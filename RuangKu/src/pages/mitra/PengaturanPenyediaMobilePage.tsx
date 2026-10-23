import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Icon } from '../../components/ui/Icon'
import { LABEL_LANGKAH } from '../../components/domain/mitra/useTambahRuangan'
import { BATAS_DRAF, hapusDrafRuangan, tampilWaktu, useDaftarDraf } from '../../lib/drafRuangan'

/**
 * Pengaturan Mitra (mobile) — akun, daftar draf
 * Tambah Ruangan (maksimal 3, bisa dilanjutkan/dihapus), dan tombol Keluar.
 */
export function PengaturanPenyediaMobilePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const draf = useDaftarDraf()

  function keluar() {
    logout()
    navigate('/')
  }

  return (
    <div className="flex flex-col gap-space-md bg-surface px-gutter pb-space-lg pt-space-md">
      {/* Judul */}
      <section className="flex flex-col gap-space-xs">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-on-surface">
          Pengaturan Mitra
        </h1>
        <p className="font-body-md text-body-md leading-relaxed text-on-surface-variant">
          Kelola akun mitra, lanjutkan draf ruangan, dan keluar dari sesi.
        </p>
      </section>

      {/* Akun */}
      <section className="rounded-lg bg-surface-container-low p-space-md shadow-card">
        <div className="flex items-center gap-space-sm">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-primary">
            <Icon name="person" className="text-[18px]" />
          </span>
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Akun</h2>
        </div>

        <div className="mt-space-md flex items-center gap-space-sm">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-white">
            <Icon name="person" className="text-[24px]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-title-md text-title-md font-semibold text-on-surface">
              {user?.nama ?? 'Penyedia'}
            </p>
            <p className="truncate font-body-md text-body-md text-on-surface-variant">{user?.email}</p>
          </div>
        </div>

        <span className="mt-space-sm inline-flex items-center gap-1 rounded-full bg-status-available-bg px-2.5 py-0.5 font-label-sm text-label-sm font-semibold text-status-available">
          <Icon name="verified" className="text-[14px]" />
          Mitra Terverifikasi
        </span>

        <div className="mt-space-md space-y-space-xs">
          <div className="rounded-lg bg-surface-container-low p-space-sm">
            <p className="font-label-sm text-label-sm text-slate-500">Peran</p>
            <p className="mt-1 font-body-md text-body-md text-on-surface">Penyedia (Mitra)</p>
          </div>

          <div className="rounded-lg bg-surface-container-low p-space-sm">
            {/* Sandi disimpan sebagai hash di server, jadi tidak bisa ditampilkan. */}
            <p className="font-label-sm text-label-sm text-slate-500">Kata Sandi</p>
            <p className="mt-1 font-body-md text-body-md tracking-wide text-on-surface" aria-label="Kata sandi tersembunyi">
              ••••••••
            </p>
          </div>
        </div>
      </section>

      {/* Draf ruangan tersimpan */}
      <section className="rounded-lg bg-surface-container-low p-space-md shadow-card">
        <div className="flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-primary">
              <Icon name="draft" className="text-[18px]" />
            </span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Draf Ruangan</h2>
          </div>
          <span className="shrink-0 rounded-full bg-purple-100 px-2.5 py-0.5 font-label-sm text-label-sm font-semibold text-primary">
            {draf.length} dari {BATAS_DRAF}
          </span>
        </div>

        {draf.length === 0 ? (
          <div className="mt-space-md rounded-lg border border-dashed border-purple-300 bg-purple-50 p-space-md text-center">
            <Icon name="draft" className="text-[24px] text-primary" />
            <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
              Belum ada draf. Simpan lewat tombol <span className="font-semibold">Simpan Draft</span> di form Tambah
              Ruangan — maksimal {BATAS_DRAF} draf.
            </p>
          </div>
        ) : (
          <>
            <ul className="mt-space-md flex flex-col gap-space-sm">
              {draf.map((d) => (
                <li key={d.id} className="rounded-lg border border-purple-100 bg-surface-container-low p-space-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 break-words font-title-md text-title-md font-semibold text-on-surface">
                      {d.nama}
                    </p>
                    <button
                      type="button"
                      onClick={() => hapusDrafRuangan(d.id)}
                      aria-label={`Hapus draf ${d.nama}`}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-status-full transition-colors active:scale-95"
                    >
                      <Icon name="delete" className="text-[20px]" />
                    </button>
                  </div>
                  <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                    Langkah {d.langkah} dari 4 — {LABEL_LANGKAH[d.langkah - 1] ?? 'Informasi Ruangan'}
                  </p>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-purple-100">
                    <div className="h-full rounded-full bg-cta" style={{ width: `${(d.langkah / 4) * 100}%` }} />
                  </div>
                  <div className="mt-space-sm flex items-center justify-between gap-space-sm">
                    <span className="font-label-sm text-label-sm text-slate-500">
                      Diperbarui {tampilWaktu(d.diperbarui)}
                    </span>
                    <Link
                      to={`/ruangan-saya/tambah?draf=${d.id}`}
                      className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-4 py-1.5 font-title-md text-body-sm text-primary transition-colors active:scale-95"
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

      {/* Keluar */}
      <section className="rounded-lg bg-surface-container-low p-space-md shadow-card">
        <p className="font-title-md text-title-md font-semibold text-on-surface">Keluar dari Akun</p>
        <p className="mt-1 font-body-md text-body-md text-on-surface-variant">Akhiri sesi mitra di perangkat ini.</p>
        <button
          type="button"
          onClick={keluar}
          className="mt-space-md flex h-12 w-full items-center justify-center gap-space-sm rounded-full bg-error-container font-title-md text-title-md text-error transition-all hover:opacity-90 active:scale-[0.99]"
        >
          <Icon name="logout" className="text-[20px]" />
          <span>Keluar</span>
        </button>
      </section>
    </div>
  )
}
