import { expireUnconfirmedHold } from '../modules/reservasi/reservasi.service';

/** Selang pemeriksaan kedaluwarsa reservasi. Cukup jarang: yang berubah hanya status lama. */
const SELANG_MS = 15 * 60 * 1000;

/**
 * Jalankan `ExpireUnconfirmedHold` sekali saat server hidup, lalu berkala.
 * Timer di-`unref()` supaya tidak menahan proses tetap hidup saat server ditutup.
 */
export function mulaiExpireOtomatis(): () => void {
  const jalankan = () => {
    expireUnconfirmedHold()
      .then((n) => {
        if (n > 0) console.log(`[cron] ${n} reservasi kedaluwarsa ditandai expired`);
      })
      .catch((err) => console.error('[cron] gagal menandai reservasi kedaluwarsa:', err));
  };
  jalankan();
  const timer = setInterval(jalankan, SELANG_MS);
  timer.unref();
  return () => clearInterval(timer);
}
