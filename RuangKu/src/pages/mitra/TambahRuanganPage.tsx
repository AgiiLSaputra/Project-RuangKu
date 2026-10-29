import { useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTambahRuangan, LABEL_AKSI_LANGKAH } from '../../components/domain/mitra/useTambahRuangan'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Field, Label, TextArea } from '../../components/ui/Field'
import { Dropdown } from '../../components/ui/Dropdown'
import { Icon } from '../../components/ui/Icon'
import { cn } from '../../lib/cn'
import { rp } from '../../lib/format'
import { OPS_JAM, OPS_KATEGORI, OPS_PROVINSI } from '../../data/tambahRuangan'

const LANGKAH = [
  { label: 'Info Dasar', sub: 'Nama, foto & fasilitas' },
  { label: 'Harga & Paket', sub: 'Tarif per jam & paket' },
  { label: 'Jadwal & Ketentuan', sub: 'Operasional & kontak' },
  { label: 'Pratinjau & Rilis', sub: 'Verifikasi publikasi' },
]

const TAUTAN_KAKI: Array<{ label: string; to: string }> = [
  { label: 'Pusat Bantuan', to: '/pusat-bantuan' },
  { label: 'Panduan Mitra', to: '/cara-kerja' },
  { label: 'Kebijakan Layanan', to: '/kebijakan-privasi' },
]

function KepalaLangkah({ nomor, judul, sub }: { nomor: number; judul: string; sub: string }) {
  return (
    <div className="flex items-center justify-between gap-space-md border-b border-purple-100 px-space-lg py-space-md sm:px-space-xl">
      <div className="flex min-w-0 items-center gap-space-sm">
        <span className="h-9 w-1 shrink-0 rounded-full bg-primary" />
        <div className="min-w-0">
          <h2 className="font-title-md text-title-md text-on-surface">
            {nomor}. {judul}
          </h2>
          <p className="text-body-sm text-slate-500">{sub}</p>
        </div>
      </div>
    </div>
  )
}

function JudulSeksi({ label, aksi }: { label: ReactNode; aksi?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-space-md">
      <h3 className="font-title-md text-title-md text-on-surface">{label}</h3>
      {aksi}
    </div>
  )
}

export function TambahRuanganPage() {
  const [hover, setHover] = useState(false)
  const [tagAktif, setTagAktif] = useState(false)
  const [seretFoto, setSeretFoto] = useState(false)
  const navigate = useNavigate()
  const f = useTambahRuangan()

  /** Input berkas tersembunyi milik halaman — tombol unggah memicunya lewat klikFoto(). */
  const elInputFoto = useRef<HTMLInputElement>(null)
  const klikFoto = () => elInputFoto.current?.click()

  return (
    <div className="relative w-full overflow-hidden bg-purple-50 px-4 pb-12 pt-6 sm:px-6">
      {/* Aksen glow latar */}
      <div className="pointer-events-none absolute -top-16 -right-20 h-96 w-96 rounded-full bg-secondary-container/15 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-space-lg">
        {/* Breadcrumb & judul */}
        <div className="flex flex-col gap-space-md">
          <nav className="flex items-center gap-space-xs font-label-md text-label-md text-slate-500">
            <Link to="/dashboard-penyedia" className="flex items-center gap-1 transition-colors hover:text-primary">
              <Icon name="home" className="text-[16px]" />
              <span>Beranda</span>
            </Link>
            <Icon name="chevron_right" className="text-[14px]" />
            <Link to="/ruangan-saya" className="transition-colors hover:text-primary">
              Ruangan Saya
            </Link>
            <Icon name="chevron_right" className="text-[14px]" />
            <span className="font-semibold text-primary">Tambah Ruangan Baru</span>
          </nav>

          <div className="flex flex-col justify-between gap-space-md sm:flex-row sm:items-center">
            <div className="flex items-center gap-space-md">
              <button
                type="button"
                aria-label="Kembali ke Ruangan Saya"
                onClick={() => navigate('/ruangan-saya')}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface transition-colors hover:border-primary hover:text-primary active:scale-95"
              >
                <Icon name="arrow_back" className="text-[20px]" />
              </button>
              <div>
                <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
                  Tambah Ruangan Baru
                </h1>
                <p className="mt-1 max-w-xl font-body-md text-body-md text-slate-500">
                  Lengkapi 4 langkah berikut untuk menerbitkan ruangan Anda ke etalase publik RuangKu.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="md"
              icon="bookmark_border"
              iconPosition="left"
              onClick={f.simpanDraf}
              className="self-start sm:self-auto"
            >
              Simpan sebagai Draft
            </Button>
          </div>
        </div>

        {/* Stepper 4 langkah */}
        <div className="rounded-2xl bg-surface-container-lowest p-space-md shadow-[0_4px_20px_-2px_rgba(108,92,231,0.06)]">
          <div className="grid grid-cols-1 gap-space-xs sm:grid-cols-2 lg:grid-cols-4">
            {LANGKAH.map((l, i) => {
              const nomor = i + 1
              const selesai = f.langkahTerisi[i]
              const aktif = nomor === f.langkah
              return (
                <button
                  key={l.label}
                  type="button"
                  onClick={() => f.keLangkah(nomor)}
                  className={cn(
                    'flex items-start gap-space-sm rounded-2xl border p-space-sm text-left transition-all',
                    aktif ? 'border-purple-300 bg-purple-50' : 'border-transparent hover:bg-purple-50/60',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-label-md font-bold',
                      selesai
                        ? 'bg-status-available text-white'
                        : aktif
                          ? 'bg-primary text-on-primary'
                          : 'bg-error text-on-error',
                    )}
                  >
                    {selesai ? (
                      <Icon name="check" className="text-[16px]" />
                    ) : aktif ? (
                      nomor
                    ) : (
                      <Icon name="close" className="text-[16px]" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={cn(
                        'block truncate font-title-md text-body-md',
                        aktif
                          ? 'text-primary'
                          : selesai
                            ? 'text-on-surface'
                            : 'font-medium text-error',
                      )}
                    >
                      {l.label}
                    </span>
                    <span className="block truncate text-body-sm text-slate-500">{l.sub}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Panel langkah + aksi */}
        <Card className="overflow-hidden">
          {/* ---------- Langkah 1: Info Dasar ---------- */}
          {f.langkah === 1 && (
            <>
              <KepalaLangkah
                nomor={1}
                judul="Info Dasar"
                sub="Foto utama tampil di pencarian — isi identitas, deskripsi, dan fasilitas ruangan."
              />
              <div className="flex flex-col gap-space-xl px-space-lg py-space-lg sm:px-space-xl">
                {/* Foto */}
                <div className="flex flex-col gap-space-sm">
                  <JudulSeksi
                    label={
                      <>
                        Foto Ruangan <span className="text-status-full">*</span>
                      </>
                    }
                  />
                  {/* Input berkas tersembunyi milik halaman — tombol unggah memicunya lewat klikFoto(). */}
                  <input
                    ref={elInputFoto}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      // Salin daftar berkas dulu — `e.target.files` jadi kosong begitu value di-reset.
                      const pilihan = Array.from(e.target.files ?? [])
                      e.target.value = ''
                      f.pilihFoto(pilihan)
                    }}
                  />
                  <div
                    onDragOver={(e) => {
                      e.preventDefault()
                      setSeretFoto(true)
                    }}
                    onDragLeave={() => setSeretFoto(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setSeretFoto(false)
                      void f.pilihFoto(e.dataTransfer.files)
                    }}
                  >
                    <button
                      type="button"
                      onClick={klikFoto}
                      className={cn(
                        'flex w-full flex-col items-center justify-center gap-space-xs rounded-2xl border-2 border-dashed border-purple-300 bg-purple-50/50 py-space-xl transition-colors hover:border-primary hover:bg-purple-50',
                        seretFoto && 'border-primary bg-purple-100',
                      )}
                    >
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-primary">
                        <Icon name="cloud_upload" className="text-[24px]" />
                      </span>
                      <span className="font-title-md text-body-md text-primary">
                        Tarik &amp; lepas atau klik untuk unggah foto Anda
                      </span>
                      <span className="text-body-sm text-slate-500">
                        JPG/PNG/WebP, maksimal 5 MB per berkas — diunggah saat ruangan diterbitkan
                      </span>
                    </button>
                  </div>

                  {f.galatFoto.length > 0 && (
                    <ul className="flex flex-col gap-1.5 rounded-md bg-red-50 p-3 text-body-sm text-status-full">
                      {f.galatFoto.map((g, i) => (
                        <li key={`${g}-${i}`} className="flex items-start gap-2">
                          <Icon name="error" className="mt-0.5 shrink-0 text-[16px]" />
                          <span>{g}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="grid grid-cols-2 gap-space-sm sm:grid-cols-4">
                    {f.foto.map((foto, i) => (
                      <div
                        key={`${foto.src}-${i}`}
                        className="relative h-32 overflow-hidden rounded-lg border border-purple-100 bg-surface-container"
                      >
                        <img src={foto.src} alt={foto.nama} className="h-full w-full object-cover" />
                        {i === 0 && (
                          <span className="absolute top-2 left-2 rounded-full bg-status-available px-2 py-0.5 font-label-sm text-[11px] font-bold text-white">
                            Utama
                          </span>
                        )}
                        <button
                          type="button"
                          aria-label={`Hapus foto ${foto.nama}`}
                          onClick={() => f.hapusFoto(i)}
                          className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-on-surface/60 text-white transition-colors hover:bg-status-full"
                        >
                          <Icon name="close" className="text-[16px]" />
                        </button>
                        <span className="absolute inset-x-0 bottom-0 truncate bg-on-surface/70 px-2 py-1 text-[11px] text-white">
                          {foto.nama}
                        </span>
                      </div>
                    ))}
                    {f.sisaSlotFoto > 0 && (
                      <button
                        type="button"
                        onClick={klikFoto}
                        className="flex h-32 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-purple-300 bg-purple-50 text-primary transition-colors hover:border-primary"
                      >
                        <Icon name="add_photo_alternate" className="text-[24px]" />
                        <span className="font-label-sm text-label-sm font-semibold">Tambah Foto</span>
                      </button>
                    )}
                    {Array.from({
                      length: Math.max(0, 4 - f.foto.length - (f.sisaSlotFoto > 0 ? 1 : 0)),
                    }).map((_, i) => (
                      <div
                        key={`slot-${i}`}
                        className="flex h-32 items-center justify-center rounded-lg border border-dashed border-outline-variant bg-surface-container"
                      >
                        <span className="font-label-sm text-label-sm text-slate-400">Slot Kosong</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Nama & kapasitas */}
                <div className="flex flex-col gap-space-sm">
                  <JudulSeksi
                    label={
                      <>
                        Identitas Ruangan <span className="text-status-full">*</span>
                      </>
                    }
                  />
                  <div className="grid grid-cols-1 gap-space-md md:grid-cols-3">
                    <Field
                      className="md:col-span-2"
                      label="Nama Ruangan"
                      required
                      value={f.nama}
                      onChange={(e) => f.setNama(e.target.value)}
                      placeholder="mis. Ballroom Lantai 2 / Boardroom Orion"
                    />
                    <Dropdown
                      label="Kategori"
                      required
                      value={f.kategori}
                      onChange={f.setKategori}
                      placeholder="Pilih kategori"
                      ops={OPS_KATEGORI.map((kategori) => ({ nilai: kategori, label: kategori }))}
                    />
                    <Field
                      label="Kota"
                      required
                      value={f.kota}
                      onChange={(e) => f.setKota(e.target.value)}
                      placeholder="mis. Jakarta Selatan"
                    />
                    <Field
                      label="Kapasitas"
                      required
                      inputMode="numeric"
                      value={f.kapasitas}
                      onChange={(e) => f.setKapasitas(e.target.value.replace(/\D/g, ''))}
                      suffix={
                        <span className="rounded-full bg-purple-100 px-2 py-0.5 font-label-sm font-semibold text-primary">
                          Orang
                        </span>
                      }
                    />
                    <Dropdown
                      className="md:col-span-1"
                      label="Provinsi"
                      required
                      value={f.provinsi}
                      onChange={f.setProvinsi}
                      placeholder="Pilih provinsi"
                      ops={OPS_PROVINSI.map((provinsi) => ({ nilai: provinsi, label: provinsi }))}
                    />
                    <Field
                      className="md:col-span-3"
                      label="Alamat Lengkap Ruangan"
                      required
                      value={f.lokasi}
                      onChange={(e) => f.setLokasi(e.target.value)}
                      placeholder="mis. Jl. Jend. Sudirman Kav. 52-53 • Menara Sudirman Lt. 2"
                    />
                    <Field
                      className="md:col-span-3"
                      label="Link Google Maps"
                      hint="Opsional"
                      type="url"
                      value={f.linkMaps}
                      onChange={(e) => f.setLinkMaps(e.target.value)}
                      placeholder="https://maps.app.goo.gl/..."
                    />
                  </div>
                  <p className="text-body-sm text-slate-500">
                    Gunakan nama populer yang sering dicari penyewa — mis. &ldquo;Ballroom Lantai 2&rdquo; atau
                    &ldquo;Boardroom Orion&rdquo;.
                  </p>
                </div>

                {/* Deskripsi */}
                <div className="flex flex-col">
                  <TextArea
                    label="Deskripsi Ruangan"
                    required
                    rows={5}
                    maxLength={1000}
                    value={f.deskripsi}
                    onChange={(e) => f.setDeskripsi(e.target.value)}
                    placeholder="Jelaskan keunggulan ruangan, tata letak, dan jenis acara yang paling cocok..."
                  />
                  <p className="mt-1 text-right text-label-sm text-slate-500">{f.deskripsi.length} / 1000 Karakter</p>
                </div>

                {/* Fasilitas */}
                <div className="flex flex-col gap-space-sm">
                  <JudulSeksi
                    label={
                      <>
                        Fasilitas <span className="text-status-full">*</span>
                      </>
                    }
                  />
                  <div className="flex flex-wrap gap-space-xs">
                    {f.opsiFasilitas.map((opsi) => {
                      const dipilih = f.fasilitas.some((fasilitas) => fasilitas.nama === opsi.nama)
                      const kustom = f.tagKustom.has(opsi.nama)
                      return (
                        <span
                          key={opsi.nama}
                          className={cn(
                            'flex items-center rounded-full border py-1.5 pr-2.5 pl-2.5 font-label-md text-label-md',
                            dipilih
                              ? 'border-primary bg-purple-50 text-primary'
                              : 'border-outline-variant bg-white text-slate-500',
                          )}
                        >
                          <button
                            type="button"
                            aria-pressed={dipilih}
                            onClick={() => f.toggleFasilitas(opsi)}
                            className="flex items-center gap-1.5 transition-colors hover:text-primary"
                          >
                            <Icon name={opsi.ikon} className="text-[16px]" />
                            {opsi.nama}
                            <Icon name={dipilih ? 'check' : 'add'} className="text-[14px]" />
                          </button>
                          {kustom && (
                            <button
                              type="button"
                              aria-label={`Hapus tag ${opsi.nama}`}
                              onClick={() => f.hapusTag(opsi.nama)}
                              className="ml-1 flex h-5 w-5 items-center justify-center rounded-full transition-colors hover:bg-purple-100 hover:text-status-full"
                            >
                              <Icon name="close" className="text-[14px]" />
                            </button>
                          )}
                        </span>
                      )
                    })}
                    {tagAktif ? (
                      <span className="flex items-center gap-1 rounded-full border border-primary bg-purple-50 py-1 pr-1 pl-2.5">
                        <input
                          autoFocus
                          type="text"
                          value={f.tagBaru}
                          onChange={(e) => f.setTagBaru(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              if (f.tagBaru.trim()) {
                                f.tambahTag()
                                setTagAktif(false)
                              }
                            }
                            if (e.key === 'Escape') setTagAktif(false)
                          }}
                          placeholder="Nama tag baru"
                          className="h-7 w-40 bg-transparent font-label-md text-label-md text-on-surface placeholder:text-slate-400 outline-none"
                        />
                        <button
                          type="button"
                          aria-label="Simpan tag"
                          onClick={() => {
                            if (f.tagBaru.trim()) {
                              f.tambahTag()
                              setTagAktif(false)
                            }
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-primary transition-colors hover:bg-purple-100"
                        >
                          <Icon name="check" className="text-[16px]" />
                        </button>
                        <button
                          type="button"
                          aria-label="Batal tambah tag"
                          onClick={() => setTagAktif(false)}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-purple-100"
                        >
                          <Icon name="close" className="text-[16px]" />
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setTagAktif(true)}
                        className="flex items-center gap-1.5 rounded-full border border-dashed border-purple-300 py-1.5 pr-2.5 pl-2.5 font-label-md text-label-md text-primary transition-colors hover:bg-purple-50"
                      >
                        <Icon name="add" className="text-[16px]" />
                        Tambah Tag
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ---------- Langkah 2: Harga & Paket ---------- */}
          {f.langkah === 2 && (
            <>
              <KepalaLangkah
                nomor={2}
                judul="Skema Tarif & Paket Sewa"
                sub="Tetapkan tarif dasar per jam dan paket harian opsional."
              />
              <div className="flex flex-col gap-space-xl px-space-lg py-space-lg sm:px-space-xl">
                {/* Tarif dasar */}
                <div className="grid grid-cols-1 items-center gap-space-md rounded-2xl border border-purple-300/60 bg-purple-50 p-space-lg md:grid-cols-2">
                  <div>
                    <Label required>Tarif Sewa Reguler (Per Jam)</Label>
                    <p className="text-body-sm text-slate-500">
                      Tarif dasar yang tampil di etalase sebelum penyewa memilih paket.
                    </p>
                  </div>
                  <span className="flex items-center overflow-hidden rounded border border-outline-variant bg-white focus-within:border-primary focus-within:shadow-focus">
                    <span className="shrink-0 pl-3.5 font-label-md font-bold text-slate-500">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      aria-label="Tarif sewa per jam"
                      value={f.tarif}
                      onChange={(e) => f.ubahTarif(e.target.value)}
                      className="h-12 w-full min-w-0 px-3 font-label-md text-[18px] font-bold text-on-surface outline-none"
                    />
                    <span className="shrink-0 pr-3.5 font-label-sm whitespace-nowrap text-slate-500">/ Jam</span>
                  </span>
                </div>

                {/* Paket harian */}
                <div className="flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between gap-space-md">
                    <div>
                      <h3 className="font-title-md text-title-md text-on-surface">Paket Harian Hemat (Opsional)</h3>
                      <p className="text-body-sm text-slate-500">Bundling durasi sewa dengan harga lebih hemat.</p>
                    </div>
                    {!f.bukaFormPaket && (
                      <button
                        type="button"
                        onClick={() => f.setBukaFormPaket(true)}
                        className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 font-label-md text-label-md font-semibold text-primary transition-colors hover:bg-purple-100"
                      >
                        <Icon name="add_circle" className="text-[16px]" />
                        Tambah Paket Baru
                      </button>
                    )}
                  </div>

                  {f.bukaFormPaket && (
                    <div className="flex flex-col gap-space-md rounded-lg border border-purple-300/60 bg-purple-50 p-space-md">
                      <h4 className="font-title-md text-body-md text-on-surface">Paket Harian Baru</h4>
                      <div className="grid grid-cols-1 gap-space-md md:grid-cols-3">
                        <Field
                          label="Nama Paket"
                          required
                          value={f.namaPaket}
                          onChange={(e) => f.setNamaPaket(e.target.value)}
                          placeholder="mis. Paket Setengah Hari"
                        />
                        <Field
                          label="Durasi"
                          required
                          inputMode="numeric"
                          value={f.durasiPaket}
                          onChange={(e) => f.setDurasiPaket(e.target.value.replace(/\D/g, ''))}
                          placeholder="4"
                          suffix={<span className="font-label-sm whitespace-nowrap text-slate-500">Jam</span>}
                        />
                        <Field
                          label="Harga Paket"
                          required
                          inputMode="numeric"
                          value={f.hargaPaket}
                          onChange={(e) => f.ubahHargaPaket(e.target.value)}
                          placeholder="4.500.000"
                        />
                      </div>
                      <TextArea
                        label="Deskripsi Paket"
                        rows={2}
                        maxLength={300}
                        value={f.deskripsiPaket}
                        onChange={(e) => f.setDeskripsiPaket(e.target.value)}
                        placeholder="Jelaskan benefit paket, mis. durasi 4 jam sudah termasuk coffee break."
                      />
                      <div className="flex items-center justify-end gap-space-sm">
                        <Button variant="outline" size="md" onClick={() => f.setBukaFormPaket(false)}>
                          Batal
                        </Button>
                        <Button size="md" icon="save" iconPosition="left" onClick={f.simpanPaket}>
                          Simpan Paket
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
                    {f.paket.map((paket) => (
                      <div
                        key={paket.id}
                        className="flex flex-col justify-between gap-space-sm rounded-lg border border-purple-100 bg-white p-space-md transition-all hover:border-purple-300 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-space-sm">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-title-md text-body-md text-on-surface">{paket.nama}</span>
                              {paket.lencana && (
                                <span
                                  className={cn(
                                    'rounded-full px-2 py-0.5 font-label-sm text-[10px] font-bold uppercase',
                                    paket.lencanaCls,
                                  )}
                                >
                                  {paket.lencana}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-body-sm text-slate-500">{paket.deskripsi}</p>
                          </div>
                          <button
                            type="button"
                            aria-label={`Hapus ${paket.nama}`}
                            onClick={() => f.hapusPaket(paket.id)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-status-full-bg hover:text-status-full"
                          >
                            <Icon name="delete" className="text-[18px]" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between border-t border-purple-100 pt-space-xs">
                          <span className="font-label-sm text-label-sm text-slate-500">Harga Paket</span>
                          <span className="font-label-md text-body-md font-bold text-primary">{rp(paket.harga)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {f.paket.length === 0 && (
                    <p className="text-body-sm text-slate-500">
                      Belum ada paket harian — tekan Tambah Paket Baru untuk membuat paket sewa baru.
                    </p>
                  )}
                </div>

                {/* Catatan review */}
                <div className="flex items-start gap-space-sm rounded-2xl border border-status-occupied/30 bg-status-occupied-bg p-space-md text-body-sm text-on-surface">
                  <Icon name="info" className="mt-0.5 shrink-0 text-[18px] text-status-occupied" />
                  <span>
                    Estimasi waktu review: 1x24 jam kerja. Anda dapat mengedit data selama proses review berlangsung.
                  </span>
                </div>
              </div>
            </>
          )}

          {/* ---------- Langkah 3: Jadwal & Ketentuan ---------- */}
          {f.langkah === 3 && (
            <>
              <KepalaLangkah
                nomor={3}
                judul="Jadwal Operasional & Kontak Lapangan"
                sub="Atur jam buka, batas acara harian, dan nomor WhatsApp penanganan."
              />
              <div className="flex flex-col gap-space-xl px-space-lg py-space-lg sm:px-space-xl">
                <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
                  {/* Jam operasional */}
                  <div className="flex flex-col gap-space-sm rounded-lg border border-purple-100 bg-white p-space-md">
                    <div className="flex items-center gap-space-sm">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-primary">
                        <Icon name="schedule" className="text-[18px]" />
                      </span>
                      <h3 className="font-title-md text-title-md text-on-surface">Jam Operasional</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-space-sm">
                      <Dropdown
                        label="Buka Jam"
                        required
                        value={f.jamBuka}
                        onChange={f.setJamBuka}
                        placeholder="Pilih jam"
                        ops={OPS_JAM.map((jam) => ({ nilai: jam, label: `${jam} WIB` }))}
                      />
                      <Dropdown
                        label="Tutup Jam"
                        required
                        value={f.jamTutup}
                        onChange={f.setJamTutup}
                        placeholder="Pilih jam"
                        ops={OPS_JAM.map((jam) => ({ nilai: jam, label: `${jam} WIB` }))}
                      />
                    </div>
                    <p className="text-body-sm text-slate-500">Jam operasional wajib diisi (FR-E4).</p>
                  </div>

                  {/* Batas acara */}
                  <div className="flex flex-col gap-space-sm rounded-lg border border-purple-100 bg-white p-space-md">
                    <div className="flex items-center gap-space-sm">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-primary">
                        <Icon name="event_available" className="text-[18px]" />
                      </span>
                      <h3 className="font-title-md text-title-md text-on-surface">Batas Acara per Hari</h3>
                    </div>
                    <Field
                      label="Batas Acara"
                      required
                      inputMode="numeric"
                      value={f.batasAcara}
                      onChange={(e) => f.setBatasAcara(e.target.value.replace(/\D/g, ''))}
                      suffix={<span className="font-label-sm whitespace-nowrap text-slate-500">Acara / hari</span>}
                    />
                    <p className="text-body-sm text-slate-500">Contoh: Maksimal 2 acara per hari (FR-E5).</p>
                  </div>
                </div>

                {/* Nomor WhatsApp */}
                <div className="flex flex-col items-start justify-between gap-space-md rounded-2xl border border-purple-300/60 bg-purple-50 p-space-lg md:flex-row md:items-center">
                  <div className="flex items-start gap-space-sm">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
                      <Icon name="call" className="text-[20px]" />
                    </span>
                    <div>
                      <h3 className="font-title-md text-title-md text-on-surface">Nomor WhatsApp Reservasi</h3>
                      <p className="mt-0.5 max-w-xl text-body-sm text-slate-500">
                        Dihubungi penyewa saat tiba di lokasi untuk serah terima kunci &amp; komunikasi reservasi —
                        tidak tampil di etalase publik (FR-E7).
                      </p>
                    </div>
                  </div>
                  <span className="flex w-full items-center overflow-hidden rounded-full border border-outline-variant bg-white focus-within:border-primary focus-within:shadow-focus md:w-64">
                    <span className="shrink-0 pl-3.5 font-label-md font-semibold text-primary">+62</span>
                    <input
                      type="tel"
                      aria-label="Nomor WhatsApp petugas lapangan"
                      value={f.wa}
                      onChange={(e) => f.setWa(e.target.value)}
                      className="h-11 w-full min-w-0 px-2 text-body-sm text-on-surface outline-none"
                    />
                  </span>
                </div>
              </div>
            </>
          )}

          {/* ---------- Langkah 4: Pratinjau & Rilis ---------- */}
          {f.langkah === 4 && (
            <>
              <KepalaLangkah
                nomor={4}
                judul="Pratinjau & Rilis"
                sub="Periksa tampilan kartu etalase sebelum menerbitkan ruangan."
              />
              <div className="flex flex-col gap-space-md px-space-lg py-space-lg sm:px-space-xl">
                <div className="flex items-center justify-between gap-space-md">
                  <h3 className="font-title-md text-title-md text-on-surface">Pratinjau Kartu Etalase Publik</h3>
                  <span className="rounded-full bg-status-available-bg px-3 py-1 font-label-sm text-label-sm font-semibold text-status-available">
                    Siap Dirilis
                  </span>
                </div>

                <Card
                  className="w-full max-w-[700px] overflow-hidden"
                  onMouseEnter={() => setHover(true)}
                  onMouseLeave={() => setHover(false)}
                >
                  <div className="relative">
                    {f.foto[0] ? (
                      <img
                        src={f.foto[0].src}
                        alt={f.nama}
                        className={cn(
                          'h-56 w-full object-cover transition-transform duration-300',
                          hover && 'scale-[1.02]',
                        )}
                      />
                    ) : (
                      <div className="flex h-56 w-full items-center justify-center bg-purple-50 text-slate-400">
                        <Icon name="image" className="text-[40px]" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white/95 px-3 py-1 font-label-sm text-label-sm font-semibold text-primary shadow-sm">
                        {f.kategori || 'Kategori'}
                      </span>
                      <span className="rounded-full bg-white/95 px-3 py-1 font-label-sm text-label-sm font-semibold text-on-surface shadow-sm">
                        Kapasitas {f.kapasitasAngka} Orang
                      </span>
                    </div>
                    <span className="absolute top-3 right-3 rounded-full bg-status-available px-3 py-1 font-label-sm text-label-sm font-bold text-white shadow-sm">
                      Tersedia
                    </span>
                  </div>

                  <div className="flex flex-col gap-space-sm p-space-lg">
                    <div className="flex flex-wrap items-center gap-x-space-sm gap-y-1 text-body-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Icon name="location_on" className="text-[16px] text-primary" />
                        {f.lokasi || 'Lokasi belum diatur'}
                        {f.provinsi ? ` • ${f.provinsi}` : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="star" className="text-[16px] text-status-occupied" />
                        (Baru)
                      </span>
                    </div>
                    <h4 className="font-headline-sm text-headline-sm text-on-surface">
                      {f.nama || 'Nama Ruangan'}
                    </h4>
                    <p className="line-clamp-3 text-body-sm text-slate-500">{f.deskripsi}</p>
                    <div className="flex flex-wrap gap-2">
                      {f.fasilitas.slice(0, 4).map((fasilitas) => (
                        <span
                          key={fasilitas.nama}
                          className="flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 font-label-sm text-label-sm text-primary"
                        >
                          <Icon name={fasilitas.ikon} className="text-[14px]" />
                          {fasilitas.nama}
                        </span>
                      ))}
                      {f.fasilitas.length > 4 && (
                        <span className="rounded-full bg-purple-50 px-2.5 py-1 font-label-sm text-label-sm text-primary">
                          +{f.fasilitas.length - 4} Fasilitas Lain
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-end justify-between gap-space-md border-t border-purple-100 pt-space-sm">
                      <div>
                        <span className="font-headline-sm text-headline-sm text-primary">{rp(f.tarifAngka)}</span>
                        <span className="text-body-sm text-slate-500"> / Jam</span>
                        <p className="text-body-sm text-slate-500">{f.ringkasPaket}</p>
                      </div>
                      <span className="rounded-full bg-purple-100 px-3 py-1.5 font-label-sm text-label-sm font-semibold text-primary">
                        Instan Booking
                      </span>
                    </div>
                  </div>
                </Card>

                <p className="max-w-[700px] text-body-sm text-slate-500">
                  Periksa kembali seluruh data di langkah sebelumnya. Setelah diterbitkan, ruangan tayang di etalase
                  publik dan dapat langsung dipesan penyewa.
                </p>
              </div>
            </>
          )}

          {/* Aksi bawah */}
          <div className="flex flex-col-reverse gap-space-md border-t border-purple-100 px-space-lg py-space-md sm:flex-row sm:items-center sm:justify-between sm:px-space-xl">
            <Button
              variant="outline"
              size="lg"
              icon="arrow_back"
              iconPosition="left"
              onClick={f.kembali}
              className="w-full sm:w-auto"
            >
              {f.langkah === 1 ? 'Kembali ke Ruangan Saya' : `Kembali ke Langkah ${f.langkah - 1}`}
            </Button>
            <Button
              size="lg"
              icon={f.langkah === 4 ? 'rocket_launch' : 'arrow_forward'}
              onClick={f.lanjut}
              disabled={f.menerbitkan}
              className="w-full sm:w-auto"
            >
              {f.menerbitkan && f.langkah === 4 ? 'Menerbitkan…' : LABEL_AKSI_LANGKAH[f.langkah - 1]}
            </Button>
          </div>
        </Card>

        {/* Kaki halaman */}
        <div className="flex flex-col items-center justify-between gap-space-md rounded-2xl bg-surface-container-lowest p-space-md shadow-[0_4px_20px_-2px_rgba(108,92,231,0.04)] sm:flex-row">
          <div className="flex items-center gap-space-sm text-body-sm text-slate-500">
            <span className="font-title-md text-primary">RuangKu Mitra</span>
            <span>© 2025 Portal Mitra Penyedia. Seluruh hak cipta dilindungi.</span>
          </div>
          <div className="flex items-center gap-space-md font-label-sm text-label-sm text-slate-500">
            {TAUTAN_KAKI.map((t, i) => (
              <span key={t.to} className="flex items-center gap-space-md">
                {i > 0 && <span aria-hidden="true">•</span>}
                <Link to={t.to} className="transition-colors hover:text-primary">
                  {t.label}
                </Link>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Toast */}
      {f.pesan && (
        <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-margin">
          <span className="flex items-center gap-space-sm rounded-full bg-inverse-surface px-4 py-2.5 text-body-sm text-inverse-on-surface shadow-card">
            <Icon name="check_circle" className="text-[18px] text-status-available" />
            {f.pesan}
          </span>
        </div>
      )}
    </div>
  )
}
