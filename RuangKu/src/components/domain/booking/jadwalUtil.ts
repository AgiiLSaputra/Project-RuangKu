/** Utilitas tanggal & jam untuk formulir reservasi (zona waktu WIB). */
export const keMenit = (jam: string): number => {
  const [h, m] = jam.split(':').map(Number)
  return h * 60 + m
}

export const dariMenit = (menit: number): string =>
  `${String(Math.floor(menit / 60)).padStart(2, '0')}:${String(menit % 60).padStart(2, '0')}`

/** Tanggal hari ini di WIB, format YYYY-MM-DD. */
export const hariIniWib = (): string => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })

export function tambahHari(tanggal: string, n: number): string {
  const d = new Date(`${tanggal}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Pilihan jam mulai per jam penuh, dari jam buka sampai satu jam sebelum jam tutup. */
export function opsiJamMulai(jamBuka: string, jamTutup: string): string[] {
  const hasil: string[] = []
  for (let m = keMenit(jamBuka); m < keMenit(jamTutup); m += 60) hasil.push(dariMenit(m))
  return hasil
}
