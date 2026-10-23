import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db, pool } from "../src/config/db";
import { mitra, pengajuanVerifikasi, sesi, users } from "../src/db/schema";
import {
  ambilCookie,
  bersihkanData,
  buatApp,
  buatUserLangsung,
} from "./helpers";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buatApp();
  // route khusus test untuk memeriksa RBAC (tidak ada di aplikasi asli)
  app.get(
    "/api/_uji/admin",
    { preHandler: [app.requireAuth, app.requirePeran("admin")] },
    async () => ({ ok: true }),
  );
  app.get(
    "/api/_uji/penyedia",
    { preHandler: [app.requireAuth, app.requirePeran("penyedia", "admin")] },
    async () => ({ ok: true }),
  );
  await app.ready();
});
afterAll(async () => {
  await app.close();
  await pool.end();
});
beforeEach(bersihkanData);

const daftarPenyewa = (over: Record<string, unknown> = {}) =>
  app.inject({
    method: "POST",
    url: "/api/auth/register",
    payload: {
      peran: "penyewa",
      nama: "Alana",
      email: "alana@mail.com",
      sandi: "sandi-rahasia-1",
      ...over,
    },
  });

const login = (email: string, sandi: string) =>
  app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { email, sandi },
  });

describe("POST /api/auth/register", () => {
  it("mendaftarkan penyewa: status aktif, sandi di-hash, sandi tidak ikut di response", async () => {
    const res = await daftarPenyewa();
    expect(res.statusCode).toBe(201);
    const { data } = res.json();
    expect(data.user).toMatchObject({
      nama: "Alana",
      email: "alana@mail.com",
      peran: "penyewa",
      status: "menunggu",
    });
    expect(data.user.ref).toMatch(/^USR-\d{4}$/);
    expect(JSON.stringify(data)).not.toMatch(/sandi/i);

    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.email, "alana@mail.com"));
    expect(row.sandiHash).not.toContain("sandi-rahasia-1");
    expect(row.sandiHash.startsWith("$argon2id$")).toBe(true);
  });

  it("penyewa baru berstatus menunggu: belum bisa login sampai admin menyetujui", async () => {
    await daftarPenyewa();
    const res = await login("alana@mail.com", "sandi-rahasia-1");
    expect(res.statusCode).toBe(403);
    expect(res.json().error.detail.status).toBe("menunggu");
  });

  it("email bentrok (tanpa membedakan huruf besar/kecil) -> 409", async () => {
    await daftarPenyewa();
    const res = await daftarPenyewa({ email: "ALANA@Mail.com" });
    expect(res.statusCode).toBe(409);
    expect(res.json().error.kode).toBe("EMAIL_SUDAH_TERDAFTAR");
  });

  it("input tidak valid -> 400 dengan daftar field", async () => {
    const res = await daftarPenyewa({ email: "bukan-email", sandi: "pendek" });
    expect(res.statusCode).toBe(400);
    const e = res.json().error;
    expect(e.kode).toBe("VALIDASI_GAGAL");
    expect(e.detail.map((d: { field: string }) => d.field)).toEqual(
      expect.arrayContaining(["email", "sandi"]),
    );
  });

  it("menolak peran admin dan field tak dikenal (mass assignment)", async () => {
    expect((await daftarPenyewa({ peran: "admin" })).statusCode).toBe(400);
    expect((await daftarPenyewa({ status: "aktif" })).statusCode).toBe(400);
    expect((await daftarPenyewa({ terverifikasi: true })).statusCode).toBe(400);
    expect((await db.select().from(users)).length).toBe(0);
  });

  it("JSON rusak -> 400 (bukan 500)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      headers: { "content-type": "application/json" },
      payload: "{rusak",
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().ok).toBe(false);
  });

  it("mendaftarkan penyedia: menunggu verifikasi + membuat mitra & pengajuan_verifikasi", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        peran: "penyedia",
        nama: "Budi",
        email: "budi@gedung.com",
        sandi: "sandi-rahasia-1",
        properti: "Gedung Serbaguna Budi",
        lokasi: "Pekanbaru",
      },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().data.user).toMatchObject({
      peran: "penyedia",
      status: "menunggu",
      terverifikasi: false,
    });
    const [m] = await db.select().from(mitra);
    const [p] = await db.select().from(pengajuanVerifikasi);
    expect(m.properti).toBe("Gedung Serbaguna Budi");
    expect(p).toMatchObject({
      ref: m.ref,
      status: "menunggu",
      venue: "Gedung Serbaguna Budi",
      lokasi: "Pekanbaru",
    });
  });

  it("penyedia tanpa properti/lokasi -> 400 dan tidak ada data setengah jadi", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        peran: "penyedia",
        nama: "Budi",
        email: "budi@gedung.com",
        sandi: "sandi-rahasia-1",
      },
    });
    expect(res.statusCode).toBe(400);
    expect((await db.select().from(users)).length).toBe(0);
  });
});

describe("POST /api/auth/login, GET /api/auth/me, POST /api/auth/logout", () => {
  beforeEach(async () => {
    await daftarPenyewa();
    await db
      .update(users)
      .set({ status: "aktif" })
      .where(eq(users.email, "alana@mail.com"));
  });

  it("login berhasil: set cookie httpOnly, /me mengembalikan user yang sama", async () => {
    const res = await login("alana@mail.com", "sandi-rahasia-1");
    expect(res.statusCode).toBe(200);
    const setCookie = String(res.headers["set-cookie"]);
    expect(setCookie).toContain("ruangku_token=");
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(JSON.stringify(res.json())).not.toMatch(/hash/i);

    const me = await app.inject({
      method: "GET",
      url: "/api/auth/me",
      cookies: { ruangku_token: ambilCookie(res)! },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json().data.user).toMatchObject({
      email: "alana@mail.com",
      peran: "penyewa",
      mitra: null,
    });
  });

  it("login tidak peduli huruf besar/kecil pada email", async () => {
    expect((await login("ALANA@MAIL.COM", "sandi-rahasia-1")).statusCode).toBe(
      200,
    );
  });

  it("sandi salah dan email tak terdaftar memberi respons yang sama (401)", async () => {
    const a = await login("alana@mail.com", "salah-total");
    const b = await login("tidak-ada@mail.com", "sandi-rahasia-1");
    expect(a.statusCode).toBe(401);
    expect(b.statusCode).toBe(401);
    expect(a.json()).toEqual(b.json());
    expect(a.headers["set-cookie"]).toBeUndefined();
  });

  it("login body tidak lengkap -> 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "alana@mail.com" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("akun menunggu/ditolak tidak bisa login (403 + status), tapi sandi salah tetap 401", async () => {
    for (const status of ["menunggu", "ditolak"] as const) {
      await buatUserLangsung({
        email: `${status}@mail.com`,
        status,
        peran: "penyedia",
      });
      const res = await login(`${status}@mail.com`, "sandi-rahasia-1");
      expect(res.statusCode).toBe(403);
      expect(res.json().error).toMatchObject({
        kode: "AKUN_TIDAK_AKTIF",
        detail: { status },
      });
      expect(res.headers["set-cookie"]).toBeUndefined();
      expect((await login(`${status}@mail.com`, "salah")).statusCode).toBe(401);
    }
  });

  it("akun nonaktif tetap bisa login (FR-H2) untuk mengajukan banding", async () => {
    await buatUserLangsung({
      email: "nonaktif-login@mail.com",
      status: "nonaktif",
      peran: "penyewa",
    });
    const res = await login("nonaktif-login@mail.com", "sandi-rahasia-1");
    expect(res.statusCode).toBe(200);
    expect(res.json().data.user).toMatchObject({
      email: "nonaktif-login@mail.com",
      status: "nonaktif",
    });
    expect(res.headers["set-cookie"]).toBeDefined();

    // Endpoint terjaga tetap menolak akun nonaktif — hanya /api/banding yang lolos.
    const terjaga = await app.inject({
      method: "GET",
      url: "/api/pesanan",
      cookies: { ruangku_token: ambilCookie(res)! },
    });
    expect(terjaga.statusCode).toBe(403);
    expect(terjaga.json().error).toMatchObject({
      kode: "AKUN_TIDAK_AKTIF",
      detail: { status: "nonaktif" },
    });
  });

  it("/me tanpa cookie atau dengan token palsu -> 401", async () => {
    expect(
      (await app.inject({ method: "GET", url: "/api/auth/me" })).statusCode,
    ).toBe(401);
    const palsu = await app.inject({
      method: "GET",
      url: "/api/auth/me",
      cookies: { ruangku_token: "abc.def.ghi" },
    });
    expect(palsu.statusCode).toBe(401);
  });

  it("token yang dimodifikasi ditolak (tanda tangan tidak cocok)", async () => {
    const token = ambilCookie(
      await login("alana@mail.com", "sandi-rahasia-1"),
    )!;
    const [h, p, s] = token.split(".");
    const rusak = `${h}.${p}.${s.slice(0, -2)}xx`;
    const res = await app.inject({
      method: "GET",
      url: "/api/auth/me",
      cookies: { ruangku_token: rusak },
    });
    expect(res.statusCode).toBe(401);
  });

  it("logout mencabut sesi: token lama tidak berlaku lagi", async () => {
    const token = ambilCookie(
      await login("alana@mail.com", "sandi-rahasia-1"),
    )!;
    expect((await db.select().from(sesi)).length).toBe(1);
    const out = await app.inject({
      method: "POST",
      url: "/api/auth/logout",
      cookies: { ruangku_token: token },
    });
    expect(out.statusCode).toBe(200);
    expect((await db.select().from(sesi)).length).toBe(0);
    const me = await app.inject({
      method: "GET",
      url: "/api/auth/me",
      cookies: { ruangku_token: token },
    });
    expect(me.statusCode).toBe(401);
  });

  it("logout tanpa login tetap 200 (idempoten)", async () => {
    expect(
      (await app.inject({ method: "POST", url: "/api/auth/logout" }))
        .statusCode,
    ).toBe(200);
  });

  it("akun dinonaktifkan setelah login -> /me masih mengenali identitas (FR-H2), endpoint lain ditolak", async () => {
    const token = ambilCookie(
      await login("alana@mail.com", "sandi-rahasia-1"),
    )!;
    await db
      .update(users)
      .set({ status: "nonaktif" })
      .where(eq(users.email, "alana@mail.com"));
    const me = await app.inject({
      method: "GET",
      url: "/api/auth/me",
      cookies: { ruangku_token: token },
    });
    // /me tetap lolos supaya client tahu statusnya nonaktif (halaman "Akun Dinonaktifkan").
    expect(me.statusCode).toBe(200);
    expect(me.json().data.user).toMatchObject({
      email: "alana@mail.com",
      status: "nonaktif",
    });
  });

  it("sesi kedaluwarsa di database -> 401 walau JWT belum expired", async () => {
    const token = ambilCookie(
      await login("alana@mail.com", "sandi-rahasia-1"),
    )!;
    await db.update(sesi).set({ kadaluarsa: new Date(Date.now() - 1000) });
    const me = await app.inject({
      method: "GET",
      url: "/api/auth/me",
      cookies: { ruangku_token: token },
    });
    expect(me.statusCode).toBe(401);
  });
});

describe("RBAC (requirePeran)", () => {
  it("hanya peran yang diizinkan yang lolos", async () => {
    await buatUserLangsung({ email: "p@mail.com", peran: "penyewa" });
    await buatUserLangsung({ email: "m@mail.com", peran: "penyedia" });
    await buatUserLangsung({ email: "a@mail.com", peran: "admin" });
    const t = async (email: string) =>
      ambilCookie(await login(email, "sandi-rahasia-1"))!;
    const [tp, tm, ta] = [
      await t("p@mail.com"),
      await t("m@mail.com"),
      await t("a@mail.com"),
    ];
    const get = (url: string, token?: string) =>
      app.inject({
        method: "GET",
        url,
        cookies: token ? { ruangku_token: token } : {},
      });

    expect((await get("/api/_uji/admin")).statusCode).toBe(401);
    expect((await get("/api/_uji/admin", tp)).statusCode).toBe(403);
    expect((await get("/api/_uji/admin", tm)).statusCode).toBe(403);
    expect((await get("/api/_uji/admin", ta)).statusCode).toBe(200);
    expect((await get("/api/_uji/penyedia", tp)).statusCode).toBe(403);
    expect((await get("/api/_uji/penyedia", tm)).statusCode).toBe(200);
  });
});

describe("Error handling umum", () => {
  it("endpoint tidak ada -> 404 berformat seragam", async () => {
    const res = await app.inject({ method: "GET", url: "/api/tidak-ada" });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toMatchObject({
      ok: false,
      error: { kode: "RUTE_TIDAK_DITEMUKAN" },
    });
  });
});
