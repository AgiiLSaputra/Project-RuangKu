import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

/** Penanda kartu/sekun — rangka pembungkus halaman hampir tidak pernah membulat. */
const PENANDA_KARTU = /(?:^|\s)(?:rounded-\S+|shadow(?:-\S+)?)(?:\s|$)/
/** Lapisan dekoratif (blob latar, overlay absolut) jangan ikut dianimasikan. */
const LAPISAN_DEKOR = /(?:^|\s)(?:fixed|absolute)(?:\s|$)/

/** Jeda antar unit dalam satu batch (ms) & batas indeks. */
const JEDA_UNIT = 55
const INDEKS_MAKS = 11

/** Garis pemicu animasi: 85% tinggi layar (sedikit di atas tepi bawah). */
const GARIS_PEMICU = 0.85

/**
 * Cari "unit" animasi di dalam akar: turun selama ada tepat satu anak elemen
 * (rangka pembungkus `mx-auto` / `flex-col`), berhenti begitu menemukan kartu
 * (punya `rounded-*`/`shadow`) — kelompok anak di tingkat itulah kartu yang
 * dimasukkan satu per satu.
 */
function cariUnit(akar: HTMLElement): HTMLElement[] {
  let tingkat = akar
  for (let i = 0; i < 6; i += 1) {
    const anak = tingkat.children
    if (anak.length !== 1) break
    const tunggal = anak[0]
    if (!(tunggal instanceof HTMLElement)) break
    if (PENANDA_KARTU.test(tunggal.getAttribute('class') ?? '')) break
    tingkat = tunggal
  }

  const unit = Array.from(tingkat.children).filter(
    (el): el is HTMLElement =>
      el instanceof HTMLElement && !LAPISAN_DEKOR.test(el.getAttribute('class') ?? ''),
  )
  // Semua anak tereliminasi (mis. hanya lapisan dekor) atau tingkat daun
  // tunggal → animasikan tingkat itu sendiri sebagai satu unit.
  return unit.length > 0 ? unit : [tingkat]
}

/**
 * Penampil isi halaman — animasi masuk **hanya dipicu saat di-scroll**.
 *
 * Perilaku:
 * - Kartu yang sudah terlihat saat halaman dibuka → tampil **langsung, tanpa
 *   animasi** (halaman terasa instan; tidak ada "jeda masuk" di layar pertama).
 * - Kartu di bawah lipatan → disembunyikan dulu (`.unit-tunggu`, hanya opacity;
 *   tata letak tetap) lalu muncul **saat masuk viewport saat di-scroll**
 *   (garis pemicu 85% tinggi layar), satu per satu dengan jeda 55ms per batch
 *   yang bersamaan. Sekali tampil, tidak diamati lagi.
 *
 * Pengaman: tanpa IntersectionObserver, unit berukuran nol, atau yang sudah
 * terlihat → konten langsung terlihat; tidak pernah macet transparan.
 * `prefers-reduced-motion` dikunci di CSS. Header & footer tidak ikut.
 *
 * Rute berdiri sendiri tanpa layout (mis. `/masuk`) membungkus isinya
 * dengan `<IsiHalaman>` secara manual; semua layout sudah memakainya.
 */
export function IsiHalaman({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const akarRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const akar = akarRef.current
    if (!akar) return
    const unit = cariUnit(akar)

    // Mode aman: tanpa IntersectionObserver → tampilkan semua apa adanya.
    if (typeof IntersectionObserver === 'undefined') return

    const tinggiLayar = window.innerHeight

    const pengamat = new IntersectionObserver(
      (entri) => {
        let urut = 0
        for (const e of entri) {
          if (!e.isIntersecting) continue
          const el = e.target
          if (!(el instanceof HTMLElement)) continue
          pengamat.unobserve(el) // sekali masuk layar, cukup satu kali
          el.style.setProperty('--jeda', `${Math.min(urut, INDEKS_MAKS) * JEDA_UNIT}ms`)
          el.classList.remove('unit-tunggu')
          el.classList.add('unit-masuk')
          urut += 1
        }
      },
      // Pemicu saat kartu melewati 85% tinggi layar (root mengecil dari bawah).
      { rootMargin: `0px 0px -${Math.round((1 - GARIS_PEMICU) * 100)}% 0px`, threshold: 0 },
    )

    for (const el of unit) {
      const r = el.getBoundingClientRect()
      const nol = el.offsetWidth === 0 && el.offsetHeight === 0
      // Sudah terlihat saat halaman dibuka → biarkan tampil langsung tanpa
      // animasi (animasi hanya untuk yang menyusul masuk saat di-scroll).
      const terlihatSekarang = !nol && r.top < tinggiLayar * GARIS_PEMICU && r.bottom > 0
      if (terlihatSekarang) continue
      // Unit tanpa ukuran (mis. di panel tab tersembunyi) jangan disembunyikan
      // agar tidak pernah tersangkut; bila nanti muncul, ia sudah terlihat.
      if (nol) continue
      el.classList.add('unit-tunggu')
      pengamat.observe(el)
    }

    return () => {
      pengamat.disconnect()
      for (const el of unit) {
        el.classList.remove('unit-tunggu', 'unit-masuk')
        el.style.removeProperty('--jeda')
      }
    }
  }, [pathname])

  return (
    <div ref={akarRef} key={pathname}>
      {children}
    </div>
  )
}
