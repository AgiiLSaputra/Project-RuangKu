/** 4 state status (RENCANA §4D — fix D7). Sama untuk desktop & mobile.
 *  Tab "3" hanya muncul setelah keputusan admin: `disetujui` (3. Diterima) atau `ditolak` (3. Ditolak).
 *  State "Akun Dinonaktifkan" bukan bagian alur daftar — halaman sendiri `/akun-dinonaktifkan`. */
export type StatusKey = 'email' | 'verification' | 'disetujui' | 'ditolak'

/** `?tab=` → StatusKey. `review` disamakan dengan `verification`. */
export function normalizeTab(tab: string | null | undefined): StatusKey {
  if (tab === 'verification' || tab === 'review') return 'verification'
  if (tab === 'disetujui') return 'disetujui'
  if (tab === 'rejected' || tab === 'ditolak') return 'ditolak'
  return 'email'
}
