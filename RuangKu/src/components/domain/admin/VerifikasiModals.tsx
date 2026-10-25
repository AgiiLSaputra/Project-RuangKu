import { cn } from '../../../lib/cn'
import { Icon } from '../../ui/Icon'
import { Overlay } from '../../ui/Overlay'
import type { VerifikasiPenyedia } from './useVerifikasiPenyedia'

const KELAS_TOMBOL =
  'inline-flex h-11 items-center justify-center gap-2 rounded-full px-space-md font-title-md text-title-md font-semibold transition-all active:scale-[0.98]'

/**
 * Modal penolakan verifikasi (FR-G1, SOP wajib): checklist alasan standar
 * (bisa lebih dari satu) + catatan perbaikan. Konfirmasi butuh minimal satu
 * alasan atau catatan.
 */
export function ModalPenolakan({ verif }: { verif: VerifikasiPenyedia }) {
  return (
    <Overlay
      open={verif.tolakBuka}
      onClose={() => verif.setTolakBuka(false)}
      labelledBy="judul-tolak"
    >
      <div className="px-6 pb-8 pt-5 md:px-0 md:pb-0 md:pt-6">
        <div className="flex items-start justify-between gap-3 pr-10">
          <div className="flex items-center gap-space-md">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-error-container text-error">
              <Icon name="gavel" className="text-[22px]" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span
                id="judul-tolak"
                className="font-headline-sm text-headline-sm font-semibold text-on-surface"
              >
                Alasan Penolakan Verifikasi
              </span>
              <span className="text-body-sm text-slate-500">
                Mitra menerima email otomatis untuk memperbaiki berkas (SOP FR-G1).
              </span>
            </span>
          </div>
          <span className="shrink-0 rounded-full bg-error-container px-3 py-1 font-label-sm text-label-sm font-semibold text-error">
            Perlu Revisi Mitra
          </span>
        </div>

        <div className="mt-space-md flex flex-col gap-2.5">
          <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-slate-500">
            Pilih alasan standar (bisa lebih dari satu):
          </span>
          {verif.alasanOpsi.map((alasan, i) => {
            const aktif = verif.alasanDipilih.includes(i)
            return (
              <label
                key={alasan}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-colors',
                  aktif ? 'bg-purple-100' : 'bg-purple-50 hover:bg-purple-100/70',
                )}
              >
                <input
                  type="checkbox"
                  checked={aktif}
                  onChange={() => verif.toggleAlasan(i)}
                  className="h-5 w-5 shrink-0 rounded text-primary accent-primary"
                />
                <span className="text-body-sm leading-snug text-on-surface">{alasan}</span>
              </label>
            )
          })}
        </div>

        <div className="mt-space-md flex flex-col gap-1.5">
          <label
            htmlFor="catatan-tolak"
            className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-slate-500"
          >
            Catatan tambahan &amp; instruksi perbaikan:
          </label>
          <textarea
            id="catatan-tolak"
            value={verif.catatan}
            onChange={(e) => verif.setCatatan(e.target.value)}
            rows={3}
            placeholder="Cth: Mohon unggah ulang foto tampak depan yang memperlihatkan plang nama gedung secara terang..."
            className="w-full rounded-xl bg-purple-50 p-space-md text-body-sm text-on-surface placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-error/20"
          />
        </div>

        {verif.galat && (
          <p className="mt-2 flex items-center gap-1.5 text-body-sm font-medium text-status-full">
            <Icon name="error" className="text-[16px]" />
            {verif.galat}
          </p>
        )}

        <div className="mt-space-lg flex flex-col-reverse gap-space-sm sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => verif.setTolakBuka(false)}
            className={cn(KELAS_TOMBOL, 'bg-purple-50 text-on-surface hover:bg-purple-100')}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={verif.konfirmasiTolak}
            disabled={Boolean(verif.proses)}
            className={cn(KELAS_TOMBOL, 'bg-status-full text-white shadow-sm hover:opacity-90 disabled:opacity-60')}
          >
            {verif.proses === 'tolak' ? (
              <>
                <Icon name="sync" className="animate-spin text-[18px]" />
                Mengirim...
              </>
            ) : (
              <>
                <Icon name="send" className="text-[18px]" />
                Konfirmasi Penolakan
              </>
            )}
          </button>
        </div>
      </div>
    </Overlay>
  )
}

/** Lightbox pratinjau foto berkas verifikasi. */
export function ModalFoto({ verif }: { verif: VerifikasiPenyedia }) {
  return (
    <Overlay
      open={Boolean(verif.fotoBesar)}
      onClose={() => verif.setFotoBesar(null)}
      labelledBy="judul-foto"
    >
      <div className="px-6 pb-8 pt-5 md:px-0 md:pb-0 md:pt-6">
        <div className="flex items-start justify-between gap-3 pr-10">
          <span className="flex min-w-0 flex-col">
            <span id="judul-foto" className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              Pratinjau Foto Berkas
            </span>
            <span className="truncate text-body-sm text-slate-500">
              {verif.fotoBesar?.judul || verif.terpilih?.nama}
            </span>
          </span>
        </div>
        <img
          src={verif.fotoBesar?.src}
          alt={verif.fotoBesar?.judul ?? 'Foto berkas verifikasi'}
          className="mt-space-md w-full rounded-2xl object-cover"
        />
        <div className="mt-space-lg flex flex-col-reverse gap-space-sm sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => verif.setFotoBesar(null)}
            className={cn(KELAS_TOMBOL, 'bg-purple-50 text-on-surface hover:bg-purple-100')}
          >
            Tutup
          </button>
          {verif.fotoBesar?.src && (
            <>
              <a
                href={verif.fotoBesar.src}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  KELAS_TOMBOL,
                  'bg-purple-50 text-on-surface hover:bg-purple-100',
                  'inline-flex items-center',
                )}
              >
                <Icon name="open_in_new" className="text-[18px]" />
                Buka Tab Baru
              </a>
              <a
                href={verif.fotoBesar.src}
                download={verif.fotoBesar.judul || true}
                className={cn(KELAS_TOMBOL, 'bg-primary text-white shadow-sm hover:opacity-90')}
              >
                <Icon name="download" className="text-[18px]" />
                Unduh Foto
              </a>
            </>
          )}
        </div>
      </div>
    </Overlay>
  )
}

/** Pratinjau dokumen verifikasi — berkas asli dari server (/uploads/...). */
export function ModalDokumen({ verif }: { verif: VerifikasiPenyedia }) {
  const m = verif.terpilih
  if (!m) return null
  const d = m.dokumen
  const url = d.url ?? ''
  const pdf = /\.pdf(\?|$)/i.test(url)

  return (
    <Overlay open={verif.dokBuka} onClose={() => verif.setDokBuka(false)} labelledBy="judul-dok">
      <div className="px-6 pb-8 pt-5 md:px-0 md:pb-0 md:pt-6">
        <div className="flex items-start justify-between gap-3 pr-10">
          <span className="flex min-w-0 flex-col">
            <span id="judul-dok" className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              Pratinjau Dokumen Perizinan
            </span>
            <span className="truncate text-body-sm text-slate-500">{d.nama}</span>
          </span>
          <span className="shrink-0 rounded-full bg-pink-100 px-3 py-1 font-label-sm text-label-sm font-semibold text-secondary">
            {pdf ? 'PDF' : 'Berkas'}
          </span>
        </div>

        {/* Pratinjau berkas asli (bila ada) — klik bisa dijalankan admin langsung dari sini. */}
        {d.url && pdf ? (
          <iframe
            src={d.url}
            title={`Berkas ${d.jenis}`}
            className="mt-space-md h-96 w-full rounded-2xl border border-purple-100 bg-white"
          />
        ) : d.url ? (
          <img
            src={d.url}
            alt={`Berkas ${d.jenis}`}
            className="mt-space-md max-h-96 w-full rounded-2xl bg-white object-contain"
          />
        ) : (
          <div className="mt-space-md flex items-center gap-3 rounded-2xl border border-purple-100 bg-purple-50 p-space-md">
            <Icon name="folder_off" className="shrink-0 text-[24px] text-slate-500" />
            <p className="text-body-sm text-slate-500">
              Berkas tidak terlampir pada pengajuan ini — pemohon belum mengunggah dokumen.
            </p>
          </div>
        )}

        <dl className="mt-space-md space-y-2 text-body-sm">
          {[
            ['Jenis Dokumen', d.jenis],
            ['Nomor Dokumen', d.nomor],
            ['Tanggal Terbit', d.terbit],
            ['Masa Berlaku', d.berlaku],
            ['Penerbit / Pejabat', d.pejabat],
            ['Alamat Terdaftar', m.maps.alamat],
          ].map(([label, nilai]) => (
            <div key={label} className="flex items-baseline justify-between gap-space-sm">
              <dt className="shrink-0 text-slate-500">{label}</dt>
              <dd className="text-right font-label-md text-label-md text-on-surface">{nilai}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-space-lg flex flex-col-reverse gap-space-sm sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => verif.setDokBuka(false)}
            className={cn(KELAS_TOMBOL, 'bg-purple-50 text-on-surface hover:bg-purple-100')}
          >
            Tutup
          </button>
          {d.url && (
            <>
              <a
                href={d.url}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  KELAS_TOMBOL,
                  'bg-purple-50 text-on-surface hover:bg-purple-100',
                  'inline-flex items-center',
                )}
              >
                <Icon name="open_in_new" className="text-[18px]" />
                Buka Berkas
              </a>
              <a
                href={d.url}
                download={d.nama || true}
                className={cn(KELAS_TOMBOL, 'bg-primary text-white shadow-sm hover:opacity-90')}
              >
                <Icon name="download" className="text-[18px]" />
                Unduh Berkas
              </a>
            </>
          )}
        </div>
      </div>
    </Overlay>
  )
}
