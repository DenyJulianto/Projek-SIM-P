import { useEffect, useState } from 'react'
import ConfirmActionModal from '../components/ConfirmActionModal'
import IlustrasiFitur from '../components/IlustrasiFitur'
import ModalCloseButton from '../components/ModalCloseButton'
import heroSekolah from '../assets/hero-sekolah.jpg'
import gambarAdmin from '../assets/showcase/admin-dasbor.jpg'
import gambarGuru from '../assets/showcase/guru-absensi.jpg'
import gambarOrtu from '../assets/showcase/orangtua-pantau.jpg'
import gambarSiswa from '../assets/showcase/siswa-ujian.jpg'
import { api } from '../lib/api'

/**
 * Menu Super Admin "Kelola Landing Page": mengubah konten landing platform
 * (domain pusat) tanpa menyentuh kode — slide hero, fitur unggulan, manfaat
 * per peran, testimoni, serta kontak, info legal, dan media sosial. Isian
 * kosong tidak tampil di landing.
 */
const TAB = [
  { key: 'slide', label: 'Slide Hero' },
  { key: 'fitur', label: 'Fitur Unggulan' },
  { key: 'manfaat', label: 'Manfaat' },
  { key: 'testimoni', label: 'Testimoni' },
  { key: 'kontak', label: 'Kontak & Legal' },
]

const ILUSTRASI = [
  { key: 'foto', label: 'Foto sekolah' },
  { key: 'pengguna', label: 'Ilustrasi pengguna' },
  { key: 'tabel', label: 'Ilustrasi tabel data' },
  { key: 'grafik', label: 'Ilustrasi grafik' },
]

// Tangkapan layar asli aplikasi (sekolah demo) yang tersedia untuk tab Manfaat.
const TANGKAPAN_BAWAAN = [
  { key: 'guru', label: 'Guru — absensi kelas', src: gambarGuru },
  { key: 'siswa', label: 'Siswa — daftar ujian', src: gambarSiswa },
  { key: 'orangtua', label: 'Orang tua — pantau anak', src: gambarOrtu },
  { key: 'admin', label: 'Admin sekolah — dasbor', src: gambarAdmin },
]
const srcBawaan = (key) => TANGKAPAN_BAWAAN.find((t) => t.key === key)?.src

export default function KelolaLandingPage() {
  const [tab, setTab] = useState('slide')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  function muat() {
    return api
      .getKelolaLanding()
      .then((d) => {
        setData(d)
        setError('')
      })
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    muat()
  }, [])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-navy-light/15 flex items-center justify-center shrink-0">
            <LayoutIcon className="h-5.5 w-5.5 text-navy" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-navy">Kelola Landing Page</h1>
            <p className="text-sm text-navy/50">
              Ubah isi halaman depan platform. Perubahan langsung tampil di landing (paling lama beberapa detik).
            </p>
          </div>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="border border-navy/15 hover:bg-navy/5 text-navy text-sm font-semibold px-5 py-2.5 rounded-full shrink-0"
        >
          Lihat Landing ↗
        </a>
      </div>

      <div role="tablist" className="flex flex-wrap gap-2 mb-5">
        {TAB.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              tab === t.key ? 'bg-navy text-white' : 'bg-white border border-navy/10 text-navy/70 hover:text-navy'
            }`}
          >
            {t.label}
            {data && t.key !== 'kontak' && <span className="ml-1.5 opacity-60">({data[t.key].length})</span>}
          </button>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {!data ? (
        !error && <p className="text-navy/40 text-sm">Memuat...</p>
      ) : tab === 'slide' ? (
        <DaftarItem
          jenis="slide"
          nama="Slide"
          items={data.slide}
          onBerubah={muat}
          judulItem={(s) => [s.judul_putih, s.judul_emas, s.judul_lanjutan].filter(Boolean).join(' ')}
          keterangan={
            'Slide aktif berganti otomatis di bagian atas landing. Tanpa gambar, slide memakai foto hero bawaan.' +
            (data.slide.some((s) => s.aktif) ? '' : ' Belum ada slide aktif — landing menampilkan slide bawaan.')
          }
          kartu={(s) => <PratinjauSlide slide={s} gambar={s.gambar_url || heroSekolah} />}
          Form={FormSlide}
        />
      ) : tab === 'fitur' ? (
        <DaftarItem
          jenis="fitur"
          nama="Fitur"
          items={data.fitur}
          onBerubah={muat}
          judulItem={(x) => x.judul}
          kolom="sm:grid-cols-2 xl:grid-cols-3"
          keterangan={
            'Kartu di bagian "Fitur Unggulan" (bisa digeser ke samping). ' +
            (data.fitur.some((x) => x.aktif) ? '' : 'Belum ada fitur aktif — bagian ini & menu Fitur tidak tampil di landing.')
          }
          kartu={(x) => <PratinjauFitur fitur={x} gambar={x.gambar_url} />}
          Form={FormFitur}
        />
      ) : tab === 'manfaat' ? (
        <DaftarItem
          jenis="manfaat"
          nama="Manfaat"
          items={data.manfaat}
          onBerubah={muat}
          judulItem={(x) => `${x.peran} — ${x.judul}`}
          keterangan={
            'Setiap item menjadi satu tab peran di bagian "Manfaat untuk Setiap Pengguna". ' +
            (data.manfaat.some((x) => x.aktif) ? '' : 'Belum ada manfaat aktif — bagian ini & menu Manfaat tidak tampil di landing.')
          }
          kartu={(x) => <PratinjauManfaat manfaat={x} gambar={x.gambar_url || srcBawaan(x.gambar_bawaan)} />}
          Form={FormManfaat}
        />
      ) : tab === 'testimoni' ? (
        <DaftarTestimoni testimoni={data.testimoni} onBerubah={muat} />
      ) : (
        <FormKontak awal={data.pengaturan} onTersimpan={(p) => setData((d) => ({ ...d, pengaturan: p }))} />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Kerangka bersama: daftar kartu + tambah/ubah/hapus                  */
/* ------------------------------------------------------------------ */

function DaftarItem({ jenis, nama, items, onBerubah, judulItem, keterangan, kartu, Form, kolom = 'md:grid-cols-2' }) {
  const [edit, setEdit] = useState(null) // null | {} (baru) | item
  const [hapus, setHapus] = useState(null)
  const [sibuk, setSibuk] = useState(false)
  const [error, setError] = useState('')

  async function konfirmasiHapus() {
    setSibuk(true)
    try {
      await api.deleteItemLanding(jenis, hapus.id)
      await onBerubah()
    } catch (err) {
      setError(err.message)
    } finally {
      setSibuk(false)
      setHapus(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <p className="text-sm text-navy/50">{keterangan}</p>
        <button
          onClick={() => setEdit({})}
          className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-full shrink-0"
        >
          + Tambah {nama}
        </button>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {items.length === 0 ? (
        <Kosong teks={`Belum ada ${nama.toLowerCase()}.`} />
      ) : (
        <div className={`grid ${kolom} gap-4`}>
          {items.map((x) => (
            <article key={x.id} className="bg-white rounded-2xl border border-navy/10 overflow-hidden flex flex-col">
              <div className="flex-1">{kartu(x)}</div>
              <div className="p-4 flex items-center justify-between gap-3 border-t border-navy/5">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-navy/50">Urutan {x.urutan}</span>
                  <StatusAktif aktif={x.aktif} />
                </div>
                <div className="flex gap-2">
                  <TombolKecil onClick={() => setEdit(x)}>Ubah</TombolKecil>
                  <TombolKecil bahaya onClick={() => setHapus(x)}>Hapus</TombolKecil>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {edit && (
        <Form
          item={edit}
          onClose={() => setEdit(null)}
          onTersimpan={async () => {
            setEdit(null)
            await onBerubah()
          }}
        />
      )}

      {hapus && (
        <ConfirmActionModal
          title={`Hapus ${nama.toLowerCase()} ini?`}
          message={`${nama} "${judulItem(hapus)}" akan dihapus permanen beserta gambarnya.`}
          confirmLabel="Ya, Hapus"
          tone="danger"
          loading={sibuk}
          onConfirm={konfirmasiHapus}
          onClose={() => setHapus(null)}
        />
      )}
    </div>
  )
}

/** State form item bergambar: isian, file unggahan + pratinjau, opsi hapus gambar, dan simpan. */
function useFormItem(jenis, item, awal, onTersimpan) {
  const [f, setF] = useState(awal)
  const [file, setFile] = useState(null)
  const [pratinjauFile, setPratinjauFile] = useState('')
  const [hapusGambar, setHapusGambar] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Lepas URL pratinjau lama saat diganti / modal ditutup.
  useEffect(() => () => pratinjauFile && URL.revokeObjectURL(pratinjauFile), [pratinjauFile])

  function pilihFile(e) {
    const baru = e.target.files?.[0] || null
    setFile(baru)
    setPratinjauFile(baru ? URL.createObjectURL(baru) : '')
  }

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  async function simpan(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.simpanItemLanding(jenis, item.id, { ...f, ...(hapusGambar && !file ? { hapus_gambar: true } : {}) }, file)
      await onTersimpan()
    } catch (err) {
      setError(pesanGalat(err))
    } finally {
      setSaving(false)
    }
  }

  return {
    f,
    setF,
    set,
    simpan,
    saving,
    error,
    file,
    pilihFile,
    hapusGambar,
    setHapusGambar,
    // URL gambar yang akan tampil setelah disimpan ('' = tanpa gambar unggahan)
    gambarUnggahan: pratinjauFile || (!hapusGambar && item.gambar_url) || '',
  }
}

function BidangGambar({ form, item, label, teksHapus, className = '' }) {
  return (
    <Bidang label={label} className={className}>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={form.pilihFile}
        className="block w-full text-sm text-navy/70 file:mr-3 file:rounded-full file:border-0 file:bg-navy/10 file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-navy"
      />
      {item.gambar_url && !form.file && (
        <label className="flex items-center gap-2 text-xs text-navy/60 mt-2">
          <input type="checkbox" checked={form.hapusGambar} onChange={(e) => form.setHapusGambar(e.target.checked)} />
          {teksHapus}
        </label>
      )}
    </Bidang>
  )
}

/** Isian daftar teks pendek (poin/meta): tambah & hapus baris, dengan batas jumlah. */
function InputDaftar({ nilai, onChange, maks, maxLength, placeholder }) {
  const ubah = (i, v) => onChange(nilai.map((x, j) => (j === i ? v : x)))
  return (
    <div className="space-y-2">
      {nilai.map((x, i) => (
        <div key={i} className="flex gap-2">
          <input value={x} maxLength={maxLength} onChange={(e) => ubah(i, e.target.value)} placeholder={placeholder} className="input" />
          <button
            type="button"
            onClick={() => onChange(nilai.filter((_, j) => j !== i))}
            aria-label="Hapus baris"
            className="shrink-0 h-10 w-10 rounded-lg border border-navy/10 text-navy/50 hover:text-red-600 hover:border-red-200"
          >
            ×
          </button>
        </div>
      ))}
      {nilai.length < maks && (
        <button type="button" onClick={() => onChange([...nilai, ''])} className="text-xs font-semibold text-navy-light hover:text-navy">
          + Tambah baris
        </button>
      )}
    </div>
  )
}

function KolomUrutanAktif({ form }) {
  return (
    <>
      <Bidang label="Urutan">
        <input type="number" min={0} max={9999} value={form.f.urutan} onChange={form.set('urutan')} className="input" placeholder="Otomatis" />
      </Bidang>
      <label className="sm:col-span-full flex items-center gap-2 text-sm text-navy/80">
        <input type="checkbox" checked={form.f.aktif} onChange={form.set('aktif')} />
        Tampilkan di landing
      </label>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Slide hero                                                          */
/* ------------------------------------------------------------------ */

/** Miniatur slide dengan gaya yang sama seperti di landing (judul putih + emas). */
function PratinjauSlide({ slide, gambar }) {
  return (
    <div className="relative isolate h-44 overflow-hidden bg-navy text-white">
      <img src={gambar} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy/90 via-navy/70 to-navy/20" />
      <div className="p-5">
        <p className="text-lg font-extrabold uppercase leading-tight">
          {slide.judul_putih || 'Judul'} {slide.judul_emas && <span className="text-gold">{slide.judul_emas}</span>}
          {slide.judul_lanjutan && (
            <>
              <br />
              {slide.judul_lanjutan}
            </>
          )}
        </p>
        <span className="block h-0.5 w-12 bg-gold my-2.5" />
        <p className="text-xs text-white/85 line-clamp-3 max-w-xs">{slide.teks}</p>
      </div>
    </div>
  )
}

function FormSlide({ item, onClose, onTersimpan }) {
  const form = useFormItem(
    'slide',
    item,
    {
      judul_putih: item.judul_putih || '',
      judul_emas: item.judul_emas || '',
      judul_lanjutan: item.judul_lanjutan || '',
      teks: item.teks || '',
      urutan: item.urutan ?? '',
      aktif: item.aktif ?? true,
    },
    onTersimpan,
  )
  const { f, set } = form

  return (
    <Modal judul={item.id ? 'Ubah Slide' : 'Tambah Slide'} onClose={onClose} lebar="max-w-2xl">
      <PratinjauSlide slide={f} gambar={form.gambarUnggahan || heroSekolah} />
      <p className="text-[11px] text-navy/40 mt-1 mb-4">Pratinjau</p>

      {form.error && <p className="text-red-600 text-sm mb-3 whitespace-pre-line">{form.error}</p>}

      <form onSubmit={form.simpan} className="grid sm:grid-cols-3 gap-3">
        <Bidang label="Judul (putih) *">
          <input required maxLength={60} value={f.judul_putih} onChange={set('judul_putih')} className="input" placeholder="Kelola Semua" />
        </Bidang>
        <Bidang label="Sorotan (emas)">
          <input maxLength={60} value={f.judul_emas} onChange={set('judul_emas')} className="input" placeholder="Sekolah" />
        </Bidang>
        <Bidang label="Baris kedua">
          <input maxLength={80} value={f.judul_lanjutan} onChange={set('judul_lanjutan')} className="input" placeholder="Dalam Satu Platform" />
        </Bidang>
        <Bidang label="Teks *" className="sm:col-span-3">
          <textarea required maxLength={300} rows={3} value={f.teks} onChange={set('teks')} className="input resize-none" />
        </Bidang>
        <BidangGambar
          form={form}
          item={item}
          label="Gambar latar (JPG/PNG/WebP, maks. 4 MB)"
          teksHapus="Hapus gambar (pakai foto hero bawaan)"
          className="sm:col-span-2"
        />
        <KolomUrutanAktif form={form} />
        <TombolForm onClose={onClose} saving={form.saving} />
      </form>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/* Fitur unggulan                                                      */
/* ------------------------------------------------------------------ */

/** Miniatur kartu Fitur Unggulan seperti di landing. */
function PratinjauFitur({ fitur, gambar }) {
  const meta = (fitur.meta || []).filter((m) => m && m.trim())
  return (
    <div className="bg-white">
      <div className="relative">
        {gambar ? <img src={gambar} alt="" className="h-44 w-full object-cover" /> : <IlustrasiFitur jenis={fitur.ilustrasi} />}
        {fitur.label && <span className="absolute top-0 right-0 px-3 py-1 text-xs font-bold bg-gold text-navy">{fitur.label}</span>}
      </div>
      <div className="px-5 py-4 text-center">
        <p className="font-bold uppercase text-slate-900">{fitur.judul || 'Judul fitur'}</p>
        {meta.length > 0 && (
          <p className="flex flex-wrap justify-center gap-x-3 text-[11px] text-slate-500 mt-1">
            {meta.map((m, i) => (
              <span key={i}>✓ {m}</span>
            ))}
          </p>
        )}
        <p className="text-xs text-slate-600 leading-relaxed mt-2 line-clamp-3">{fitur.deskripsi}</p>
      </div>
    </div>
  )
}

function FormFitur({ item, onClose, onTersimpan }) {
  const form = useFormItem(
    'fitur',
    item,
    {
      judul: item.judul || '',
      deskripsi: item.deskripsi || '',
      label: item.label || '',
      meta: item.meta?.length ? item.meta : [''],
      ilustrasi: item.ilustrasi || 'foto',
      urutan: item.urutan ?? '',
      aktif: item.aktif ?? true,
    },
    onTersimpan,
  )
  const { f, set, setF } = form

  return (
    <Modal judul={item.id ? 'Ubah Fitur' : 'Tambah Fitur'} onClose={onClose} lebar="max-w-3xl">
      <div className="grid md:grid-cols-[260px_1fr] gap-5 items-start">
        <div className="md:sticky md:top-0">
          <div className="border border-navy/10 shadow-sm">
            <PratinjauFitur fitur={f} gambar={form.gambarUnggahan} />
          </div>
          <p className="text-[11px] text-navy/40 mt-1">Pratinjau</p>
        </div>

        <div>
          {form.error && <p className="text-red-600 text-sm mb-3 whitespace-pre-line">{form.error}</p>}
          <form onSubmit={form.simpan} className="grid sm:grid-cols-2 gap-3">
            <Bidang label="Judul *">
              <input required maxLength={80} value={f.judul} onChange={set('judul')} className="input" placeholder="Manajemen Sekolah" />
            </Bidang>
            <Bidang label="Label pojok">
              <input maxLength={30} value={f.label} onChange={set('label')} className="input" placeholder="mis. Inti" />
            </Bidang>
            <Bidang label="Deskripsi *" className="sm:col-span-2">
              <textarea required maxLength={300} rows={3} value={f.deskripsi} onChange={set('deskripsi')} className="input resize-none" />
            </Bidang>
            <div className="sm:col-span-2">
              <span className="block text-xs font-semibold text-navy/70 mb-1">Poin singkat (maks. 3)</span>
              <InputDaftar
                nilai={f.meta}
                onChange={(meta) => setF((p) => ({ ...p, meta }))}
                maks={3}
                maxLength={40}
                placeholder="mis. Multi-sekolah"
              />
            </div>
            <Bidang label="Gambar bawaan">
              <select value={f.ilustrasi} onChange={set('ilustrasi')} className="input">
                {ILUSTRASI.map((x) => (
                  <option key={x.key} value={x.key}>
                    {x.label}
                  </option>
                ))}
              </select>
              <span className="block text-[11px] text-navy/40 mt-1">Dipakai bila tidak ada gambar unggahan.</span>
            </Bidang>
            <BidangGambar
              form={form}
              item={item}
              label="Gambar unggahan (opsional, maks. 4 MB)"
              teksHapus="Hapus gambar (pakai gambar bawaan)"
            />
            <KolomUrutanAktif form={form} />
            <TombolForm onClose={onClose} saving={form.saving} />
          </form>
        </div>
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/* Manfaat per peran                                                   */
/* ------------------------------------------------------------------ */

/** Miniatur satu tab Manfaat: teks & poin di kiri, tangkapan layar di kanan. */
function PratinjauManfaat({ manfaat, gambar }) {
  const poin = (manfaat.poin || []).filter((p) => p && p.trim())
  return (
    <div className="p-4 grid grid-cols-[1fr_auto] gap-4">
      <div className="min-w-0">
        <span className="inline-block bg-gold text-navy text-[11px] font-bold uppercase px-2.5 py-1">{manfaat.peran || 'Peran'}</span>
        <p className="font-bold text-slate-900 mt-2 leading-snug">{manfaat.judul || 'Judul manfaat'}</p>
        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{manfaat.teks}</p>
        {poin.length > 0 && (
          <ul className="mt-2 space-y-0.5">
            {poin.slice(0, 4).map((p, i) => (
              <li key={i} className="text-[11px] text-slate-600 truncate">
                ✓ {p}
              </li>
            ))}
          </ul>
        )}
      </div>
      {gambar ? (
        <img src={gambar} alt="" className="w-32 h-24 object-cover object-top border border-slate-200 rounded" />
      ) : (
        <span className="w-32 h-24 rounded border border-dashed border-slate-300 text-[11px] text-slate-400 flex items-center justify-center text-center p-2">
          Tanpa gambar
        </span>
      )}
    </div>
  )
}

function FormManfaat({ item, onClose, onTersimpan }) {
  const form = useFormItem(
    'manfaat',
    item,
    {
      peran: item.peran || '',
      judul: item.judul || '',
      teks: item.teks || '',
      poin: item.poin?.length ? item.poin : [''],
      gambar_bawaan: item.gambar_bawaan || '',
      urutan: item.urutan ?? '',
      aktif: item.aktif ?? true,
    },
    onTersimpan,
  )
  const { f, set, setF } = form

  return (
    <Modal judul={item.id ? 'Ubah Manfaat' : 'Tambah Manfaat'} onClose={onClose} lebar="max-w-2xl">
      <div className="border border-navy/10 bg-white rounded-lg">
        <PratinjauManfaat manfaat={f} gambar={form.gambarUnggahan || srcBawaan(f.gambar_bawaan)} />
      </div>
      <p className="text-[11px] text-navy/40 mt-1 mb-4">Pratinjau</p>

      {form.error && <p className="text-red-600 text-sm mb-3 whitespace-pre-line">{form.error}</p>}

      <form onSubmit={form.simpan} className="grid sm:grid-cols-2 gap-3">
        <Bidang label="Nama tab (peran) *">
          <input required maxLength={40} value={f.peran} onChange={set('peran')} className="input" placeholder="mis. Guru" />
        </Bidang>
        <Bidang label="Judul *">
          <input required maxLength={100} value={f.judul} onChange={set('judul')} className="input" placeholder="Absensi Digital untuk Guru" />
        </Bidang>
        <Bidang label="Teks *" className="sm:col-span-2">
          <textarea required maxLength={400} rows={3} value={f.teks} onChange={set('teks')} className="input resize-none" />
        </Bidang>
        <div className="sm:col-span-2">
          <span className="block text-xs font-semibold text-navy/70 mb-1">Poin manfaat (maks. 6)</span>
          <InputDaftar
            nilai={f.poin}
            onChange={(poin) => setF((p) => ({ ...p, poin }))}
            maks={6}
            maxLength={80}
            placeholder="mis. Input nilai, tugas & ujian online"
          />
        </div>
        <Bidang label="Tangkapan layar bawaan">
          <select value={f.gambar_bawaan} onChange={set('gambar_bawaan')} className="input">
            <option value="">— Tanpa gambar bawaan —</option>
            {TANGKAPAN_BAWAAN.map((x) => (
              <option key={x.key} value={x.key}>
                {x.label}
              </option>
            ))}
          </select>
          <span className="block text-[11px] text-navy/40 mt-1">Tangkapan layar asli aplikasi; dipakai bila tidak ada gambar unggahan.</span>
        </Bidang>
        <BidangGambar
          form={form}
          item={item}
          label="Gambar unggahan (opsional, maks. 4 MB)"
          teksHapus="Hapus gambar (pakai tangkapan bawaan)"
        />
        <KolomUrutanAktif form={form} />
        <TombolForm onClose={onClose} saving={form.saving} />
      </form>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/* Testimoni                                                           */
/* ------------------------------------------------------------------ */

function DaftarTestimoni({ testimoni, onBerubah }) {
  const [edit, setEdit] = useState(null)
  const [hapus, setHapus] = useState(null)
  const [sibuk, setSibuk] = useState(false)
  const [error, setError] = useState('')

  async function konfirmasiHapus() {
    setSibuk(true)
    try {
      await api.deleteTestimoniLanding(hapus.id)
      await onBerubah()
    } catch (err) {
      setError(err.message)
    } finally {
      setSibuk(false)
      setHapus(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <p className="text-sm text-navy/50">
          Gunakan hanya testimoni asli, dengan izin orang yang bersangkutan. Bagian Testimoni tampil bila ada minimal satu yang aktif.
        </p>
        <button
          onClick={() => setEdit({})}
          className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-full shrink-0"
        >
          + Tambah Testimoni
        </button>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">Kutipan</th>
              <th className="px-4 py-3 whitespace-nowrap">Nama</th>
              <th className="px-4 py-3 whitespace-nowrap">Urutan</th>
              <th className="px-4 py-3 whitespace-nowrap">Status</th>
              <th className="px-4 py-3 whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {testimoni.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-navy/40">
                  Belum ada testimoni — bagian Testimoni tidak tampil di landing.
                </td>
              </tr>
            ) : (
              testimoni.map((t) => (
                <tr key={t.id} className="border-t border-navy/5 align-top">
                  <td className="px-4 py-3 text-navy/80 min-w-64">
                    <p className="line-clamp-2">&ldquo;{t.kutipan}&rdquo;</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-medium text-navy">{t.nama}</p>
                    <p className="text-xs text-navy/50">{[t.jabatan, t.sekolah].filter(Boolean).join(' · ')}</p>
                  </td>
                  <td className="px-4 py-3 text-navy/70">{t.urutan}</td>
                  <td className="px-4 py-3">
                    <StatusAktif aktif={t.aktif} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex gap-2">
                      <TombolKecil onClick={() => setEdit(t)}>Ubah</TombolKecil>
                      <TombolKecil bahaya onClick={() => setHapus(t)}>Hapus</TombolKecil>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {edit && (
        <FormTestimoni
          testimoni={edit}
          onClose={() => setEdit(null)}
          onTersimpan={async () => {
            setEdit(null)
            await onBerubah()
          }}
        />
      )}

      {hapus && (
        <ConfirmActionModal
          title="Hapus testimoni ini?"
          message={`Testimoni dari ${hapus.nama} akan dihapus permanen.`}
          confirmLabel="Ya, Hapus"
          tone="danger"
          loading={sibuk}
          onConfirm={konfirmasiHapus}
          onClose={() => setHapus(null)}
        />
      )}
    </div>
  )
}

function FormTestimoni({ testimoni, onClose, onTersimpan }) {
  const [f, setF] = useState({
    kutipan: testimoni.kutipan || '',
    nama: testimoni.nama || '',
    jabatan: testimoni.jabatan || '',
    sekolah: testimoni.sekolah || '',
    urutan: testimoni.urutan ?? '',
    aktif: testimoni.aktif ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  async function simpan(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.simpanTestimoniLanding(testimoni.id, { ...f, urutan: f.urutan === '' ? null : Number(f.urutan) })
      await onTersimpan()
    } catch (err) {
      setError(pesanGalat(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal judul={testimoni.id ? 'Ubah Testimoni' : 'Tambah Testimoni'} onClose={onClose}>
      {error && <p className="text-red-600 text-sm mb-3 whitespace-pre-line">{error}</p>}
      <form onSubmit={simpan} className="grid sm:grid-cols-2 gap-3">
        <Bidang label="Kutipan *" className="sm:col-span-2">
          <textarea required maxLength={600} rows={4} value={f.kutipan} onChange={set('kutipan')} className="input resize-none" />
        </Bidang>
        <Bidang label="Nama *">
          <input required maxLength={100} value={f.nama} onChange={set('nama')} className="input" />
        </Bidang>
        <Bidang label="Jabatan">
          <input maxLength={100} value={f.jabatan} onChange={set('jabatan')} className="input" placeholder="mis. Kepala Sekolah" />
        </Bidang>
        <Bidang label="Sekolah / Lembaga">
          <input maxLength={150} value={f.sekolah} onChange={set('sekolah')} className="input" />
        </Bidang>
        <Bidang label="Urutan">
          <input type="number" min={0} max={9999} value={f.urutan} onChange={set('urutan')} className="input" placeholder="Otomatis" />
        </Bidang>
        <label className="sm:col-span-2 flex items-center gap-2 text-sm text-navy/80">
          <input type="checkbox" checked={f.aktif} onChange={set('aktif')} />
          Tampilkan di landing
        </label>
        <TombolForm onClose={onClose} saving={saving} />
      </form>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/* Kontak, legal & media sosial                                        */
/* ------------------------------------------------------------------ */

const GRUP_KONTAK = [
  {
    judul: 'Kontak Tim Sales',
    ket: 'Mengaktifkan menu Kontak serta bagian "Hubungi Kami" & formulir kemitraan yang membuka WhatsApp.',
    bidang: [{ k: 'whatsapp', label: 'Nomor WhatsApp', ph: '6281234567890', ket: 'Diawali 62, tanpa + atau spasi.' }],
  },
  {
    judul: 'Informasi Perusahaan (footer)',
    ket: 'Tampil di baris paling bawah footer. Hanya isian yang diisi yang ditampilkan.',
    bidang: [
      { k: 'nama_legal', label: 'Nama Legal', ph: 'PT Nama Perusahaan' },
      { k: 'info_legal', label: 'Info Legal', ph: 'NIB 1234567890123 · NPWP 01.234.567.8-901.000' },
      { k: 'alamat', label: 'Alamat Kantor', ph: 'Jl. ...', lebar: true },
      { k: 'email', label: 'Email Resmi', ph: 'info@domain.co.id', type: 'email' },
      { k: 'telepon', label: 'Telepon Dukungan', ph: '+62 21 1234 5678' },
      { k: 'kebijakan_privasi_url', label: 'Tautan Kebijakan Privasi', ph: 'https://...', type: 'url', lebar: true },
    ],
  },
  {
    judul: 'Media Sosial',
    ket: 'Ikon di footer hanya bisa diklik bila tautannya diisi.',
    bidang: [
      { k: 'sosmed_x', label: 'X (Twitter)', ph: 'https://x.com/...', type: 'url' },
      { k: 'sosmed_instagram', label: 'Instagram', ph: 'https://instagram.com/...', type: 'url' },
      { k: 'sosmed_facebook', label: 'Facebook', ph: 'https://facebook.com/...', type: 'url' },
      { k: 'sosmed_youtube', label: 'YouTube', ph: 'https://youtube.com/@...', type: 'url' },
    ],
  },
]

function FormKontak({ awal, onTersimpan }) {
  const [f, setF] = useState(awal)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})
  const [sukses, setSukses] = useState(false)

  async function simpan(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setErrors({})
    setSukses(false)
    try {
      const hasil = await api.updatePengaturanLanding(f)
      setF(hasil)
      onTersimpan(hasil)
      setSukses(true)
    } catch (err) {
      setError(err.errors ? 'Periksa kembali isian yang ditandai.' : err.message)
      setErrors(err.errors || {})
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={simpan} className="space-y-4">
      {GRUP_KONTAK.map((g) => (
        <section key={g.judul} className="bg-white rounded-2xl border border-navy/10 p-5">
          <p className="text-sm font-bold text-navy">{g.judul}</p>
          <p className="text-xs text-navy/50 mb-4">{g.ket}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {g.bidang.map((b) => (
              <Bidang key={b.k} label={b.label} className={b.lebar ? 'sm:col-span-2' : ''}>
                <input
                  type={b.type || 'text'}
                  value={f[b.k] || ''}
                  onChange={(e) => setF((p) => ({ ...p, [b.k]: e.target.value }))}
                  placeholder={b.ph}
                  className={`input ${errors[b.k] ? '!border-red-400' : ''}`}
                />
                {errors[b.k] ? (
                  <span className="block text-xs text-red-600 mt-1">{errors[b.k][0]}</span>
                ) : (
                  b.ket && <span className="block text-xs text-navy/40 mt-1">{b.ket}</span>
                )}
              </Bidang>
            ))}
          </div>
        </section>
      ))}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-6 py-2.5 rounded-full disabled:opacity-50"
        >
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
        {sukses && <span className="text-sm text-emerald-700">Tersimpan — landing sudah diperbarui.</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </form>
  )
}

/* ------------------------------------------------------------------ */
/* Komponen bantu                                                      */
/* ------------------------------------------------------------------ */

function pesanGalat(err) {
  return err.errors ? Object.values(err.errors).flat().join('\n') : err.message
}

function Modal({ judul, onClose, children, lebar = 'max-w-lg' }) {
  return (
    <div className="fixed inset-0 z-[100] bg-teal-950/50 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div
        className={`tm-panel relative bg-gradient-to-b from-emerald-50 to-white rounded-3xl ${lebar} w-full shadow-2xl shadow-teal-900/20 p-6 max-h-[92vh] overflow-y-auto`}
      >
        <ModalCloseButton onClose={onClose} />
        <h2 className="text-lg font-bold text-navy mb-4">{judul}</h2>
        {children}
      </div>
    </div>
  )
}

function Bidang({ label, className = '', children }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-semibold text-navy/70 mb-1">{label}</span>
      {children}
    </label>
  )
}

function TombolForm({ onClose, saving }) {
  return (
    <div className="sm:col-span-full flex justify-end gap-3 pt-2">
      <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-navy/70 hover:text-navy">
        Batal
      </button>
      <button
        type="submit"
        disabled={saving}
        className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2 rounded-md disabled:opacity-50"
      >
        {saving ? 'Menyimpan...' : 'Simpan'}
      </button>
    </div>
  )
}

function TombolKecil({ bahaya = false, ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
        bahaya ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-navy/15 text-navy hover:bg-navy/5'
      }`}
    />
  )
}

function StatusAktif({ aktif }) {
  return (
    <span
      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
        aktif ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
      }`}
    >
      {aktif ? 'Tampil' : 'Disembunyikan'}
    </span>
  )
}

function Kosong({ teks }) {
  return <p className="bg-white rounded-2xl border border-navy/10 px-4 py-8 text-center text-sm text-navy/40">{teks}</p>
}

function LayoutIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M9 9v11" />
    </svg>
  )
}
