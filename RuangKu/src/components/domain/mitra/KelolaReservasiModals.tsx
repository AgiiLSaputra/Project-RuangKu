import { useState } from 'react'
import { type ReservasiMasuk } from '../../../data/kelolaReservasi'
import { rp } from '../../../lib/format'
import { cn } from '../../../lib/cn'
import { Icon } from '../../ui/Icon'
import { Overlay } from '../../ui/Overlay'
import { Field, Select, TextArea } from '../../ui/Field'
import type { FormUsulanJadwal, KelolaReservasi } from './useKelolaReservasi'

const OPSI_JAM = Array.from({ length: 13 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`)

const KELAS_TOMBOL_SEMI =
  'inline-flex h-11 items-center justify-center gap-2 rounded-full px-space-md font-title-md text-title-md font-semibold transition-all active:scale-[0.98]'

/** Modal penolakan booking — alasan wajib min. 15 karakter (mockup §5). */
function ModalTolakReservasi({
  reservasi,
  onTutup,
  onKonfirmasi,
}: {
  reservasi: ReservasiMasuk | null
  onTutup: () => void
  onKonfirmasi: (alasan: string) => boolean
}) {
  const [alasan, setAlasan] = useState('')
  const [galat, setGalat] = useState('')

  const konfirmasi = () => {
    if (alasan.trim().length < 15) {
      setGalat('Alasan masih kurang dari 15 karakter.')
      return
    }
    if (!onKonfirmasi(alasan)) setGalat('Reservasi tidak lagi berstatus Pending.')
  }

  return (
    <Overlay open={Boolean(reservasi)} onClose={onTutup} labelledBy="judul-tolak">
      <div className="px-6 pb-8 pt-5 md:px-0 md:pb-0 md:pt-6">
        <div className="flex items-center gap-space-md pr-10">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-status-full-bg text-status-full">
            <Icon name="gavel" className="text-[22px]" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span id="judul-tolak" className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              Tolak Reservasi
            </span>
            <span className="truncate font-label-md text-label-md font-semibold text-status-full">
              {reservasi?.kode} • {reservasi?.penyewa}
            </span>
          </span>
        </div>

        <div className="mt-space-md flex items-start gap-space-sm rounded-xl bg-purple-100 p-space-md">
          <Icon name="info" className="mt-0.5 shrink-0 text-[20px] text-primary" />
          <p className="text-body-sm leading-relaxed text-on-surface">
            Notifikasi otomatis dikirim ke penyewa dan slot jadwal langsung dibuka kembali untuk pemesan lain
            (FR-D1 &amp; FR-F3).
          </p>
        </div>

        <div className="mt-space-md">
          <TextArea
            label="Alasan Penolakan"
            required
            hint="Wajib Diisi"
            rows={4}
            value={alasan}
            onChange={(e) => {
              setAlasan(e.target.value)
              setGalat('')
            }}
            placeholder="Contoh: Bukti transfer tidak valid atau gedung sedang mengalami perbaikan fasilitas mendesak..."
          />
          <p className="mt-1 text-body-sm text-slate-500">
            Minimal 15 karakter untuk transparansi kepada penyewa ({alasan.trim().length}/15).
          </p>
          {galat && (
            <p className="mt-1 flex items-center gap-1 text-body-sm font-medium text-status-full">
              <Icon name="error" className="text-[16px]" />
              {galat}
            </p>
          )}
        </div>

        <div className="mt-space-lg flex flex-col-reverse gap-space-sm sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onTutup}
            className={cn(KELAS_TOMBOL_SEMI, 'bg-white text-slate-500 shadow-sm hover:text-on-surface')}
          >
            Batal (Kembali)
          </button>
          <button
            type="button"
            onClick={konfirmasi}
            className={cn(
              KELAS_TOMBOL_SEMI,
              'bg-status-full text-white shadow-[0_4px_12px_rgba(239,68,68,0.3)] hover:bg-status-full/90',
            )}
          >
            Konfirmasi Tolak Reservasi
          </button>
        </div>
      </div>
    </Overlay>
  )
}

/** Modal bukti transfer manual — verifikasi FR-F3 sebelum persetujuan. */
function ModalBuktiTransfer({
  reservasi,
  onTutup,
  onTolak,
  onSetujui,
}: {
  reservasi: ReservasiMasuk | null
  onTutup: () => void
  onTolak: () => void
  onSetujui: (kode: string) => void
}) {
  const bukti = reservasi?.bukti
  const rincian: Array<{ label: string; nilai: string; mono?: boolean }> = bukti
    ? [
        { label: 'Nama Pengirim', nilai: bukti.atasNama },
        { label: 'Bank Tujuan', nilai: bukti.bank },
        { label: 'Waktu Transfer', nilai: bukti.terkirim },
        { label: 'Nomor Referensi', nilai: bukti.ref, mono: true },
      ]
    : []

  return (
    <Overlay open={Boolean(reservasi)} onClose={onTutup} labelledBy="judul-bukti">
      <div className="px-6 pb-8 pt-5 md:px-0 md:pb-0 md:pt-6">
        <div className="flex items-center gap-space-md pr-10">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-status-available-bg text-status-available">
            <Icon name="receipt_long" className="text-[22px]" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span id="judul-bukti" className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              Bukti Transfer Manual
            </span>
            <span className="truncate font-label-md text-label-md font-semibold text-primary">
              {reservasi?.kode}
            </span>
          </span>
        </div>

        <div className="mt-space-md rounded-xl bg-purple-50 p-space-md">
          <div className="flex items-baseline justify-between gap-space-sm">
            <span className="text-body-sm text-slate-500">Nominal Dikirim</span>
            <span className="font-label-md text-label-md font-bold text-on-surface">
              {bukti ? rp(bukti.nominal) : '-'}
            </span>
          </div>
          <div className="mt-2 space-y-1.5 border-t border-purple-100 pt-2">
            {rincian.map((r) => (
              <div key={r.label} className="flex items-baseline justify-between gap-space-sm">
                <span className="text-body-sm text-slate-500">{r.label}</span>
                <span
                  className={cn(
                    'text-right text-body-sm font-medium text-on-surface',
                    r.mono && 'font-label-md text-label-md text-primary',
                  )}
                >
                  {r.nilai}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-space-md flex items-start gap-space-sm rounded-xl bg-status-occupied-bg p-space-md">
          <Icon name="verified_user" className="mt-0.5 shrink-0 text-[20px] text-status-occupied" />
          <p className="text-body-sm leading-relaxed text-on-surface">
            Cocokkan nama pengirim &amp; nominal dengan tagihan reservasi sebelum menyetujui (FR-F3). Persetujuan
            mengunci slot dan menjadwalkan sterilisasi 2 jam.
          </p>
        </div>

        <div className="mt-space-lg flex flex-col-reverse gap-space-sm sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onTolak}
            className={cn(
              KELAS_TOMBOL_SEMI,
              'border border-status-full/30 bg-status-full-bg text-status-full hover:bg-status-full hover:text-white',
            )}
          >
            Bukti Tidak Sesuai
          </button>
          <button
            type="button"
            onClick={() => reservasi && onSetujui(reservasi.kode)}
            className={cn(
              KELAS_TOMBOL_SEMI,
              'bg-status-available text-white shadow-[0_4px_12px_rgba(34,197,94,0.28)] hover:bg-status-available/90',
            )}
          >
            <Icon name="check_circle" className="text-[18px]" />
            Sesuai &amp; Setujui
          </button>
        </div>
      </div>
    </Overlay>
  )
}

const FORM_USULAN_AWAL: FormUsulanJadwal = { tanggal: '', jamMulai: '09:00', catatan: '' }

/** Modal usulan perubahan jadwal (FR-D1) — usul tanggal & jam mulai baru, durasi tetap. */
function ModalUsulanJadwal({
  reservasi,
  onTutup,
  onKirim,
}: {
  reservasi: ReservasiMasuk | null
  onTutup: () => void
  onKirim: (form: FormUsulanJadwal) => Promise<string | null>
}) {
  const [form, setForm] = useState<FormUsulanJadwal>(FORM_USULAN_AWAL)
  const [galat, setGalat] = useState('')
  const [mengirim, setMengirim] = useState(false)

  const kirim = async () => {
    setGalat('')
    setMengirim(true)
    const hasil = await onKirim(form)
    setMengirim(false)
    if (hasil) setGalat(hasil)
  }

  return (
    <Overlay
      open={Boolean(reservasi)}
      onClose={() => {
        if (!mengirim) onTutup()
      }}
      labelledBy="judul-usulan"
    >
      <div className="px-6 pb-8 pt-5 md:px-0 md:pb-0 md:pt-6">
        <div className="flex items-center gap-space-md pr-10">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-status-occupied-bg text-status-occupied">
            <Icon name="update" className="text-[22px]" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span id="judul-usulan" className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              Usulkan Jadwal Baru
            </span>
            <span className="truncate font-label-md text-label-md font-semibold text-status-occupied">
              {reservasi?.kode} • {reservasi?.penyewa}
            </span>
          </span>
        </div>

        <div className="mt-space-md rounded-xl bg-purple-50 p-space-md">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-slate-500">
            Jadwal Terpasang Sekarang
          </span>
          <p className="mt-1 font-title-md text-title-md text-on-surface">
            {reservasi?.tanggal} • {reservasi?.jam}
          </p>
          <p className="mt-1 text-body-sm text-slate-500">
            Durasi sewa tetap ({reservasi?.durasiJam} Jam) — yuk usulkan tanggal &amp; jam mulai yang baru.
          </p>
        </div>

        <div className="mt-space-md flex items-start gap-space-sm rounded-xl bg-purple-100 p-space-md">
          <Icon name="schedule_send" className="mt-0.5 shrink-0 text-[20px] text-primary" />
          <p className="text-body-sm leading-relaxed text-on-surface">
            Usulan dikirim ke penyewa sebagai banner di dashboard-nya. Jadwal baru hanya berlaku setelah penyewa
            menyetujui; slot lama tetap terkunci sampai ada keputusan.
          </p>
        </div>

        <div className="mt-space-md grid grid-cols-1 gap-space-md sm:grid-cols-2">
          <Field
            label="Tanggal Baru"
            required
            type="date"
            value={form.tanggal}
            onChange={(e) => {
              setForm({ ...form, tanggal: e.target.value })
              setGalat('')
            }}
          />
          <Select
            label="Jam Mulai Baru"
            required
            value={form.jamMulai}
            onChange={(e) => {
              setForm({ ...form, jamMulai: e.target.value })
              setGalat('')
            }}
          >
            {OPSI_JAM.map((j) => (
              <option key={j} value={j}>
                {j} WIB
              </option>
            ))}
          </Select>
          <div className="sm:col-span-2">
            <TextArea
              label="Catatan untuk Penyewa"
              rows={3}
              value={form.catatan}
              onChange={(e) => setForm({ ...form, catatan: e.target.value })}
              placeholder="Contoh: Terdapat gladi resik kenegaraan di area venue, kami usul geser jadwal satu hari — tarif tidak berubah, maaf atas ketidaknyamanannya."
            />
          </div>
        </div>

        {galat && (
          <p className="mt-space-sm flex items-center gap-1 text-body-sm font-medium text-status-full">
            <Icon name="error" className="text-[16px]" />
            {galat}
          </p>
        )}

        <div className="mt-space-lg flex flex-col-reverse gap-space-sm sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onTutup}
            disabled={mengirim}
            className={cn(KELAS_TOMBOL_SEMI, 'bg-white text-slate-500 shadow-sm hover:text-on-surface')}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => void kirim()}
            disabled={mengirim}
            className={cn(KELAS_TOMBOL_SEMI, 'bg-cta text-white shadow-cta hover:opacity-90 disabled:opacity-60')}
          >
            <Icon name={mengirim ? 'hourglass_top' : 'send'} className="text-[18px]" />
            {mengirim ? 'Mengirim Usulan…' : 'Kirim Usulan ke Penyewa'}
          </button>
        </div>
      </div>
    </Overlay>
  )
}

/** Kumpulan modal halaman Kelola Reservasi — varian desktop & mobile memakai satu set sama. */
export function KelolaReservasiModals({ kelola }: { kelola: KelolaReservasi }) {
  return (
    <>
      <ModalBuktiTransfer
        reservasi={kelola.bukti}
        onTutup={() => kelola.setBukti(null)}
        onTolak={() => {
          kelola.setTolak(kelola.bukti)
          kelola.setBukti(null)
        }}
        onSetujui={(kode) => {
          kelola.setujui(kode)
          kelola.setBukti(null)
        }}
      />
      <ModalTolakReservasi
        key={`tolak-${kelola.tolak?.kode ?? 'tutup'}`}
        reservasi={kelola.tolak}
        onTutup={() => kelola.setTolak(null)}
        onKonfirmasi={kelola.konfirmasiTolak}
      />
      {/* key = kode: reset form usulan setiap ganti reservasi (FR-D1). */}
      <ModalUsulanJadwal
        key={`usul-${kelola.usul?.kode ?? 'tutup'}`}
        reservasi={kelola.usul}
        onTutup={() => kelola.setUsul(null)}
        onKirim={kelola.kirimUsulan}
      />
    </>
  )
}
