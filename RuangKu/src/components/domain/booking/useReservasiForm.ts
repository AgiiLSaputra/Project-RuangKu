import { useCallback, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useBookings } from '../../../context/BookingContext'
import type { Ruangan } from '../../../data/seed'
import { ApiError } from '../../../lib/api'
import { validasiPromoServer, type HasilPromo } from '../../../services/reservasi'
import { useDetailRuangan } from '../room/useRuangan'
import { dariMenit, hariIniWib, keMenit, opsiJamMulai, tambahHari } from './jadwalUtil'
import { RUANGAN_DEFAULT } from './konstanta'
import { ruanganMinimal } from './mapperReservasi'
import { useSlotHold } from './useSlotHold'
import { jamBerikutnya, labelTanggal } from './utilStruk'

export type TipePenyewa = 'perorangan' | 'perusahaan'
export type StatusPromo = 'idle' | 'sukses' | 'galat'

const CATATAN_DEFAULT =
  'Mohon dipersiapkan 4 wireless mic, konektor HDMI & Type-C untuk proyektor panggung utama, serta ruang transit VIP.'

/** Jam fleksibel minimal 2 jam (sama dengan aturan di server). */
const MIN_JAM_FLEKSIBEL = 2
const BATAS_HARI_KE_DEPAN = 365

interface OpsiForm {
  /** Teks awal textarea catatan (mockup desktop & mobile sedikit berbeda). */
  catatanAwal?: string
}

/** Data yang bisa dibawa dari halaman detail ruangan lewat `navigate(..., { state })`. */
interface StateAwal {
  tanggal?: string
  paketId?: string
}

/** Pesan galat dari server yang ramah dibaca (untuk validasi, ambil pesan pertama). */
function pesanDariServer(err: ApiError): string {
  if (err.kode === 'VALIDASI_GAGAL' && Array.isArray(err.detail)) {
    const pertama = err.detail[0] as { pesan?: string } | undefined
    if (pertama?.pesan) return pertama.pesan
  }
  return err.message
}

/**
 * Seluruh state + interaksi FormulirReservasi (desktop & mobile).
 * Ruangan, harga, bentrok jadwal, promo, dan kode reservasi ditentukan server;
 * hitungan di layar ini hanya pratinjau.
 */
export function useReservasiForm(options: OpsiForm = {}) {
  const params = useParams()
  const navigate = useNavigate()
  const lokasi = useLocation()
  const { user } = useAuth()
  const { buat } = useBookings()
  const hold = useSlotHold()

  const awal = (lokasi.state ?? null) as StateAwal | null
  const roomId = params.roomId ?? RUANGAN_DEFAULT

  const detail = useDetailRuangan(roomId)
  /** `false` selama ruangan belum dimuat dari server (halaman menampilkan layar menunggu). */
  const siap = detail.ruangan !== null
  // Cadangan hanya agar tipe tidak null; tidak pernah tampil karena halaman berhenti di layar menunggu.
  const ruangan: Ruangan = detail.ruangan ?? ruanganMinimal(roomId)

  // ---- Jadwal & paket ----
  const hariIni = hariIniWib()
  const hariMaks = tambahHari(hariIni, BATAS_HARI_KE_DEPAN)
  const [tanggal, setTanggal] = useState(
    awal?.tanggal && awal.tanggal >= hariIni ? awal.tanggal : tambahHari(hariIni, 7),
  )
  const [jamMulai, setJamMulai] = useState('09:00')
  const [paketPilihan, setPaketPilihan] = useState<string | null>(awal?.paketId ?? null)
  const [durasiFleksibel, setDurasiFleksibel] = useState(MIN_JAM_FLEKSIBEL)

  const paketTerpilih =
    ruangan.paket.find((p) => p.id === paketPilihan) ?? ruangan.paket.find((p) => p.id === 'fullday') ?? ruangan.paket[0]
  const fleksibel = paketTerpilih?.jam === 0
  const durasi = !paketTerpilih ? 0 : fleksibel ? durasiFleksibel : paketTerpilih.jam
  const mulaiMenit = keMenit(jamMulai)
  const selesaiMenit = mulaiMenit + durasi * 60
  const selesaiValid = selesaiMenit <= 24 * 60
  const jamSelesai = selesaiValid ? dariMenit(selesaiMenit) : '--:--'
  const subtotal = !paketTerpilih ? 0 : fleksibel ? ruangan.tarifPerJam * durasi : paketTerpilih.harga

  const opsiJam = useMemo(() => opsiJamMulai(ruangan.jamBuka, ruangan.jamTutup), [ruangan.jamBuka, ruangan.jamTutup])
  const opsiDurasi = useMemo(() => {
    const maks = Math.floor((keMenit(ruangan.jamTutup) - mulaiMenit) / 60)
    const batas = Math.min(Math.max(maks, MIN_JAM_FLEKSIBEL), 12)
    return Array.from({ length: batas - MIN_JAM_FLEKSIBEL + 1 }, (_, i) => MIN_JAM_FLEKSIBEL + i)
  }, [ruangan.jamTutup, mulaiMenit])

  const galatJadwal = useMemo(() => {
    if (!paketTerpilih) return 'Ruangan ini belum memiliki paket sewa.'
    if (!tanggal) return 'Pilih tanggal acara.'
    if (tanggal < hariIni) return 'Tanggal acara sudah lewat.'
    if (tanggal > hariMaks) return 'Reservasi hanya bisa dibuat maksimal 1 tahun ke depan.'
    if (mulaiMenit < keMenit(ruangan.jamBuka)) return `Jam mulai sebelum jam buka gedung (${ruangan.jamBuka} WIB).`
    if (!selesaiValid || selesaiMenit > keMenit(ruangan.jamTutup)) {
      return `Jadwal melewati jam tutup gedung (${ruangan.jamTutup} WIB). Pilih jam mulai lebih awal atau paket yang lebih singkat.`
    }
    return null
  }, [paketTerpilih, tanggal, hariIni, hariMaks, mulaiMenit, selesaiMenit, selesaiValid, ruangan.jamBuka, ruangan.jamTutup])

  const skemaLabel = paketTerpilih ? `${paketTerpilih.nama} (${durasi} Jam)` : '-'
  const rentangJam = selesaiValid ? `${jamMulai} – ${jamSelesai} WIB` : '-'
  const jedaSampai = selesaiValid ? jamBerikutnya(jamSelesai, 2) : '-'

  // ---- Data pemesan & acara ----
  const [tipe, setTipe] = useState<TipePenyewa>('perusahaan')
  const [nama, setNama] = useState(user?.nama ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [wa, setWa] = useState((user?.wa ?? '').replace(/^\s*(\+?62|0)/, '').trim())
  const [perusahaan, setPerusahaan] = useState('PT Innovasia Digital Nusantara')
  const [namaAcara, setNamaAcara] = useState('Nusantara Tech Leaders Summit 2026: AI Transformation')
  const [jenisAcara, setJenisAcara] = useState('Seminar / Konferensi')
  const [jumlahTamu, setJumlahTamu] = useState('280')
  const [tataLetak, setTataLetak] = useState('theater')
  const [catatan, setCatatan] = useState(options.catatanAwal ?? CATATAN_DEFAULT)

  // ---- Promo ----
  const [kodePromo, setKodePromoState] = useState('')
  const [promoAktif, setPromoAktif] = useState<HasilPromo | null>(null)
  const [promo, setPromo] = useState<{ status: StatusPromo; pesan: string }>({ status: 'idle', pesan: '' })

  /** Mengubah teks kode membatalkan promo yang sudah diterapkan: harus klik Terapkan lagi. */
  const setKodePromo = (v: string) => {
    setKodePromoState(v)
    setPromoAktif(null)
    setPromo({ status: 'idle', pesan: '' })
  }

  // Pratinjau diskon dengan rumus yang sama dengan server; angka akhir tetap dihitung server.
  const diskon = useMemo(() => {
    if (!promoAktif) return 0
    return promoAktif.jenis === 'persen'
      ? Math.round((subtotal * promoAktif.nilai) / 100)
      : Math.min(promoAktif.nilai, subtotal)
  }, [promoAktif, subtotal])

  const [setuju, setSetuju] = useState(true)
  const [galat, setGalat] = useState<string | null>(null)
  const [mengirim, setMengirim] = useState(false)

  const totalTamu = Number(jumlahTamu) || 0

  const galatTamu = useMemo(() => {
    if (jumlahTamu.trim() === '') return 'Jumlah tamu wajib diisi.'
    if (totalTamu > ruangan.kapasitasMax)
      return `Jumlah tamu melebihi batas aman kuota (Maks. ${ruangan.kapasitasMax} orang sesuai izin gedung)`
    if (totalTamu < ruangan.kapasitasMin)
      return `Jumlah tamu kurang dari kapasitas minimum ruangan (Min. ${ruangan.kapasitasMin} orang)`
    return null
  }, [jumlahTamu, totalTamu, ruangan.kapasitasMax, ruangan.kapasitasMin])

  const total = subtotal - diskon

  const keRuangan = useCallback(() => navigate(`/ruangan/${roomId}`), [navigate, roomId])

  const terapkanPromo = async () => {
    const kode = kodePromo.trim().toUpperCase()
    if (!kode) {
      setPromoAktif(null)
      setPromo({ status: 'galat', pesan: 'Masukkan kode promo terlebih dahulu.' })
      return
    }
    try {
      const hasil = await validasiPromoServer(kode, subtotal)
      setPromoAktif(hasil)
      setPromo({
        status: 'sukses',
        pesan:
          hasil.jenis === 'persen'
            ? `Kode ${hasil.kode} diterapkan — diskon ${hasil.nilai}%.`
            : `Kode ${hasil.kode} diterapkan — potongan Rp ${hasil.nilai.toLocaleString('id-ID')}.`,
      })
    } catch (err) {
      setPromoAktif(null)
      setPromo({
        status: 'galat',
        pesan: err instanceof ApiError ? err.message : 'Tidak dapat memeriksa kode promo. Coba lagi.',
      })
    }
  }

  const konfirmasi = async () => {
    if (mengirim) return
    if (!setuju) {
      setGalat('Anda harus menyetujui Syarat & Ketentuan Reservasi sebelum konfirmasi.')
      return
    }
    if (galatJadwal) {
      setGalat(galatJadwal)
      return
    }
    if (galatTamu) {
      setGalat(galatTamu)
      return
    }
    if (!nama.trim() || !email.trim() || !wa.trim() || !namaAcara.trim()) {
      setGalat('Lengkapi semua kolom bertanda * sebelum konfirmasi reservasi.')
      return
    }
    if (tipe === 'perusahaan' && !perusahaan.trim()) {
      setGalat('Nama Perusahaan / Instansi wajib diisi untuk tipe penyewa ini.')
      return
    }
    if (!paketTerpilih?.idServer) {
      setGalat('Data paket belum siap. Muat ulang halaman ini.')
      return
    }

    setGalat(null)
    setMengirim(true)
    try {
      const baru = await buat({
        ruangan: ruangan.id,
        tanggal,
        jamMulai,
        paketId: paketTerpilih.idServer,
        durasiJam: fleksibel ? durasiFleksibel : undefined,
        jumlahPeserta: totalTamu,
        acara: namaAcara.trim(),
        promo: promoAktif?.kode,
        detail: {
          tipe,
          pic: {
            nama: nama.trim(),
            email: email.trim(),
            // Kolom diisi tanpa kode negara (di layar sudah ada awalan +62).
            wa: `+62 ${wa.trim().replace(/^\s*(\+?62|0)/, '').trim()}`,
          },
          perusahaan: tipe === 'perusahaan' ? perusahaan.trim() : undefined,
          jenisAcara,
          tataLetak,
          catatan: catatan.trim() || undefined,
        },
      })
      navigate(`/struk/${baru.kode}`)
    } catch (err) {
      setGalat(err instanceof ApiError ? pesanDariServer(err) : 'Tidak dapat terhubung ke server. Coba lagi.')
    } finally {
      setMengirim(false)
    }
  }

  return {
    roomId,
    ruangan,
    siap,
    memuatRuangan: detail.memuat,
    galatRuangan: detail.galat,
    tidakAdaRuangan: detail.tidakAda,
    muatUlangRuangan: detail.muat,
    hold,
    // jadwal & paket
    tanggal,
    setTanggal,
    hariMin: hariIni,
    hariMaks,
    jamMulai,
    setJamMulai,
    opsiJam,
    paketTerpilih,
    setPaketId: setPaketPilihan,
    fleksibel,
    durasiFleksibel,
    setDurasiFleksibel,
    opsiDurasi,
    jamSelesai,
    jedaSampai,
    galatJadwal,
    labelTanggal: labelTanggal(tanggal),
    rentangJam,
    skemaLabel,
    subtotal,
    // pemesan & acara
    tipe,
    setTipe,
    nama,
    setNama,
    email,
    setEmail,
    wa,
    setWa,
    perusahaan,
    setPerusahaan,
    namaAcara,
    setNamaAcara,
    jenisAcara,
    setJenisAcara,
    jumlahTamu,
    setJumlahTamu,
    tataLetak,
    setTataLetak,
    catatan,
    setCatatan,
    // promo & kirim
    kodePromo,
    setKodePromo,
    promo,
    diskon,
    terapkanPromo,
    setuju,
    setSetuju,
    galat,
    setGalat,
    galatTamu,
    total,
    mengirim,
    keRuangan,
    konfirmasi,
  }
}

export type ReservasiForm = ReturnType<typeof useReservasiForm>
