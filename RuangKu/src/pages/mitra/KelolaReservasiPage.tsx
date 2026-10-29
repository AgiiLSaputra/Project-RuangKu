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
  teksTanggalIso,
  type ReservasiMasuk,
} from '../../data/kelolaReservasi'
import { cn } from '../../lib/cn'
import { rp } from '../../lib/format'

const KELAS_TOMBOL = 'inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-body-sm font-semibold transition-all'

/** Baris aksi mengikuti status reservasi (FR-F3 & FR-C16). */
function AksiBaris({ r, kelola }: { r: ReservasiMasuk; kelola: KelolaReservasi }) {
  if (r.status === 'pending')
    return (
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => kelola.setujui(r.kode)}
          className={cn(KELAS_TOMBOL, 'bg-status-available text-white shadow-sm hover:bg-status-available/90')}
        >
          Setujui
        </button>
        <button
          type="button"
          onClick={() => kelola.setTolak(r)}
          className={cn(
            KELAS_TOMBOL,
            'border border-status-full/30 bg-white text-status-full hover:bg-status-full hover:text-white',
          )}
        >
          Tolak
        </button>
        <button
          type="button"
          onClick={() => kelola.setBukti(r)}
          className={cn(KELAS_TOMBOL, 'px-2 text-primary hover:bg-purple-100')}
        >
          Lihat Bukti TF
        </button>
      </div>
    )

  if (r.status === 'approved') {
    const usulanAktif = Boolean(r.usulanJadwal)
    return (
      <div className="flex items-center justify-end gap-2">
        {!usulanAktif && (
          <button
            type="button"
            onClick={() => kelola.setUsul(r)}
            className={cn(KELAS_TOMBOL, 'bg-status-occupied-bg text-status-occupied hover:bg-status-occupied hover:text-white')}
          >
            Usulkan Jadwal
          </button>
        )}
        <button
          type="button"
          onClick={() => kelola.selesaikan(r.kode)}
          className={cn(KELAS_TOMBOL, 'bg-primary-container text-on-primary shadow-sm hover:bg-purple-700')}
        >
          Tandai Completed
        </button>
        <button
          type="button"
          onClick={() => kelola.batalkan(r.kode)}
          className={cn(
            KELAS_TOMBOL,
            'border border-status-full/30 bg-white text-status-full hover:bg-status-full hover:text-white',
          )}
        >
          Batalkan
        </button>
        <Link to="/struk" className={cn(KELAS_TOMBOL, 'px-2 text-primary hover:bg-purple-100')}>
          Rincian Struk
        </Link>
      </div>
    )
  }

  if (r.status === 'completed')
    return (
      <div className="flex items-center justify-end gap-2">
        <span className="rounded-full bg-purple-50 px-2.5 py-1 font-label-sm text-label-sm text-slate-500">
          Selesai Dilaksanakan
        </span>
        <Link
          to="/struk"
          className={cn(KELAS_TOMBOL, 'bg-white text-primary shadow-sm hover:bg-purple-100')}
        >
          <Icon name="receipt_long" className="text-[16px]" />
          <span>Arsip Struk</span>
        </Link>
      </div>
    )

  return (
    <div className="flex items-center justify-end gap-2">
      <span
        className="rounded-full bg-status-blocked-bg px-2.5 py-1 font-label-sm text-label-sm text-slate-500"
        title="Jadwal slot langsung dibuka otomatis untuk publik"
      >
        Slot Dilepas
      </span>
      <span
        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500"
        title={r.alasan ?? 'Penyewa meminta perubahan jadwal — hubungi penyewa untuk konfirmasi.'}
      >
        <Icon name="help" className="text-[18px]" />
      </span>
    </div>
  )
}

/** Kelola Reservasi masuk (mockup KelolaReservasi.html) — FR-F3, FR-C13, FR-C16. */
export function KelolaReservasiPage() {
  const kelola = useKelolaReservasi()

  const kartu = [
    {
      eyebrow: 'SOP SLA Verifikasi',
      judul: 'Pending Verifikasi',
      angka: kelola.jumlahStatus.pending,
      satuan: 'Booking',
      panel: 'bg-status-occupied-bg',
      teks: 'text-status-occupied',
      ikon: 'hourglass_top',
      kaki: (
        <span className="flex items-center gap-1.5 text-status-occupied">
          <Icon name="info" className="text-[16px]" />
          <span>Batas konfirmasi &lt; 24 jam sebelum slot auto-expired (FR-C16).</span>
        </span>
      ),
    },
    {
      eyebrow: 'Sterilisasi Siap',
      judul: 'Approved / Terjadwal',
      angka: kelola.jumlahStatus.approved,
      satuan: 'Booking',
      panel: 'bg-status-available-bg',
      teks: 'text-status-available',
      ikon: 'event_available',
      kaki: (
        <span className="flex items-center gap-1.5 text-status-available">
          <Icon name="sanitizer" className="text-[16px]" />
          <span>Jeda sterilisasi otomatis 2 jam terkunci (FR-C6).</span>
        </span>
      ),
    },
    {
      eyebrow: 'Kinerja Keuangan',
      judul: 'Reservasi Selesai',
      angka: kelola.baris.filter((r) => r.status === 'completed').length,
      satuan: 'Booking',
      panel: 'bg-purple-100',
      teks: 'text-primary',
      ikon: 'payments',
      kaki: (
        <span className="flex w-full items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-slate-500">
            <Icon name="account_balance_wallet" className="text-[16px]" />
            <span>Nilai total sewa:</span>
          </span>
          <span className="font-label-md text-label-md font-semibold text-primary">
            {rp(
              kelola.baris
                .filter((r) => r.status === 'completed')
                .reduce((n, r) => n + r.total, 0),
            )}
          </span>
        </span>
      ),
    },
  ]

  return (
    <div className="relative w-full overflow-hidden bg-purple-50 px-4 pb-12 pt-6 sm:px-6">
      <div className="pointer-events-none absolute -top-16 -right-20 h-96 w-96 rounded-full bg-secondary-container/15 blur-3xl" />
      <div className="pointer-events-none absolute top-56 left-1/4 h-[300px] w-[520px] rounded-full bg-primary-fixed/40 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-space-lg">
        {/* Breadcrumb, judul & aksi utama */}
        <section className="flex flex-col gap-space-sm">
          <nav className="flex items-center gap-space-xs font-label-md text-label-md text-slate-500">
            <Link to="/dashboard-penyedia" className="flex items-center gap-1 transition-colors hover:text-primary">
              <Icon name="home" className="text-[16px]" />
              <span>Beranda</span>
            </Link>
            <Icon name="chevron_right" className="text-[14px]" />
            <span>Reservasi</span>
            <Icon name="chevron_right" className="text-[14px]" />
            <span className="font-semibold text-primary">Manajemen Pemesanan Masuk</span>
          </nav>

          <div className="flex flex-col justify-between gap-space-md lg:flex-row lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-space-sm">
                <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
                  Kelola Reservasi Masuk
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-status-occupied-bg px-3 py-1 font-label-md text-label-md font-semibold text-status-occupied">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-status-occupied" />
                  {kelola.perluProses} Reservasi Perlu Diproses
                </span>
              </div>
              <p className="mt-1 max-w-3xl font-body-md text-body-md text-slate-500">
                Tinjau bukti pembayaran di luar sistem, konfirmasi jadwal, atau perbarui status pemesanan sesuai
                aturan SOP RuangKu (FR-F3 &amp; FR-C13).
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-space-sm self-start lg:self-end">
              <button
                type="button"
                onClick={kelola.eksporCsv}
                className="inline-flex items-center gap-2 rounded-full bg-white px-space-md py-2.5 font-title-md text-title-md text-primary shadow-sm transition-all hover:bg-purple-100"
              >
                <Icon name="download" className="text-[20px]" />
                <span>Ekspor Jadwal (.csv)</span>
              </button>
              <button
                type="button"
                onClick={() => kelola.setManual(true)}
                className="inline-flex items-center gap-2 rounded-full bg-cta px-space-md py-2.5 font-title-md text-title-md text-white shadow-cta transition-all hover:opacity-90"
              >
                <Icon name="add_circle" className="text-[20px]" />
                <span>Buat Booking Manual</span>
              </button>
            </div>
          </div>
        </section>

        {/* Ringkasan cepat & peringatan SOP */}
        <section className="grid grid-cols-1 gap-space-md md:grid-cols-3">
          {kartu.map((k) => (
            <div
              key={k.judul}
              className={cn(
                'flex flex-col justify-between rounded-2xl p-space-md shadow-card transition-shadow hover:shadow-md',
                k.panel,
              )}
            >
              <div className="flex items-start justify-between gap-space-sm">
                <div>
                  <span className={cn('font-label-sm text-label-sm uppercase tracking-wider', k.teks)}>
                    {k.eyebrow}
                  </span>
                  <h3 className="mt-1 font-headline-sm text-headline-sm font-semibold text-on-surface">{k.judul}</h3>
                  <p className="mt-1 flex items-baseline gap-1.5">
                    <span className={cn('font-display text-display', k.teks)}>{k.angka}</span>
                    <span className="font-title-md text-title-md font-normal text-slate-500">{k.satuan}</span>
                  </p>
                </div>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/80 shadow-sm">
                  <Icon name={k.ikon} className={cn('text-[26px]', k.teks)} />
                </span>
              </div>
              <div className="mt-space-md border-t border-white/60 pt-space-xs text-body-sm">{k.kaki}</div>
            </div>
          ))}
        </section>

        {/* Filter chip, pencarian & filter ruangan */}
        <section className="flex flex-col justify-between gap-space-md rounded-2xl bg-surface-container-lowest p-space-md shadow-card xl:flex-row xl:items-center">
          <div className="flex items-center gap-space-xs overflow-x-auto pb-1 xl:pb-0">
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

          <div className="flex shrink-0 flex-col gap-space-sm sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-80">
              <Icon
                name="search"
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[20px] text-slate-500"
              />
              <input
                type="text"
                value={kelola.cari}
                onChange={(e) => kelola.ubahCari(e.target.value)}
                placeholder="Cari penyewa, gedung, atau kode..."
                className="h-11 w-full rounded-full bg-purple-50 pr-4 pl-10 font-body-md text-body-md text-on-surface transition-all placeholder:text-slate-500 focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>
            <SortSelect
              opsi={kelola.opsiRuangan}
              nilai={kelola.ruangan}
              onPilih={kelola.ubahRuangan}
              label="Filter ruangan"
              className="h-11 bg-purple-50 px-4 font-body-md text-body-md text-on-surface hover:bg-surface-container"
            />
          </div>
        </section>

        {/* Tabel reservasi masuk */}
        <section className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-purple-100 font-label-sm text-label-sm uppercase tracking-wider whitespace-nowrap text-slate-500">
                  <th className="px-space-lg py-space-md">Penyewa &amp; Kode</th>
                  <th className="px-space-md py-space-md">Ruangan</th>
                  <th className="px-space-md py-space-md">Tanggal &amp; Waktu</th>
                  <th className="px-space-md py-space-md">Kapasitas</th>
                  <th className="px-space-md py-space-md">Total &amp; Metode</th>
                  <th className="px-space-md py-space-md">Status</th>
                  <th className="px-space-lg py-space-md text-right">Aksi Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50 text-body-md text-on-surface">
                {kelola.barisHalaman.map((r) => {
                  const info = kelola.infoRuangan(r.ruanganId)
                  const persen = Math.min(100, Math.round((r.tamu / (info?.kapasitasMax ?? 1)) * 100))
                  return (
                    <tr key={r.kode} className="transition-colors hover:bg-purple-50/70">
                      {/* Penyewa & kode */}
                      <td className="px-space-lg py-space-md">
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-body-sm font-bold',
                              AVATAR_STATUS[r.status],
                            )}
                          >
                            {r.inisial}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate font-title-md text-title-md text-on-surface">{r.penyewa}</p>
                              {(r.status === 'pending' || r.status === 'approved') && (
                                <a
                                  href={`https://wa.me/${r.wa}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  title={`Chat ${r.penyewa} via WhatsApp`}
                                  className="text-status-available transition-opacity hover:opacity-80"
                                >
                                  <Icon name="chat" className="text-[16px]" />
                                </a>
                              )}
                            </div>
                            <p className="truncate font-body-sm text-body-sm text-slate-500">{r.organisasi}</p>
                            <span
                              className={cn(
                                'font-label-sm tracking-wide',
                                r.status === 'pending' ? 'text-primary' : 'text-slate-500',
                              )}
                            >
                              {r.kode}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Ruangan */}
                      <td className="px-space-md py-space-md">
                        <p className="font-title-md text-title-md text-on-surface">{info?.nama ?? r.ruanganNama ?? '-'}</p>
                        <span className="inline-flex items-center gap-1 font-body-sm text-body-sm text-slate-500">
                          <Icon name={ikonKategori(info?.kategori)} className="text-[14px]" />
                          <span>{info?.kota ?? ''}</span>
                        </span>
                      </td>

                      {/* Tanggal & waktu */}
                      <td className="px-space-md py-space-md whitespace-nowrap">
                        <p className="font-medium">{r.tanggal}</p>
                        <p className="font-body-sm text-body-sm text-slate-500">
                          {r.jam} ({r.durasiJam} Jam)
                        </p>
                        {r.steril ? (
                          <span
                            className={cn(
                              'mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-label-sm text-label-sm',
                              r.steril.aktif ? 'bg-status-available-bg text-status-available' : 'bg-purple-100 text-primary',
                            )}
                          >
                            <Icon name={r.steril.aktif ? 'lock_clock' : 'schedule'} className="text-[12px]" />
                            <span>{r.steril.teks}</span>
                          </span>
                        ) : (
                          r.keterangan && (
                            <p
                              className={cn(
                                'font-body-sm text-body-sm',
                                r.status === 'completed' ? 'text-slate-500' : 'text-status-full',
                              )}
                              title={r.alasan}
                            >
                              {r.keterangan}
                            </p>
                          )
                        )}
                        {r.usulanJadwal && (
                          <span
                            className="mt-1 inline-flex items-center gap-1 rounded-full bg-status-occupied-bg px-2 py-0.5 font-label-sm text-label-sm font-medium text-status-occupied"
                            title={`Menunggu keputusan penyewa — usulan jadwal baru (FR-D1)`}
                          >
                            <Icon name="update" className="text-[12px]" />
                            <span>
                              Usulan {teksTanggalIso(r.usulanJadwal.tanggalBaru)} •{' '}
                              {r.usulanJadwal.jamMulaiBaru} - {r.usulanJadwal.jamSelesaiBaru} WIB (Menunggu Setuju
                              Penyewa)
                            </span>
                          </span>
                        )}
                      </td>

                      {/* Kapasitas */}
                      <td className="px-space-md py-space-md">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <span className="font-title-md text-title-md">{r.tamu}</span>
                          <span className="font-body-sm text-body-sm text-slate-500">/ {info?.kapasitasMax ?? 0} Pax</span>
                        </div>
                        <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-purple-100">
                          <div
                            className={cn('h-full rounded-full', r.status === 'approved' ? 'bg-status-available' : 'bg-primary')}
                            style={{ width: `${persen}%` }}
                          />
                        </div>
                      </td>

                      {/* Total & metode */}
                      <td className="px-space-md py-space-md whitespace-nowrap">
                        <p
                          className={cn(
                            'font-label-md text-label-md font-bold',
                            r.status === 'cancelled' ? 'text-slate-500 line-through' : 'text-on-surface',
                          )}
                        >
                          {rp(r.total)}
                        </p>
                        <span
                          className={cn(
                            'font-body-sm text-body-sm',
                            r.lunas ? 'font-medium text-status-available' : 'text-slate-500',
                          )}
                        >
                          {r.lunas ? 'Lunas Terverifikasi' : r.metode}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-space-md py-space-md">
                        <StatusBadge status={r.status} />
                        {r.alasan && (
                          <p className="mt-1 max-w-40 font-body-sm text-body-sm text-slate-500" title={r.alasan}>
                            {r.alasan}
                          </p>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="px-space-lg py-space-md">
                        <AksiBaris r={r} kelola={kelola} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {!kelola.adaHasil && (
            <div className="flex flex-col items-center gap-space-sm px-space-lg py-space-xl text-center">
              <Icon name="search_off" className="text-[32px] text-slate-500" />
              <p className="font-title-md text-title-md text-on-surface">Tidak ada reservasi</p>
              <p className="font-body-sm text-body-sm text-slate-500">
                Ubah filter status, pilihan ruangan, atau kata kunci pencarian.
              </p>
            </div>
          )}

          {/* Paginasi */}
          <div className="flex flex-col items-center justify-between gap-space-sm border-t border-purple-100 bg-purple-50/50 px-space-md py-space-md font-body-sm text-body-sm text-slate-500 sm:flex-row">
            <span>
              Menampilkan {kelola.tersaring.length === 0 ? 0 : (kelola.halaman - 1) * UKURAN_HALAMAN + 1}-
              {Math.min(kelola.halaman * UKURAN_HALAMAN, kelola.tersaring.length)} dari {kelola.tersaring.length}{' '}
              reservasi
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Halaman sebelumnya"
                disabled={kelola.halaman <= 1}
                onClick={() => kelola.keHalaman(kelola.halaman - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-500 transition-colors hover:bg-purple-100 disabled:pointer-events-none disabled:opacity-40"
              >
                <Icon name="chevron_left" className="text-[16px]" />
              </button>
              {Array.from({ length: kelola.totalHalaman }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`Halaman ${n}`}
                  aria-current={n === kelola.halaman}
                  onClick={() => kelola.keHalaman(n)}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-body-sm font-bold transition-colors',
                    n === kelola.halaman
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-white text-on-surface hover:bg-purple-100',
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
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-500 transition-colors hover:bg-purple-100 disabled:pointer-events-none disabled:opacity-40"
              >
                <Icon name="chevron_right" className="text-[16px]" />
              </button>
            </div>
          </div>
        </section>

        {/* Catatan operasional */}
        <section className="flex flex-col items-start justify-between gap-space-md rounded-2xl bg-gradient-to-r from-purple-100 via-purple-50 to-pink-100/60 p-space-md shadow-sm sm:flex-row sm:items-center">
          <div className="flex items-start gap-space-sm">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon name="shield" className="text-[20px]" />
            </span>
            <div>
              <p className="font-title-md text-title-md text-on-surface">Aturan Operasional Reservasi</p>
              <p className="mt-0.5 max-w-3xl font-body-sm text-body-sm text-on-surface-variant">
                Setiap persetujuan otomatis mengunci slot, menjadwalkan jeda sterilisasi 2 jam (FR-C6), dan
                mengirim notifikasi WhatsApp ke penyewa. Pembatalan melepas slot kembali ke etalase publik.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-space-sm font-label-sm text-label-sm text-slate-500">
            <Link to="/cara-kerja" className="transition-colors hover:text-primary">
              Panduan Mitra
            </Link>
            <span aria-hidden="true">•</span>
            <Link to="/pusat-bantuan" className="transition-colors hover:text-primary">
              Pusat Bantuan
            </Link>
          </div>
        </section>
      </div>

      <KelolaReservasiModals kelola={kelola} />
    </div>
  )
}
