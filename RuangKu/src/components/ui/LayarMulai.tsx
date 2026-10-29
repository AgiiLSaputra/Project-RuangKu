import { cn } from '../../lib/cn'

/**
 * Layar loading awal — tampil saat aplikasi baru dibuka, yaitu selama sesi
 * dicek ke server (`AuthProvider`). Tampilannya sengaja dibuat sama dengan
 * splash statis di `index.html` supaya pergantian dari HTML ke React mulus
 * (lihat indeks.html: blok `#splash`).
 */
export function LayarMulai({ pesan = 'Menyiapkan RuangKu...' }: { pesan?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed inset-0 z-[100] flex flex-col items-center justify-center gap-space-xs bg-surface',
        'motion-safe:animate-masuk-halaman',
      )}
    >
      <img src="/LogoRuangku.png" alt="" className="h-14 w-auto" />
      <span className="font-heading text-2xl font-extrabold tracking-tight text-on-surface">
        Ruang<span className="text-primary">Ku</span>
      </span>
      <span className="material-symbols-outlined animate-spin mt-2 text-[34px] text-primary">
        progress_activity
      </span>
      <p className="mt-space-xs font-body-sm text-body-sm text-on-surface-variant">{pesan}</p>
      <span className="sr-only">Halaman sedang dimuat</span>
    </div>
  )
}
