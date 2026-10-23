import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../../components/ui/Icon'
import { useAuth } from '../../context/AuthContext'
import { useKartuMendatang } from '../../components/domain/booking/useMendatang'
import { useUsulanJadwal } from '../../components/domain/dashboard/useUsulanJadwal'
import {
  DOT_STATUS,
  useRiwayatDashboard,
  type StatusRiwayat,
} from '../../components/domain/dashboard/useRiwayatDashboard'
import { rp } from '../../lib/format'

const GAYA_STATUS: Record<StatusRiwayat, string> = {
  Pending: 'bg-status-occupied-bg text-status-occupied',
  Approved: 'bg-status-available-bg text-status-available',
  Completed: 'bg-purple-100 text-primary',
  Dibatalkan: 'bg-status-full-bg text-status-full',
}

/** Tanggal hari ini dalam bahasa Indonesia — header sapaan mengikuti hari berjalan. */
const tanggalHariIni = new Date().toLocaleDateString('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/** Dashboard penyewa (mockup DashboardPenyewa.html) — FR-C12, FR-D1, FR-C20, FR-E4. */
export function DashboardPenyewaPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [filter, setFilter] = useState<StatusRiwayat | 'Semua'>('Semua')
  /** Kartu mendatang dari data reservasi nyata (foto/nama sesuai ruangan yang dipesan). */
  const mendatang = useKartuMendatang()
  /** Usulan perubahan jadwal penyedia — banner hanya muncul bila ada usulan menunggu (FR-D1). */
  const usulan = useUsulanJadwal()
  /** Tabel riwayat, jumlah filter & statistik — semuanya turunan data server. */
  const { riwayat, filter: filterRiwayat, statistik } = useRiwayatDashboard()

  const baris = filter === 'Semua' ? riwayat : riwayat.filter((r) => r.status === filter)

  const statistikKartu = [
    {
      label: 'Reservasi Aktif',
      angka: String(statistik.aktif),
      angkaCls: 'text-on-surface',
      kaki: `${statistik.aktif - statistik.menunggu} Approved • ${statistik.menunggu} Pending`,
      kakiDot: 'bg-primary',
      kakiCls: 'text-primary',
      panel: 'bg-purple-100',
      ikon: 'calendar_month',
      ikonCls: 'text-primary',
    },
    {
      label: 'Menunggu Konfirmasi',
      angka: String(statistik.menunggu),
      angkaCls: 'text-status-occupied',
      kaki: 'Menunggu konfirmasi penyedia',
      kakiDot: '',
      kakiCls: 'text-slate-500',
      panel: 'bg-status-occupied-bg',
      ikon: 'hourglass_top',
      ikonCls: 'text-status-occupied',
    },
    {
      label: 'Reservasi Selesai',
      angka: String(statistik.selesai),
      angkaCls: 'text-on-surface',
      kaki: 'Sepanjang masa',
      kakiDot: '',
      kakiCls: 'text-slate-500',
      panel: 'bg-status-available-bg',
      ikon: 'verified',
      ikonCls: 'text-status-available',
    },
  ]

  const keStruk = (kode: string) => navigate(`/struk?kode=${kode}`)

  return (
    <div className="relative w-full bg-purple-50 px-4 pb-12 pt-6 sm:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col">
        {/* Header Sambutan Pengguna */}
        <section className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex flex-col">
            <h2 className="font-headline-lg flex items-center gap-2 text-headline-lg tracking-tight text-on-surface">
              Halo, {user?.nama ?? 'Penyewa'}
            </h2>
            <p className="mt-1 font-body-md text-body-md text-slate-500">
              {tanggalHariIni} • Kelola aktivitas pemesanan gedung dan jadwal acara Anda di sini.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/cari-ruangan')}
              className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-secondary to-pink-300 px-6 py-3 font-title-md text-title-md text-on-primary shadow-md transition-all hover:opacity-95 hover:shadow-lg active:scale-[0.98]"
            >
              <Icon name="search" className="text-[20px] font-bold" />
              <span>Cari Ruangan Baru</span>
            </button>
          </div>
        </section>

        {/* Kartu Statistik */}
        <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {statistikKartu.map((s) => (
            <div
              key={s.label}
              className="flex items-start justify-between rounded-lg bg-surface-container-lowest p-6 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex flex-col">
                <span className="font-title-md text-body-md font-medium text-slate-500">{s.label}</span>
                <span className={`font-display my-1 tracking-tight text-display ${s.angkaCls}`}>{s.angka}</span>
                <span
                  className={`inline-flex items-center gap-1.5 font-label-md text-label-md font-medium ${s.kakiCls}`}
                >
                  {s.kakiDot && <span className={`h-2 w-2 rounded-full ${s.kakiDot}`} />}
                  <span>{s.kaki}</span>
                </span>
              </div>
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${s.panel}`}>
                <Icon name={s.ikon} className={`text-[28px] ${s.ikonCls}`} />
              </div>
            </div>
          ))}
        </section>

        {/* Perlu Tindakan Anda — permintaan reschedule dari penyedia (FR-D1) */}
        {usulan.aktif && (
          <section className="relative mb-10 overflow-hidden rounded-lg bg-status-occupied-bg p-6 shadow-sm">
            <div className="flex flex-col items-start gap-4 sm:flex-row">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-status-occupied/20 text-status-occupied">
                <Icon name="notification_important" className="text-[26px]" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-amber-200/60 px-3 py-1 font-label-sm text-label-sm font-semibold uppercase tracking-wider text-amber-900">
                    Permintaan Perubahan Jadwal Dari Penyedia
                  </span>
                  <span className="font-label-sm font-mono text-label-sm text-slate-500">ID: {usulan.aktif.kode}</span>
                </div>
                <p className="mb-2 font-body-md text-body-md text-on-surface">
                  <strong>{usulan.aktif.penyediaNama}</strong> mengajukan penyesuaian jadwal (Reschedule) untuk
                  reservasi <span className="font-semibold text-primary">{usulan.aktif.ruanganNama}</span>, semula{' '}
                  <span className="line-through text-slate-500">
                    {usulan.aktif.tanggalLama} ({usulan.aktif.jamLama})
                  </span>
                  .
                </p>
                <div className="my-2 flex items-center gap-3 rounded-lg bg-surface-container-lowest/80 p-3.5 backdrop-blur-sm">
                  <Icon name="event_repeat" className="text-[22px] text-primary" />
                  <div className="flex flex-col gap-2 font-body-md text-body-md text-on-surface">
                    <span>
                      <span className="text-slate-500">Jadwal Baru yang Diajukan:</span>
                      <strong className="ml-1 text-on-surface">
                        {usulan.aktif.tanggalBaru} • {usulan.aktif.jamBaru}
                      </strong>
                      <span className="font-body-sm text-body-sm text-slate-500">
                        (Durasi {usulan.aktif.durasiJam} Jam tetap)
                      </span>
                    </span>
                    {usulan.aktif.catatan && (
                      <span className="flex items-start gap-2 text-slate-500">
                        <Icon name="chat_bubble_outline" className="mt-0.5 shrink-0 text-[18px]" />
                        <span className="font-body-sm text-body-sm italic">“Catatan pengelola: {usulan.aktif.catatan}”</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={usulan.proses}
                    onClick={() => void usulan.putuskan('setujui')}
                    className="rounded-full bg-gradient-to-r from-secondary to-pink-300 px-5 py-2.5 font-title-md text-body-md text-on-primary shadow-sm transition-all hover:opacity-95 active:scale-95 disabled:cursor-wait disabled:opacity-60"
                  >
                    Setujui Perubahan
                  </button>
                  <button
                    type="button"
                    disabled={usulan.proses}
                    onClick={() => {
                      if (window.confirm('Menolak berarti reservasi ikut dibatalkan. Lanjutkan?'))
                        void usulan.putuskan('tolak')
                    }}
                    className="rounded-full bg-surface-container-lowest px-5 py-2.5 font-title-md text-body-md text-status-full shadow-sm transition-all hover:bg-status-full-bg active:scale-95 disabled:cursor-wait disabled:opacity-60"
                  >
                    Tolak &amp; Batalkan
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Reservasi Mendatang */}
        <section className="mb-10">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-headline-md text-headline-md tracking-tight text-on-surface">Reservasi Mendatang</h3>
              <span className="rounded-full bg-purple-100 px-3 py-1 font-label-md text-label-md text-primary">
                {mendatang.length} Jadwal
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/pesanan')}
              className="inline-flex items-center gap-1 font-body-sm text-body-sm font-semibold text-primary hover:text-purple-700"
            >
              <span>Lihat Semua Reservasi</span>
              <Icon name="arrow_forward" className="text-[16px]" />
            </button>
          </div>

          {mendatang.length === 0 && (
            <p className="rounded-lg bg-surface-container-lowest p-6 shadow-sm text-body-md text-slate-500">
              Belum ada reservasi mendatang. Pilih ruangan di katalog dan ajukan reservasi pertamamu!
            </p>
          )}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {mendatang.map((m) => (
              <div
                key={m.kode}
                className="group relative flex flex-col justify-between overflow-hidden rounded-lg bg-surface-container-lowest p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div>
                  {/* Foto venue + overlay kode booking & status (mockup terbaru) */}
                  <div className="relative mb-4 h-48 w-full overflow-hidden rounded-lg">
                    <img
                      src={m.gambar}
                      alt={m.alt}
                      className="h-full w-full object-cover transition-all group-hover:scale-105"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-surface-container-lowest/90 px-2.5 py-1 font-mono text-label-sm font-semibold text-slate-500 shadow-sm backdrop-blur-sm">
                      {m.kode}
                    </span>
                    <span
                      className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-3 py-1 font-label-md text-label-md font-semibold shadow-sm ${m.tampilanStatus.badge}`}
                    >
                      <Icon name={m.tampilanStatus.ikon} className="text-[14px]" />
                      {m.tampilanStatus.label}
                    </span>
                  </div>

                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-col">
                      <Link
                        to={`/struk?kode=${m.kode}`}
                        title="Klik untuk buka Struk PDF"
                        className="flex truncate items-center gap-1.5 font-headline-sm text-headline-sm text-on-surface transition-colors hover:text-primary"
                      >
                        <span>{m.nama}</span>
                        <Icon
                          name="picture_as_pdf"
                          className="shrink-0 text-[18px] text-slate-500 group-hover:text-primary"
                        />
                      </Link>
                      <span className="mt-0.5 font-body-sm text-body-sm text-slate-500">{m.gedung}</span>
                    </div>
                  </div>

                  <div className="mb-4 flex flex-col justify-between gap-3 rounded-lg bg-purple-50 p-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-lowest text-primary shadow-sm">
                        <Icon name={m.ikonWaktu} className="text-[20px]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-body-sm text-body-sm font-semibold text-on-surface">{m.tanggal}</span>
                        <span className="font-body-sm text-body-sm text-slate-500">{m.jam}</span>
                      </div>
                    </div>
                    <div className="flex justify-between sm:flex-col sm:items-end">
                      <span className="font-label-sm text-label-sm text-slate-500">Total Biaya</span>
                      <span className="font-label-md font-mono text-headline-sm font-bold text-primary">
                        {rp(m.biaya)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <div
                    className={`flex items-center gap-1.5 font-body-sm text-body-sm ${
                      m.peringatan ? 'text-status-occupied' : 'text-status-available'
                    }`}
                  >
                    <Icon name={m.peringatan ? 'warning' : 'check_circle'} className="text-[16px]" />
                    <span>{m.catatan}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => keStruk(m.kode)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-4 py-2 font-body-md text-body-md text-primary transition-colors hover:bg-surface-variant"
                    >
                      <Icon name="receipt_long" className="text-[18px]" />
                      <span>Buka Struk PDF</span>
                    </button>
                    <button
                      type="button"
                      className="rounded-full bg-surface-container-high px-4 py-2 font-body-md text-body-md text-on-surface-variant transition-colors hover:bg-surface-variant"
                    >
                      {m.peringatan ? 'Ajukan Reschedule' : 'Reschedule'}
                    </button>
                    <button
                      type="button"
                      className="ml-auto rounded-full bg-surface-container-lowest px-4 py-2 font-body-md text-body-md text-status-full transition-colors hover:bg-status-full-bg"
                    >
                      {m.peringatan ? 'Ajukan Batal' : 'Batalkan'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Riwayat & Status Reservasi (FR-C20 & FR-E4) */}
        <section className="mb-4 flex flex-col">
          <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-headline-md text-headline-md tracking-tight text-on-surface">
                Riwayat & Status Reservasi
              </h3>
              <p className="font-body-sm text-body-sm text-slate-500">
                Pantau seluruh status pembayaran dan arsip berkas pemesanan.
              </p>
            </div>
            <div id="filter-container" className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
              {filterRiwayat.map((f) => {
                const aktif = filter === f.nilai
                return (
                  <button
                    key={f.nilai}
                    type="button"
                    onClick={() => setFilter(f.nilai)}
                    className={
                      aktif
                        ? 'shrink-0 rounded-full bg-primary px-4 py-1.5 font-title-md text-body-md text-on-primary shadow-sm'
                        : 'shrink-0 rounded-full bg-surface-container-lowest px-4 py-1.5 font-title-md text-body-md text-on-surface-variant transition-colors hover:bg-surface-container'
                    }
                  >
                    {f.label} ({f.jumlah})
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mb-6 overflow-hidden rounded-lg bg-surface-container-lowest shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-purple-100 font-title-md text-body-md text-on-surface">
                    <th className="px-5 py-4">Kode Booking</th>
                    <th className="px-5 py-4">Ruangan & Lokasi Gedung</th>
                    <th className="px-5 py-4">Tanggal & Jam Sewa</th>
                    <th className="px-5 py-4">Total Biaya</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50 text-body-md">
                  {baris.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-body-md text-slate-500">
                        Belum ada riwayat reservasi — ajukan reservasi pertamamu dari katalog.
                      </td>
                    </tr>
                  )}
                  {baris.map((r) => (
                    <tr key={r.kode} className="transition-colors hover:bg-purple-50/60">
                      <td className="px-5 py-4 font-mono font-semibold text-label-md text-slate-500">{r.kode}</td>
                      <td className="px-5 py-4">
                        <Link
                          to={`/struk?kode=${r.kode}`}
                          className="flex items-center gap-1 font-title-md text-title-md text-on-surface hover:text-primary"
                        >
                          <span>{r.nama}</span>
                          <Icon name="open_in_new" className="text-[16px] text-slate-500" />
                        </Link>
                        <span className="font-body-sm text-body-sm text-slate-500">
                          {r.gedung} • {r.lokasi}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-on-surface">{r.tanggal}</div>
                        <div className="font-body-sm text-body-sm text-slate-500">{r.jam}</div>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-on-surface">{rp(r.biaya)}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-label-md text-label-md font-medium ${GAYA_STATUS[r.status]}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${DOT_STATUS[r.status]}`} />
                          <span>{r.status}</span>
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/struk?kode=${r.kode}`}
                          className="inline-flex items-center gap-1 font-body-sm text-body-sm font-semibold text-primary hover:text-purple-700"
                        >
                          <span>Lihat Struk PDF</span>
                          <Icon name="arrow_forward" className="text-[16px]" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="flex flex-col items-center justify-between gap-4 bg-purple-50/60 p-4 sm:flex-row">
              <span className="font-body-sm text-body-sm text-slate-500">
                Menampilkan 1-{baris.length} dari {riwayat.length} riwayat reservasi
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
