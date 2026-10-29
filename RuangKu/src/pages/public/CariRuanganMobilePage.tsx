import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { useAuth } from '../../context/AuthContext'
import { LoginRequiredModal } from '../../components/domain/room/LoginRequiredModal'
import {
  FILTER_AWAL,
  FASILITAS,
  HARGA_MAKS_AWAL,
  OPSI_KAPASITAS,
  OPSI_URUT,
  PER_MUAT,
  filterKeApi,
  jumlahFilterAktif,
  saringRuangan,
  type Filter,
  type Urut,
} from '../../components/domain/room/katalog'
import { useKatalogRuangan } from '../../components/domain/room/useRuangan'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { Overlay } from '../../components/ui/Overlay'
import { SortSelect } from '../../components/ui/SortSelect'
import { CITIES, KATEGORI_FILTER, type Kategori, type Ruangan } from '../../data/seed'
import { rp } from '../../lib/format'

const HARGA_MIN = 100_000
const HARGA_MAKS = 5_000_000
const HARGA_LANGKAH = 100_000

/** Katalog & pencarian ruangan — varian MOBILE (CariRuanganMobile.html). */
export function CariRuanganMobilePage() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  /** Penyedia hanya boleh melihat katalog/detail — tanpa aksi pemesanan. */
  const lihatSaja = user?.peran === 'penyedia'

  const [kataInput, setKataInput] = useState('')
  const [kata, setKata] = useState('')
  const [kategori, setKategori] = useState<'Semua' | Kategori>('Semua')
  const [urut, setUrut] = useState<Urut>('populer')
  const [batas, setBatas] = useState(PER_MUAT)
  const [perluLogin, setPerluLogin] = useState(false)
  const [filterTerbuka, setFilterTerbuka] = useState(false)

  // Bottom sheet: `draf` = yang dipilih, `dipakai` = setelah "Terapkan".
  const [draf, setDraf] = useState<Filter>(FILTER_AWAL)
  const [dipakai, setDipakai] = useState<Filter>(FILTER_AWAL)

  // Kata kunci, kota, kapasitas, dan harga disaring server; sisanya di saringRuangan.
  const { ruangan: semua, memuat, galat, muat } = useKatalogRuangan(filterKeApi(kata, dipakai))
  // Pratinjau jumlah untuk tombol "Terapkan" hanya diambil selama panel filter terbuka.
  const draftServer = useKatalogRuangan(filterKeApi(kata, draf), filterTerbuka)

  const hasil = useMemo(
    () => saringRuangan({ kategori, filter: dipakai, urut, data: semua }),
    [kategori, dipakai, urut, semua],
  )
  const pratinjau = useMemo(
    () => saringRuangan({ kategori, filter: draf, urut, data: draftServer.ruangan }).length,
    [kategori, draf, urut, draftServer.ruangan],
  )
  const tampil = hasil.slice(0, batas)
  const jumlahAktif = jumlahFilterAktif(draf)

  const cari = (e: FormEvent) => {
    e.preventDefault()
    setKata(kataInput)
    setBatas(PER_MUAT)
  }

  const reset = () => {
    setKataInput('')
    setKata('')
    setKategori('Semua')
    setUrut('populer')
    setDraf(FILTER_AWAL)
    setDipakai(FILTER_AWAL)
    setBatas(PER_MUAT)
  }

  /** Perubahan dari chip aktif — langsung menembak filter yang dipakai. */
  const ubahLangsung = (patch: Partial<Filter>) => {
    setDraf((d) => ({ ...d, ...patch }))
    setDipakai((d) => ({ ...d, ...patch }))
    setBatas(PER_MUAT)
  }

  const toggleFasilitas = (id: string) =>
    setDraf((d) => ({
      ...d,
      fasilitas: d.fasilitas.includes(id) ? d.fasilitas.filter((x) => x !== id) : [...d.fasilitas, id],
    }))

  const terapkan = () => {
    setDipakai(draf)
    setBatas(PER_MUAT)
    setFilterTerbuka(false)
  }

  const pilihKategori = (k: 'Semua' | Kategori) => {
    setKategori(k)
    setBatas(PER_MUAT)
  }

  /** Chip filter aktif yang bisa satu-satu dihapus (mockup "Active Chip Dismissals"). */
  const chips = useMemo(() => {
    const daftar: { key: string; label: string; hapus: () => void }[] = []
    if (kata) daftar.push({ key: 'kata', label: `"${kata}"`, hapus: () => { setKata(''); setKataInput('') } })
    if (dipakai.kota !== 'semua')
      daftar.push({ key: 'kota', label: dipakai.kota, hapus: () => ubahLangsung({ kota: 'semua' }) })
    if (dipakai.kapasitas !== 0)
      daftar.push({
        key: 'kapasitas',
        label: OPSI_KAPASITAS[dipakai.kapasitas].singkat,
        hapus: () => ubahLangsung({ kapasitas: 0 }),
      })
    if (dipakai.hargaMaks !== HARGA_MAKS_AWAL)
      daftar.push({ key: 'harga', label: `s/d ${rp(dipakai.hargaMaks)}`, hapus: () => ubahLangsung({ hargaMaks: HARGA_MAKS_AWAL }) })
    dipakai.fasilitas.forEach((id) => {
      const opsi = FASILITAS.find((f) => f.id === id)
      if (opsi) daftar.push({ key: id, label: opsi.label, hapus: () => ubahLangsung({ fasilitas: dipakai.fasilitas.filter((x) => x !== id) }) })
    })
    return daftar
  }, [kata, dipakai])

  /** Public (belum login) tidak boleh pesan — arahkan ke modal wajib login. */
  const pesan = (r: Ruangan) => {
    if (isAuthenticated) navigate(`/reservasi/${r.id}/form`)
    else setPerluLogin(true)
  }

  return (
    <div className="flex flex-col gap-space-md px-margin pb-12">
      {/* ============ 1. JUDUL + SEARCH & FILTER ============ */}
      <section className="flex flex-col gap-space-sm">
        <div className="flex items-center gap-space-xs">
          <span className="font-headline-sm text-headline-sm text-on-surface">Cari Ruangan</span>
        </div>
        <p className="text-body-sm text-on-surface-variant">
          Temukan ruangan meeting, ballroom, &amp; coworking terbaik.
        </p>

        <form onSubmit={cari} className="flex items-center gap-space-xs pt-1">
          <div className="relative flex flex-1 items-center rounded-full bg-surface-container-lowest px-3 py-1.5 shadow-card">
            <Icon name="search" className="ml-1 text-[20px] text-outline" />
            <input
              type="text"
              value={kataInput}
              onChange={(e) => setKataInput(e.target.value)}
              placeholder="Cari nama ruangan, gedung, lokasi..."
              aria-label="Cari ruangan"
              className="w-full bg-transparent px-2 py-1 text-body-sm text-on-surface outline-none placeholder:text-outline"
            />
            <button
              type="submit"
              aria-label="Lakukan Pencarian"
              className="bg-cta flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition-opacity hover:opacity-95"
            >
              <Icon name="arrow_forward" className="text-[16px]" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setFilterTerbuka(true)}
            aria-label="Pencarian dan Filter"
            className="flex items-center gap-1 rounded-full bg-surface-container-lowest px-3 py-2 text-on-surface shadow-card transition-colors hover:bg-purple-100"
          >
            <Icon name="tune" className="text-[18px] text-primary" />
            <span className="font-label-md text-label-md">Filter</span>
            {jumlahAktif > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-secondary font-label-sm text-label-sm text-on-secondary">
                {jumlahAktif}
              </span>
            )}
          </button>
        </form>
      </section>

      {/* ============ 2. PILL KATEGORI (scroll horizontal) ============ */}
      <section className="-mx-margin flex items-center gap-2 overflow-x-auto px-margin pb-1 no-scrollbar">
        {KATEGORI_FILTER.map((k) => {
          const aktif = kategori === k
          const jml = semua.filter((r) => k === 'Semua' || r.kategori === k).length
          return (
            <button
              key={k}
              type="button"
              aria-pressed={aktif}
              onClick={() => pilihKategori(k)}
              className={cn(
                'shrink-0 rounded-full px-4 py-1.5 text-[14px] font-semibold shadow-card transition-colors',
                aktif ? 'bg-cta text-white' : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface',
              )}
            >
              {k === 'Semua' ? `Semua (${jml})` : `${k} (${jml})`}
            </button>
          )
        })}
      </section>

      {/* ============ 3. STATUS HASIL + CHIP FILTER AKTIF ============ */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="font-headline-sm text-title-md text-on-surface">{hasil.length} Ruangan</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-status-available-bg px-2 py-0.5 font-label-sm text-label-sm text-status-available">
              <span className="h-1.5 w-1.5 rounded-full bg-status-available" />
              Live
            </span>
          </div>
          <SortSelect
            label="Urutkan hasil"
            nilai={urut}
            onPilih={(id) => setUrut(id as Urut)}
            opsi={OPSI_URUT.map((o) => ({ id: o.id, label: `Urutkan: ${o.singkat}` }))}
            className="cursor-pointer bg-purple-100 px-2.5 py-1 font-body-md text-body-sm text-on-surface"
          />
        </div>

        {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {chips.map((c) => (
              <span
                key={c.key}
                className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 font-label-md text-label-md text-primary"
              >
                <span className="max-w-[160px] truncate">{c.label}</span>
                <button
                  type="button"
                  aria-label={`Hapus filter ${c.label}`}
                  onClick={c.hapus}
                  className="flex items-center transition-colors hover:text-error"
                >
                  <Icon name="close" className="text-[14px]" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={reset}
              className="ml-1 font-label-sm text-label-sm text-secondary hover:underline"
            >
              Reset
            </button>
          </div>
        )}
      </section>

      {/* ============ 4. DAFTAR KARTU RUANGAN ============ */}
      {memuat || galat ? (
        <div
          className="flex flex-col items-center gap-space-sm rounded-lg bg-surface-container-lowest p-space-xl text-center shadow-card"
          role="status"
          aria-live="polite"
        >
          {memuat ? (
            <p className="text-body-sm text-slate-500">Memuat daftar ruangan...</p>
          ) : (
            <>
              <h3 className="font-headline-sm text-title-md text-on-surface">Gagal memuat ruangan</h3>
              <p className="text-body-sm text-on-surface-variant">{galat}</p>
              <Button onClick={muat} size="sm" icon="refresh" iconPosition="left">
                Coba lagi
              </Button>
            </>
          )}
        </div>
      ) : hasil.length === 0 ? (
        <div className="flex flex-col items-center gap-space-sm rounded-lg bg-surface-container-lowest p-space-xl text-center shadow-card">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-primary">
            <Icon name="travel_explore" className="text-[32px]" />
          </span>
          <h3 className="font-headline-sm text-title-md text-on-surface">Tidak Ada Ruangan yang Cocok</h3>
          <p className="text-body-sm text-on-surface-variant">
            Coba ubah kata kunci, rentang harga, atau kurangi filter fasilitas.
          </p>
          <Button onClick={reset} size="sm" icon="refresh" iconPosition="left">
            Reset Semua Filter
          </Button>
        </div>
      ) : (
        <section className="flex flex-col gap-space-md">
          {tampil.map((r) => (
            <article
              key={r.id}
              className="flex flex-col overflow-hidden rounded-lg bg-surface-container-lowest shadow-card transition-all active:scale-[0.99]"
            >
              <div className="relative aspect-[4/3] w-full bg-surface-container">
                <img alt={r.nama} src={r.foto[0]} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-on-surface/40 via-transparent to-transparent" />
                <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-surface-container-lowest/90 px-2.5 py-1 font-label-sm text-label-sm text-on-surface shadow-sm backdrop-blur-md">
                  <Icon name="star" filled className="text-[14px] text-status-occupied" />
                  <span className="font-title-md">{r.rating}</span>
                  <span className="text-slate-500">({r.ulasan})</span>
                </div>
              </div>

              <div className="flex flex-col gap-3 p-4">
                <div>
                  <h2 className="font-headline-sm text-headline-sm font-bold leading-snug text-on-surface">{r.nama}</h2>
                  <div className="mt-1 flex items-center gap-1 text-body-sm text-on-surface-variant">
                    <Icon name="location_on" className="text-[16px] text-primary" />
                    <span className="truncate">
                      {r.kota} • {r.penyedia}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                  <Icon name="group" className="text-[18px] text-purple-500" />
                  <span>
                    Kapasitas:{' '}
                    <strong className="font-title-md text-on-surface">Maks. {r.kapasitasMax} Tamu</strong>
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {r.fasilitas.slice(0, 3).map((f) => (
                    <span
                      key={f}
                      className="rounded-full bg-purple-50 px-2.5 py-1 font-label-sm text-label-sm text-slate-500"
                    >
                      {f}
                    </span>
                  ))}
                </div>

                <span className="flex w-fit items-center gap-1 rounded-full bg-primary/90 px-3 py-1 font-label-sm text-label-sm text-on-primary shadow-sm">
                  {r.kategori}
                </span>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <div className="min-w-0">
                    <span className="block font-label-sm text-label-sm text-slate-500">Tarif Sewa</span>
                    <div className="font-headline-md text-headline-sm text-primary">
                      {rp(r.tarifPerJam)}{' '}
                      <span className="font-body-sm text-body-sm font-normal text-slate-500">/ jam</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/ruangan/${r.id}`)}
                    className="shrink-0 rounded-full bg-purple-100 px-5 py-2.5 font-title-md text-body-sm text-primary shadow-sm transition-colors hover:bg-pink-100 hover:text-secondary"
                  >
                    Lihat Detail
                  </button>
                </div>

                {!lihatSaja && (
                  <button
                    type="button"
                    onClick={() => pesan(r)}
                    title={isAuthenticated ? 'Lanjutkan ke formulir reservasi' : 'Masuk dulu untuk memesan'}
                    className="bg-cta flex w-full items-center justify-center gap-1.5 rounded-full py-3 font-title-md text-body-sm text-white shadow-cta transition-all active:scale-[0.98]"
                  >
                    {!isAuthenticated && <Icon name="lock" className="text-[16px]" />}
                    <span>{isAuthenticated ? 'Pesan Sekarang' : 'Masuk & Pesan'}</span>
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      )}

      {/* ============ 5. MUAT LEBIH BANYAK ============ */}
      {hasil.length > 0 && batas < hasil.length && (
        <section className="pt-2">
          <button
            type="button"
            onClick={() => setBatas((b) => b + PER_MUAT)}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-purple-100 py-3.5 font-title-md text-body-md text-primary shadow-sm transition-colors hover:bg-purple-300"
          >
            <Icon name="sync" className="text-[20px]" />
            <span>Muat Lebih Banyak Ruangan ({hasil.length - tampil.length} Tersisa)</span>
          </button>
        </section>
      )}

      {/* ============ 6. BANNER BANTUAN CONCIERGE ============ */}
      <section className="flex items-center gap-4 rounded-lg bg-gradient-to-br from-purple-100 via-pink-100 to-purple-50 p-5 shadow-card">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-surface-container-lowest shadow-md">
          <Icon name="support_agent" className="text-[28px] text-secondary" />
        </span>
        <div className="flex flex-1 flex-col gap-1">
          <h3 className="font-headline-sm text-title-md text-on-surface">Tidak Menemukan yang Pas?</h3>
          <p className="text-body-sm text-on-surface-variant">
            Tim RuangKu siap bantu reservasi custom untuk event skala besar.
          </p>
          <div className="pt-1">
            <Link
              to="/kontak"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 font-title-md text-label-md text-on-primary shadow-sm transition-colors hover:bg-purple-700"
            >
              <span>Bantuan CS Concierge</span>
              <Icon name="arrow_forward" className="text-[14px]" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============ BOTTOM SHEET FILTER ============ */}
      <Overlay open={filterTerbuka} onClose={() => setFilterTerbuka(false)} labelledBy="judul-filter-katalog">
        <div className="flex max-h-[85dvh] flex-col gap-space-md overflow-y-auto p-5 pb-8">
          <div className="flex flex-col items-center">
            <div className="mb-3 h-1.5 w-12 rounded-full bg-slate-300" />
            <div className="flex w-full items-center justify-between pr-10">
              <span id="judul-filter-katalog" className="font-headline-sm text-headline-sm text-on-surface">
                Filter Pencarian
              </span>
            </div>
          </div>

          {/* Wilayah / Kota */}
          <div className="flex flex-col gap-space-xs">
            <span className="font-title-md text-body-md text-on-surface">Wilayah / Kota</span>
            <div className="relative">
              <select
                value={draf.kota}
                onChange={(e) => setDraf((d) => ({ ...d, kota: e.target.value }))}
                className="h-11 w-full cursor-pointer appearance-none rounded-full bg-purple-50 px-space-md pr-10 text-body-md text-on-surface outline-none"
              >
                <option value="semua">Semua Kota ({CITIES.join(', ')})</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <Icon
                name="expand_more"
                className="pointer-events-none absolute right-3 top-2.5 text-[20px] text-slate-500"
              />
            </div>
          </div>

          {/* Kapasitas Tamu */}
          <div className="flex flex-col gap-space-xs">
            <span className="font-title-md text-body-md text-on-surface">Kapasitas Tamu</span>
            <div className="grid grid-cols-2 gap-2">
              {OPSI_KAPASITAS.map((o, i) => (
                <button
                  key={o.label}
                  type="button"
                  aria-pressed={draf.kapasitas === i}
                  onClick={() => setDraf((d) => ({ ...d, kapasitas: i }))}
                  className={cn(
                    'rounded-full py-2 text-center font-label-md text-label-md transition-colors',
                    draf.kapasitas === i
                      ? 'bg-purple-100 text-primary'
                      : 'bg-surface-container text-on-surface-variant hover:text-on-surface',
                  )}
                >
                  {i === 0 ? 'Semua Kapasitas' : o.singkat}
                </button>
              ))}
            </div>
          </div>

          {/* Rentang Harga */}
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <span className="font-title-md text-body-md text-on-surface">Rentang Harga / Jam</span>
              <span className="font-label-md text-label-md text-primary">s/d {rp(draf.hargaMaks)}</span>
            </div>
            <input
              type="range"
              min={HARGA_MIN}
              max={HARGA_MAKS}
              step={HARGA_LANGKAH}
              value={draf.hargaMaks}
              onChange={(e) => setDraf((d) => ({ ...d, hargaMaks: Number(e.target.value) }))}
              className="h-2 w-full cursor-pointer rounded-lg bg-purple-100 accent-primary"
            />
          </div>

          {/* Fasilitas Lengkap */}
          <div className="flex flex-col gap-space-xs">
            <span className="font-title-md text-body-md text-on-surface">Fasilitas Lengkap</span>
            <div className="grid grid-cols-2 gap-2 text-body-sm text-on-surface-variant">
              {FASILITAS.map((f) => (
                <label
                  key={f.id}
                  className="flex cursor-pointer items-center gap-2 rounded bg-purple-50 p-2 transition-colors hover:bg-purple-100"
                >
                  <input
                    type="checkbox"
                    checked={draf.fasilitas.includes(f.id)}
                    onChange={() => toggleFasilitas(f.id)}
                    className="h-4 w-4 cursor-pointer rounded accent-primary"
                  />
                  <span className="truncate">{f.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Aksi filter */}
          <div className="flex items-center gap-2 pt-2 pb-6">
            <button
              type="button"
              onClick={reset}
              className="flex-1 rounded-full bg-purple-50 py-3 text-center font-title-md text-body-md text-slate-500"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={terapkan}
              aria-busy={draftServer.memuat}
              className="flex-[2] rounded-full bg-cta py-3 text-center font-title-md text-body-md text-white shadow-md transition-opacity hover:opacity-90"
            >
              Terapkan ({pratinjau})
            </button>
          </div>
        </div>
      </Overlay>

      <LoginRequiredModal open={perluLogin} onClose={() => setPerluLogin(false)} />
    </div>
  )
}
