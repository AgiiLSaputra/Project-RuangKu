import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, ApiError } from '../../../lib/api'
import {
  ALASAN_PENOLAKAN,
  type DokumenVerif,
  type MitraVerifikasi,
} from '../../../data/verifikasiPenyedia'

export type FilterVerif = 'semua' | 'prioritas'

const pad2 = (n: number) => String(n).padStart(2, '0')

/** Tanggal berjalan zona WIB dalam format ISO (YYYY-MM-DD). */
function hariWib(d: Date = new Date()): string {
  const wib = new Date(d.getTime() + 7 * 60 * 60 * 1000)
  return wib.toISOString().slice(0, 10)
}

/** Jam & menit WIB "HH:MM" dari timestamp UTC. */
const jamWib = (d: Date) => {
  const wib = new Date(d.getTime() + 7 * 60 * 60 * 1000)
  return `${pad2(wib.getUTCHours())}:${pad2(wib.getUTCMinutes())}`
}

/** "Hari ini, 10:45" / "Kemarin, 16:30" / "21 Okt, 13:48" WIB. */
function labelWaktuPendek(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const jam = jamWib(d)
  const hari = hariWib(d)
  if (hari === hariWib()) return `Hari ini, ${jam}`
  if (hari === hariWib(new Date(Date.now() - 86_400_000))) return `Kemarin, ${jam}`
  return `${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta' })}, ${jam}`
}

/** "24 Oktober 2026, 10:45 WIB" — waktu eksekusi lengkap untuk panel konfirmasi. */
function labelWaktuPenuh(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return `${d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  })}, ${jamWib(d)} WIB`
}

/** Usia relatif dari pengajuan — "13 jam yang lalu" / "3 hari yang lalu". */
function usiaRelatif(iso: string): string {
  const umurJam = (Date.now() - Date.parse(iso)) / 3_600_000
  if (umurJam < 1) return `${Math.max(1, Math.round(umurJam * 60))} menit yang lalu`
  if (umurJam < 24) return `${Math.round(umurJam)} jam yang lalu`
  return `${Math.round(umurJam / 24)} hari yang lalu`
}

/** SLA verifikasi FR-G1: target 24 jam sejak pengajuan. */
function hitungSla(diajukanPada: string): { sla: string; slaNada: MitraVerifikasi['slaNada'] } {
  const sisa = 24 - (Date.now() - Date.parse(diajukanPada)) / 3_600_000
  if (sisa <= 0) return { sla: 'Lewat SLA (24 Jam)', slaNada: 'kritis' }
  if (sisa <= 3) return { sla: `Sisa ${Math.max(1, Math.round(sisa))} Jam (Kritis)`, slaNada: 'kritis' }
  if (sisa <= 24)
    return { sla: `Sisa ${Math.max(1, Math.round(sisa))} Jam (Prioritas)`, slaNada: 'prioritas' }
  return { sla: `Sisa ${Math.round(sisa / 24)} Hari (Aman)`, slaNada: 'aman' }
}

/** Baris ringkas `GET /api/admin/verifikasi`. */
interface BarisVerifikasiApi {
  id: string
  ref: string
  venue: string
  lokasi: string
  diajukanPada: string
  status: string
  pemohon: { id: string; ref: string; nama: string; email: string; status: string }
}

/** Detail lengkap `GET /api/admin/verifikasi/:id`. */
interface DetailVerifikasiApi {
  id: string
  ref: string
  venue: string
  lokasi: string
  alamat: string
  koordinat: string
  placeId: string
  tempat: string
  picNama: string
  picJabatan: string
  email: string
  waTampil: string
  waNomor: string
  tipeUsaha: string
  kapasitas: string
  jamOperasional: string
  jedaSteril: string
  diajukanPada: string
  status: string
  pemohon: { id: string; ref: string; nama: string; email: string }
  mitra: { ref: string; properti: string } | null
  dokumen: Array<{
    jenis: string
    nama: string
    nomor: string
    terbit: string
    berlaku: string
    pejabat: string
    fileUrl: string
    ukuran: string | number
    meta: string | null
  }>
  foto: Array<{ url: string; label: string; judul: string | null; meta: string | null }>
}

/** Label panjang jenis dokumen untuk pratinjau. */
const LABEL_DOKUMEN: Record<string, string> = {
  NIB: 'Nomor Induk Berusaha (NIB)',
  SKDU: 'Surat Keterangan Domisili Usaha (SKDU)',
}

/** Baris ringkas → objek dasar MitraVerifikasi (tanpa detail berkas). */
function dariBarisApi(b: BarisVerifikasiApi): MitraVerifikasi {
  const { sla, slaNada } = hitungSla(b.diajukanPada)
  return {
    id: b.id,
    nama: b.pemohon.nama,
    venue: b.venue,
    ikonVenue: 'domain',
    lokasi: b.lokasi,
    sla,
    slaNada,
    waktu: labelWaktuPendek(b.diajukanPada),
    masukHariIni: hariWib(new Date(b.diajukanPada)) === hariWib(),
    berkasRingkas: 'Foto + Dokumen Verifikasi',
    ikonBerkas: 'attach_file',
    idMitra: b.pemohon.ref,
    diajukan: labelWaktuPenuh(b.diajukanPada),
    usia: usiaRelatif(b.diajukanPada),
    pic: { nama: '—', jabatan: '—' },
    email: b.pemohon.email,
    wa: { tampil: '—', nomor: '—' },
    foto: [],
    maps: { alamat: '—', koordinat: '—', placeId: '—', tempat: b.venue },
    dokumen: {
      nama: '—',
      ukuran: '—',
      meta: 'Menunggu detail…',
      jenis: 'Dokumen Usaha',
      nomor: '—',
      terbit: '—',
      berlaku: '—',
      pejabat: '—',
    },
    rangkuman: {
      tipe: '—',
      tipeSub: '',
      kapasitas: '—',
      kapasitasSub: '',
      jam: '—',
      jamSub: '',
      jeda: '—',
    },
    detailSiap: false,
  }
}

/** Detail server → isi lengkap berkas pada objek verifikasi. */
function gabungDetail(before: MitraVerifikasi, d: DetailVerifikasiApi): MitraVerifikasi {
  const dok: DokumenVerif =
    d.dokumen.length > 0
      ? {
          nama: d.dokumen[0].nama,
          ukuran: String(d.dokumen[0].ukuran),
          meta: d.dokumen[0].meta ?? 'Dokumen terlampir pada pengajuan',
          jenis: LABEL_DOKUMEN[d.dokumen[0].jenis] ?? d.dokumen[0].jenis,
          nomor: d.dokumen[0].nomor,
          terbit: d.dokumen[0].terbit,
          berlaku: d.dokumen[0].berlaku,
          pejabat: d.dokumen[0].pejabat,
        }
      : {
          ...before.dokumen,
          meta: 'Tidak ada dokumen terlampir pada pengajuan ini',
        }
  return {
    ...before,
    idMitra: d.mitra?.ref ?? before.idMitra,
    pic: { nama: d.picNama || '—', jabatan: d.picJabatan || '—' },
    email: d.email || before.email,
    wa: { tampil: d.waTampil || '—', nomor: d.waNomor || '—' },
    foto: d.foto.map((f) => ({
      src: f.url,
      label: f.label,
      judul: f.judul ?? undefined,
      meta: f.meta ?? undefined,
    })),
    maps: {
      alamat: d.alamat || '—',
      koordinat: d.koordinat || '—',
      placeId: d.placeId || '—',
      tempat: d.tempat || d.venue,
    },
    dokumen: dok,
    rangkuman: {
      tipe: d.tipeUsaha || '—',
      tipeSub: 'Sesuai pengajuan verifikasi',
      kapasitas: d.kapasitas ? `${d.kapasitas} Pax` : '—',
      kapasitasSub: 'Kapasitas tercatat pengajuan',
      jam: d.jamOperasional || '—',
      jamSub: 'Jam operasional pengajuan',
      jeda: d.jedaSteril || '—',
    },
    detailSiap: true,
  }
}

/**
 * State halaman verifikasi mitra (FR-G1) — data nyata dari server:
 * antrean dari `GET /api/admin/verifikasi?status=menunggu`, berkas lengkap
 * dari `GET /api/admin/verifikasi/:id` (diambil saat pertama kali dipilih),
 * dan keputusan via `PATCH /api/admin/verifikasi/:id`.
 * Dipakai bersama oleh varian desktop & mobile.
 */
export function useVerifikasiPenyedia() {
  const [params] = useSearchParams()
  const [data, setData] = useState<MitraVerifikasi[]>([])
  const [memuat, setMemuat] = useState(true)
  const [galatMuat, setGalatMuat] = useState('')
  const [percobaan, setPercobaan] = useState(0)
  const [pilihId, setPilihId] = useState('')
  const [memuatDetail, setMemuatDetail] = useState(false)
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

  /** Ambil seluruh halaman antrean verifikasi dari server. */
  const muat = useCallback(async () => {
    setMemuat(true)
    setGalatMuat('')
    try {
      const kolam: BarisVerifikasiApi[] = []
      let halaman = 1
      for (;;) {
        const isi = await api<{
          daftar: BarisVerifikasiApi[]
          total: number
          halaman: number
          perHalaman: number
        }>(`/admin/verifikasi?status=menunggu&halaman=${halaman}`)
        kolam.push(...isi.daftar)
        if (isi.daftar.length < isi.perHalaman || kolam.length >= isi.total || halaman >= 20) break
        halaman += 1
      }
      setData(kolam.map(dariBarisApi))
      // Preset `?mitra=<id>` dari dashboard admin, atau otomatis pengajuan pertama.
      const preset = params.get('mitra')
      setPilihId((lama) => (lama !== '' ? lama : preset ?? kolam[0]?.id ?? ''))
    } catch (err) {
      setGalatMuat(err instanceof ApiError ? err.message : 'Terjadi kesalahan. Coba lagi.')
    } finally {
      setMemuat(false)
    }
  }, [params])

  useEffect(() => {
    void muat()
  }, [muat, percobaan])

  /** Ambil berkas lengkap saat sebuah pengajuan dipilih (lazy, sekali). */
  useEffect(() => {
    if (pilihId === '') return
    const sasaran = data.find((m) => m.id === pilihId)
    if (!sasaran || sasaran.detailSiap) return
    let batal = false
    setMemuatDetail(true)
    api<{ pengajuan: DetailVerifikasiApi }>(`/admin/verifikasi/${pilihId}`)
      .then(({ pengajuan: d }) => {
        if (!batal) setData((lama) => lama.map((m) => (m.id === pilihId ? gabungDetail(m, d) : m)))
      })
      .catch(() => {
        /* detail gagal — tandai siap dengan placeholder agar panel tetap tampil, bukan kartu "selesai" */
        if (!batal)
          setData((lama) =>
            lama.map((m) => (m.id === pilihId && !m.detailSiap ? { ...m, detailSiap: true } : m)),
          )
      })
      .finally(() => {
        if (!batal) setMemuatDetail(false)
      })
    return () => {
      batal = true
    }
  }, [pilihId, data])

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

  /** Mitra yang sedang dibuka di panel detail (null selama detail dimuat). */
  const terpilih = useMemo(() => {
    const kandidat = data.find((m) => m.id === pilihId) ?? antrean[0] ?? null
    if (!kandidat || !kandidat.detailSiap) return null
    return kandidat
  }, [data, pilihId, antrean])

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

  /** Setujui penyedia → PATCH server, tugas keluar antrean. */
  const setujui = async () => {
    const m = terpilih
    if (!m || proses) return
    setProses('setuju')
    setGalat('')
    try {
      await api(`/admin/verifikasi/${m.id}`, {
        method: 'PATCH',
        body: { keputusan: 'setujui' },
      })
      setData((d) => d.filter((x) => x.id !== m.id))
      setHasil({
        nada: 'sukses',
        teks: `Akun mitra disetujui — etalase ${m.venue} aktif dan tayang di katalog. Notifikasi aktivasi dikirim ke ${m.email}.`,
      })
      pindahSeleksi(m.id)
      void muat()
    } catch (err) {
      setGalat(err instanceof ApiError ? err.message : 'Terjadi kesalahan. Coba lagi.')
    } finally {
      setProses(null)
    }
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
  const konfirmasiTolak = async () => {
    const m = terpilih
    if (!m || proses) return
    if (alasanDipilih.length === 0 && catatan.trim() === '') {
      setGalat('Pilih minimal satu alasan standar atau tulis catatan perbaikan untuk mitra.')
      return
    }
    setGalat('')
    setProses('tolak')
    const bagian = [
      ...alasanDipilih.map((i) => `• ${ALASAN_PENOLAKAN[i]}`),
      ...(catatan.trim() ? [catatan.trim()] : []),
    ]
    try {
      await api(`/admin/verifikasi/${m.id}`, {
        method: 'PATCH',
        body: {
          keputusan: 'tolak',
          catatan: `Alasan penolakan:\n${bagian.join('\n')}`,
        },
      })
      setData((d) => d.filter((x) => x.id !== m.id))
      setHasil({
        nada: 'tolak',
        teks: `Pengajuan ${m.nama} ditolak (${alasanDipilih.length} alasan standar${
          catatan.trim() ? ' + catatan tambahan' : ''
        }). Email koreksi dikirim ke ${m.email}.`,
      })
      setTolakBuka(false)
      setAlasanDipilih([])
      setCatatan('')
      pindahSeleksi(m.id)
      void muat()
    } catch (err) {
      setGalat(err instanceof ApiError ? err.message : 'Terjadi kesalahan. Coba lagi.')
    } finally {
      setProses(null)
    }
  }

  /** Muat ulang antrean dari server (pengganti "kembalikan data demo"). */
  const resetDemo = () => {
    setHasil(null)
    setCari('')
    setFilter('semua')
    setUrutTerbaru(true)
    setPercobaan((n) => n + 1)
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
    memuat,
    galatMuat,
    memuatDetail,
    muat: resetDemo,
  }
}

export type VerifikasiPenyedia = ReturnType<typeof useVerifikasiPenyedia>
