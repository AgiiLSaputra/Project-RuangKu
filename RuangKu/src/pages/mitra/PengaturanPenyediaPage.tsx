import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Icon } from '../../components/ui/Icon'
import { LABEL_LANGKAH } from '../../components/domain/mitra/useTambahRuangan'
import { BATAS_DRAF, hapusDrafRuangan, tampilWaktu, useDaftarDraf } from '../../lib/drafRuangan'

/**
 * Pengaturan Mitra (desktop) — akun, daftar draf
 * Tambah Ruangan (maksimal 3, bisa dilanjutkan/dihapus), dan tombol Keluar.
 */
export function PengaturanPenyediaPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const draf = useDaftarDraf()

  function keluar() {
    logout()
    navigate('/')
  }

  return (
    <div className="relative w-full overflow-hidden bg-purple-50 px-4 pb-12 pt-6 sm:px-6">
      <div className="pointer-events-none absolute -top-16 -right-20 h-96 w-96 rounded-full bg-secondary-container/15 blur-3xl" />
      <div className="pointer-events-none absolute top-48 left-1/3 h-[300px] w-[500px] rounded-full bg-primary-fixed/40 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-space-lg">
        <div className="flex flex-col gap-space-xs">
          <nav className="flex items-center gap-space-xs font-label-md text-label-md text-slate-500">
            <Link to="/dashboard-penyedia" className="flex items-center gap-1 transition-colors hover:text-primary">
              <Icon name="home" className="text-[16px]" />
              <span>Beranda</span>
            </Link>
            <Icon name="chevron_right" className="text-[14px]" />
            <span className="font-semibold text-primary">Pengaturan</span>
          </nav>
          <div>
            <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">Pengaturan Mitra</h1>
            <p className="mt-1 max-w-2xl font-body-md text-body-md text-slate-500">
              Kelola akun mitra, lanjutkan draf ruangan yang belum selesai, dan keluar dari sesi.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-space-md lg:grid-cols-3">
          {/* Akun */}
          <section className="rounded-lg bg-surface-container-lowest p-space-md shadow-card lg:col-span-2">
            <div className="flex items-center gap-space-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-primary">
                <Icon name="person" className="text-[20px]" />
              </span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Akun</h2>
            </div>

            <div className="mt-space-md flex items-center gap-space-md rounded-lg bg-surface-container-low p-space-md">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                <Icon name="person" className="text-[28px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-title-md text-title-md font-semibold text-on-surface">
                  {user?.nama ?? 'Penyedia'}
                </p>
                <p className="truncate font-body-md text-body-md text-on-surface-variant">{user?.email}</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-status-available-bg px-3 py-1 font-label-sm text-label-sm font-semibold text-status-available">
                <Icon name="verified" className="text-[14px]" />
                Mitra Terverifikasi
              </span>
            </div>

            <div className="mt-space-md grid grid-cols-1 gap-space-sm sm:grid-cols-3">
              <div className="rounded-lg bg-surface-container-low p-space-md">
                <p className="font-label-sm text-label-sm text-slate-500">Peran</p>
                <p className="mt-1 font-title-md text-title-md text-on-surface">Penyedia (Mitra)</p>
              </div>
              <div className="rounded-lg bg-surface-container-low p-space-md">
                <p className="font-label-sm text-label-sm text-slate-500">Status</p>
                <p className="mt-1 font-title-md text-title-md text-on-surface">Aktif</p>
              </div>
              <div className="rounded-lg bg-surface-container-low p-space-md">
                {/* Sandi disimpan sebagai hash di server, jadi tidak bisa ditampilkan. */}
                <p className="font-label-sm text-label-sm text-slate-500">Kata Sandi</p>
                <p className="mt-1 font-title-md text-title-md tracking-wide text-on-surface" aria-label="Kata sandi tersembunyi">
                  ••••••••
                </p>
              </div>
            </div>
          </section>

          {/* Draf ruangan tersimpan */}
          <section className="rounded-lg bg-surface-container-lowest p-space-md shadow-card">
            <div className="flex items-center justify-between gap-space-sm">
              <div className="flex items-center gap-space-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-primary">
                  <Icon name="draft" className="text-[20px]" />
                </span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Draf Ruangan</h2>
              </div>
              <span className="shrink-0 rounded-full bg-purple-100 px-2.5 py-0.5 font-label-sm text-label-sm font-semibold text-primary">
                {draf.length} dari {BATAS_DRAF}
              </span>
            </div>

            {draf.length === 0 ? (
              <div className="mt-space-md rounded-lg border border-dashed border-purple-300 bg-purple-50 p-space-md text-center">
                <Icon name="draft" className="text-[28px] text-primary" />
                <p className="mt-space-xs font-body-md text-body-md text-on-surface-variant">
                  Belum ada draf. Simpan lewat tombol <span className="font-semibold">Simpan sebagai Draft</span> di
                  form Tambah Ruangan — maksimal {BATAS_DRAF} draf.
                </p>
              </div>
            ) : (
              <>
                <ul className="mt-space-md flex flex-col gap-space-sm">
                  {draf.map((d) => (
                    <li
                      key={d.id}
                      className="rounded-lg border border-purple-100 bg-surface-container-low p-space-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 break-words font-title-md text-title-md font-semibold text-on-surface">
                          {d.nama}
                        </p>
                        <button
                          type="button"
                          onClick={() => hapusDrafRuangan(d.id)}
                          aria-label={`Hapus draf ${d.nama}`}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-status-full transition-colors hover:bg-status-full-bg"
                        >
                          <Icon name="delete" className="text-[18px]" />
                        </button>
                      </div>
                      <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                        Langkah {d.langkah} dari 4 — {LABEL_LANGKAH[d.langkah - 1] ?? 'Informasi Ruangan'}
                      </p>
                      <div className="mt-space-xs h-2 w-full overflow-hidden rounded-full bg-purple-100">
                        <div
                          className="h-full rounded-full bg-cta"
                          style={{ width: `${(d.langkah / 4) * 100}%` }}
                        />
                      </div>
                      <div className="mt-space-sm flex items-center justify-between gap-space-sm">
                        <span className="font-label-sm text-label-sm text-slate-500">
                          Diperbarui {tampilWaktu(d.diperbarui)}
                        </span>
                        <Link
                          to={`/ruangan-saya/tambah?draf=${d.id}`}
                          className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-4 py-1.5 font-title-md text-body-sm text-primary transition-colors hover:bg-primary-container hover:text-on-primary"
                        >
                          <Icon name="edit_note" className="text-[16px]" />
                          Lanjutkan
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="mt-space-sm font-label-sm leading-relaxed text-slate-500">
                  Batas {BATAS_DRAF} draf — hapus salah satu kalau ingin menyimpan draf baru.
                </p>
              </>
            )}
          </section>
        </div>

        {/* Keluar */}
        <section className="flex items-center justify-between gap-space-md rounded-lg bg-surface-container-lowest p-space-md shadow-card">
          <div className="flex min-w-0 items-center gap-space-sm">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-status-full-bg text-status-full">
              <Icon name="logout" className="text-[20px]" />
            </span>
            <div className="min-w-0">
              <p className="font-title-md text-title-md font-semibold text-on-surface">Keluar dari Akun</p>
              <p className="truncate font-body-md text-body-md text-on-surface-variant">
                Akhiri sesi mitra di perangkat ini.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={keluar}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-300 px-5 py-2 font-title-md text-title-md text-error transition-all hover:border-error hover:bg-error-container hover:text-on-error-container"
          >
            <Icon name="logout" className="text-[18px]" />
            <span>Keluar</span>
          </button>
        </section>
      </div>
    </div>
  )
}
