import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ALASAN_PENOLAKAN,
  VERIFIKASI_AWAL,
  type MitraVerifikasi,
} from '../../../data/verifikasiPenyedia'

export type FilterVerif = 'semua' | 'prioritas'

/**
 * State halaman verifikasi mitra (FR-G1): antrean + pencarian + filter,
 * pemilihan mitra (dapat dipreset lewat `?mitra=<id>` dari dashboard admin),
 * keputusan setujui/tolak dengan modal alasan, pratinjau foto/dokumen.
 * Dipakai bersama oleh varian desktop & mobile.
 */
export function useVerifikasiPenyedia() {
  const [params] = useSearchParams()
  const [data, setData] = useState<MitraVerifikasi[]>(VERIFIKASI_AWAL)
  const [pilihId, setPilihId] = useState<string>(() => {
    const preset = params.get('mitra')
    return VERIFIKASI_AWAL.some((m) => m.id === preset) ? preset! : VERIFIKASI_AWAL[0].id
  })
  const [cari, setCari] = useState('')
  const [filter, setFilter] = useState<FilterVerif>('semua')
  const [urutTerbaru, setUrutTerbaru] = useState(true)
  const [proses, setProses] = useState<'setuju' | 'tolak' | null>(null)
  const [hasil, setHasil] = useState<{ nada: 'sukses' | 'tolak'; teks: string } | null>(null)
  const [tolakBuka, setTolakBuka] = useState(false)
  const [alasanDipilih, setAlasanDipilih] = useState<number[]>([])
  const [catatan, setCatatan] = useState('')
  const [galat, setGalat] = useState('')
  const [fotoBesar, setFotoBesar] = useState<{ src: string; judul: string } | null>(null)
  const [dokBuka, setDokBuka] = useState(false)

  /** Antrean setelah filter + pencarian; terbaru = urutan asli data. */
  const antrean = useMemo(() => {
    const kunci = cari.trim().toLowerCase()
    const hasil = data.filter(
      (m) =>
        (filter === 'semua' || m.masukHariIni) &&
        (kunci === '' || `${m.nama} ${m.venue} ${m.lokasi}`.toLowerCase().includes(kunci)),
    )
    return urutTerbaru ? hasil : [...hasil].reverse()
  }, [data, cari, filter, urutTerbaru])

  /** Mitra yang sedang dibuka di panel detail. */
  const terpilih = data.find((m) => m.id === pilihId) ?? antrean[0] ?? null

  const ringkas = useMemo(
    () => ({
      menunggu: data.length,
      prioritas: data.filter((m) => m.masukHariIni).length,
    }),
    [data],
  )

  /** Pindahkan pilihan ke antrean berikutnya setelah sebuah keputusan. */
  const pindahSeleksi = (dihapusId: string) => {
    const sisa = antrean.filter((m) => m.id !== dihapusId)
    setPilihId(sisa[0]?.id ?? '')
  }

  /** Setujui penyedia → etalase aktif, tugas keluar antrean. */
  const setujui = () => {
    const m = terpilih
    if (!m || proses) return
    setProses('setuju')
    window.setTimeout(() => {
      setData((d) => d.filter((x) => x.id !== m.id))
      setHasil({
        nada: 'sukses',
        teks: `Akun mitra disetujui — etalase ${m.venue} aktif dan tayang di katalog. Notifikasi aktivasi dikirim ke ${m.email}.`,
      })
      setProses(null)
      pindahSeleksi(m.id)
    }, 750)
  }

  const toggleAlasan = (i: number) =>
    setAlasanDipilih((dipilih) =>
      dipilih.includes(i) ? dipilih.filter((x) => x !== i) : [...dipilih, i],
    )

  const bukaTolak = () => {
    setAlasanDipilih([])
    setCatatan('')
    setGalat('')
    setTolakBuka(true)
  }

  /** Konfirmasi penolakan — wajib pilih alasan standar atau tulis catatan. */
  const konfirmasiTolak = () => {
    const m = terpilih
    if (!m || proses) return
    if (alasanDipilih.length === 0 && catatan.trim() === '') {
      setGalat('Pilih minimal satu alasan standar atau tulis catatan perbaikan untuk mitra.')
      return
    }
    setGalat('')
    setProses('tolak')
    window.setTimeout(() => {
      setData((d) => d.filter((x) => x.id !== m.id))
      setHasil({
        nada: 'tolak',
        teks: `Pengajuan ${m.nama} ditolak (${alasanDipilih.length} alasan standar${
          catatan.trim() ? ' + catatan tambahan' : ''
        }). Email koreksi dikirim ke ${m.email}.`,
      })
      setProses(null)
      setTolakBuka(false)
      setAlasanDipilih([])
      setCatatan('')
      pindahSeleksi(m.id)
    }, 800)
  }

  /** Kembalikan seluruh antrean ke kondisi awal (mode demo). */
  const resetDemo = () => {
    setData(VERIFIKASI_AWAL)
    setHasil(null)
    setCari('')
    setFilter('semua')
    setUrutTerbaru(true)
    setPilihId(VERIFIKASI_AWAL[0].id)
  }

  return {
    antrean,
    terpilih,
    ringkas,
    cari,
    setCari,
    filter,
    setFilter,
    urutTerbaru,
    setUrutTerbaru,
    proses,
    hasil,
    setHasil,
    setujui,
    tolakBuka,
    bukaTolak,
    setTolakBuka,
    alasanDipilih,
    toggleAlasan,
    alasanOpsi: ALASAN_PENOLAKAN,
    catatan,
    setCatatan,
    galat,
    konfirmasiTolak,
    fotoBesar,
    setFotoBesar,
    dokBuka,
    setDokBuka,
    pilih: setPilihId,
    resetDemo,
  }
}

export type VerifikasiPenyedia = ReturnType<typeof useVerifikasiPenyedia>
