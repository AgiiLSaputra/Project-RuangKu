import { useRef, useState } from 'react'
import { useTambahRuangan, LABEL_AKSI_LANGKAH } from '../../components/domain/mitra/useTambahRuangan'
import { Button } from '../../components/ui/Button'
import { Field, TextArea } from '../../components/ui/Field'
import { Dropdown } from '../../components/ui/Dropdown'
import { Icon } from '../../components/ui/Icon'
import { cn } from '../../lib/cn'
import { rp } from '../../lib/format'
import { MAKS_FOTO, MAKS_UKURAN_FOTO_MB, OPS_JAM, OPS_KATEGORI, OPS_PROVINSI } from '../../data/tambahRuangan'

const LABEL_LANGKAH = ['Info', 'Harga', 'Jadwal', 'Pratinjau']

const KARTU = 'rounded-3xl bg-surface-container-lowest p-space-md shadow-sm'

function JudulSeksi({ ikon, label, sub }: { ikon: string; label: string; sub?: string }) {
  return (
    <div className="flex items-center gap-space-sm">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-primary">
        <Icon name={ikon} className="text-[18px]" />
      </span>
      <div className="min-w-0">
        <h2 className="font-title-md text-title-md text-on-surface">{label}</h2>
        {sub && <p className="text-body-sm text-slate-500">{sub}</p>}
      </div>
    </div>
  )
}

export function TambahRuanganMobilePage() {
  const f = useTambahRuangan()
  const [tagAktif, setTagAktif] = useState(false)

  /** Input berkas tersembunyi milik halaman — tombol unggah memicunya lewat klikFoto(). */
  const elInputFoto = useRef<HTMLInputElement>(null)
  const klikFoto = () => elInputFoto.current?.click()

  const daftarCek = [
    { teks: 'Jam operasional lengkap', nilai: `${f.jamBuka} - ${f.jamTutup}` },
    { teks: `${f.foto.length} foto sudah diunggah`, nilai: `Sisa ${f.sisaSlotFoto} slot` },
    { teks: `${f.paket.length} paket aktif`, nilai: f.ringkasPaket },
    { teks: 'Nomor WhatsApp terdaftar', nilai: `+62 ${f.wa}` },
    {
      teks: f.batasAktif ? `Batas ${f.batasAcaraAngka} sesi per hari` : 'Tanpa batas sesi harian',
      nilai: f.batasAktif ? 'Aktif' : 'Nonaktif',
    },
  ]

  return (
    <div className="relative flex flex-col gap-space-md bg-surface px-gutter pb-space-lg pt-space-md">
      {/* 1. Sub-bar judul + simpan draf */}
      <section className="flex items-center justify-between gap-space-sm">
        <div className="flex min-w-0 items-center gap-space-sm">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-headline-sm text-headline-sm tracking-tight text-on-surface">
              Tambah Ruangan Baru
            </h1>
          </div>
        </div>
        <Button
          variant="soft"
          size="sm"
          icon="bookmark_border"
          iconPosition="left"
          onClick={f.simpanDraf}
          className="shrink-0"
        >
          Simpan Draft
        </Button>
      </section>

      {/* 2. Stepper titik + garis progres */}
      <section className="rounded-3xl bg-surface-container-lowest p-space-sm shadow-sm">
        <div className="flex items-start justify-between gap-1 px-2">
          {LABEL_LANGKAH.map((label, i) => {
            const nomor = i + 1
            const selesai = f.langkahTerisi[i]
            const aktif = nomor === f.langkah
            return (
              <button
                key={label}
                type="button"
                onClick={() => f.keLangkah(nomor)}
                className="relative flex flex-1 flex-col items-center gap-1"
              >
                {i < LABEL_LANGKAH.length - 1 && (
                  <>
                    <span className="absolute top-[16px] left-1/2 h-1 w-[calc(100%+4px)] rounded-full bg-surface-container" />
                    <span
                      className={cn(
                        'absolute top-[16px] left-1/2 h-1 w-[calc(100%+4px)] rounded-full bg-primary-container transition-opacity duration-300',
                        selesai ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                  </>
                )}
                <span
                  className={cn(
                    'relative z-10 flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300',
                    selesai
                      ? 'bg-status-available text-white'
                      : aktif
                        ? 'scale-110 bg-primary-container text-on-primary-container shadow-md shadow-primary/30'
                        : 'bg-error text-on-error',
                  )}
                >
                  {selesai ? (
                    <Icon name="check" className="text-[16px]" />
                  ) : aktif ? (
                    <span className="font-label-md text-label-md font-bold">{nomor}</span>
                  ) : (
                    <Icon name="close" className="text-[16px]" />
                  )}
                </span>
                <span
                  className={cn(
                    'font-label-sm text-label-sm whitespace-nowrap',
                    selesai
                      ? 'font-medium text-status-available'
                      : aktif
                        ? 'font-bold text-primary'
                        : 'font-medium text-error',
                  )}
                >
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* 3. Konten langkah */}
      {f.langkah === 1 && (
        <section className={cn(KARTU, 'flex flex-col gap-space-md')}>
          <JudulSeksi ikon="photo_camera" label="Info Dasar" sub="Foto, nama, deskripsi & fasilitas ruangan." />

          {/* Foto */}
          <div className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <span className="font-title-md text-[13px] font-semibold text-on-surface-variant">
                Foto Ruangan <span className="text-status-full">*</span>
              </span>
              <span className="font-label-sm text-label-sm text-slate-500">
                {f.foto.length} dari {MAKS_FOTO} foto
              </span>
            </div>
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
            <button
              type="button"
              onClick={klikFoto}
              className="flex w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-purple-300 bg-purple-50/50 py-space-md transition-colors active:border-primary"
            >
              <Icon name="cloud_upload" className="text-[24px] text-primary" />
              <span className="font-title-md text-body-sm text-primary">Ketuk untuk unggah foto Anda</span>
              <span className="text-label-sm text-slate-500">
                JPG/PNG/WebP, maks. {MAKS_UKURAN_FOTO_MB} MB — diunggah saat diterbitkan
              </span>
            </button>
            <div className="grid grid-cols-3 gap-space-sm">
              {f.foto.map((foto, i) => (
                <div key={`${foto.src}-${i}`} className="relative aspect-square overflow-hidden rounded-lg bg-surface-container">
                  <img src={foto.src} alt={foto.nama} className="h-full w-full object-cover" />
                  {i === 0 && (
                    <span className="absolute top-1.5 left-1.5 rounded-full bg-status-available px-1.5 py-0.5 font-label-sm text-[10px] font-bold text-white">
                      Utama
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label={`Hapus foto ${foto.nama}`}
                    onClick={() => f.hapusFoto(i)}
                    className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-on-surface/60 text-white active:bg-status-full"
                  >
                    <Icon name="close" className="text-[14px]" />
                  </button>
                </div>
              ))}
              {f.sisaSlotFoto > 0 && (
                <button
                  type="button"
                  onClick={klikFoto}
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-purple-300 bg-purple-50 text-primary active:border-primary"
                >
                  <Icon name="add" className="text-[22px]" />
                  <span className="font-label-sm text-label-sm font-semibold">Tambah</span>
                </button>
              )}
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
          </div>

          {/* Identitas */}
          <div className="flex flex-col gap-space-md">
            <Field
              label="Nama Ruangan"
              required
              value={f.nama}
              onChange={(e) => f.setNama(e.target.value)}
              placeholder="mis. Ballroom Lantai 2"
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
              placeholder="mis. Bandung"
            />
            <Field
              label="Alamat Lengkap Ruangan"
              required
              value={f.lokasi}
              onChange={(e) => f.setLokasi(e.target.value)}
              placeholder="mis. Jl. Jend. Sudirman Kav. 52-53 • Menara Sudirman Lt. 2"
            />
            <Dropdown
              label="Provinsi"
              required
              value={f.provinsi}
              onChange={f.setProvinsi}
              placeholder="Pilih provinsi"
              ops={OPS_PROVINSI.map((provinsi) => ({ nilai: provinsi, label: provinsi }))}
            />
            <Field
              label="Link Google Maps"
              hint="Opsional"
              type="url"
              value={f.linkMaps}
              onChange={(e) => f.setLinkMaps(e.target.value)}
              placeholder="https://maps.app.goo.gl/..."
            />
            <TextArea
              label="Deskripsi Ruangan"
              required
              rows={4}
              maxLength={1000}
              value={f.deskripsi}
              onChange={(e) => f.setDeskripsi(e.target.value)}
              placeholder="Jelaskan keunggulan ruangan Anda..."
            />
            <p className="-mt-2 text-right text-label-sm text-slate-500">{f.deskripsi.length} / 1000 Karakter</p>
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
          </div>

          {/* Fasilitas */}
          <div className="flex flex-col gap-space-sm">
            <span className="font-title-md text-[13px] font-semibold text-on-surface-variant">
              Fasilitas <span className="text-status-full">*</span>
            </span>
            <div className="flex flex-wrap gap-space-xs">
              {f.opsiFasilitas.map((opsi) => {
                const dipilih = f.fasilitas.some((fasilitas) => fasilitas.nama === opsi.nama)
                const kustom = f.tagKustom.has(opsi.nama)
                return (
                  <span
                    key={opsi.nama}
                    className={cn(
                      'flex items-center rounded-full border py-1.5 pr-2.5 pl-2.5 font-label-md text-label-md',
                      dipilih ? 'border-primary bg-purple-50 text-primary' : 'border-outline-variant bg-white text-slate-500',
                    )}
                  >
                    <button
                      type="button"
                      aria-pressed={dipilih}
                      onClick={() => f.toggleFasilitas(opsi)}
                      className="flex items-center gap-1.5 active:text-primary"
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
                        className="ml-1 flex h-5 w-5 items-center justify-center rounded-full active:bg-purple-100 active:text-status-full"
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
                    }}
                    placeholder="Nama tag baru"
                    className="h-7 w-32 bg-transparent font-label-md text-label-md text-on-surface placeholder:text-slate-400 outline-none"
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
                    className="flex h-7 w-7 items-center justify-center rounded-full text-primary active:bg-purple-100"
                  >
                    <Icon name="check" className="text-[16px]" />
                  </button>
                  <button
                    type="button"
                    aria-label="Batal tambah tag"
                    onClick={() => setTagAktif(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 active:bg-purple-100"
                  >
                    <Icon name="close" className="text-[16px]" />
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setTagAktif(true)}
                  className="flex items-center gap-1.5 rounded-full border border-dashed border-purple-300 py-1.5 pr-2.5 pl-2.5 font-label-md text-label-md text-primary active:bg-purple-50"
                >
                  <Icon name="add" className="text-[16px]" />
                  Tambah Tag
                </button>
              )}
            </div>
            {f.fasilitas.length === 0 && (
              <p className="text-body-sm text-slate-500">Belum ada fasilitas dipilih.</p>
            )}
          </div>

          <Button block size="lg" icon="arrow_forward" onClick={f.lanjut}>
            {LABEL_AKSI_LANGKAH[0]}
          </Button>
        </section>
      )}

      {f.langkah === 2 && (
        <>
          <section className={cn(KARTU, 'flex flex-col gap-space-md')}>
            <JudulSeksi ikon="payments" label="Tarif & Paket" sub="Tarif dasar per jam dan paket harian." />

            <div className="flex flex-col gap-space-sm">
              <div className="flex items-center justify-between gap-space-sm">
                <span className="font-title-md text-[13px] font-semibold text-on-surface-variant">
                  Tarif Dasar Per Jam <span className="text-status-full">*</span>
                </span>
                <span className="rounded-full bg-status-available-bg px-2 py-0.5 font-label-sm text-label-sm font-semibold text-status-available">
                  Harga Dasar
                </span>
              </div>
              <span className="flex items-center overflow-hidden rounded-xl border border-outline-variant bg-white focus-within:border-primary focus-within:shadow-focus">
                <span className="shrink-0 pl-4 font-headline-sm text-headline-sm text-primary">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  aria-label="Tarif sewa per jam"
                  value={f.tarif}
                  onChange={(e) => f.ubahTarif(e.target.value)}
                  className="h-14 w-full min-w-0 px-3 font-label-md text-[20px] font-bold text-on-surface outline-none"
                />
                <span className="shrink-0 pr-4 font-label-sm whitespace-nowrap text-slate-500">/ jam</span>
              </span>
            </div>

            <div className="flex flex-col gap-space-sm">
              <div className="flex items-center justify-between">
                <span className="font-title-md text-[13px] font-semibold text-on-surface-variant">
                  Paket Harian Hemat (Opsional)
                </span>
                {!f.bukaFormPaket && (
                  <button
                    type="button"
                    onClick={() => f.setBukaFormPaket(true)}
                    className="flex items-center gap-1 font-label-sm text-label-sm font-bold text-primary active:opacity-70"
                  >
                    <Icon name="add_circle" className="text-[16px]" />
                    Tambah
                  </button>
                )}
              </div>

              {f.bukaFormPaket && (
                <div className="flex flex-col gap-space-sm rounded-lg bg-purple-50/70 p-space-sm">
                  <Field
                    label="Nama Paket"
                    required
                    value={f.namaPaket}
                    onChange={(e) => f.setNamaPaket(e.target.value)}
                    placeholder="mis. Paket Setengah Hari"
                  />
                  <div className="grid grid-cols-2 gap-space-sm">
                    <Field
                      label="Durasi (jam)"
                      required
                      inputMode="numeric"
                      value={f.durasiPaket}
                      onChange={(e) => f.setDurasiPaket(e.target.value.replace(/\D/g, ''))}
                      placeholder="4"
                    />
                    <Field
                      label="Harga (Rp)"
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
                    placeholder="mis. Durasi 4 jam sudah termasuk coffee break."
                  />
                  <div className="flex items-center justify-end gap-space-sm">
                    <Button variant="outline" size="sm" onClick={() => f.setBukaFormPaket(false)}>
                      Batal
                    </Button>
                    <Button size="sm" icon="save" iconPosition="left" onClick={f.simpanPaket}>
                      Simpan Paket
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-space-sm">
                {f.paket.map((paket, i) => (
                  <div
                    key={paket.id}
                    className="flex items-center gap-space-sm rounded-lg bg-purple-50/70 p-space-sm"
                  >
                    <span
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-label-md font-bold text-white',
                        i % 2 === 0 ? 'bg-primary-container' : 'bg-primary',
                      )}
                    >
                      {paket.durasiJam}J
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-title-md text-body-md text-on-surface">{paket.nama}</p>
                      <p className="text-body-sm text-slate-500">Durasi {paket.durasiJam} jam</p>
                    </div>
                    <span className="shrink-0 font-label-md text-body-md font-bold text-primary">
                      {rp(paket.harga)}
                    </span>
                    <button
                      type="button"
                      aria-label={`Hapus ${paket.nama}`}
                      onClick={() => f.hapusPaket(paket.id)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 active:bg-status-full-bg active:text-status-full"
                    >
                      <Icon name="delete" className="text-[18px]" />
                    </button>
                  </div>
                ))}
                {f.paket.length === 0 && (
                  <p className="text-body-sm text-slate-500">
                    Belum ada paket harian — tekan Tambah untuk membuat paket sewa baru.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-space-sm rounded-2xl bg-purple-100 p-space-md text-body-sm text-primary">
              <Icon name="info" className="mt-0.5 shrink-0 text-[18px]" />
              <span>Estimasi waktu review: 1x24 jam kerja. Anda dapat mengedit data selama proses review.</span>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-space-sm">
            <Button variant="outline" size="lg" icon="arrow_back" iconPosition="left" onClick={f.kembali}>
              Kembali
            </Button>
            <Button size="lg" icon="arrow_forward" onClick={f.lanjut}>
              Lanjut
            </Button>
          </div>
        </>
      )}

      {f.langkah === 3 && (
        <>
          {/* Jam operasional */}
          <section className={cn(KARTU, 'flex flex-col gap-space-md')}>
            <JudulSeksi ikon="schedule" label="Jam Operasional" sub="Dibuka setiap hari (FR-E4)." />
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
          </section>

          {/* Jadwal tutup khusus */}
          <section className={cn(KARTU, 'flex flex-col gap-space-md')}>
            <div className="flex items-center justify-between gap-space-sm">
              <JudulSeksi ikon="event_busy" label="Jadwal Tutup Khusus" />
              <button
                type="button"
                className="flex items-center gap-1 font-label-sm text-label-sm font-bold text-primary active:opacity-70"
              >
                <Icon name="add" className="text-[16px]" />
                Tambah
              </button>
            </div>
            <div className="flex flex-col gap-space-sm">
              {f.tutupKhusus.map((tutup) => (
                <div
                  key={tutup.id}
                  className="flex items-center gap-space-sm rounded-2xl bg-surface-container p-space-sm"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-status-full-bg text-status-full">
                    <Icon name="block" className="text-[20px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-title-md text-body-md text-on-surface">{tutup.hari}</p>
                    <p className="text-body-sm text-slate-500">
                      {tutup.jam} — {tutup.alasan}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Hapus jadwal ${tutup.hari}`}
                    onClick={() => f.hapusTutupKhusus(tutup.id)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 active:bg-status-full-bg active:text-status-full"
                  >
                    <Icon name="close" className="text-[18px]" />
                  </button>
                </div>
              ))}
              {f.tutupKhusus.length === 0 && (
                <p className="text-body-sm text-slate-500">Belum ada jadwal tutup khusus.</p>
              )}
            </div>
            <div className="flex items-start gap-space-sm rounded-2xl bg-surface-container p-space-md text-body-sm text-slate-500">
              <Icon name="cleaning_services" className="mt-0.5 shrink-0 text-[18px] text-primary" />
              <span>Pembersihan &amp; pengecekan teknis membutuhkan waktu 1 jam di antara acara.</span>
            </div>
          </section>

          {/* Batas reservasi harian */}
          <section className={cn(KARTU, 'flex flex-col gap-space-md')}>
            <JudulSeksi ikon="event_available" label="Batas Reservasi per Hari" />
            <div className="flex items-center justify-between gap-space-sm rounded-2xl bg-purple-50 p-space-sm">
              <div className="min-w-0">
                <p className="font-title-md text-body-md text-on-surface">
                  Maksimal {f.batasAcara} acara per hari
                </p>
                <p className="text-body-sm text-slate-500">Atur berapa sesi boleh berlangsung tiap hari (FR-E5).</p>
              </div>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2.5 py-1 font-label-sm text-label-sm font-bold',
                  f.batasAktif ? 'bg-purple-100 text-primary' : 'bg-status-blocked-bg text-status-blocked',
                )}
              >
                {f.batasAktif ? `${f.batasAcara} sesi` : 'Nonaktif'}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={f.batasAktif}
                aria-label="Aktifkan batas reservasi harian"
                onClick={() => f.setBatasAktif(!f.batasAktif)}
                className={cn(
                  'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                  f.batasAktif ? 'bg-primary-container' : 'bg-outline-variant',
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                    f.batasAktif && 'translate-x-5',
                  )}
                />
              </button>
            </div>
          </section>

          {/* Kontak WhatsApp */}
          <section className={cn(KARTU, 'flex flex-col gap-space-md')}>
            <JudulSeksi
              ikon="call"
              label="Nomor WhatsApp Reservasi"
              sub="Dihubungi penyewa saat tiba di lokasi — tidak tampil di etalase publik (FR-E7)."
            />
            <span className="flex items-center overflow-hidden rounded-full border border-outline-variant bg-white focus-within:border-primary focus-within:shadow-focus">
              <span className="shrink-0 pl-4 font-label-md font-semibold text-primary">+62</span>
              <input
                type="tel"
                aria-label="Nomor WhatsApp petugas lapangan"
                value={f.wa}
                onChange={(e) => f.setWa(e.target.value)}
                className="h-11 w-full min-w-0 px-2 text-body-md text-on-surface outline-none"
              />
            </span>
            <p className="text-body-sm text-slate-500">
              Nomor lapangan dipakai untuk serah terima kunci &amp; komunikasi reservasi.
            </p>
          </section>

          <div className="grid grid-cols-2 gap-space-sm">
            <Button variant="outline" size="lg" icon="arrow_back" iconPosition="left" onClick={f.kembali}>
              Kembali
            </Button>
            <Button size="lg" icon="arrow_forward" onClick={f.lanjut}>
              Lanjut
            </Button>
          </div>
        </>
      )}

      {f.langkah === 4 && (
        <>
          <div className="flex items-center justify-between gap-space-sm">
            <div>
              <h2 className="font-title-md text-title-md text-on-surface">Pratinjau Kartu Etalase Publik</h2>
              <p className="text-body-sm text-slate-500">Tampilan pencarian RuangKu.</p>
            </div>
            <span className="shrink-0 rounded-full bg-status-available-bg px-3 py-1 font-label-sm text-label-sm font-semibold text-status-available">
              Siap Dirilis
            </span>
          </div>

          {/* Kartu pratinjau */}
          <div className="overflow-hidden rounded-3xl bg-surface-container-lowest shadow-sm ring-1 ring-purple-100">
            <div className="relative aspect-[4/3]">
              {f.foto[0] ? (
                <img src={f.foto[0].src} alt={f.nama} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-purple-50 text-slate-400">
                  <Icon name="image" className="text-[40px]" />
                </div>
              )}
              <span className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 font-label-sm text-label-sm font-bold text-on-surface shadow-sm">
                <Icon name="star" className="text-[14px] text-status-occupied" />
                (Baru)
              </span>
              <span className="absolute top-3 right-3 rounded-full bg-status-available px-2.5 py-1 font-label-sm text-label-sm font-bold text-white shadow-sm">
                Tersedia
              </span>
              <span className="absolute right-3 bottom-3 rounded-full bg-white/95 px-2.5 py-1 font-label-sm text-label-sm font-semibold text-primary shadow-sm">
                {f.paket.length} Paket Harian
              </span>
            </div>
            <div className="flex flex-col gap-space-xs p-space-md">
              <span className="flex items-center gap-1 text-label-sm text-slate-500">
                <Icon name="location_on" className="text-[14px] text-primary" />
                {f.lokasi || 'Lokasi belum diatur'}
                {f.provinsi ? ` • ${f.provinsi}` : ''}
              </span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">{f.nama || 'Nama Ruangan'}</h3>
              <span className="flex items-center gap-1 text-body-sm text-slate-500">
                <Icon name="group" className="text-[16px] text-primary" />
                Kapasitas hingga {f.kapasitasAngka} orang
              </span>
              <div className="flex flex-wrap gap-1.5">
                {f.fasilitas.slice(0, 3).map((fasilitas) => (
                  <span
                    key={fasilitas.nama}
                    className="flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 font-label-sm text-label-sm text-primary"
                  >
                    <Icon name={fasilitas.ikon} className="text-[12px]" />
                    {fasilitas.nama}
                  </span>
                ))}
                {f.fasilitas.length > 3 && (
                  <span className="rounded-full bg-purple-50 px-2 py-0.5 font-label-sm text-label-sm text-primary">
                    +{f.fasilitas.length - 3} lainnya
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-end justify-between gap-space-sm border-t border-purple-100 pt-space-sm">
                <div>
                  <span className="font-headline-sm text-headline-sm text-primary">{rp(f.tarifAngka)}</span>
                  <span className="text-body-sm text-slate-500"> / jam</span>
                  <p className="text-label-sm text-slate-500">{f.ringkasPaket}</p>
                </div>
                <span className="rounded-full bg-purple-100 px-2.5 py-1 font-label-sm text-label-sm font-semibold text-primary">
                  Instan Booking
                </span>
              </div>
            </div>
          </div>

          {/* Checklist kesiapan */}
          <section className={cn(KARTU, 'flex flex-col gap-space-sm')}>
            <h2 className="font-title-md text-title-md text-on-surface">Ceklis Kesiapan Terbit</h2>
            {daftarCek.map((cek) => (
              <div
                key={cek.teks}
                className="flex items-center justify-between gap-space-sm rounded-2xl bg-surface-container p-space-sm"
              >
                <span className="flex min-w-0 items-center gap-space-sm">
                  <Icon name="check_circle" className="shrink-0 text-[18px] text-status-available" />
                  <span className="truncate font-title-md text-body-sm text-on-surface">{cek.teks}</span>
                </span>
                <span className="shrink-0 font-label-sm text-label-sm text-slate-500">{cek.nilai}</span>
              </div>
            ))}
          </section>

          <p className="px-1 text-center text-body-sm text-slate-500">
            Setelah diterbitkan, ruangan tayang di etalase publik dan dapat langsung dipesan penyewa.
          </p>

          <div className="flex flex-col gap-space-sm">
            <Button block size="lg" icon={f.menerbitkan ? 'hourglass_top' : 'rocket_launch'} onClick={f.lanjut} disabled={f.menerbitkan}>
              {f.menerbitkan ? 'Menerbitkan…' : LABEL_AKSI_LANGKAH[3]}
            </Button>
            <Button block variant="outline" size="md" icon="arrow_back" iconPosition="left" onClick={f.kembali} disabled={f.menerbitkan}>
              Kembali ke Langkah 3
            </Button>
          </div>
        </>
      )}

      {/* Toast */}
      {f.pesan && (
        <div
          className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-gutter"
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 88px)' }}
        >
          <span className="flex items-center gap-space-sm rounded-full bg-inverse-surface px-4 py-2.5 text-body-sm text-inverse-on-surface shadow-card">
            <Icon name="check_circle" className="text-[18px] text-status-available" />
            {f.pesan}
          </span>
        </div>
      )}
    </div>
  )
}
