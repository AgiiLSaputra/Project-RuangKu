import { rp } from '../../../lib/format'
import { Button } from '../../ui/Button'
import { Card, CardBody } from '../../ui/Card'
import { Field, Select } from '../../ui/Field'
import { Icon } from '../../ui/Icon'
import type { ReservasiForm } from './useReservasiForm'

/** Kartu "Jadwal & Paket Sewa" di formulir reservasi: tanggal, paket, jam mulai, durasi (bila fleksibel). */
export function JadwalReservasiCard({ f }: { f: ReservasiForm }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4 border-b border-purple-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-primary">
            <Icon name="event_available" className="text-xl" />
          </span>
          <div>
            <span className="text-label-sm font-bold uppercase tracking-wide text-primary">Langkah 1</span>
            <h3 className="font-heading text-title-md font-bold text-on-surface">Jadwal &amp; Paket Sewa</h3>
          </div>
        </div>
        <Button variant="outline" size="sm" icon="calendar_month" iconPosition="left" onClick={f.keRuangan}>
          Lihat Kalender
        </Button>
      </div>

      <CardBody className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field
            label="Tanggal Pelaksanaan"
            required
            type="date"
            min={f.hariMin}
            max={f.hariMaks}
            value={f.tanggal}
            onChange={(e) => f.setTanggal(e.target.value)}
          />

          <Select
            label="Skema / Paket Sewa"
            required
            value={f.paketTerpilih?.id ?? ''}
            onChange={(e) => f.setPaketId(e.target.value)}
          >
            {f.ruangan.paket.map((p) => (
              <option key={p.id} value={p.id}>
                {p.jam === 0 ? `${p.nama} — ${rp(f.ruangan.tarifPerJam)} / jam` : `${p.nama} (${p.jam} Jam) — ${rp(p.harga)}`}
              </option>
            ))}
          </Select>

          <Select label="Jam Mulai" required value={f.jamMulai} onChange={(e) => f.setJamMulai(e.target.value)}>
            {f.opsiJam.map((j) => (
              <option key={j} value={j}>
                {j} WIB
              </option>
            ))}
          </Select>

          {f.fleksibel ? (
            <Select
              label="Durasi Sewa"
              required
              value={String(f.durasiFleksibel)}
              onChange={(e) => f.setDurasiFleksibel(Number(e.target.value))}
            >
              {f.opsiDurasi.map((d) => (
                <option key={d} value={d}>
                  {d} Jam
                </option>
              ))}
            </Select>
          ) : (
            <div>
              <p className="mb-1.5 text-label-md font-semibold text-on-surface">Durasi</p>
              <p className="flex h-12 items-center rounded border border-outline-variant bg-purple-50 px-3.5 text-body-md text-on-surface">
                {f.paketTerpilih ? `${f.paketTerpilih.jam} Jam (sesuai paket)` : '-'}
              </p>
            </div>
          )}
        </div>

        {f.galatJadwal ? (
          <div className="flex items-start gap-2 rounded border border-status-full/40 bg-status-full-bg p-3 text-body-sm text-status-full">
            <Icon name="error" className="mt-0.5 shrink-0 text-[18px]" />
            <span>{f.galatJadwal}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 rounded border border-purple-100 bg-purple-50 p-4 md:grid-cols-2">
            <div>
              <p className="text-label-sm text-on-surface-variant">Acara berlangsung</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-body-sm font-bold text-on-surface">
                <Icon name="schedule" className="text-base text-primary" />
                {f.rentangJam}
              </p>
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant">Estimasi biaya sewa</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-body-sm font-bold text-on-surface">
                <Icon name="payments" className="text-base text-primary" />
                {rp(f.subtotal)}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 rounded border border-purple-300/40 bg-purple-100/70 p-3.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
            <Icon name="sanitizer" className="text-sm" />
          </span>
          <p className="text-body-sm font-medium leading-relaxed text-purple-700">
            <strong>Jeda sterilisasi 2 jam otomatis</strong> diblokir pasca-acara
            {f.galatJadwal ? '' : ` (sampai ${f.jedaSampai} WIB)`} demi higienitas ruangan, tanpa biaya tambahan (FR-C6).
            Jadwal yang bertabrakan dengan pemesanan lain akan ditolak sistem.
          </p>
        </div>
      </CardBody>
    </Card>
  )
}
