import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LoginRequiredModal } from '../../components/domain/room/LoginRequiredModal'
import {
  HARI_MINGGU_PERTAMA,
  KELAS_STATUS,
  LABEL_STATUS,
  NAMA_BULAN,
  hariDalamBulan,
  offsetMinggu,
  slotTanggal,
  statusHari,
  tanggalPanjang,
  type StatusHari,
} from '../../components/domain/room/jadwal'
import { IKON_KATEGORI, LABEL_KATEGORI, hargaPaket, ikonFasilitas, infoPaket } from '../../components/domain/room/infoRuangan'
import { useDetailRuangan } from '../../components/domain/room/useRuangan'
import { Icon } from '../../components/ui/Icon'
import { Button } from '../../components/ui/Button'
import { GALLERY } from '../../data/images'
import { LINK_MAPS_CONTOH } from '../../data/seed'
import { rp } from '../../lib/format'

interface SelKalender {
  tanggal: number | null
  status: StatusHari | null
}

/** Detail ruangan publik — varian MOBILE (DetailRuanganPublikMobile.html). */
export function DetailRuanganMobilePage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  /** Penyedia cuma melihat detail & deskripsi — tanpa tombol pemesanan. */
  const lihatSaja = user?.peran === 'penyedia'

  const { ruangan, memuat, galat, tidakAda, muat } = useDetailRuangan(roomId)

  const [fotoAktif, setFotoAktif] = useState(0)
  const [bulan, setBulan] = useState(9) // Oktober 2026
  const [tanggal, setTanggal] = useState(24)
  const [paketId, setPaketId] = useState('fullday')
  const [tersimpan, setTersimpan] = useState(false)
  const [perluLogin, setPerluLogin] = useState(false)
  const [pesan, setPesan] = useState<string | null>(null)

  /** Data belum siap (memuat / galat / tidak ada) — jangan render isi detail. */
  if (memuat || !ruangan) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-space-md px-margin py-space-xl text-center">
        {memuat ? (
          <p className="text-body-md text-slate-500">Memuat detail ruangan...</p>
        ) : (
          <>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-on-surface">
              {tidakAda ? 'Ruangan tidak ditemukan' : 'Gagal memuat ruangan'}
            </h2>
            <p className="text-body-md text-slate-500">
              {tidakAda ? 'Ruangan ini tidak ada atau sudah tidak tayang di katalog.' : galat}
            </p>
            <div className="flex items-center gap-space-sm">
              {!tidakAda && <Button onClick={muat}>Coba lagi</Button>}
              <button
                type="button"
                onClick={() => navigate('/cari-ruangan')}
                className="inline-flex items-center rounded-full bg-purple-100 px-space-lg py-2.5 font-title-md text-title-md text-primary transition-colors active:bg-purple-300"
              >
                Kembali ke Katalog
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  const foto = ruangan.foto.length > 0 ? ruangan.foto : GALLERY
  const srcFoto = foto[Math.min(fotoAktif, foto.length - 1)]

  /** Paket aktif: id pilihan pengguna bila ada, jika tidak Full Day, lalu paket pertama. */
  const paketAktif =
    ruangan.paket.find((p) => p.id === paketId) ??
    ruangan.paket.find((p) => p.id === 'fullday') ??
    ruangan.paket[0]
  const idPaketAktif = paketAktif?.id ?? ''
  const info = infoPaket(idPaketAktif)
  const harga = hargaPaket(ruangan, idPaketAktif)
  const slots = slotTanggal(bulan, tanggal)

  const totalHari = hariDalamBulan(bulan)
  const sel: SelKalender[] = []
  for (let i = 0; i < offsetMinggu(bulan); i++) sel.push({ tanggal: null, status: null })
  for (let t = 1; t <= totalHari; t++) sel.push({ tanggal: t, status: statusHari(bulan, t) })
  while (sel.length % 7 !== 0) sel.push({ tanggal: null, status: null })

  const gantiBulan = (arah: -1 | 1) => {
    const berikut = Math.min(11, Math.max(0, bulan + arah))
    if (berikut === bulan) return
    setBulan(berikut)
    setTanggal((t) => Math.min(t, hariDalamBulan(berikut)))
  }

  const tampilkanPesan = (teks: string) => {
    setPesan(teks)
    window.setTimeout(() => setPesan(null), 2000)
  }

  const bagikan = async () => {
    const url = window.location.href
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: ruangan.nama, text: ruangan.nama, url })
      } catch {
        /* pengguna membatalkan share — diamkan */
      }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      tampilkanPesan('Tautan berhasil disalin')
    } catch {
      tampilkanPesan('Gagal menyalin tautan')
    }
  }

  const pesanSekarang = () => {
    if (isAuthenticated) {
      const tanggalIso = `2026-${String(bulan + 1).padStart(2, '0')}-${String(tanggal).padStart(2, '0')}`
      navigate(`/reservasi/${ruangan.id}/form`, { state: { tanggal: tanggalIso, paketId: idPaketAktif } })
    } else {
      setPerluLogin(true)
    }
  }

  const inisial = ruangan.penyedia
    .split(' ')
    .filter((w) => !['pt', 'cv', 'tbk'].includes(w.toLowerCase()))
    .slice(0, 2)
    .map((w) => w[0])
    .join('')

  return (
    <div className="flex flex-col pb-12">
      {/* ============ Baris aksi (back / share / bookmark) ============ */}
      <div className="flex items-center justify-between gap-2 px-margin py-space-sm">
        <div className="flex min-w-0 items-center gap-space-xs">
          <button
            type="button"
            aria-label="Kembali"
            onClick={() => navigate(-1)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-on-surface transition-all hover:bg-surface-container active:scale-95"
          >
            <Icon name="arrow_back" className="text-[24px]" />
          </button>
          <h1 className="truncate font-headline-sm text-headline-sm text-on-surface">Detail Ruangan</h1>
        </div>
        <div className="flex items-center gap-space-xs">
          <button
            type="button"
            aria-label="Bagikan ruangan"
            onClick={bagikan}
            className="flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant transition-all hover:text-on-surface active:scale-95"
          >
            <Icon name="share" className="text-[22px]" />
          </button>
          <button
            type="button"
            aria-label="Simpan ruangan"
            aria-pressed={tersimpan}
            onClick={() => setTersimpan((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant transition-all hover:text-primary active:scale-95"
          >
            <Icon name="bookmark" filled={tersimpan} className={tersimpan ? 'text-[22px] text-primary' : 'text-[22px]'} />
          </button>
        </div>
      </div>

      {/* ============ 1. Galeri foto ============ */}
      <div className="relative w-full px-margin pt-space-sm">
        <div className="relative h-64 w-full overflow-hidden rounded-lg bg-surface-container shadow-card">
          <img alt={ruangan.nama} src={srcFoto} className="h-full w-full object-cover" />
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-surface-container-lowest/90 px-3 py-1 shadow-card backdrop-blur-md">
            <Icon name="verified" filled className="text-[16px] text-status-available" />
            <span className="font-label-sm text-label-sm font-semibold text-on-surface">Foto Resmi Terverifikasi</span>
          </div>
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-inverse-surface/80 px-2.5 py-0.5 font-label-sm text-label-sm text-inverse-on-surface backdrop-blur-md">
            <Icon name="photo_library" className="text-[14px]" />
            <span>
              {fotoAktif + 1}/{foto.length} Foto
            </span>
          </div>
        </div>

        {/* Thumbnail — HARUS <button> (RENCANA §4D2) */}
        <div className="no-scrollbar flex items-center gap-space-sm overflow-x-auto py-space-sm">
          {foto.map((f, i) => {
            const aktif = i === fotoAktif
            return (
              <button
                key={f}
                type="button"
                aria-label={`Foto ${i + 1}`}
                aria-pressed={aktif}
                onClick={() => setFotoAktif(i)}
                className={`h-14 w-20 shrink-0 overflow-hidden rounded p-0.5 shadow-sm transition-all ${
                  aktif ? 'bg-primary-container' : 'bg-surface-container hover:opacity-80'
                }`}
              >
                <img alt={`Foto ${i + 1}`} src={f} className="h-full w-full rounded object-cover" />
              </button>
            )
          })}
        </div>
      </div>

      {/* ============ 2. Informasi utama ============ */}
      <div className="mt-space-xs flex flex-col gap-space-sm px-margin">
        <div className="flex flex-wrap items-center gap-space-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-status-available-bg px-3 py-1 font-label-sm text-label-sm font-semibold text-status-available">
            <Icon name="check_circle" filled className="text-[14px]" />
            Terverifikasi Resmi
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 font-label-sm text-label-sm font-semibold text-primary">
            <Icon name={IKON_KATEGORI[ruangan.kategori]} className="text-[14px]" />
            {LABEL_KATEGORI[ruangan.kategori]}
          </span>
          <span className="ml-auto rounded-full bg-surface-container px-2 py-0.5 font-label-sm text-label-sm text-slate-500">
            {ruangan.kode}
          </span>
        </div>

        <div>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">{ruangan.nama}</h2>
          <a
            href={ruangan.linkMaps ?? LINK_MAPS_CONTOH}
            target="_blank"
            rel="noreferrer"
            title="Buka lokasi di Google Maps"
            className="mt-1 flex items-center gap-1.5 text-on-surface-variant transition-colors hover:text-primary"
          >
            <Icon name="location_on" className="text-[18px] text-primary" />
            <span className="truncate">
              {ruangan.alamat} • {ruangan.penyedia}
            </span>
            <Icon name="open_in_new" className="shrink-0 text-[14px] text-slate-400" />
          </a>
          <a
            href={ruangan.linkMaps ?? LINK_MAPS_CONTOH}
            target="_blank"
            rel="noreferrer"
            className="mt-space-sm inline-flex w-fit items-center gap-1.5 rounded-full border-[1.5px] border-purple-300 px-4 py-2 font-title-md text-body-md text-primary transition-colors active:bg-purple-100"
          >
            <Icon name="map" className="text-[18px]" />
            Buka di Google Maps
            <Icon name="open_in_new" className="text-[15px]" />
          </a>
        </div>

        <div className="mt-space-xs grid grid-cols-2 gap-space-sm">
          <div className="flex items-center gap-3 rounded bg-surface-container-low p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 text-primary">
              <Icon name="groups" className="text-[20px]" />
            </span>
            <div className="min-w-0">
              <p className="font-label-sm text-label-sm text-slate-500">Kapasitas</p>
              <p className="truncate font-title-md text-title-md font-semibold text-on-surface">
                {ruangan.kapasitasMin} - {ruangan.kapasitasMax} Tamu
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded bg-surface-container-low p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100 text-secondary">
              <Icon name="square_foot" className="text-[20px]" />
            </span>
            <div className="min-w-0">
              <p className="font-label-sm text-label-sm text-slate-500">Luas Area</p>
              <p className="truncate font-title-md text-title-md font-semibold text-on-surface">{ruangan.luas} m²</p>
            </div>
          </div>
        </div>
      </div>

      {/* ============ 3. Pilihan tarif & paket ============ */}
      <div className="mt-space-lg px-margin">
        <div className="rounded-lg bg-surface-container-lowest p-space-md shadow-card">
          <div className="flex items-center justify-between pb-space-sm">
            <div>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-slate-500">
                Pilihan Reservasi
              </span>
              <p className="font-title-md text-title-md text-on-surface">Tarif Sewa Reguler</p>
            </div>
            <div className="text-right">
              <span className="font-headline-sm text-headline-sm text-primary">{rp(ruangan.tarifPerJam)}</span>
              <span className="text-body-sm text-on-surface-variant"> / jam</span>
            </div>
          </div>

          <div className="mt-space-xs flex flex-col gap-space-sm">
            {ruangan.paket.map((p) => {
              const aktif = idPaketAktif === p.id
              const d = infoPaket(p.id)
              return (
                <label
                  key={p.id}
                  className={`relative flex cursor-pointer items-start gap-3 rounded p-3 transition-all ${
                    aktif ? 'bg-purple-50 shadow-card' : 'bg-surface-container-low'
                  }`}
                >
                  <input
                    type="radio"
                    name="booking_package"
                    value={p.id}
                    checked={aktif}
                    onChange={() => setPaketId(p.id)}
                    className="mt-1 h-4 w-4 accent-primary"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-title-md text-title-md text-on-surface">{d.judul}</span>
                        {d.hemat && (
                          <span
                            className={`rounded-full px-2 py-0.5 font-label-sm text-label-sm font-semibold ${
                              p.id === 'fullday' ? 'bg-secondary text-on-secondary' : 'bg-pink-100 text-secondary'
                            }`}
                          >
                            {d.hemat}
                          </span>
                        )}
                      </div>
                      <span
                        className={`font-title-md text-title-md ${aktif ? 'font-bold text-primary' : 'text-on-surface'}`}
                      >
                        {rp(p.harga)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-body-sm text-on-surface-variant">{d.subMobile}</p>
                  </div>
                </label>
              )
            })}
          </div>

          <div className="mt-space-md flex items-start gap-2.5 rounded bg-purple-100/70 p-3 text-on-surface-variant">
            <Icon name="schedule" className="mt-0.5 flex-shrink-0 text-[20px] text-primary" />
            <div className="min-w-0 text-body-sm">
              <span className="font-semibold text-on-surface">
                Operasional: {ruangan.jamBuka} – {ruangan.jamTutup} WIB.
              </span>{' '}
              Setiap pemesanan memiliki jeda sterilisasi 2 jam otomatis (FR-C6) sebelum slot berikutnya.
            </div>
          </div>
        </div>
      </div>

      {/* ============ 4. Fasilitas ============ */}
      <div className="mt-space-lg px-margin">
        <div className="mb-space-sm flex items-center justify-between">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Fasilitas Termasuk</h2>
          <span className="font-label-sm text-label-sm font-semibold text-primary">
            {ruangan.fasilitas.length} Fasilitas Unggulan
          </span>
        </div>
        <div className="grid grid-cols-2 gap-space-sm">
          {ruangan.fasilitas.map((f, i) => (
            <div
              key={f}
              className={`flex items-center gap-2.5 rounded bg-surface-container-lowest p-3 shadow-sm ${
                i === ruangan.fasilitas.length - 1 ? 'col-span-2' : ''
              }`}
            >
              <Icon name={ikonFasilitas(f)} className="flex-shrink-0 text-[20px] text-primary" />
              <span className="truncate text-body-sm font-medium text-on-surface">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ============ 5. Deskripsi ============ */}
      <div className="mt-space-lg px-margin">
        <h2 className="mb-space-sm font-headline-sm text-headline-sm text-on-surface">Deskripsi Ruangan</h2>
        <div className="rounded-lg bg-surface-container-lowest p-space-md shadow-sm">
          <p className="text-body-md leading-relaxed text-on-surface-variant">{ruangan.deskripsi}</p>
          <div className="mt-space-md flex items-start gap-3 rounded bg-purple-100 p-3.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
              <Icon name="verified_user" className="text-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="font-title-md text-title-md font-semibold text-primary">Protokol Kebersihan RuangKu v1.0</p>
              <p className="mt-0.5 text-body-sm text-on-surface-variant">
                Sirkulasi HEPA Filter aktif &amp; disinfeksi fogging UV-C selama 2 jam otomatis sebelum serah terima
                kunci.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============ 6. Kalender ============ */}
      <div className="mt-space-lg px-margin">
        <div className="mb-space-sm flex items-center justify-between">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Ketersediaan Real-Time</h2>
            <p className="text-body-sm text-slate-500">Pilih tanggal untuk melihat jadwal slot</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-status-available-bg px-2.5 py-1 font-label-sm text-label-sm font-semibold text-status-available">
            <span className="h-2 w-2 animate-pulse rounded-full bg-status-available" />
            Live Sync
          </span>
        </div>

        <div className="rounded-lg bg-surface-container-lowest p-space-md shadow-card">
          <div className="mb-space-sm flex items-center justify-between pb-2">
            <span className="font-title-md text-title-md font-bold text-on-surface">
              {NAMA_BULAN[bulan]} 2026
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Bulan Sebelumnya"
                onClick={() => gantiBulan(-1)}
                disabled={bulan === 0}
                className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface transition-all hover:bg-surface-container active:scale-95 disabled:opacity-40"
              >
                <Icon name="chevron_left" className="text-[18px]" />
              </button>
              <button
                type="button"
                aria-label="Bulan Berikutnya"
                onClick={() => gantiBulan(1)}
                disabled={bulan === 11}
                className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface transition-all hover:bg-surface-container active:scale-95 disabled:opacity-40"
              >
                <Icon name="chevron_right" className="text-[18px]" />
              </button>
            </div>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1 text-center font-label-sm text-label-sm text-slate-500">
            {HARI_MINGGU_PERTAMA.map((h) => (
              <span key={h}>{h}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-body-sm">
            {sel.map((s, i) => {
              const t = s.tanggal
              if (t === null) return <span key={`kosong-${i}`} className="py-2" />
              if (t === tanggal) {
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTanggal(t)}
                    className="flex flex-col items-center gap-1 rounded bg-primary py-2 font-bold text-on-primary shadow-card"
                  >
                    <span>{t}</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  </button>
                )
              }
              const kelas = s.status ? KELAS_STATUS[s.status] : null
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTanggal(t)}
                  className={`flex flex-col items-center gap-1 rounded py-2 transition-colors hover:bg-purple-50 ${
                    kelas ? 'text-on-surface' : 'text-slate-500'
                  }`}
                >
                  <span>{t}</span>
                  {kelas && <span className={`h-1.5 w-1.5 rounded-full ${kelas.dot}`} />}
                </button>
              )
            })}
          </div>

          <div className="mt-space-md flex flex-wrap items-center justify-between gap-2 border-t border-surface-container pt-space-sm font-label-sm text-label-sm">
            <span className="flex items-center gap-1.5 text-on-surface-variant">
              <span className="h-2.5 w-2.5 rounded-full bg-status-available" /> {LABEL_STATUS.tersedia}
            </span>
            <span className="flex items-center gap-1.5 text-on-surface-variant">
              <span className="h-2.5 w-2.5 rounded-full bg-status-occupied" /> Sebagian
            </span>
            <span className="flex items-center gap-1.5 text-on-surface-variant">
              <span className="h-2.5 w-2.5 rounded-full bg-status-full" /> Penuh
            </span>
            <span className="flex items-center gap-1.5 text-on-surface-variant">
              <span className="h-2.5 w-2.5 rounded-full bg-status-blocked" /> Libur
            </span>
          </div>

          {/* Timeline tanggal terpilih */}
          <div className="mt-space-md">
            <p className="mb-space-sm font-title-md text-title-md font-semibold text-on-surface">
              Timeline Slot • {tanggalPanjang(bulan, tanggal)}
            </p>
            <div className="flex flex-col gap-2 text-body-sm">
              {slots.map((s) => {
                const kelas = KELAS_STATUS[s.status]
                return (
                  <div
                    key={s.rentang}
                    className={`flex items-center justify-between gap-2 rounded p-3 ${kelas.panel}`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Icon
                        name={
                          s.status === 'tersedia'
                            ? 'event_available'
                            : s.status === 'terisi'
                              ? 'lock_clock'
                              : s.status === 'penuh'
                                ? 'block'
                                : 'sanitizer'
                        }
                        className={`flex-shrink-0 text-[18px] ${kelas.teks}`}
                      />
                      <div className="min-w-0">
                        <span className={`font-semibold ${kelas.teks}`}>{s.rentang}</span>
                        <p className="truncate text-xs text-on-surface-variant">{s.ket}</p>
                      </div>
                    </div>
                    <span
                      className={`flex-shrink-0 rounded-full bg-white px-2 py-0.5 font-label-sm text-label-sm font-semibold ${kelas.teks}`}
                    >
                      {s.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ============ 7. Kartu penyedia ============ */}
      <div className="mt-space-lg px-margin">
        <div className="flex items-center gap-3.5 rounded-lg bg-surface-container-lowest p-space-md shadow-sm">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-container font-bold text-on-primary shadow-sm">
            {inisial}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate font-title-md text-title-md font-semibold text-on-surface">
                {ruangan.penyedia}
              </p>
              <Icon name="verified" filled className="text-[16px] text-primary" />
            </div>
            <p className="text-body-sm text-on-surface-variant">Mitra Pengelola Resmi Terverifikasi</p>
            <span className="mt-1 inline-flex items-center gap-1 font-label-sm text-label-sm text-status-available">
              <Icon name="chat" className="text-[14px]" /> WhatsApp &amp; Faktur Pajak Otomatis
            </span>
          </div>
        </div>
      </div>

      {/* ============ Toast ============ */}
      {pesan && (
        <div className="fixed inset-x-0 z-50 flex justify-center px-margin" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 148px)' }}>
          <span className="rounded-full bg-inverse-surface px-4 py-2 text-body-sm text-inverse-on-surface shadow-card">
            {pesan}
          </span>
        </div>
      )}

      {/* ============ 8. Sticky bottom bar (hanya untuk pemesan) ============ */}
      {!lihatSaja && (
        <div
          className="fixed inset-x-0 z-40 border-t border-purple-100 bg-surface-container-lowest/95 backdrop-blur-xl"
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 64px)' }}
        >
          <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-margin py-3">
            <div className="min-w-0">
              <p className="truncate font-label-sm text-label-sm text-slate-500">Total ({info.ringkasSingkat})</p>
              <div className="flex items-baseline gap-1">
                <span className="font-headline-sm text-headline-sm font-extrabold text-on-surface">{rp(harga)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={pesanSekarang}
              className="bg-cta flex flex-shrink-0 items-center gap-2 rounded-full px-5 py-3 font-title-md text-title-md font-semibold text-on-primary shadow-card transition-all active:scale-95"
            >
              <span>Pilih Jadwal</span>
              <Icon name="arrow_forward" className="text-[18px]" />
            </button>
          </div>
        </div>
      )}

      <LoginRequiredModal open={perluLogin} onClose={() => setPerluLogin(false)} />
    </div>
  )
}
