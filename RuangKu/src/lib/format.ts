export const rp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

export const jam = (h: string) => `${h} WIB`

/** Tautan Google Maps (buka tab baru) dari kueri alamat/ruangan — publik, tanpa login. */
export const tautanMaps = (kueri: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(kueri)}`
