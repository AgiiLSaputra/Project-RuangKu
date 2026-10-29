import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  DRAF,
  MAKS_FOTO,
  MAKS_UKURAN_FOTO_MB,
  OPS_FASILITAS,
  TIPE_FOTO_DITERIMA,
  type FasilitasDraft,
  type FotoDraft,
  type PaketDraft,
  type TutupKhusus,
} from '../../../data/tambahRuangan'
import { ApiError } from '../../../lib/api'
import { cariDraf, simpanDrafRuangan, type IsiDraf } from '../../../lib/drafRuangan'
import { buatRuanganServer, unggahFotoRuanganServer } from '../../../services/mitra'

/** Label tombol aksi utama per langkah (desktop & mobile sama). */
export const LABEL_AKSI_LANGKAH = [
  'Lanjut ke Harga & Paket',
  'Lanjut ke Jadwal & Ketentuan',
  'Lanjut ke Pratinjau & Rilis',
  'Terbitkan Ruangan Sekarang',
] as const

const PESAN_TERBIT = 'Selamat! Ruangan Anda berhasil diterbitkan.'

const ukuranMb = (berkas: File) => berkas.size / (1024 * 1024)

/** Cadangan tipe berkas dari ekstensi — sebagian berkas (Drive/WhatsApp) datang tanpa `type`. */
const TIPE_DARI_EKSTENSI: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

const tipeFoto = (berkas: File) =>
  berkas.type || TIPE_DARI_EKSTENSI[berkas.name.split('.').pop()?.toLowerCase() ?? ''] || ''

/**
 * Perkecil foto yang melebihi batas (jepretan HP bisa 6-12 MB) lewat canvas,
 * supaya pengguna tidak perlu menyunting sendiri dulu sebelum mengunggah.
 */
async function kompresFoto(berkas: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(berkas)
    const sisiTerpanjang = Math.max(bitmap.width, bitmap.height)
    const skala = sisiTerpanjang > 1600 ? 1600 / sisiTerpanjang : 1
    const kanvas = document.createElement('canvas')
    kanvas.width = Math.max(1, Math.round(bitmap.width * skala))
    kanvas.height = Math.max(1, Math.round(bitmap.height * skala))
    const ctx = kanvas.getContext('2d')
    if (!ctx) return berkas
    ctx.drawImage(bitmap, 0, 0, kanvas.width, kanvas.height)
    bitmap.close?.()
    const blob = await new Promise<Blob | null>((selesai) => kanvas.toBlob(selesai, 'image/jpeg', 0.85))
    if (!blob) return berkas
    return new File([blob], berkas.name.replace(/\.[^.]+$/, '') + '.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now(),
    })
  } catch {
    return berkas
  }
}

/** Digit WA dari kolom "+62 …" — dipakai verifikasi kontak & cadangan payload `wa`. */
const digitWa = (wa: string) => wa.replace(/\D/g, '')

/** Label isi tiap langkah wizard — tampil di kartu draf (Pengaturan). */
export const LABEL_LANGKAH = [
  'Informasi Ruangan',
  'Harga & Paket',
  'Jadwal & Ketentuan',
  'Pratinjau & Rilis',
] as const

const formatAngka = (teks: string) => {
  const angka = teks.replace(/\D/g, '')
  return angka === '' ? '' : Number(angka).toLocaleString('id-ID')
}

/**
 * Seluruh state + interaksi wizard Tambah Ruangan (4 langkah),
 * dipakai bersama halaman desktop & mobile (mockup PageTambahRuangan[.Mobile].html).
 */
export function useTambahRuangan() {
  const navigate = useNavigate()

  /** Draf lanjutan lewat URL /ruangan-saya/tambah?draf=<id> — kosong kalau tidak ada. */
  const [params] = useSearchParams()
  const drafAwal = useMemo(() => cariDraf(params.get('draf')), [params])

  const [idDraf, setIdDraf] = useState<string | null>(drafAwal?.id ?? null)
  const [langkah, setLangkah] = useState(drafAwal?.langkah ?? 1)
  const [nama, setNama] = useState(drafAwal?.isi.nama ?? '')
  const [kategori, setKategori] = useState(drafAwal?.isi.kategori ?? '')
  const [kota, setKota] = useState(drafAwal?.isi.kota ?? '')
  const [lokasi, setLokasi] = useState(drafAwal?.isi.lokasi ?? '')
  const [provinsi, setProvinsi] = useState(drafAwal?.isi.provinsi ?? '')
  const [linkMaps, setLinkMaps] = useState(drafAwal?.isi.linkMaps ?? '')
  const [kapasitas, setKapasitas] = useState(
    drafAwal ? drafAwal.isi.kapasitas : DRAF.kapasitas ? String(DRAF.kapasitas) : '',
  )
  const [deskripsi, setDeskripsi] = useState(drafAwal?.isi.deskripsi ?? '')
  const [tarif, setTarif] = useState(
    drafAwal ? drafAwal.isi.tarif : DRAF.tarifPerJam ? DRAF.tarifPerJam.toLocaleString('id-ID') : '',
  )
  const [jamBuka, setJamBuka] = useState(drafAwal?.isi.jamBuka ?? DRAF.jamBuka)
  const [jamTutup, setJamTutup] = useState(drafAwal?.isi.jamTutup ?? DRAF.jamTutup)
  const [batasAcara, setBatasAcara] = useState(
    drafAwal ? drafAwal.isi.batasAcara : DRAF.batasAcara ? String(DRAF.batasAcara) : '',
  )
  const [batasAktif, setBatasAktif] = useState(drafAwal?.isi.batasAktif ?? true)
  const [wa, setWa] = useState(drafAwal?.isi.wa ?? DRAF.wa)
  const [foto, setFoto] = useState<FotoDraft[]>(drafAwal?.isi.foto ?? DRAF.foto)
  const [fasilitas, setFasilitas] = useState<FasilitasDraft[]>(drafAwal?.isi.fasilitas ?? DRAF.fasilitas)
  const [opsiFasilitas, setOpsiFasilitas] = useState<FasilitasDraft[]>(drafAwal?.isi.opsiFasilitas ?? OPS_FASILITAS)
  const [tagBaru, setTagBaru] = useState('')
  const [paket, setPaket] = useState<PaketDraft[]>(drafAwal?.isi.paket ?? DRAF.paket)
  const [tutupKhusus, setTutupKhusus] = useState<TutupKhusus[]>(drafAwal?.isi.tutupKhusus ?? DRAF.tutupKhusus)

  const [pesan, setPesan] = useState<string | null>(null)
  /** Alasan berkas foto ditolak — ditampilkan menetap di bawah kolom foto (bukan toast 3 detik). */
  const [galatFoto, setGalatFoto] = useState<string[]>([])
  const [menerbitkan, setMenerbitkan] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const tampilkanPesan = useCallback((teks: string) => {
    setPesan(teks)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setPesan(null), 3000)
  }, [])

  const tarifAngka = useMemo(() => Number(tarif.replace(/\D/g, '')) || 0, [tarif])
  const kapasitasAngka = useMemo(() => Number(kapasitas.replace(/\D/g, '')) || 0, [kapasitas])
  const batasAcaraAngka = useMemo(() => Number(batasAcara.replace(/\D/g, '')) || 0, [batasAcara])

  /**
   * Status kelengkapan tiap langkah wizard — dipakai stepper (centang vs silang)
   * dan untuk memblokir lanjut sebelum langkah terisi penuh.
   */
  const langkahTerisi = useMemo(
    () => [
      foto.length > 0 &&
        nama.trim() !== '' &&
        kategori.trim() !== '' &&
        kota.trim() !== '' &&
        lokasi.trim() !== '' &&
        provinsi.trim() !== '' &&
        kapasitasAngka > 0 &&
        deskripsi.trim() !== '' &&
        fasilitas.length > 0,
      tarifAngka > 0,
      jamBuka.trim() !== '' && jamTutup.trim() !== '' && batasAcaraAngka > 0 && wa.trim() !== '',
      foto.length > 0 &&
        nama.trim() !== '' &&
        kategori.trim() !== '' &&
        kota.trim() !== '' &&
        lokasi.trim() !== '' &&
        provinsi.trim() !== '' &&
        kapasitasAngka > 0 &&
        deskripsi.trim() !== '' &&
        fasilitas.length > 0 &&
        tarifAngka > 0 &&
        jamBuka.trim() !== '' &&
        jamTutup.trim() !== '' &&
        batasAcaraAngka > 0 &&
        wa.trim() !== '',
    ],
    [
      foto.length,
      nama,
      kategori,
      kota,
      lokasi,
      provinsi,
      kapasitasAngka,
      deskripsi,
      fasilitas.length,
      tarifAngka,
      jamBuka,
      jamTutup,
      batasAcaraAngka,
      wa,
    ],
  )

  const keLangkah = useCallback(
    (n: number) => {
      const target = Math.min(4, Math.max(1, n))
      if (target > langkah) {
        const belumTerisi = Array.from(
          { length: target - langkah },
          (_, i) => langkah + i,
        ).find((nomor) => !langkahTerisi[nomor - 1])
        if (belumTerisi) {
          tampilkanPesan(`Lengkapi langkah ${belumTerisi} terlebih dahulu.`)
          return
        }
      }
      setLangkah(target)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [langkah, langkahTerisi, tampilkanPesan],
  )

  /**
   * Simpan isi form sebagai draf di Pengaturan (maksimal 3).
   * Kalau sedang membuka draf lama, draf itu yang diperbarui — tidak memakai slot baru.
   */
  const simpanDraf = useCallback(() => {
    const isi: IsiDraf = {
      nama,
      kategori,
      kota,
      lokasi,
      provinsi,
      linkMaps,
      kapasitas,
      deskripsi,
      tarif,
      jamBuka,
      jamTutup,
      batasAcara,
      wa,
      batasAktif,
      /** File tak bisa di-serialize ke localStorage — hanya foto server yang ikut draf. */
      foto: foto.filter((ft) => !ft.berkas),
      fasilitas,
      opsiFasilitas,
      paket,
      tutupKhusus,
    }
    const hasil = simpanDrafRuangan({
      id: idDraf ?? undefined,
      nama: nama.trim() || 'Draf Tanpa Nama',
      langkah,
      isi,
    })
    if (hasil.ok && !idDraf) setIdDraf(hasil.id)
    tampilkanPesan(hasil.pesan)
  }, [
    idDraf,
    langkah,
    nama,
    kategori,
    kota,
    lokasi,
    provinsi,
    linkMaps,
    kapasitas,
    deskripsi,
    tarif,
    jamBuka,
    jamTutup,
    batasAcara,
    wa,
    batasAktif,
    foto,
    fasilitas,
    opsiFasilitas,
    paket,
    tutupKhusus,
    tampilkanPesan,
  ])

  /**
   * Terbitkan ruangan: kirim isian asli pengguna ke server (`POST /api/mitra/ruangan`),
   * lalu unggah foto pilihan pengguna (`POST /api/mitra/ruangan/:id/foto`, multipart).
   * Kategori & paket bawaan ditambahkan server hanya bila form tidak menyediakannya.
   */
  const terbitkan = useCallback(async () => {
    if (!langkahTerisi[3]) {
      tampilkanPesan('Lengkapi langkah 1-3 terlebih dahulu.')
      return
    }
    setMenerbitkan(true)
    try {
      const ruangan = await buatRuanganServer({
        nama: nama.trim(),
        kategori,
        alamat: lokasi.trim(),
        kota: kota.trim(),
        provinsi,
        kapasitasMin: kapasitasAngka,
        tarifPerJam: tarifAngka,
        jamBuka,
        jamTutup,
        deskripsi: deskripsi.trim() || undefined,
        linkMaps: linkMaps.trim() || undefined,
        wa: digitWa(wa) ? `+62${digitWa(wa)}` : undefined,
        fasilitas: fasilitas.map((fas) => ({ nama: fas.nama, ikon: fas.ikon })),
        // Wizard membolehkan tanpa paket; beri satu paket sewa-jam fleksibel dari tarif dasar.
        paket: paket.length
          ? paket.map((p) => ({
              nama: p.nama,
              durasiJam: p.durasiJam,
              harga: p.harga,
              deskripsi: p.deskripsi.trim() || undefined,
            }))
          : [
              {
                nama: 'Sewa Jam Fleksibel',
                durasiJam: 0,
                harga: tarifAngka,
                deskripsi: 'Sewa per jam mengikuti kebutuhan acara.',
              },
            ],
        tutupKhusus: tutupKhusus.map((t) => ({
          hari: t.hari,
          jam: t.jam,
          alasan: t.alasan.trim() || undefined,
        })),
      })
      const berkasFoto = foto.map((ft) => ft.berkas).filter((b): b is File => Boolean(b))
      try {
        await unggahFotoRuanganServer(ruangan.id, berkasFoto)
      } catch (err) {
        // Jangan diam-diam: ruangan sudah terbit, tapi pengguna berhak tahu fotonya gagal.
        console.error('[tambahRuangan] unggah foto gagal', err)
        tampilkanPesan(
          err instanceof ApiError
            ? `Ruangan terbit, tetapi foto gagal diunggah: ${err.message}`
            : 'Ruangan terbit, tetapi foto gagal diunggah. Coba unggah ulang dari halaman Ruangan Saya.',
        )
        window.setTimeout(() => navigate('/ruangan-saya'), 2500)
        return
      }
      tampilkanPesan(PESAN_TERBIT)
      window.setTimeout(() => navigate('/ruangan-saya'), 1200)
    } catch (err) {
      tampilkanPesan(err instanceof ApiError ? err.message : 'Gagal menerbitkan ruangan. Coba lagi.')
    } finally {
      setMenerbitkan(false)
    }
  }, [
    langkahTerisi,
    tampilkanPesan,
    nama,
    kategori,
    kota,
    lokasi,
    provinsi,
    kapasitasAngka,
    tarifAngka,
    jamBuka,
    jamTutup,
    deskripsi,
    linkMaps,
    wa,
    fasilitas,
    paket,
    tutupKhusus,
    foto,
    navigate,
  ])

  const lanjut = useCallback(() => {
    if (!langkahTerisi[langkah - 1]) {
      tampilkanPesan(`Lengkapi langkah ${langkah} terlebih dahulu.`)
      return
    }
    if (langkah < 4) keLangkah(langkah + 1)
    else void terbitkan()
  }, [langkah, langkahTerisi, keLangkah, terbitkan, tampilkanPesan])

  const kembali = useCallback(() => {
    if (langkah > 1) keLangkah(langkah - 1)
    else navigate('/ruangan-saya')
  }, [langkah, keLangkah, navigate])

  /**
   * Baca berkas pilihan pengguna → pratinjau blob + simpan File untuk diunggah saat terbit.
   * `FileList` di input itu hidup: begitu `input.value = ''` dijalankan halaman, isinya
   * langsung kosong. Karena itu berkas disalin ke array biasa SEBELUM state di-set
   * (React boleh menunda updater state sampai setelah handler selesai).
   */
  const pilihFoto = useCallback(
    async (berkas: FileList | readonly File[] | null) => {
      const pilihan = berkas ? Array.from(berkas) : []
      if (!pilihan.length) return

      const tolak: string[] = []
      const siap: FotoDraft[] = []

      for (const asli of pilihan) {
        if (foto.length + siap.length >= MAKS_FOTO) {
          tolak.push(`Maksimal ${MAKS_FOTO} foto per ruangan — "${asli.name}" tidak ikut.`)
          continue
        }
        if (!TIPE_FOTO_DITERIMA.includes(tipeFoto(asli))) {
          tolak.push(`"${asli.name}" bukan JPG, PNG, atau WebP.`)
          continue
        }
        // Foto besar (jepretan HP) diperkecil otomatis supaya tetap bisa dipakai.
        const berkasSiap = ukuranMb(asli) > MAKS_UKURAN_FOTO_MB ? await kompresFoto(asli) : asli
        if (ukuranMb(berkasSiap) > MAKS_UKURAN_FOTO_MB) {
          tolak.push(
            `"${asli.name}" ${ukuranMb(berkasSiap).toFixed(1)} MB — maksimal ${MAKS_UKURAN_FOTO_MB} MB.`,
          )
          continue
        }
        siap.push({ src: URL.createObjectURL(berkasSiap), nama: berkasSiap.name, berkas: berkasSiap })
      }

      if (siap.length) setFoto((daftar) => [...daftar, ...siap].slice(0, MAKS_FOTO))
      setGalatFoto(tolak)
      if (!siap.length && tolak.length) {
        tampilkanPesan('Foto tidak bisa dipakai — lihat keterangan di bawah kolom foto.')
      }
    },
    [foto.length, tampilkanPesan],
  )

  /** Foto hasil unggahan pengguna (punya berkas) — gambar untuk payload unggah. */
  const hapusFoto = useCallback((indeks: number) => {
    setFoto((daftar) => {
      const lepas = daftar[indeks]
      if (lepas?.berkas) URL.revokeObjectURL(lepas.src)
      return daftar.filter((_, i) => i !== indeks)
    })
  }, [])

  const toggleFasilitas = useCallback((opsi: FasilitasDraft) => {
    setFasilitas((daftar) =>
      daftar.some((f) => f.nama === opsi.nama)
        ? daftar.filter((f) => f.nama !== opsi.nama)
        : [...daftar, opsi],
    )
  }, [])

  /** Tambah tag fasilitas baru ke daftar opsi sekaligus langsung terpilih. */
  const tambahTag = useCallback(() => {
    const teks = tagBaru.trim()
    if (!teks) return
    const tag: FasilitasDraft = { nama: teks, ikon: 'local_offer' }
    setOpsiFasilitas((daftar) =>
      daftar.some((f) => f.nama.toLowerCase() === teks.toLowerCase()) ? daftar : [...daftar, tag],
    )
    setFasilitas((daftar) =>
      daftar.some((f) => f.nama.toLowerCase() === teks.toLowerCase()) ? daftar : [...daftar, tag],
    )
    setTagBaru('')
  }, [tagBaru])

  /** Nama tag buatan pengguna (bukan bawaan) — bisa dihapus permanen. */
  const tagKustom = useMemo(
    () => new Set(opsiFasilitas.filter((o) => !OPS_FASILITAS.some((b) => b.nama === o.nama)).map((o) => o.nama)),
    [opsiFasilitas],
  )

  const hapusTag = useCallback((nama: string) => {
    setOpsiFasilitas((daftar) => daftar.filter((f) => f.nama !== nama))
    setFasilitas((daftar) => daftar.filter((f) => f.nama !== nama))
  }, [])

  const hapusPaket = useCallback((id: string) => {
    setPaket((daftar) => daftar.filter((p) => p.id !== id))
  }, [])

  const [bukaFormPaket, setBukaFormPaket] = useState(false)
  const [namaPaket, setNamaPaket] = useState('')
  const [durasiPaket, setDurasiPaket] = useState('')
  const [hargaPaket, setHargaPaket] = useState('')
  const [deskripsiPaket, setDeskripsiPaket] = useState('')

  const ubahHargaPaket = useCallback((teks: string) => setHargaPaket(formatAngka(teks)), [])

  /** Simpan paket harian baru dari form langkah 2. */
  const simpanPaket = useCallback(() => {
    const nama = namaPaket.trim()
    const durasi = Number(durasiPaket.replace(/\D/g, ''))
    const harga = Number(hargaPaket.replace(/\D/g, ''))
    if (!nama || !durasi || !harga) {
      tampilkanPesan('Lengkapi nama, durasi, dan harga paket.')
      return
    }
    setPaket((daftar) => [...daftar, { id: `paket-${Date.now()}`, nama, durasiJam: durasi, harga, deskripsi: deskripsiPaket.trim() }])
    setNamaPaket('')
    setDurasiPaket('')
    setHargaPaket('')
    setDeskripsiPaket('')
    setBukaFormPaket(false)
    tampilkanPesan('Paket harian berhasil ditambahkan.')
  }, [namaPaket, durasiPaket, hargaPaket, deskripsiPaket, tampilkanPesan])

  const hapusTutupKhusus = useCallback((id: string) => {
    setTutupKhusus((daftar) => daftar.filter((t) => t.id !== id))
  }, [])

  const ubahTarif = useCallback((teks: string) => setTarif(formatAngka(teks)), [])

  const sisaSlotFoto = MAKS_FOTO - foto.length

  /** Ringkasan paket untuk kartu pratinjau — mis. "Half Day & Full Day". */
  const ringkasPaket = useMemo(() => {
    if (paket.length === 0) return 'Belum ada paket harian'
    return paket
      .map((p) => (p.durasiJam <= 4 ? 'Half Day' : p.durasiJam <= 8 ? 'Full Day' : `${p.durasiJam} Jam`))
      .join(' & ')
  }, [paket])

  return {
    langkah,
    langkahTerisi,
    keLangkah,
    lanjut,
    kembali,
    simpanDraf,
    pesan,
    menerbitkan,
    nama,
    setNama,
    kategori,
    setKategori,
    kota,
    setKota,
    lokasi,
    setLokasi,
    provinsi,
    setProvinsi,
    linkMaps,
    setLinkMaps,
    kapasitas,
    setKapasitas,
    kapasitasAngka,
    deskripsi,
    setDeskripsi,
    tarif,
    ubahTarif,
    tarifAngka,
    jamBuka,
    setJamBuka,
    jamTutup,
    setJamTutup,
    batasAcara,
    setBatasAcara,
    batasAcaraAngka,
    batasAktif,
    setBatasAktif,
    wa,
    setWa,
    foto,
    pilihFoto,
    hapusFoto,
    galatFoto,
    sisaSlotFoto,
    terbitkan,
    fasilitas,
    opsiFasilitas,
    tagKustom,
    toggleFasilitas,
    hapusTag,
    tagBaru,
    setTagBaru,
    tambahTag,
    paket,
    hapusPaket,
    bukaFormPaket,
    setBukaFormPaket,
    namaPaket,
    setNamaPaket,
    durasiPaket,
    setDurasiPaket,
    hargaPaket,
    ubahHargaPaket,
    deskripsiPaket,
    setDeskripsiPaket,
    simpanPaket,
    ringkasPaket,
    tutupKhusus,
    hapusTutupKhusus,
  }
}

export type TambahRuanganForm = ReturnType<typeof useTambahRuangan>
