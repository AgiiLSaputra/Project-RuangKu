import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../../../lib/api'
import {
  ambilRuanganMitra,
  hapusRuanganServer,
  ubahRuanganServer,
  type DetailRuanganMitra,
} from '../../../services/mitra'

/** Isi form Edit Ruangan — angka disimpan sebagai string agar input terkendali. */
export interface FormEditRuangan {
  nama: string
  kategori: string
  gedung: string
  alamat: string
  kota: string
  provinsi: string
  linkMaps: string
  kapasitasMin: string
  kapasitasMax: string
  tarifPerJam: string
  jamBuka: string
  jamTutup: string
  deskripsi: string
}

const FORM_KOSONG: FormEditRuangan = {
  nama: '',
  kategori: 'Meeting Room',
  gedung: '',
  alamat: '',
  kota: '',
  provinsi: '',
  linkMaps: '',
  kapasitasMin: '',
  kapasitasMax: '',
  tarifPerJam: '',
  jamBuka: '08:00',
  jamTutup: '21:00',
  deskripsi: '',
}

const keForm = (r: DetailRuanganMitra): FormEditRuangan => ({
  nama: r.nama,
  kategori: r.kategori,
  gedung: r.gedung ?? '',
  alamat: r.alamat,
  kota: r.kota,
  provinsi: r.provinsi,
  linkMaps: r.linkMaps ?? '',
  kapasitasMin: String(r.kapasitasMin),
  kapasitasMax: String(r.kapasitasMax),
  tarifPerJam: String(r.tarifPerJam),
  jamBuka: r.jamBuka,
  jamTutup: r.jamTutup,
  deskripsi: r.deskripsi,
})

const pesanGalat = (err: unknown) =>
  err instanceof ApiError ? err.message : 'Tidak dapat terhubung ke server. Coba lagi.'

/**
 * State halaman Edit Ruangan: muat detail milik mitra (`GET /api/mitra/ruangan/:id`),
 * simpan perubahan (`PATCH`), ubah status etalase, dan hapus permanen (`DELETE`).
 */
export function useEditRuangan(id: string) {
  const [form, setForm] = useState<FormEditRuangan>(FORM_KOSONG)
  const [status, setStatus] = useState<'aktif' | 'tenggang'>('aktif')
  const [memuat, setMemuat] = useState(true)
  const [galatMuat, setGalatMuat] = useState('')
  const [galat, setGalat] = useState('')
  const [pesan, setPesan] = useState('')
  const [menyimpan, setMenyimpan] = useState(false)
  const [mengubahStatus, setMengubahStatus] = useState(false)
  const [menghapus, setMenghapus] = useState(false)
  const [konfirmasiHapus, setKonfirmasiHapus] = useState(false)
  const [percobaan, setPercobaan] = useState(0)

  useEffect(() => {
    let batal = false
    setMemuat(true)
    setGalatMuat('')
    ambilRuanganMitra(id)
      .then((r) => {
        if (batal) return
        setForm(keForm(r))
        setStatus(r.statusListing)
      })
      .catch((err: unknown) => {
        if (!batal) setGalatMuat(pesanGalat(err))
      })
      .finally(() => {
        if (!batal) setMemuat(false)
      })
    return () => {
      batal = true
    }
  }, [id, percobaan])

  /** Muat ulang detail (tombol "Coba lagi"). */
  const muat = useCallback(() => setPercobaan((n) => n + 1), [])

  const ubah = useCallback(
    (nama: keyof FormEditRuangan, nilai: string) => setForm((f) => ({ ...f, [nama]: nilai })),
    [],
  )

  /** Validasi ringan di klien — server tetap memvalidasi ulang semua field. */
  const validasi = (): string | null => {
    if (form.nama.trim().length < 3) return 'Nama ruangan minimal 3 karakter.'
    if (form.alamat.trim().length < 5) return 'Alamat minimal 5 karakter.'
    if (form.kota.trim().length < 2) return 'Kota wajib diisi.'
    if (form.provinsi.trim().length < 2) return 'Provinsi wajib diisi.'
    const min = Number(form.kapasitasMin)
    const maks = Number(form.kapasitasMax)
    if (!Number.isInteger(min) || min < 1) return 'Kapasitas minimal harus angka bulat ≥ 1.'
    if (!Number.isInteger(maks) || maks < min) return 'Kapasitas maksimal tidak boleh kurang dari minimal.'
    const tarif = Number(form.tarifPerJam)
    if (!Number.isFinite(tarif) || tarif < 0) return 'Tarif per jam tidak valid.'
    if (form.jamTutup <= form.jamBuka) return 'Jam tutup harus setelah jam buka.'
    return null
  }

  /** Simpan perubahan. `true` bila server menerima. */
  const simpan = useCallback(async (): Promise<boolean> => {
    const salah = validasi()
    if (salah) {
      setGalat(salah)
      setPesan('')
      return false
    }
    setMenyimpan(true)
    setGalat('')
    setPesan('')
    try {
      await ubahRuanganServer(id, {
        nama: form.nama.trim(),
        kategori: form.kategori,
        gedung: form.gedung.trim(),
        alamat: form.alamat.trim(),
        kota: form.kota.trim(),
        provinsi: form.provinsi.trim(),
        linkMaps: form.linkMaps.trim(),
        kapasitasMin: Number(form.kapasitasMin),
        kapasitasMax: Number(form.kapasitasMax),
        tarifPerJam: Number(form.tarifPerJam),
        jamBuka: form.jamBuka,
        jamTutup: form.jamTutup,
        deskripsi: form.deskripsi.trim(),
      })
      setPesan('Perubahan ruangan tersimpan.')
      return true
    } catch (err) {
      setGalat(pesanGalat(err))
      return false
    } finally {
      setMenyimpan(false)
    }
  }, [id, form])

  /** Nonaktifkan (hilang dari katalog) atau tampilkan lagi ruangan di etalase. */
  const ubahStatus = useCallback(async () => {
    const baru = status === 'aktif' ? 'tenggang' : 'aktif'
    setMengubahStatus(true)
    setGalat('')
    setPesan('')
    try {
      await ubahRuanganServer(id, { statusListing: baru })
      setStatus(baru)
      setPesan(
        baru === 'aktif'
          ? 'Ruangan ditampilkan lagi di katalog publik.'
          : 'Ruangan dinonaktifkan dan disembunyikan dari katalog publik.',
      )
    } catch (err) {
      setGalat(pesanGalat(err))
    } finally {
      setMengubahStatus(false)
    }
  }, [id, status])

  /** Hapus permanen. `true` bila server menerima (ditolak 409 bila ada reservasi). */
  const hapus = useCallback(async (): Promise<boolean> => {
    setMenghapus(true)
    setGalat('')
    try {
      await hapusRuanganServer(id)
      return true
    } catch (err) {
      setGalat(pesanGalat(err))
      return false
    } finally {
      setMenghapus(false)
    }
  }, [id])

  return {
    form,
    ubah,
    status,
    memuat,
    galatMuat,
    galat,
    pesan,
    menyimpan,
    mengubahStatus,
    menghapus,
    konfirmasiHapus,
    setKonfirmasiHapus,
    muat,
    simpan,
    ubahStatus,
    hapus,
  }
}
