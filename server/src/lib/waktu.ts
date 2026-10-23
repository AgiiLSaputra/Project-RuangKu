// Tanggal & jam mengikuti WIB (Asia/Jakarta), bukan zona waktu server.
const FORMAT_WIB = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jakarta',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** Tanggal (YYYY-MM-DD) dan menit-sejak-tengah-malam saat ini di WIB. */
export function sekarangWib(sekarang: Date = new Date()) {
  const p = Object.fromEntries(FORMAT_WIB.formatToParts(sekarang).map((x) => [x.type, x.value]));
  return { tanggal: `${p.year}-${p.month}-${p.day}`, menit: Number(p.hour) * 60 + Number(p.minute) };
}

/** Geser tanggal YYYY-MM-DD sebanyak n hari (negatif = mundur). */
export function tambahHari(tanggal: string, n: number): string {
  const d = new Date(`${tanggal}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export const keMenit = (jam: string): number => {
  const [h, m] = jam.split(':').map(Number);
  return h * 60 + m;
};

export const dariMenit = (menit: number): string =>
  `${String(Math.floor(menit / 60)).padStart(2, '0')}:${String(menit % 60).padStart(2, '0')}`;
