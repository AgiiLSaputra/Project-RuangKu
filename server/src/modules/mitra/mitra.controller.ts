import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppError, validasi } from '../../lib/errors';
import * as fotoService from './mitra.foto.service';
import * as laporanService from './mitra.laporan.service';
import { buatRuanganSchema, idFotoParamSchema, idRuanganParamSchema, laporanQuerySchema, ubahRuanganSchema } from './mitra.schema';
import * as service from './mitra.service';
import {
  MAKS_FOTO,
  ekstensiUntuk,
  folderUpload,
  hapusBerkas,
  namaBerkasBaru,
  pastikanFolder,
  urlUntuk,
} from './upload.util';

export async function buat(req: FastifyRequest, reply: FastifyReply) {
  const input = validasi(buatRuanganSchema, req.body);
  const ruangan = await service.buatRuangan(req.authUser!, input);
  return reply.code(201).send({ ok: true, data: { ruangan } });
}

export async function ubah(req: FastifyRequest, reply: FastifyReply) {
  const { id } = validasi(idRuanganParamSchema, req.params);
  const input = validasi(ubahRuanganSchema, req.body);
  const ruangan = await service.ubahRuangan(req.authUser!, id, input);
  return reply.send({ ok: true, data: { ruangan } });
}

/** Detail satu ruangan milik mitra untuk form Edit Ruangan. */
export async function detail(req: FastifyRequest, reply: FastifyReply) {
  const { id } = validasi(idRuanganParamSchema, req.params);
  const ruangan = await service.detailRuangan(req.authUser!, id);
  return reply.send({ ok: true, data: { ruangan } });
}

/** Hapus ruangan milik mitra (ditolak bila sudah punya riwayat reservasi). */
export async function hapus(req: FastifyRequest, reply: FastifyReply) {
  const { id } = validasi(idRuanganParamSchema, req.params);
  const hasil = await service.hapusRuangan(req.authUser!, id);
  return reply.send({ ok: true, data: hasil });
}

/** Daftar ruangan mitra + kinerja bulan berjalan (halaman Ruangan Saya / dashboard mitra). */
export async function listing(req: FastifyRequest, reply: FastifyReply) {
  const data = await laporanService.daftarListing(req.authUser!);
  return reply.send({ ok: true, data });
}

/** Laporan okupansi & pendapatan per ruangan (halaman Laporan Okupansi). */
export async function laporan(req: FastifyRequest, reply: FastifyReply) {
  const query = validasi(laporanQuerySchema, req.query);
  const data = await laporanService.laporanOkupansi(req.authUser!, query);
  return reply.send({ ok: true, data });
}

// ---------- Foto ruangan (M6) ----------

/**
 * Unggah 1–4 foto untuk satu ruangan (multipart, field `foto`).
 * Kuota dicek sebelum berkas ditulis; bila salah satu berkas ditolak,
 * berkas yang sudah terlanjur tersimpan dihapus lagi.
 */
export async function unggahFoto(req: FastifyRequest, reply: FastifyReply) {
  const { id } = validasi(idRuanganParamSchema, req.params);
  if (!req.isMultipart()) {
    throw new AppError(400, 'BUKAN_MULTIPART', 'Unggah foto harus memakai multipart/form-data');
  }

  const { sisa, urutanAwal } = await fotoService.cekKapasitasFoto(req.authUser!, id);
  if (sisa === 0) {
    throw new AppError(409, 'FOTO_PENUH', `Maksimal ${MAKS_FOTO} foto per ruangan`);
  }

  const tersimpan: string[] = []; // nama berkas di disk
  const urls: string[] = [];

  try {
    for await (const part of req.files()) {
      if (tersimpan.length >= sisa) {
        part.file.resume();
        throw new AppError(409, 'FOTO_PENUH', `Maksimal ${MAKS_FOTO} foto per ruangan`);
      }
      const ekstensi = ekstensiUntuk(part.mimetype);
      if (!ekstensi) {
        part.file.resume();
        throw new AppError(400, 'TIPE_BERKAS_TIDAK_DIDUKUNG', 'Foto harus berformat JPG, PNG, atau WebP');
      }

      const nama = namaBerkasBaru(id, part.mimetype);
      await pastikanFolder();
      await pipeline(part.file, createWriteStream(path.join(folderUpload(), nama)));
      tersimpan.push(nama);
      urls.push(urlUntuk(nama));
    }

    if (!urls.length) throw new AppError(400, 'FOTO_KOSONG', 'Tidak ada berkas foto yang dikirim');

    const foto = await fotoService.simpanFoto(id, urls, urutanAwal);
    return reply.code(201).send({ ok: true, data: { foto } });
  } catch (err) {
    // Jangan tinggalkan berkas yatim saat unggahan gagal di tengah jalan.
    await Promise.all(tersimpan.map((nama) => hapusBerkas(nama)));
    throw err;
  }
}

/** Hapus satu foto ruangan beserta berkasnya. */
export async function hapusFoto(req: FastifyRequest, reply: FastifyReply) {
  const { id, fotoId } = validasi(idFotoParamSchema, req.params);
  const foto = await fotoService.hapusFoto(req.authUser!, id, fotoId);
  return reply.send({ ok: true, data: { foto } });
}
