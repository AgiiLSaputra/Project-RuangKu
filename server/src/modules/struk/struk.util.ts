/**
 * Seri e-ticket diturunkan dari kode reservasi (`RK-10001-RUANGKU` → `RK-2026-10001`).
 * Kode reservasi sudah unik dari sequence, jadi seri & barcode ikut unik tanpa sequence baru.
 */
export function seriDariKode(kode: string): string {
  return `RK-2026-${kode.replace(/\D/g, '')}`;
}

/** Nilai barcode e-ticket yang dicetak di struk (`SERI-VAL`). */
export function barcodeDariSeri(seri: string): string {
  return `${seri}-VAL`;
}
