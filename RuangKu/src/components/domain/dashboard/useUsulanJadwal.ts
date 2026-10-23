import { useCallback, useMemo, useState } from 'react'
import { useBookings } from '../../../context/BookingContext'
import { useSumberRuanganServer } from '../booking/useDaftar'
import type { UsulanJadwal } from '../../../data/seed'
import { ApiError } from '../../../lib/api'

/** Data banner "Permintaan Perubahan Jadwal Dari Penyedia" (FR-D1) yang siap tampil. */
export interface BannerUsulan {
  /** ID keputusan untuk `putuskanUsulan`. */
  id: string
  kode: string
  penyediaNama: string
  ruanganNama: string
  /** Sintaks "Jumat, 07 Nov 2026". */
  tanggalLama: string
  jamLama: string
  /** Sintaks "Sabtu, 08 Nov 2026" + "09:00 - 13:00 WIB". */
  tanggalBaru: string
  jamBaru: string
  durasiJam: number
  catatan: string
}

const teksTanggal = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

/**
 * Usulan perubahan jadwal penyedia yang aktif (status 'menunggu') di daftar reservasi penyewa.
 * Banner dashboard hanya tampil kalau hook ini mengembalikan data — bukan selalu muncul.
 */
export function useUsulanJadwal() {
  const { daftar, putuskanUsulan } = useBookings()
  const sumber = useSumberRuanganServer()
  const [proses, setProses] = useState(false)

  const aktif = useMemo<BannerUsulan | null>(() => {
    const r = daftar.find((x) => x.status === 'approved' && x.usulanJadwal)
    if (!r?.usulanJadwal) return null
    const u: UsulanJadwal = r.usulanJadwal
    return {
      id: u.id,
      kode: r.kode,
      penyediaNama: u.penyediaNama ?? sumber(r.ruanganId)?.penyedia ?? 'Pengelola ruangan',
      ruanganNama: sumber(r.ruanganId)?.nama ?? r.acara,
      tanggalLama: teksTanggal(r.tanggal),
      jamLama: `${r.jamMulai} - ${r.jamSelesai} WIB`,
      tanggalBaru: teksTanggal(u.tanggalBaru),
      jamBaru: `${u.jamMulaiBaru} - ${u.jamSelesaiBaru} WIB`,
      durasiJam: r.durasiJam,
      catatan: u.catatanPenyedia ?? '',
    }
  }, [daftar, sumber])

  const putuskan = useCallback(
    async (keputusan: 'setujui' | 'tolak') => {
      if (!aktif || proses) return false
      setProses(true)
      try {
        await putuskanUsulan(aktif.id, keputusan)
        return true
      } catch (err) {
        if (err instanceof ApiError) window.alert(err.message)
        else window.alert('Tidak dapat terhubung ke server. Coba lagi.')
        return false
      } finally {
        setProses(false)
      }
    },
    [aktif, proses, putuskanUsulan],
  )

  return { aktif, putuskan, proses }
}
