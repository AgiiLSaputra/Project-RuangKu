import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEditRuangan } from '../../components/domain/mitra/useEditRuangan'
import { Field, Select, TextArea } from '../../components/ui/Field'
import { Icon } from '../../components/ui/Icon'
import { Overlay } from '../../components/ui/Overlay'
import { cn } from '../../lib/cn'

const KELAS_TOMBOL =
  'inline-flex items-center justify-center gap-2 rounded-full px-space-md font-title-md text-title-md font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'

/**
 * Halaman Edit Ruangan mitra (desktop & mobile memakai layout yang sama).
 * Menampung perubahan data, penonaktifan etalase (pindah dari kartu Ruangan Saya),
 * dan penghapusan ruangan beserta datanya di server.
 */
export function EditRuanganPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const e = useEditRuangan(id)

  const simpan = async () => {
    if (await e.simpan()) window.setTimeout(() => navigate('/ruangan-saya'), 900)
  }

  const hapus = async () => {
    if (await e.hapus()) navigate('/ruangan-saya')
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-12 pt-6 sm:px-6">
      <nav className="flex flex-wrap items-center gap-1.5 font-label-md text-label-md text-slate-500">
        <Link to="/dashboard-penyedia" className="transition-colors hover:text-primary">
          Beranda
        </Link>
        <Icon name="chevron_right" className="text-[14px]" />
        <Link to="/ruangan-saya" className="transition-colors hover:text-primary">
          Ruangan Saya
        </Link>
        <Icon name="chevron_right" className="text-[14px]" />
        <span className="font-semibold text-primary">Edit Ruangan</span>
      </nav>

      <div className="mt-space-sm flex flex-wrap items-start justify-between gap-space-sm">
        <div>
          <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">Edit Ruangan</h1>
          <p className="mt-1 font-body-md text-body-md text-slate-500">
            Perbarui data ruangan, atur status etalase, atau hapus ruangan dari daftar Anda.
          </p>
        </div>
        {!e.memuat && !e.galatMuat && (
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-label-sm text-label-sm font-semibold',
              e.status === 'aktif'
                ? 'bg-status-available-bg text-status-available'
                : 'bg-status-occupied-bg text-status-occupied',
            )}
          >
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                e.status === 'aktif' ? 'bg-status-available' : 'bg-status-occupied',
              )}
            />
            {e.status === 'aktif' ? 'Tayang di katalog' : 'Disembunyikan dari katalog'}
          </span>
        )}
      </div>

      {e.galatMuat ? (
        <div className="mt-space-lg flex flex-col items-center gap-space-sm rounded-2xl bg-surface-container-lowest p-space-xl text-center shadow-card">
          <Icon name="error" className="text-[32px] text-status-full" />
          <p className="font-title-md text-title-md text-on-surface">Gagal memuat ruangan</p>
          <p className="font-body-sm text-body-sm text-slate-500">{e.galatMuat}</p>
          <div className="flex items-center gap-space-sm">
            <button
              type="button"
              onClick={e.muat}
              className={cn(KELAS_TOMBOL, 'bg-cta px-5 py-2.5 text-white shadow-cta hover:opacity-90')}
            >
              Coba Lagi
            </button>
            <Link
              to="/ruangan-saya"
              className={cn(KELAS_TOMBOL, 'bg-purple-100 px-5 py-2.5 text-primary hover:bg-purple-300/40')}
            >
              Kembali
            </Link>
          </div>
        </div>
      ) : e.memuat ? (
        <p className="mt-space-lg font-body-md text-body-md text-slate-500">Memuat data ruangan...</p>
      ) : (
        <div className="mt-space-lg flex flex-col gap-space-lg">
          {(e.galat || e.pesan) && (
            <div
              className={cn(
                'flex items-start gap-2 rounded-2xl px-space-md py-3 font-body-sm text-body-sm shadow-sm',
                e.galat ? 'bg-status-blocked-bg text-status-full' : 'bg-status-available-bg text-status-available',
              )}
            >
              <Icon name={e.galat ? 'error' : 'check_circle'} className="text-[18px]" />
              <span className="font-medium">{e.galat || e.pesan}</span>
            </div>
          )}

          {/* Form data ruangan */}
          <section className="rounded-2xl bg-surface-container-lowest p-space-lg shadow-card">
            <h2 className="font-title-md text-title-md font-semibold text-on-surface">Data Ruangan</h2>
            <p className="mt-0.5 font-body-sm text-body-sm text-slate-500">
              Perubahan berlaku di etalase publik setelah disimpan.
            </p>

            <form
              className="mt-space-md grid grid-cols-1 gap-space-md md:grid-cols-2"
              onSubmit={(ev) => {
                ev.preventDefault()
                void simpan()
              }}
            >
              <Field
                label="Nama Ruangan"
                required
                value={e.form.nama}
                onChange={(ev) => e.ubah('nama', ev.target.value)}
                className="md:col-span-2"
              />
              <Select
                label="Kategori"
                required
                value={e.form.kategori}
                onChange={(ev) => e.ubah('kategori', ev.target.value)}
              >
                <option value="Ballroom">Ballroom &amp; Konferensi</option>
                <option value="Meeting Room">Meeting Room</option>
                <option value="Creative Space">Creative Space</option>
              </Select>
              <Field
                label="Nama Gedung"
                value={e.form.gedung}
                onChange={(ev) => e.ubah('gedung', ev.target.value)}
                placeholder="Opsional"
              />
              <Field
                label="Alamat"
                required
                value={e.form.alamat}
                onChange={(ev) => e.ubah('alamat', ev.target.value)}
                className="md:col-span-2"
              />
              <Field
                label="Kota"
                required
                value={e.form.kota}
                onChange={(ev) => e.ubah('kota', ev.target.value)}
              />
              <Field
                label="Provinsi"
                required
                value={e.form.provinsi}
                onChange={(ev) => e.ubah('provinsi', ev.target.value)}
              />
              <Field
                label="Kapasitas Minimal"
                required
                type="number"
                min={1}
                value={e.form.kapasitasMin}
                onChange={(ev) => e.ubah('kapasitasMin', ev.target.value)}
                suffix="orang"
              />
              <Field
                label="Kapasitas Maksimal"
                required
                type="number"
                min={1}
                value={e.form.kapasitasMax}
                onChange={(ev) => e.ubah('kapasitasMax', ev.target.value)}
                suffix="orang"
              />
              <Field
                label="Tarif Sewa per Jam"
                required
                type="number"
                min={0}
                step={1000}
                value={e.form.tarifPerJam}
                onChange={(ev) => e.ubah('tarifPerJam', ev.target.value)}
                suffix="Rp"
              />
              <Field
                label="Tautan Google Maps"
                value={e.form.linkMaps}
                onChange={(ev) => e.ubah('linkMaps', ev.target.value)}
                placeholder="Opsional"
              />
              <Field
                label="Jam Buka"
                required
                type="time"
                value={e.form.jamBuka}
                onChange={(ev) => e.ubah('jamBuka', ev.target.value)}
              />
              <Field
                label="Jam Tutup"
                required
                type="time"
                value={e.form.jamTutup}
                onChange={(ev) => e.ubah('jamTutup', ev.target.value)}
              />
              <TextArea
                label="Deskripsi Ruangan"
                value={e.form.deskripsi}
                onChange={(ev) => e.ubah('deskripsi', ev.target.value)}
                className="md:col-span-2"
              />

              <div className="flex flex-col-reverse gap-space-sm md:col-span-2 md:flex-row md:justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/ruangan-saya')}
                  className={cn(KELAS_TOMBOL, 'bg-white py-2.5 text-slate-500 shadow-sm hover:text-on-surface')}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={e.menyimpan}
                  className={cn(KELAS_TOMBOL, 'bg-cta py-2.5 text-white shadow-cta hover:opacity-90')}
                >
                  <Icon name="save" className="text-[18px]" />
                  {e.menyimpan ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </section>

          {/* Status etalase — pindahan tombol Nonaktifkan/Aktifkan dari kartu Ruangan Saya */}
          <section className="rounded-2xl bg-surface-container-lowest p-space-lg shadow-card">
            <h2 className="font-title-md text-title-md font-semibold text-on-surface">Status Etalase</h2>
            <p className="mt-1 font-body-sm text-body-sm text-slate-500">
              {e.status === 'aktif'
                ? 'Ruangan saat ini tayang di katalog publik. Nonaktifkan untuk menyembunyikannya dari penyewa tanpa menghapus data.'
                : 'Ruangan sedang disembunyikan dari katalog publik. Aktifkan kembali agar penyewa bisa melihat dan memesannya.'}
            </p>
            <button
              type="button"
              onClick={() => void e.ubahStatus()}
              disabled={e.mengubahStatus || e.menyimpan}
              className={cn(
                KELAS_TOMBOL,
                'mt-space-md py-2.5',
                e.status === 'aktif'
                  ? 'bg-status-full-bg text-status-full hover:opacity-90'
                  : 'bg-status-available-bg text-status-available hover:opacity-90',
              )}
            >
              <Icon name={e.status === 'aktif' ? 'pause_circle' : 'play_circle'} className="text-[18px]" />
              {e.mengubahStatus
                ? 'Memproses...'
                : e.status === 'aktif'
                  ? 'Nonaktifkan Ruangan'
                  : 'Aktifkan Ruangan'}
            </button>
          </section>

          {/* Hapus ruangan */}
          <section className="rounded-2xl bg-status-blocked-bg/60 p-space-lg shadow-card">
            <h2 className="font-title-md text-title-md font-semibold text-status-full">Hapus Ruangan</h2>
            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
              Menghapus ruangan beserta foto, fasilitas, dan paketnya dari database secara permanen. Ruangan yang
              sudah memiliki riwayat reservasi tidak bisa dihapus — nonaktifkan saja agar struk lama tetap utuh.
            </p>
            <button
              type="button"
              onClick={() => e.setKonfirmasiHapus(true)}
              disabled={e.menghapus}
              className={cn(KELAS_TOMBOL, 'mt-space-md bg-status-full py-2.5 text-white hover:opacity-90')}
            >
              <Icon name="delete" className="text-[18px]" />
              Hapus Ruangan
            </button>
          </section>
        </div>
      )}

      <Overlay
        open={e.konfirmasiHapus}
        onClose={() => e.setKonfirmasiHapus(false)}
        labelledBy="judul-hapus-ruangan"
      >
        <div className="px-6 pb-8 pt-5 md:px-0 md:pb-0 md:pt-6">
          <div className="flex items-center gap-space-md pr-10">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-status-blocked-bg text-status-full">
              <Icon name="delete_forever" className="text-[22px]" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span
                id="judul-hapus-ruangan"
                className="font-headline-sm text-headline-sm font-semibold text-on-surface"
              >
                Hapus ruangan ini?
              </span>
              <span className="text-body-sm text-slate-500">
                Data ruangan, foto, fasilitas, dan paketnya akan dihapus permanen.
              </span>
            </span>
          </div>

          {e.galat && <p className="mt-space-md font-body-sm font-medium text-status-full">{e.galat}</p>}

          <div className="mt-space-lg flex flex-col-reverse gap-space-sm sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => e.setKonfirmasiHapus(false)}
              className={cn(KELAS_TOMBOL, 'bg-white py-2.5 text-slate-500 shadow-sm hover:text-on-surface')}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => void hapus()}
              disabled={e.menghapus}
              className={cn(KELAS_TOMBOL, 'bg-status-full py-2.5 text-white hover:opacity-90')}
            >
              <Icon name="delete" className="text-[18px]" />
              {e.menghapus ? 'Menghapus...' : 'Ya, Hapus Permanen'}
            </button>
          </div>
        </div>
      </Overlay>
    </div>
  )
}
