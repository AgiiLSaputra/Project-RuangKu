import { Link } from 'react-router-dom'
import { NADA_SLA } from '../../data/dashboardAdmin'
import type { MitraVerifikasi } from '../../data/verifikasiPenyedia'
import { cn } from '../../lib/cn'
import { Icon } from '../../components/ui/Icon'
import {
  ModalDokumen,
  ModalFoto,
  ModalPenolakan,
} from '../../components/domain/admin/VerifikasiModals'
import {
  useVerifikasiPenyedia,
} from '../../components/domain/admin/useVerifikasiPenyedia'

const KELAS_TOMBOL =
  'inline-flex items-center justify-center gap-2 rounded-full font-title-md text-body-md font-semibold transition-all active:scale-[0.95]'

/** Judul seksi bernomor (bukti fisik, lokasi, rangkuman). */
function JudulSeksi({
  nomor,
  judul,
  deskripsi,
}: {
  nomor: string
  judul: string
  deskripsi: string
}) {
  return (
    <div className="flex items-center gap-space-sm">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 font-label-md text-label-md font-bold text-primary">
        {nomor}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
          {judul}
        </span>
        <span className="text-body-sm text-slate-500">{deskripsi}</span>
      </span>
    </div>
  )
}

/** Kartu satu mitra pada antrean kiri. */
function KartuAntrean({
  m,
  aktif,
  onPilih,
}: {
  m: MitraVerifikasi
  aktif: boolean
  onPilih: () => void
}) {
  const sla = NADA_SLA[m.slaNada]
  return (
    <button
      type="button"
      onClick={onPilih}
      aria-current={aktif ? 'true' : undefined}
      className={cn(
        'relative w-full overflow-hidden rounded-2xl p-space-md text-left shadow-sm transition-all',
        aktif ? 'bg-purple-100' : 'bg-surface-container-lowest hover:bg-surface-container-high/40',
      )}
    >
      {aktif && <span className="absolute inset-y-0 left-0 w-1.5 bg-primary" aria-hidden />}
      <div className={cn('flex flex-col gap-2', aktif && 'pl-1.5')}>
        <div className="flex items-start justify-between gap-2">
          <span className="flex min-w-0 flex-col">
            <span className="font-title-md text-title-md font-semibold leading-snug text-on-surface">
              {m.nama}
            </span>
            <span
              className={cn(
                'flex items-center gap-1 text-body-sm font-medium',
                aktif ? 'text-primary' : 'text-slate-500',
              )}
            >
              <Icon name={m.ikonVenue} className="text-[16px]" />
              {m.venue}
            </span>
          </span>
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 font-label-sm text-label-sm font-semibold',
              sla.chip,
            )}
          >
            {m.sla}
          </span>
        </div>
        <span className="flex items-center gap-1 text-body-sm text-slate-500">
          <Icon name="location_on" className="text-[15px]" />
          {m.lokasi}
        </span>
        <span
          className={cn(
            'flex items-center justify-between gap-2 border-t pt-1',
            aktif ? 'border-purple-300/40' : 'border-purple-50',
          )}
        >
          <span className="font-label-md text-label-md text-slate-500">
            {m.waktu} WIB
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-lowest px-2.5 py-0.5 font-label-sm text-label-sm font-semibold text-primary shadow-sm">
            <Icon name={m.ikonBerkas} className="text-[13px]" />
            {m.berkasRingkas}
          </span>
        </span>
      </div>
    </button>
  )
}

/**
 * Halaman verifikasi mitra penyedia (FR-G1) — mockup `Verif.html`.
 * Tata letak master-detail: antrean kiri, panel verifikasi lengkap kanan.
 */
export function VerifikasiPenyediaPage() {
  const verif = useVerifikasiPenyedia()
  const m = verif.terpilih
  /** Panel memuat: saat list masuk ATAU detail pengajuan yang dipilih sedang diambil. */
  const memuatPanel = verif.memuat || (verif.memuatDetail && verif.antrean.length > 0)

  return (
    <div className="mx-auto w-full max-w-7xl pb-6 pt-4">
      {/* 1. Judul halaman + target SLA */}
      <section className="mb-space-lg flex flex-col gap-space-md lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-body-sm text-slate-500">
            <Link to="/admin" className="transition-colors hover:text-primary">
              Beranda
            </Link>
            <Icon name="chevron_right" className="text-[14px] text-outline-variant" />
            <span>Super Admin</span>
            <Icon name="chevron_right" className="text-[14px] text-outline-variant" />
            <span className="font-medium text-primary">Verifikasi Penyedia</span>
          </nav>
          <div className="flex items-center gap-space-sm pt-0.5">
            <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
              Verifikasi Mitra Penyedia Baru
            </h1>
            <span className="rounded-full bg-status-occupied-bg px-3 py-1 font-label-md text-label-md font-semibold text-status-occupied">
              {verif.ringkas.menunggu} Menunggu Persetujuan
            </span>
          </div>
          <p className="max-w-4xl text-body-md leading-relaxed text-slate-500">
            Tinjau kelengkapan identitas fisik venue, keabsahan dokumen perizinan, dan titik
            koordinat Google Maps sebelum mengizinkan penayangan etalase publik (SOP FR-G1).
          </p>
        </div>

        <div className="flex items-center gap-space-sm self-start rounded-full bg-purple-100 px-space-md py-2.5 shadow-sm lg:self-center">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white">
            <Icon name="timer" className="text-[18px]" />
          </span>
          <span className="flex flex-col pr-2">
            <span className="font-label-sm font-semibold uppercase tracking-wider text-primary">
              Target Verifikasi
            </span>
            <span className="text-body-sm font-semibold text-on-surface">
              Prioritas SLA: {'<'} 24 Jam sejak diajukan
            </span>
          </span>
        </div>
      </section>

      {/* 2. Master-detail: antrean + panel verifikasi */}
      <div className="grid grid-cols-12 items-start gap-gutter-desktop">
        {/* Kolom kiri: antrean kandidat */}
        <div className="col-span-12 flex flex-col gap-space-md lg:col-span-4">
          <div className="flex flex-col gap-space-sm rounded-2xl bg-surface-container-lowest p-space-md shadow-sm">
            <div className="relative flex items-center">
              <Icon
                name="search"
                className="pointer-events-none absolute left-3.5 text-[18px] text-slate-500"
              />
              <input
                type="search"
                value={verif.cari}
                onChange={(e) => verif.setCari(e.target.value)}
                placeholder="Cari nama mitra atau gedung..."
                aria-label="Cari nama mitra atau gedung"
                className="h-11 w-full rounded-full bg-purple-50 pl-10 pr-3.5 text-body-sm text-on-surface placeholder:text-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => verif.setFilter('semua')}
                  className={cn(
                    'rounded-full px-3 py-1 font-label-sm text-label-sm font-semibold transition-colors',
                    verif.filter === 'semua'
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-purple-50 text-slate-500 hover:bg-purple-100 hover:text-primary',
                  )}
                >
                  Semua ({verif.ringkas.menunggu})
                </button>
                <button
                  type="button"
                  onClick={() => verif.setFilter('prioritas')}
                  className={cn(
                    'rounded-full px-3 py-1 font-label-sm text-label-sm font-semibold transition-colors',
                    verif.filter === 'prioritas'
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-purple-50 text-slate-500 hover:bg-purple-100 hover:text-primary',
                  )}
                >
                  Prioritas ({verif.ringkas.prioritas})
                </button>
              </div>
              <button
                type="button"
                onClick={() => verif.setUrutTerbaru((v) => !v)}
                className="font-label-sm text-label-sm text-slate-500 transition-colors hover:text-primary"
              >
                Urut: {verif.urutTerbaru ? 'Terbaru' : 'Terlama'}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-space-sm">
            {verif.antrean.length === 0 ? (
              <div className="rounded-2xl bg-surface-container-lowest p-space-lg text-center shadow-sm">
                <p className="font-title-md text-title-md font-semibold text-on-surface">
                  Tidak ada mitra yang cocok
                </p>
                <p className="mt-1 text-body-sm text-slate-500">
                  Ubah filter atau kata kunci pencarian.
                </p>
              </div>
            ) : (
              verif.antrean.map((kandidat) => (
                <KartuAntrean
                  key={kandidat.id}
                  m={kandidat}
                  aktif={m?.id === kandidat.id}
                  onPilih={() => verif.pilih(kandidat.id)}
                />
              ))
            )}
          </div>

          <div className="flex items-center justify-between gap-2 px-2 font-label-sm text-label-sm text-slate-500">
            <span>
              Menampilkan {verif.antrean.length} dari {verif.ringkas.menunggu} permohonan aktif
            </span>
            {(verif.filter !== 'semua' || verif.cari !== '') && (
              <button
                type="button"
                onClick={() => {
                  verif.setFilter('semua')
                  verif.setCari('')
                }}
                className="flex items-center gap-0.5 font-semibold text-primary hover:underline"
              >
                Lihat Semua Antrean
                <Icon name="arrow_forward" className="text-[14px]" />
              </button>
            )}
          </div>
        </div>

        {/* Kolom kanan: panel verifikasi detail */}
        <div id="panel-verifikasi" className="col-span-12 flex flex-col gap-space-lg lg:col-span-8">
          {verif.hasil && (
            <div
              className={cn(
                'flex items-start gap-space-sm rounded-2xl p-space-md shadow-sm',
                verif.hasil.nada === 'sukses' ? 'bg-status-available-bg' : 'bg-error-container',
              )}
            >
              <Icon
                name={verif.hasil.nada === 'sukses' ? 'check_circle' : 'cancel'}
                className={cn(
                  'mt-0.5 shrink-0 text-[20px]',
                  verif.hasil.nada === 'sukses' ? 'text-status-available' : 'text-error',
                )}
              />
              <p className="flex-1 text-body-sm leading-relaxed text-on-surface">
                {verif.hasil.teks}
              </p>
              <button
                type="button"
                aria-label="Tutup ringkasan keputusan"
                onClick={() => verif.setHasil(null)}
                className="shrink-0 rounded-full p-1 text-slate-500 transition-colors hover:bg-white/60 hover:text-on-surface"
              >
                <Icon name="close" className="text-[18px]" />
              </button>
            </div>
          )}

          {!m ? (
            /* Antrean habis diputus — atau detail sedang dimuat dari server */
            memuatPanel ? (
              <div className="flex flex-col items-center gap-space-md rounded-2xl bg-surface-container-lowest p-space-xl text-center shadow-sm">
                <span className="flex h-14 w-14 animate-pulse items-center justify-center rounded-full bg-purple-100 text-primary">
                  <Icon name="hourglass_top" className="text-[28px]" />
                </span>
                <p className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  Memuat Antrean Verifikasi…
                </p>
                <p className="max-w-md text-body-sm text-slate-500">
                  Mengambil data pengajuan terbaru dari server RuangKu.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-space-md rounded-2xl bg-surface-container-lowest p-space-xl text-center shadow-sm">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-status-available-bg text-status-available">
                  <Icon name="verified" className="text-[28px]" />
                </span>
                {verif.galatMuat && (
                  <p className="font-label-md font-semibold text-status-full">
                    Gagal memuat: {verif.galatMuat}
                  </p>
                )}
                <div>
                  <p className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                    Seluruh antrean verifikasi selesai diputus
                  </p>
                  <p className="mt-1 max-w-md text-body-sm text-slate-500">
                    Semua permohonan mitra sudah disetujui atau ditolak, dan setiap keputusan
                    tercatat permanen di Audit Log (FR-I1).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={verif.resetDemo}
                  className={cn(
                    KELAS_TOMBOL,
                    'h-11 bg-purple-50 px-space-md text-primary shadow-sm hover:bg-purple-100',
                  )}
                >
                  <Icon name="refresh" className="text-[18px]" />
                  Muat Ulang Antrean
                </button>
              </div>
            )
          ) : (
            <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm">
              {/* Kepala: identitas mitra + kanal komunikasi */}
              <div className="flex flex-col gap-space-md bg-surface-container-low p-space-lg">
                <div className="flex flex-col justify-between gap-space-sm md:flex-row md:items-center">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-headline-md text-headline-md font-semibold text-on-surface">
                        {m.nama}
                      </h2>
                      <span className="inline-flex items-center gap-1 rounded-full bg-status-available-bg px-2.5 py-0.5 font-label-sm text-label-sm font-semibold text-status-available">
                        <Icon name="verified" className="text-[14px]" />
                        Email Terverifikasi
                      </span>
                      <span className="rounded-full bg-status-occupied-bg px-2.5 py-0.5 font-label-sm text-label-sm font-semibold text-status-occupied">
                        Menunggu Verifikasi (FR-A4)
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-body-sm text-slate-500">
                      <span className="font-label-sm font-semibold uppercase tracking-wider text-primary">
                        ID Mitra: {m.idMitra}
                      </span>
                      <span>•</span>
                      <span>
                        Diajukan {m.diajukan} ({m.usia})
                      </span>
                    </div>
                  </div>
                  <a
                    href={`https://wa.me/${m.wa.nomor}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center gap-2 self-start rounded-full bg-status-available-bg px-4 text-body-sm font-semibold text-status-available shadow-sm transition-colors hover:bg-status-available hover:text-white md:self-auto"
                  >
                    <Icon name="chat" className="text-[18px]" />
                    Hubungi via WhatsApp
                  </a>
                </div>

                {/* Bento data PIC */}
                <div className="grid grid-cols-1 gap-space-sm pt-2 sm:grid-cols-3">
                  {[
                    {
                      label: 'Penanggung Jawab (PIC)',
                      nilai: m.pic.nama,
                      kaki: m.pic.jabatan,
                      kakiKelas: 'text-slate-500',
                      mono: false,
                    },
                    {
                      label: 'Email Terdaftar',
                      nilai: m.email,
                      kaki: 'Domain Perusahaan Valid',
                      kakiKelas: 'text-status-available',
                      mono: false,
                      ikonKaki: 'check_circle',
                    },
                    {
                      label: 'WhatsApp Operasional (FR-A6)',
                      nilai: m.wa.tampil,
                      kaki: 'Aktif • Terhubung API',
                      kakiKelas: 'text-slate-500',
                      mono: true,
                    },
                  ].map((kartu) => (
                    <div
                      key={kartu.label}
                      className="flex flex-col gap-1 rounded-2xl bg-surface-container-lowest p-space-md shadow-sm"
                    >
                      <span className="font-label-sm font-medium uppercase tracking-wider text-slate-500">
                        {kartu.label}
                      </span>
                      <span
                        className={cn(
                          'truncate font-title-md text-title-md font-semibold text-on-surface',
                          kartu.mono && 'font-label-md',
                        )}
                        title={kartu.nilai}
                      >
                        {kartu.nilai}
                      </span>
                      <span
                        className={cn(
                          'flex items-center gap-1 text-body-sm font-medium',
                          kartu.kakiKelas,
                        )}
                      >
                        {kartu.ikonKaki && <Icon name={kartu.ikonKaki} className="text-[14px]" />}
                        {kartu.kaki}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Isi panel verifikasi */}
              <div className="flex flex-col gap-space-xl p-space-lg">
                {/* Seksi 1: bukti fisik */}
                <section className="flex flex-col gap-space-md">
                  <div className="flex items-center justify-between gap-2">
                    <JudulSeksi
                      nomor="1"
                      judul="Bukti Fisik Bangunan & Gedung"
                      deskripsi="Verifikasi visual keaslian fasilitas, tata ruang, dan pencahayaan (FR-A5, FR-A9)"
                    />
                    <span className="shrink-0 rounded-full bg-purple-100 px-2.5 py-1 font-label-sm font-semibold text-primary">
                      {m.foto.length} Foto Berkas Diajukan
                    </span>
                  </div>
                  <div className="grid grid-cols-1 items-stretch gap-space-md md:grid-cols-3">
                    {/* Foto utama — bisa kosong bila pemohon belum mengunggah foto */}
                    {m.foto.length === 0 ? (
                      <div className="col-span-1 flex items-center justify-center rounded-2xl bg-surface-container p-space-md text-body-sm text-slate-500 shadow-sm md:col-span-2">
                        Belum ada foto pada pengajuan ini
                      </div>
                    ) : (
                    <button
                      type="button"
                      onClick={() =>
                        verif.setFotoBesar({ src: m.foto[0].src, judul: m.foto[0].judul ?? m.venue })
                      }
                      className="group relative col-span-1 aspect-[16/10] overflow-hidden rounded-2xl bg-surface-container text-left shadow-sm md:col-span-2"
                    >
                      <img
                        src={m.foto[0].src}
                        alt={m.foto[0].judul ?? m.venue}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-inverse-surface/80 via-inverse-surface/20 to-transparent p-space-md text-white">
                        <span className="mb-1 inline-flex w-fit items-center gap-1 rounded-full bg-primary/80 px-2.5 py-0.5 font-label-sm font-semibold backdrop-blur-md">
                          {m.foto[0].label}
                        </span>
                        <span className="flex items-end justify-between gap-2">
                          <span className="font-title-md text-title-md font-semibold">
                            {m.foto[0].judul}
                          </span>
                          <span className="shrink-0 font-label-sm opacity-90">
                            {m.foto[0].meta}
                          </span>
                        </span>
                      </span>
                    </button>
                    )}
                    {/* Foto pendukung */}
                    <div className="flex flex-col justify-between gap-space-md">
                      {m.foto.slice(1).map((foto) => (
                        <button
                          key={foto.label}
                          type="button"
                          onClick={() => verif.setFotoBesar({ src: foto.src, judul: foto.label })}
                          className="group relative aspect-[16/10] overflow-hidden rounded-2xl bg-surface-container shadow-sm"
                        >
                          <img
                            src={foto.src}
                            alt={foto.label}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <span className="absolute inset-0 flex items-end bg-gradient-to-t from-inverse-surface/75 to-transparent p-3 text-white">
                            <span className="flex items-center gap-1 font-label-sm font-semibold">
                              <Icon name="zoom_in" className="text-[14px]" />
                              {foto.label}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Seksi 2: lokasi & dokumen */}
                <section className="flex flex-col gap-space-md">
                  <JudulSeksi
                    nomor="2"
                    judul="Validasi Kelayakan Lokasi & Dokumen Perizinan"
                    deskripsi="Tautan Google Maps terverifikasi wajib ada jika tanpa berkas dokumen fisik perizinan (FR-A5)"
                  />
                  <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
                    {/* Kartu Google Maps */}
                    <div className="flex flex-col justify-between gap-space-md rounded-2xl bg-purple-50 p-space-md">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-status-available-bg text-status-available">
                              <Icon name="location_on" className="text-[18px]" />
                            </span>
                            <span className="font-title-md text-title-md font-semibold text-on-surface">
                              Tautan Google Maps Terverifikasi
                            </span>
                          </span>
                          <span className="rounded-full bg-status-available-bg px-2 py-0.5 font-label-sm font-semibold text-status-available">
                            Terhubung API
                          </span>
                        </div>
                        <p className="text-body-sm leading-relaxed text-on-surface-variant">
                          {m.maps.alamat}
                        </p>
                        <div className="flex flex-col gap-1 rounded-xl bg-surface-container-lowest p-2.5 font-label-sm text-label-sm text-slate-500">
                          <div className="flex items-center justify-between gap-2">
                            <span>Titik Koordinat GPS:</span>
                            <span className="font-label-md font-semibold text-on-surface">
                              {m.maps.koordinat}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span>Place ID Verified:</span>
                            <span className="truncate font-label-md font-semibold text-primary">
                              {m.maps.placeId}
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Pratinjau peta statis */}
                      <div className="relative flex h-32 items-center justify-center overflow-hidden rounded-xl bg-surface-container-high shadow-sm">
                        <span className="absolute inset-0 bg-primary/5" aria-hidden />
                        <span className="relative z-10 flex flex-col items-center gap-1">
                          <span className="flex h-7 w-7 animate-bounce items-center justify-center rounded-full bg-status-full text-white shadow-md">
                            <Icon name="pin_drop" className="text-[16px]" />
                          </span>
                          <span className="rounded-full bg-surface-container-lowest/90 px-2 py-0.5 font-label-sm font-semibold text-on-surface shadow-sm">
                            {m.maps.tempat}
                          </span>
                        </span>
                      </div>
                      <a
                        href={`https://maps.google.com/?q=${m.maps.koordinat}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-surface-container-lowest text-body-sm font-semibold text-primary shadow-sm transition-colors hover:bg-purple-100"
                      >
                        Buka Titik Koordinat di Google Maps
                        <Icon name="open_in_new" className="text-[16px]" />
                      </a>
                    </div>

                    {/* Kartu dokumen perizinan */}
                    <div className="flex flex-col justify-between gap-space-md rounded-2xl bg-purple-50 p-space-md">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-primary">
                              <Icon name="verified_user" className="text-[18px]" />
                            </span>
                            <span className="font-title-md text-title-md font-semibold text-on-surface">
                              Sertifikat &amp; Izin Usaha
                            </span>
                          </span>
                          <span className="rounded-full bg-purple-100 px-2 py-0.5 font-label-sm font-semibold text-primary">
                            Dokumen Sah
                          </span>
                        </div>
                        <p className="text-body-sm leading-relaxed text-on-surface-variant">
                          {m.dokumen.jenis} terintegrasi OSS — terbit {m.dokumen.terbit}, berlaku
                          hingga {m.dokumen.berlaku}.
                        </p>
                        <div className="flex items-center gap-3 rounded-xl bg-surface-container-lowest p-3 shadow-sm">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-secondary">
                            <Icon name="picture_as_pdf" className="text-[24px]" />
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate font-title-md text-title-md font-semibold text-on-surface">
                              {m.dokumen.nama}
                            </span>
                            <span className="font-label-sm text-slate-500">
                              {m.dokumen.ukuran} • {m.dokumen.meta}
                            </span>
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => verif.setDokBuka(true)}
                        className="flex h-10 items-center justify-center gap-1 rounded-full bg-primary text-body-sm font-semibold text-white shadow-sm transition-colors hover:bg-purple-700"
                      >
                        <Icon name="visibility" className="text-[16px]" />
                        Pratinjau Dokumen
                      </button>
                    </div>
                  </div>
                </section>

                {/* Seksi 3: rangkuman etalase */}
                <section className="flex flex-col gap-space-md">
                  <JudulSeksi
                    nomor="3"
                    judul="Rangkuman Rencana Etalase & Operasional"
                    deskripsi="Konfigurasi awal venue yang akan tayang di katalog setelah disetujui"
                  />
                  <div className="grid grid-cols-2 gap-space-md md:grid-cols-4">
                    {[
                      {
                        label: 'Tipe Ruangan',
                        nilai: m.rangkuman.tipe,
                        kaki: m.rangkuman.tipeSub,
                        nilaiKelas: 'text-on-surface',
                      },
                      {
                        label: 'Estimasi Kapasitas',
                        nilai: m.rangkuman.kapasitas,
                        kaki: m.rangkuman.kapasitasSub,
                        nilaiKelas: 'text-primary',
                      },
                      {
                        label: 'Jam Operasional',
                        nilai: m.rangkuman.jam,
                        kaki: m.rangkuman.jamSub,
                        nilaiKelas: 'text-on-surface',
                      },
                      {
                        label: 'Jeda Sterilisasi (FR-C6)',
                        nilai: m.rangkuman.jeda,
                        kaki: 'Otomatis terkunci sistem',
                        nilaiKelas: 'text-status-available',
                        ikon: 'lock_clock',
                      },
                    ].map((kartu) => (
                      <div
                        key={kartu.label}
                        className="flex flex-col gap-1 rounded-2xl bg-surface-container-low p-space-md"
                      >
                        <span className="font-label-sm font-medium uppercase tracking-wider text-slate-500">
                          {kartu.label}
                        </span>
                        <span
                          className={cn(
                            'font-headline-sm text-headline-sm font-semibold',
                            kartu.nilaiKelas,
                          )}
                        >
                          {kartu.nilai}
                        </span>
                        <span
                          className={cn(
                            'flex items-center gap-1 text-body-sm text-slate-500',
                            kartu.ikon && kartu.nilaiKelas === 'text-status-available' && 'text-status-available',
                          )}
                        >
                          {kartu.ikon && <Icon name={kartu.ikon} className="text-[16px]" />}
                          {kartu.kaki}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Seksi 4: banner audit */}
                <section className="flex items-start gap-space-sm rounded-2xl bg-purple-100/60 p-space-md">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon name="verified" className="text-[18px]" />
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="font-title-md text-title-md font-semibold text-on-surface">
                      Integritas Audit Log Terenkripsi (FR-I1)
                    </span>
                    <span className="text-body-sm leading-relaxed text-slate-500">
                      Seluruh tindakan persetujuan dan penolakan dicatat permanen di Audit Log
                      terenkripsi beserta nama akun Super Admin (Admin Utama Sistem), alamat IP,
                      dan stempel waktu UTC+7. Keputusan bersifat mengikat.
                    </span>
                  </span>
                </section>
              </div>

              {/* Bar aksi keputusan (sticky) */}
              <div className="sticky bottom-0 z-20 flex flex-col justify-between gap-space-md border-t border-purple-100 bg-surface-container-lowest/95 px-space-lg py-space-md shadow-lg backdrop-blur-md sm:flex-row sm:items-center">
                <span className="flex flex-col">
                  <span className="font-title-md text-title-md font-semibold text-on-surface">
                    Keputusan Verifikasi Akun Mitra (FR-G1)
                  </span>
                  <span className="text-body-sm text-slate-500">
                    Pastikan seluruh bukti fisik gedung dan koordinat telah terkonfirmasi.
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-space-sm">
                  <button
                    type="button"
                    onClick={verif.bukaTolak}
                    disabled={Boolean(verif.proses)}
                    className={cn(
                      KELAS_TOMBOL,
                      'h-12 bg-error-container px-space-lg text-error shadow-sm transition-colors hover:bg-error hover:text-white disabled:opacity-60',
                    )}
                  >
                    <Icon name="cancel" className="text-[20px]" />
                    Tolak Pengajuan
                  </button>
                  <button
                    type="button"
                    onClick={verif.setujui}
                    disabled={Boolean(verif.proses)}
                    className={cn(
                      KELAS_TOMBOL,
                      'h-12 bg-status-available px-space-xl text-white shadow-md transition-all hover:opacity-95 hover:shadow-lg disabled:opacity-60',
                    )}
                  >
                    {verif.proses === 'setuju' ? (
                      <>
                        <Icon name="sync" className="animate-spin text-[20px]" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <Icon name="check_circle" className="text-[20px]" />
                        Setujui Penyedia (Aktifkan Etalase)
                      </>
                    )}
                  </button>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <ModalPenolakan verif={verif} />
      <ModalFoto verif={verif} />
      <ModalDokumen verif={verif} />
    </div>
  )
}
