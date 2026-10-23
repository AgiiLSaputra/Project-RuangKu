import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../../../lib/api'
import type { Ruangan } from '../../../data/seed'
import { ambilDaftarRuangan, ambilRuangan, type FilterKatalogApi } from '../../../services/ruangan'

const pesanGalat = (err: unknown) =>
  err instanceof ApiError ? err.message : 'Tidak dapat terhubung ke server. Coba lagi.'

/** Jeda sebelum filter dikirim, supaya geser slider harga tidak memicu puluhan request. */
const JEDA_FILTER_MS = 250

/**
 * Katalog ruangan dari server, disaring di server sesuai `filter` (katalog, beranda, landing).
 * Request lama yang selesai belakangan diabaikan, jadi hasil selalu milik filter terakhir.
 * `aktif: false` menunda pengambilan (mis. panel filter mobile yang belum dibuka).
 */
export function useKatalogRuangan(filter: FilterKatalogApi = {}, aktif = true) {
  const [ruangan, setRuangan] = useState<Ruangan[]>([])
  const [percobaan, setPercobaan] = useState(0)
  // Hasil terakhir dicatat bersama kunci permintaannya; `memuat` = hasil belum milik kunci saat ini.
  const [selesai, setSelesai] = useState<{ kunci: string; galat: string } | null>(null)
  const kunci = `${JSON.stringify(filter)}#${percobaan}`

  useEffect(() => {
    if (!aktif) return
    let batal = false
    const t = window.setTimeout(() => {
      ambilDaftarRuangan(filter)
        .then((r) => {
          if (batal) return
          setRuangan(r)
          setSelesai({ kunci, galat: '' })
        })
        .catch((err) => {
          if (!batal) setSelesai({ kunci, galat: pesanGalat(err) })
        })
    }, JEDA_FILTER_MS)
    return () => {
      batal = true
      window.clearTimeout(t)
    }
    // `filter` sudah terwakili `kunci`; objek filter baru tiap render tidak boleh memicu ulang.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kunci, aktif])

  const muat = useCallback(() => setPercobaan((n) => n + 1), [])
  const memuat = selesai?.kunci !== kunci

  return { ruangan, memuat, galat: memuat ? '' : (selesai?.galat ?? ''), muat }
}

/** Satu ruangan dari server berdasarkan id/slug di URL (untuk halaman Detail Ruangan). */
export function useDetailRuangan(idAtauSlug: string | undefined) {
  const [ruangan, setRuangan] = useState<Ruangan | null>(null)
  const [memuat, setMemuat] = useState(true)
  const [galat, setGalat] = useState('')
  const [tidakAda, setTidakAda] = useState(false)
  const [percobaan, setPercobaan] = useState(0)

  useEffect(() => {
    setRuangan(null)
    setGalat('')
    if (!idAtauSlug) {
      setTidakAda(true)
      setMemuat(false)
      return
    }
    let batal = false
    setTidakAda(false)
    setMemuat(true)
    ambilRuangan(idAtauSlug)
      .then((r) => {
        if (!batal) setRuangan(r)
      })
      .catch((err) => {
        if (batal) return
        if (err instanceof ApiError && err.kode === 'RUANGAN_TIDAK_DITEMUKAN') setTidakAda(true)
        else setGalat(pesanGalat(err))
      })
      .finally(() => {
        if (!batal) setMemuat(false)
      })
    return () => {
      batal = true
    }
  }, [idAtauSlug, percobaan])

  const muat = useCallback(() => setPercobaan((n) => n + 1), [])

  return { ruangan, memuat, galat, tidakAda, muat }
}
