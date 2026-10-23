import { useState, type FormEvent } from 'react'
import type { BuktiTransfer } from '../../../data/kelolaReservasi'
import type { StatusReservasi } from '../../../data/seed'
import { ApiError } from '../../../lib/api'
import { rp } from '../../../lib/format'
import { unggahBuktiServer } from '../../../services/reservasi'
import { Button } from '../../ui/Button'
import { Field } from '../../ui/Field'
import { Icon } from '../../ui/Icon'
import { labelTerbit } from './utilStruk'

const waktuSekarang = () => labelTerbit(new Date().toISOString()).replace(' WIB', '')

interface Props {
  kode: string
  total: number
  status: StatusReservasi
  bukti?: BuktiTransfer
  /** Dipanggil setelah bukti tersimpan di server supaya halaman memuat ulang struk. */
  onTersimpan: () => void
}

/**
 * Kartu bukti transfer manual di halaman struk (FR-E1).
 * Penyewa mengisi data transfer; mitra lalu memverifikasinya di Kelola Reservasi
 * (tombol "Lihat Bukti TF"). Hanya tampil selama reservasi masih berjalan.
 */
export function UnggahBuktiCard({ kode, total, status, bukti, onTersimpan }: Props) {
  const bisaDiunggah = status === 'pending' || status === 'approved'
  const [terbuka, setTerbuka] = useState(false)
  const [bank, setBank] = useState('')
  const [atasNama, setAtasNama] = useState('')
  const [nominal, setNominal] = useState(String(total))
  const [terkirim, setTerkirim] = useState(waktuSekarang)
  const [ref, setRef] = useState('')
  const [mengirim, setMengirim] = useState(false)
  const [galat, setGalat] = useState('')
  const [tersimpan, setTersimpan] = useState(false)

  if (!bisaDiunggah) return null

  async function kirim(e: FormEvent) {
    e.preventDefault()
    setGalat('')
    const angka = Number(nominal)
    if (!Number.isFinite(angka) || angka <= 0) {
      setGalat('Nominal harus lebih dari 0.')
      return
    }
    setMengirim(true)
    try {
      await unggahBuktiServer(kode, {
        bank: bank.trim(),
        atasNama: atasNama.trim(),
        nominal: Math.round(angka),
        terkirim: terkirim.trim(),
        ref: ref.trim(),
      })
      setTersimpan(true)
      setTerbuka(false)
      onTersimpan()
    } catch (err) {
      setGalat(err instanceof ApiError ? err.message : 'Tidak dapat menyimpan bukti transfer. Coba lagi.')
    } finally {
      setMengirim(false)
    }
  }

  return (
    <section className="mt-space-lg w-full rounded-lg bg-surface-container-lowest p-space-md shadow-card print:hidden">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-primary">
          <Icon name="receipt_long" className="text-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-title-md text-title-md font-semibold text-on-surface">Bukti Transfer</h2>
          <p className="font-body-sm text-body-sm text-slate-500">
            {bukti
              ? 'Bukti transfer sudah dikirim ke pengelola.'
              : 'Unggah data transfer agar pengelola bisa memverifikasi pembayaran.'}
          </p>
        </div>
      </div>

      {bukti ? (
        <dl className="mt-space-sm grid grid-cols-1 gap-2 rounded-lg bg-surface-container-low p-space-sm sm:grid-cols-2">
          {[
            ['Bank Tujuan', bukti.bank],
            ['Nama Pengirim', bukti.atasNama],
            ['Nominal', rp(bukti.nominal)],
            ['Waktu Transfer', bukti.terkirim],
            ['Nomor Referensi', bukti.ref],
          ].map(([label, nilai]) => (
            <div key={label}>
              <dt className="font-label-sm text-label-sm text-slate-500">{label}</dt>
              <dd className="font-body-md text-body-md text-on-surface">{nilai}</dd>
            </div>
          ))}
        </dl>
      ) : tersimpan ? (
        <p className="mt-space-sm rounded-lg bg-status-available-bg p-space-sm font-body-sm text-body-sm text-status-available">
          Bukti transfer tersimpan. Pengelola akan memverifikasi pembayaran Anda.
        </p>
      ) : terbuka ? (
        <form onSubmit={kirim} className="mt-space-sm flex flex-col gap-space-sm">
          <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-2">
            <Field label="Bank Tujuan" required value={bank} onChange={(e) => setBank(e.target.value)} placeholder="BCA" maxLength={60} />
            <Field
              label="Nama Pengirim"
              required
              value={atasNama}
              onChange={(e) => setAtasNama(e.target.value)}
              placeholder="Nama di rekening"
              maxLength={100}
            />
            <Field
              label="Nominal"
              required
              type="number"
              min={1}
              value={nominal}
              onChange={(e) => setNominal(e.target.value)}
              hint={`Total tagihan ${rp(total)}`}
            />
            <Field label="Waktu Transfer" required value={terkirim} onChange={(e) => setTerkirim(e.target.value)} maxLength={60} />
            <Field
              label="Nomor Referensi"
              required
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="TRX-0099"
              maxLength={60}
              className="sm:col-span-2"
            />
          </div>

          {galat && <p className="font-body-sm text-body-sm text-status-full">{galat}</p>}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={mengirim} icon="upload" iconPosition="left">
              {mengirim ? 'Menyimpan...' : 'Kirim Bukti Transfer'}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setTerbuka(false)} disabled={mengirim}>
              Batal
            </Button>
          </div>
        </form>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-space-sm"
          icon="upload"
          iconPosition="left"
          onClick={() => {
            setTerkirim(waktuSekarang())
            setNominal(String(total))
            setTerbuka(true)
          }}
        >
          Unggah Bukti Transfer
        </Button>
      )}
    </section>
  )
}
