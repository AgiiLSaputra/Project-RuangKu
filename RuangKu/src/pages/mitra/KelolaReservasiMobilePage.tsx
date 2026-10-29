import { useState } from 'react'
import { Link } from 'react-router-dom'
import { StatusBadge } from '../../components/ui/Badge'
import { Icon } from '../../components/ui/Icon'
import { SortSelect } from '../../components/ui/SortSelect'
import { KelolaReservasiModals } from '../../components/domain/mitra/KelolaReservasiModals'
import {
  UKURAN_HALAMAN,
  ikonKategori,
  useKelolaReservasi,
  type KelolaReservasi,
} from '../../components/domain/mitra/useKelolaReservasi'
import {
  AVATAR_STATUS,
  FILTER_MASUK,
  STATUS_BAYAR,
  kodeKanan,
  teksTanggalIso,
  type ReservasiMasuk,
} from '../../data/kelolaReservasi'
import { cn } from '../../lib/cn'
import { rp } from '../../lib/format'

/** Tombol aksi lebar penuh di dalam kartu. */
const TOMBOL_LEBAR =
  'inline-flex w-full items-center justify-center gap-1.5 rounded-full px-space-md py-2.5 font-title-md text-title-md transition-all active:scale-[0.98]'
/** Tombol aksi setengah lebar (selalu berpasangan). */
const TOMBOL_SETENGAH =
  'inline-flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 font-title-md text-title-md transition-all active:scale-[0.98]'

/** Baris aksi kartu — mengikuti status reservasi (FR-F3 & FR-C16). */
function AksiKartu({ r, kelola }: { r: ReservasiMasuk; kelola: KelolaReservasi }) {
  if (r.status === 'pending')
    return (
      <div className="flex flex-col gap-space-sm pt-1">
        <button
          type="button"
          onClick={() => kelola.setBukti(r)}
          className={cn(TOMBOL_LEBAR, 'bg-purple-50 text-primary')}
        >
          <Icon name="receipt_long" className="text-[18px]" />
          <span>Lihat Bukti Transfer</span>
        </button>
        <div className="flex gap-space-sm">
          <button
            type="button"
            onClick={() => kelola.setujui(r.kode)}
            className={cn(TOMBOL_SETENGAH, 'bg-status-available text-white shadow-sm')}
          >
            <Icon name="check_circle" className="text-[18px]" />
            <span>Setujui</span>
          </button>
          <button
            type="button"
            onClick={() => kelola.setTolak(r)}
            className={cn(TOMBOL_SETENGAH, 'bg-status-full-bg text-status-full')}
          >
            <Icon name="cancel" className="text-[18px]" />
            <span>Tolak</span>
          </button>
        </div>
      </div>
    )

  if (r.status === 'approved')
    return (
      <div className="flex flex-col gap-space-sm pt-1">
        {!r.usulanJadwal && (
          <button
            type="button"
            onClick={() => kelola.setUsul(r)}
            className={cn(TOMBOL_LEBAR, 'bg-status-occupied-bg text-status-occupied')}
          >
            <Icon name="update" className="text-[18px]" />
            <span>Usulkan Jadwal Baru</span>
          </button>
        )}
        <div className="flex gap-space-sm">
          <button
            type="button"
            onClick={() => kelola.selesaikan(r.kode)}
            className={cn(TOMBOL_SETENGAH, 'bg-primary text-on-primary shadow-sm')}
          >
            <Icon name="task_alt" className="text-[18px]" />
            <span>Tandai Selesai</span>
          </button>
          <button
            type="button"
            onClick={() => kelola.batalkan(r.kode)}
            className={cn(TOMBOL_SETENGAH, 'bg-status-full-bg text-status-full')}
          >
            <Icon name="event_busy" className="text-[18px]" />
            <span>Batalkan</span>
          </button>
        </div>
        <Link to="/struk" className={cn(TOMBOL_LEBAR, 'bg-surface-container text-primary')}>
          <Icon name="receipt" className="text-[18px]" />
          <span>Rincian Struk &amp; Kontrak</span>
        </Link>
      </div>
    )

  if (r.status === 'completed')
    return (
      <Link to="/struk" className={cn(TOMBOL_LEBAR, 'bg-surface-container text-on-surface-variant')}>
        <Icon name="folder" className="text-[18px]" />
        <span>Arsip Struk &amp; Feedback</span>
      </Link>
    )

  return (
    <div className="flex w-full items-center justify-between gap-space-sm rounded-full bg-purple-50 px-space-md py-2">
      <span className="font-label-sm text-label-sm text-slate-500" title="Slot dilepas otomatis ke etalase publik">
        Slot Dilepas
      </span>
      <span className="font-body-sm text-body-sm text-slate-500" title={r.alasan ?? 'Hubungi penyewa untuk keterangan.'}>
        {r.keterangan}
      </span>
    </div>
  )
}

/** Kelola Reservasi masuk — varian mobile (KelolaVersiMobile.html). */
export function KelolaReservasiMobilePage() {
  const kelola = useKelolaReservasi()
  const [disalin, setDisalin] = useState<string | null>(null)

  /** Salin kode booking ke clipboard — indikator "done" sesaat. */
  const salin = (kode: string) => {
    navigator.clipboard?.writeText(kode)?.then(
      () => {
        setDisalin(kode)
        window.setTimeout(() => setDisalin((k) => (k === kode ? null : k)), 1500)
      },
      () => undefined,
    )
  }

  const kartu = [
    {
      eyebrow: 'SOP SLA Verifikasi',
      panel: 'bg-status-occupied-bg',
      teks: 'text-status-occupied',
      ikon: 'timer',
      nilai: `${kelola.jumlahStatus.pending} Booking`,
      nilaiKelas: 'text-on-surface',
      sub: 'Pending Verifikasi',
      kaki: 'Batas konfirmasi < 24 jam sebelum slot auto-expired (FR-C16).',
    },
    {
      eyebrow: 'Sterilisasi Siap',
      panel: 'bg-status-available-bg',
      teks: 'text-status-available',
      ikon: 'cleaning_services',
      nilai: `${kelola.jumlahStatus.approved} Booking`,
      nilaiKelas: 'text-on-surface',
      sub: 'Approved / Terjadwal',
      kaki: 'Jeda sterilisasi otomatis 2 jam terkunci rapi (FR-C6).',
    },
    {
      eyebrow: 'Kinerja Keuangan',
      panel: 'bg-purple-100',
      teks: 'text-primary',
      ikon: 'account_balance_wallet',
      nilai: rp(
        kelola.baris.filter((r) => r.status === 'completed').reduce((n, r) => n + r.total, 0),
      ),
      nilaiKelas: 'text-primary',
      sub: `${kelola.baris.filter((r) => r.status === 'completed').length} Reservasi Selesai`,
      kaki: 'Omset terkonfirmasi via virtual account & manual transfer.',
    },
  ]

  const awalTampil = kelola.tersaring.length === 0 ? 0 : (kelola.halaman - 1) * UKURAN_HALAMAN + 1
  const akhirTampil = Math.min(kelola.halaman * UKURAN_HALAMAN, kelola.tersaring.length)

  return (
    <div className="flex flex-col gap-space-md bg-surface px-gutter pb-space-lg pt-space-md">
      {/* Judul, deskripsi & aksi cepat */}
      <section className="flex flex-col gap-space-sm">
        <div className="flex flex-wrap items-center gap-space-sm">
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-on-surface">
            Kelola Reservasi
          </h1>
        </div>
        <p className="font-body-sm leading-relaxed text-body-sm text-on-surface-variant">
          Tinjau bukti pembayaran transfer di luar sistem, konfirmasi jadwal, atau perbarui status pemesanan sesuai
          SOP RuangKu (FR-F3 &amp; FR-C13).
        </p>
        <div className="flex items-center gap-space-sm pt-1">
          <button
            type="button"
            onClick={kelola.eksporCsv}
            aria-label="Ekspor CSV"
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-purple-100 px-space-md py-3 font-title-md text-title-md text-primary transition-all active:scale-95"
          >
            <Icon name="file_download" className="text-[20px]" />
            <span>Ekspor</span>
          </button>
        </div>
      </section>

      {/* Kartu ringkasan — carousel horizontal */}
      <section className="flex gap-space-sm overflow-x-auto pb-1 no-scrollbar">
        {kartu.map((k) => (
          <article
            key={k.eyebrow}
            className={cn('flex w-64 shrink-0 flex-col justify-between rounded-2xl p-space-md shadow-card', k.panel)}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={cn('font-label-sm uppercase tracking-wider', k.teks)}>{k.eyebrow}</span>
              <Icon name={k.ikon} className={cn('text-[20px]', k.teks)} />
            </div>
            <div className="my-2">
              <span className={cn('block font-headline-sm text-headline-sm font-bold', k.nilaiKelas)}>{k.nilai}</span>
              <p className={cn('font-body-sm text-body-sm font-medium', k.teks)}>{k.sub}</p>
            </div>
            <p className="font-label-sm leading-tight text-label-sm text-on-surface-variant">{k.kaki}</p>
          </article>
        ))}
      </section>

      {/* Filter chip, pencarian, filter ruangan & urut tanggal */}
      <section className="flex flex-col gap-space-sm">
        <div className="-mx-gutter flex gap-space-xs overflow-x-auto px-gutter pb-1 no-scrollbar">
          {FILTER_MASUK.map((f) => {
            const aktif = kelola.filter === f.id
            const jumlah = f.id === 'semua' ? kelola.baris.length : kelola.jumlahStatus[f.id]
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => kelola.ubahFilter(f.id)}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 font-title-md text-title-md transition-all',
                  aktif ? 'bg-primary text-on-primary shadow-sm' : cn(f.dasar, f.sorot),
                )}
              >
                <span>{f.label}</span>
                <span
                  className={cn(
                    'flex h-5 min-w-5 items-center justify-center rounded-full px-1 font-label-sm text-label-sm font-semibold',
                    aktif ? 'bg-white/25' : 'bg-purple-100 text-primary',
                  )}
                >
                  {jumlah}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex flex-col gap-space-xs">
          <div className="relative flex items-center">
            <Icon
              name="search"
              className="pointer-events-none absolute left-3.5 text-[20px] text-slate-500"
            />
            <input
              type="text"
              value={kelola.cari}
              onChange={(e) => kelola.ubahCari(e.target.value)}
              placeholder="Cari nama pemesan, kode booking..."
              className="h-11 w-full rounded-full bg-purple-50 pr-4 pl-11 font-body-sm text-body-sm text-on-surface shadow-sm transition-colors placeholder:text-slate-500 focus:bg-surface-container-lowest focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-space-xs">
            <div className="min-w-0 flex-1">
              <SortSelect
                opsi={kelola.opsiRuangan}
                nilai={kelola.ruangan}
                onPilih={kelola.ubahRuangan}
                label="Filter ruangan"
                className="h-11 w-full justify-between bg-purple-100 px-4 font-body-md text-body-md font-semibold text-primary shadow-sm"
              />
            </div>
            <button
              type="button"
              onClick={kelola.ubahUrut}
              aria-label={kelola.urut === 'terbaru' ? 'Urutkan tanggal: terlama ke terbaru' : 'Urutkan tanggal: terbaru ke terlama'}
              title={kelola.urut === 'terbaru' ? 'Urutkan: tanggal terbaru dulu' : 'Urutkan: tanggal terlama dulu'}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-container text-primary shadow-sm transition-all active:scale-95"
            >
              <Icon name="swap_vert" className="text-[20px]" />
            </button>
          </div>
        </div>
      </section>

      {/* Daftar kartu reservasi */}
      <section className="flex flex-col gap-space-md">
        {kelola.barisHalaman.map((r) => {
          const info = kelola.infoRuangan(r.ruanganId)
          const kanan = kodeKanan(r)
          const bayar = STATUS_BAYAR[r.status]
          const penanda = r.masuk ?? r.tanggal
          return (
            <article key={r.kode} className="flex flex-col gap-space-sm rounded-2xl bg-surface-container-lowest p-space-md shadow-card">
              {/* Status + metode + waktu masuk */}
              <div className="flex items-start justify-between gap-space-xs">
                <div className="flex flex-wrap items-center gap-space-xs">
                  <StatusBadge status={r.status} />
                  <span className="rounded-full bg-purple-100 px-2.5 py-1 font-label-sm text-label-sm font-medium text-primary">
                    {r.metode}
                  </span>
                </div>
                <span className="shrink-0 font-label-sm text-label-sm text-slate-500">{penanda}</span>
              </div>

              {/* Kode booking + salin + label status pembayaran */}
              <div className="flex items-center justify-between gap-space-sm rounded-xl bg-purple-50 px-3 py-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="select-all truncate font-label-sm font-semibold text-primary">{r.kode}</span>
                  <button
                    type="button"
                    onClick={() => salin(r.kode)}
                    aria-label={`Salin kode ${r.kode}`}
                    title="Salin Kode"
                    className="shrink-0 text-slate-500 transition-colors hover:text-primary"
                  >
                    <Icon
                      name={disalin === r.kode ? 'done' : 'content_copy'}
                      className={cn('text-[16px]', disalin === r.kode && 'text-status-available')}
                    />
                  </button>
                </div>
                <span className={cn('shrink-0 font-label-sm font-semibold', kanan.kelas)}>{kanan.teks}</span>
              </div>

              {/* Penyewa */}
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-title-md text-title-md font-bold',
                    AVATAR_STATUS[r.status],
                  )}
                >
                  {r.inisial}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h2 className="truncate font-title-md text-title-md text-on-surface">{r.penyewa}</h2>
                    {(r.status === 'pending' || r.status === 'approved') && (
                      <a
                        href={`https://wa.me/${r.wa}`}
                        target="_blank"
                        rel="noreferrer"
                        title={`Chat ${r.penyewa} via WhatsApp`}
                        className="text-status-available"
                      >
                        <Icon name="chat" className="text-[16px]" />
                      </a>
                    )}
                  </div>
                  <p className="truncate font-body-sm text-body-sm text-on-surface-variant">{r.organisasi}</p>
                </div>
              </div>

              {/* Ruangan, kapasitas, jadwal & jeda sterilisasi */}
              <div className="flex flex-col gap-1.5 rounded-xl bg-surface-container-low p-3">
                <div className="flex items-center gap-2">
                  <Icon name={ikonKategori(info?.kategori)} className="shrink-0 text-[18px] text-primary" />
                  <span className="truncate font-body-sm font-medium text-on-surface">{info?.nama ?? r.ruanganNama ?? '-'}</span>
                </div>
                <p className="pl-6 font-body-sm text-body-sm text-slate-500">
                  {info?.kota} (Kapasitas: {r.tamu} / {info?.kapasitasMax ?? 0} Pax)
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <Icon name="schedule" className="shrink-0 text-[18px] text-primary" />
                  <span className="font-body-sm font-medium text-on-surface">
                    {r.tanggal} • {r.jam}
                  </span>
                </div>
                {r.steril ? (
                  <span
                    className={cn(
                      'mt-1 flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 font-label-sm text-label-sm font-medium',
                      r.steril.aktif ? 'bg-status-available-bg text-status-available' : 'bg-status-occupied-bg text-status-occupied',
                    )}
                  >
                    <Icon name={r.steril.aktif ? 'verified_user' : 'lock_clock'} className="text-[15px]" />
                    <span>{r.steril.teks}</span>
                  </span>
                ) : (
                  r.keterangan && (
                    <p className="mt-1 pl-6 font-body-sm text-body-sm text-slate-500" title={r.alasan}>
                      {r.keterangan}
                    </p>
                  )
                )}
                {r.usulanJadwal && (
                  <span className="mt-1 flex w-fit items-center gap-1.5 rounded-full bg-status-occupied-bg px-2.5 py-1 font-label-sm text-label-sm font-medium text-status-occupied">
                    <Icon name="update" className="text-[15px]" />
                    <span>
                      Usulan {teksTanggalIso(r.usulanJadwal.tanggalBaru)} • {r.usulanJadwal.jamMulaiBaru} -{' '}
                      {r.usulanJadwal.jamSelesaiBaru} WIB (Menunggu Setuju Penyewa)
                    </span>
                  </span>
                )}
              </div>

              {/* Total tarif & status pembayaran */}
              <div className="flex items-end justify-between gap-space-sm pt-1">
                <div className="flex min-w-0 flex-col">
                  <span className="font-body-sm text-body-sm text-slate-500">Total Tarif Sewa</span>
                  <span
                    className={cn(
                      'font-headline-sm text-headline-sm font-bold',
                      r.status === 'cancelled' ? 'text-slate-500 line-through' : 'text-primary',
                    )}
                  >
                    {rp(r.total)}
                  </span>
                </div>
                <div className="flex min-w-0 flex-col items-end text-right">
                  <span className="truncate font-body-sm font-medium text-on-surface-variant">
                    {r.lunas ? 'Lunas Terverifikasi' : r.metode}
                  </span>
                  <span className={cn('font-body-sm text-body-sm', bayar.kelas)}>{bayar.teks}</span>
                </div>
              </div>

              {/* Aksi */}
              <AksiKartu r={r} kelola={kelola} />
            </article>
          )
        })}

        {!kelola.adaHasil && (
          <div className="flex flex-col items-center gap-space-sm rounded-2xl bg-surface-container-lowest px-space-md py-space-xl text-center shadow-card">
            <Icon name="search_off" className="text-[32px] text-slate-500" />
            <p className="font-title-md text-title-md text-on-surface">Tidak ada reservasi</p>
            <p className="font-body-sm text-body-sm text-slate-500">
              Ubah filter status, pilihan ruangan, atau kata kunci pencarian.
            </p>
          </div>
        )}
      </section>

      {/* Paginasi */}
      <section className="flex flex-col items-center gap-space-sm">
        <p className="text-center font-body-sm text-body-sm text-on-surface-variant">
          Menampilkan <span className="font-semibold text-on-surface">{awalTampil} - {akhirTampil}</span> dari{' '}
          <span className="font-semibold text-on-surface">{kelola.tersaring.length}</span> total reservasi
        </p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Halaman sebelumnya"
            disabled={kelola.halaman <= 1}
            onClick={() => kelola.keHalaman(kelola.halaman - 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-low text-slate-500 transition-colors active:bg-surface-container disabled:opacity-40"
          >
            <Icon name="chevron_left" className="text-[18px]" />
          </button>
          {Array.from({ length: kelola.totalHalaman }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`Halaman ${n}`}
              aria-current={n === kelola.halaman}
              onClick={() => kelola.keHalaman(n)}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full font-label-md text-label-md transition-colors',
                n === kelola.halaman
                  ? 'bg-primary font-bold text-on-primary shadow-sm'
                  : 'bg-surface-container text-on-surface active:bg-purple-100',
              )}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            aria-label="Halaman berikutnya"
            disabled={kelola.halaman >= kelola.totalHalaman}
            onClick={() => kelola.keHalaman(kelola.halaman + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container text-primary transition-colors active:bg-purple-100 disabled:opacity-40"
          >
            <Icon name="chevron_right" className="text-[18px]" />
          </button>
        </div>
      </section>

      {/* Catatan operasional */}
      <section className="flex items-start gap-space-sm rounded-2xl bg-purple-100 p-space-md">
        <Icon name="shield" className="mt-0.5 shrink-0 text-[20px] text-primary" />
        <div>
          <p className="font-title-md text-title-md text-on-surface">Aturan Operasional Reservasi</p>
          <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
            Persetujuan mengunci slot &amp; menjadwalkan sterilisasi 2 jam (FR-C6). Pembatalan melepas slot kembali
            ke etalase publik.
          </p>
          <div className="mt-1.5 flex items-center gap-space-sm font-label-sm text-label-sm text-slate-500">
            <Link to="/cara-kerja" className="transition-colors hover:text-primary">
              Panduan Mitra
            </Link>
            <span aria-hidden="true">•</span>
            <Link to="/pusat-bantuan" className="transition-colors hover:text-primary">
              Pusat Bantuan
            </Link>
          </div>
        </div>
      </section>

      <KelolaReservasiModals kelola={kelola} />
    </div>
  )
}
