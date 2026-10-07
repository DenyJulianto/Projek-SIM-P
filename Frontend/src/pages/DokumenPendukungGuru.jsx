import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { kelasDiajar, mapelDiajar } from '../lib/sumberProgram'
import { ModalKonfirmasi, TombolUnduh } from './ModulAjarManagement'
import ProgramSemesterManagement from './ProgramSemesterManagement'
import ProgramTahunanManagement from './ProgramTahunanManagement'

// Dokumen pendukung modul ajar untuk Guru Mapel & Wali Kelas: Silabus,
// Pemetaan ATP, Jurnal Harian (isian bisa diambil dari Modul Ajar), serta
// Program Semester & Program Tahunan (diverifikasi Waka Kurikulum).

const KARTU = 'bg-white rounded-2xl border border-slate-200 shadow-sm'
const INPUT =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100 disabled:text-slate-500'
const TOMBOL_UTAMA =
  'rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed'
const TOMBOL_KEDUA =
  'rounded-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-sm font-semibold px-4 py-2.5 disabled:opacity-50'

const TAB = [
  { key: 'silabus', label: 'Silabus', ket: 'CP, TP, Profil Pelajar Pancasila, materi, kegiatan, asesmen, alokasi waktu, dan media per topik.' },
  { key: 'pemetaan_atp', label: 'Pemetaan ATP', ket: 'Matriks alur tujuan pembelajaran: ATP mana diajarkan di pertemuan ke berapa.' },
  { key: 'jurnal', label: 'Jurnal Harian', ket: 'Catatan pelaksanaan tiap pertemuan: tanggal, ATP, materi, asesmen, kehadiran, dan kendala.' },
  { key: 'program-semester', label: 'Program Semester' },
  { key: 'program-tahunan', label: 'Program Tahunan' },
]
const LABEL = Object.fromEntries(TAB.map((t) => [t.key, t.label]))
const TERLAKSANA = { ya: 'Terlaksana', sebagian: 'Sebagian', tidak: 'Tidak terlaksana' }

function barisKosong(jenis) {
  if (jenis === 'silabus') return { elemen: '', cp: '', tp: '', profil: [], materi: '', kegiatan: '', asesmen: '', alokasi: '', media: '' }
  if (jenis === 'pemetaan_atp') return { elemen: '', tp: '', atp: '', alokasi_jp: '', pertemuan: [] }
  return { tanggal: new Date().toISOString().slice(0, 10), pertemuan_ke: '', jam_ke: '', atp: '', materi: '', asesmen: '', hadir: '', tidak_hadir: '', terlaksana: '', catatan: '' }
}

function dataKosong(jenis) {
  if (jenis === 'silabus') return { cp_umum: '', catatan: '', baris: [barisKosong(jenis)] }
  if (jenis === 'pemetaan_atp') return { jumlah_pertemuan: 8, catatan: '', baris: [barisKosong(jenis)] }
  return { catatan: '', baris: [barisKosong(jenis)] }
}

// Baris dari server (angka null) diseragamkan supaya input terkendali.
function untukForm(data) {
  return {
    ...data,
    baris: (data.baris || []).map((b) => Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v ?? '']))),
  }
}

function namaFile(d, format) {
  const bagian = [d.jenis.replace('_', '-'), d.mata_pelajaran?.nama_mapel, d.kelas?.nama_kelas, d.semester]
  return `${bagian.filter(Boolean).join('-').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${format}`
}

export default function DokumenPendukungGuru({ onBack }) {
  const [tab, setTab] = useState('silabus')
  const [opsi, setOpsi] = useState(null)
  const [error, setError] = useState('')
  const [editor, setEditor] = useState(null)

  useEffect(() => {
    api.getOpsiDokumenPendukung().then(setOpsi).catch((e) => setError(e.message))
  }, [])

  if (editor) {
    return (
      <Latar>
        <EditorDokumen
          jenis={editor.jenis}
          dokumen={editor.dokumen}
          opsi={opsi}
          onTutup={() => setEditor(null)}
        />
      </Latar>
    )
  }

  const info = TAB.find((t) => t.key === tab)
  return (
    <Latar>
      <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-800 mb-1 block">
        ← Kembali ke Dashboard
      </button>
      <h1 className="text-xl font-extrabold text-slate-900">Dokumen Pendukung</h1>
      <p className="text-sm text-slate-500 mt-0.5 mb-5 max-w-2xl">
        Pelengkap Modul Ajar: Silabus, Pemetaan ATP, Jurnal Harian, Program Semester, dan Program Tahunan untuk kelas dan mata pelajaran yang Anda ajar.
      </p>

      <div className={`${KARTU} p-1.5 mb-5 flex flex-wrap gap-1`} role="tablist">
        {TAB.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`text-sm font-semibold px-4 py-2 rounded-xl ${tab === t.key ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">{error}</p>}

      {tab === 'program-semester' && <ProgramSemesterManagement guru tanpaJudul />}
      {tab === 'program-tahunan' && <ProgramTahunanManagement guru tanpaJudul />}
      {info.ket && <DaftarDokumen key={tab} jenis={tab} keterangan={info.ket} opsi={opsi} onBuka={(dokumen) => setEditor({ jenis: tab, dokumen })} />}
    </Latar>
  )
}

function Latar({ children }) {
  return <div className="-m-6 sm:-m-8 p-6 sm:p-8 min-h-screen bg-slate-50">{children}</div>
}

/* ------------------------------ daftar ------------------------------ */

function DaftarDokumen({ jenis, keterangan, opsi, onBuka }) {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [hapus, setHapus] = useState(null)
  const [sibuk, setSibuk] = useState(false)

  const muat = useCallback(() => {
    api
      .listDokumenPendukung(jenis)
      .then(setItems)
      .catch((e) => {
        setItems([])
        setError(e.message)
      })
  }, [jenis])

  useEffect(() => {
    muat()
  }, [muat])

  async function konfirmasiHapus() {
    setSibuk(true)
    try {
      await api.deleteDokumenPendukung(hapus.id)
      setHapus(null)
      muat()
    } catch (e) {
      setError(e.message)
    } finally {
      setSibuk(false)
    }
  }

  const tanpaJadwal = opsi && opsi.mengajar.length === 0
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-sm text-slate-500 max-w-xl">{keterangan}</p>
        <button onClick={() => onBuka(null)} disabled={!opsi || tanpaJadwal} className={TOMBOL_UTAMA}>
          + Buat {LABEL[jenis]}
        </button>
      </div>
      {error && <p className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">{error}</p>}
      {tanpaJadwal && (
        <p className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm text-amber-800">
          Anda belum punya jadwal mengajar, jadi belum ada kelas dan mata pelajaran yang bisa dipilih. Hubungi Waka Kurikulum.
        </p>
      )}
      {items === null && <p className="text-sm text-slate-400">Memuat...</p>}
      {items?.length === 0 && (
        <div className={`${KARTU} p-10 text-center`}>
          <p className="font-semibold text-slate-700">Belum ada {LABEL[jenis]}.</p>
          <p className="text-sm text-slate-500 mt-1">Buat baru, lalu klik &ldquo;Isi dari Modul Ajar&rdquo; agar isiannya tersusun otomatis.</p>
        </div>
      )}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {(items || []).map((d) => (
          <div key={d.id} className={`${KARTU} p-5 flex flex-col`}>
            <h3 className="font-bold text-slate-900 leading-snug">
              {d.mata_pelajaran?.nama_mapel || '-'} — {d.kelas?.nama_kelas || '-'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Semester {d.semester === 'genap' ? 'Genap' : 'Ganjil'} · {d.tahun_ajaran?.nama || '-'}
            </p>
            <p className="text-[11px] text-slate-400 mt-auto pt-4">
              {d.jumlah_baris} baris · diperbarui {new Date(d.updated_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
            </p>
            <div className="flex gap-2 mt-3">
              <button onClick={() => onBuka(d)} className={`${TOMBOL_UTAMA} flex-1 !py-2 !text-xs`}>
                Buka / Edit
              </button>
              <button onClick={() => setHapus(d)} className="text-xs font-semibold px-3 py-2 rounded-full text-red-600 hover:bg-red-50">
                Hapus
              </button>
            </div>
            <TombolUnduh kecil unduh={(f) => api.unduhDokumenPendukung(d.id, f, namaFile(d, f))} />
          </div>
        ))}
      </div>
      {hapus && (
        <ModalKonfirmasi
          judul={`Hapus ${LABEL[jenis]}`}
          pesan={
            <>
              Yakin ingin menghapus {LABEL[jenis]} <b>{hapus.mata_pelajaran?.nama_mapel} — {hapus.kelas?.nama_kelas}</b>? Tindakan ini tidak dapat dibatalkan.
            </>
          }
          labelYa={sibuk ? 'Menghapus...' : 'Hapus'}
          bahaya
          sibuk={sibuk}
          onBatal={() => setHapus(null)}
          onYa={konfirmasiHapus}
        />
      )}
    </div>
  )
}

/* ------------------------------ editor ------------------------------ */

function EditorDokumen({ jenis, dokumen, opsi, onTutup }) {
  const [id, setId] = useState(dokumen?.id ?? null)
  const [tersimpan, setTersimpan] = useState(dokumen || null)
  const [kepala, setKepala] = useState({
    tahun_ajaran_id: dokumen?.tahun_ajaran_id ?? opsi?.tahun_ajaran_aktif ?? '',
    mata_pelajaran_id: dokumen?.mata_pelajaran_id ?? (opsi?.mengajar.length === 1 ? opsi.mengajar[0].mata_pelajaran_id : ''),
    kelas_id: dokumen?.kelas_id ?? '',
    semester: dokumen?.semester ?? 'ganjil',
  })
  const [data, setData] = useState(() => (dokumen ? untukForm(dokumen.data) : dataKosong(jenis)))
  const [simpan, setSimpan] = useState({ sibuk: false, pesan: '', error: '' })
  const [sumber, setSumber] = useState({ sibuk: false, pesan: '' })
  const [gantiDenganSumber, setGantiDenganSumber] = useState(null)

  const mengajar = opsi?.mengajar || []
  const pilihanKelas = kelasDiajar(mengajar, kepala.mata_pelajaran_id)
  const lengkap = kepala.tahun_ajaran_id && kepala.mata_pelajaran_id && kepala.kelas_id && kepala.semester

  function ubahKepala(field, value) {
    setKepala((k) => {
      const baru = { ...k, [field]: value }
      if (!kelasDiajar(mengajar, baru.mata_pelajaran_id).some((x) => String(x.id) === String(baru.kelas_id))) baru.kelas_id = ''
      return baru
    })
  }

  const ubahData = (field, value) => setData((d) => ({ ...d, [field]: value }))
  const ubahBaris = (i, patch) => setData((d) => ({ ...d, baris: d.baris.map((b, j) => (j === i ? { ...b, ...patch } : b)) }))
  const hapusBaris = (i) => setData((d) => ({ ...d, baris: d.baris.filter((_, j) => j !== i) }))
  const tambahBaris = () => setData((d) => ({ ...d, baris: [...d.baris, barisKosong(jenis)] }))
  function geserBaris(i, arah) {
    setData((d) => {
      const baris = [...d.baris]
      const j = i + arah
      if (j < 0 || j >= baris.length) return d
      ;[baris[i], baris[j]] = [baris[j], baris[i]]
      return { ...d, baris }
    })
  }

  async function ambilSumber() {
    setSumber({ sibuk: true, pesan: '' })
    try {
      const r = await api.getSumberDokumenPendukung({ jenis, kelas_id: kepala.kelas_id, mata_pelajaran_id: kepala.mata_pelajaran_id, semester: kepala.semester })
      if (!r.data.baris.length) {
        setSumber({ sibuk: false, pesan: r.asal })
        return
      }
      const adaIsian = data.baris.some((b) => Object.entries(b).some(([k, v]) => k !== 'tanggal' && (Array.isArray(v) ? v.length : v !== '')))
      if (adaIsian) setGantiDenganSumber(r)
      else terapkanSumber(r)
      setSumber({ sibuk: false, pesan: '' })
    } catch (e) {
      setSumber({ sibuk: false, pesan: e.message })
    }
  }

  function terapkanSumber(r) {
    setData((d) => ({ ...untukForm(r.data), catatan: d.catatan, ...(jenis === 'silabus' && !r.data.cp_umum ? { cp_umum: d.cp_umum } : {}) }))
    setSumber({ sibuk: false, pesan: r.asal })
    setGantiDenganSumber(null)
  }

  async function isiKehadiran() {
    const tanggal = [...new Set(data.baris.map((b) => b.tanggal).filter(Boolean))]
    if (!tanggal.length) {
      setSumber({ sibuk: false, pesan: 'Isi tanggal pelaksanaan dulu pada baris jurnal.' })
      return
    }
    setSumber({ sibuk: true, pesan: '' })
    try {
      const rekap = await api.getKehadiranDokumenPendukung(kepala.kelas_id, tanggal)
      setData((d) => ({
        ...d,
        baris: d.baris.map((b) => {
          const r = rekap[b.tanggal]
          if (!r) return b
          return { ...b, hadir: r.hadir, tidak_hadir: r.tidak_hadir }
        }),
      }))
      const ada = Object.keys(rekap).length
      setSumber({
        sibuk: false,
        pesan: ada
          ? `Kehadiran diisi dari absensi harian kelas untuk ${ada} tanggal.`
          : 'Belum ada absensi harian kelas pada tanggal-tanggal tersebut.',
      })
    } catch (e) {
      setSumber({ sibuk: false, pesan: e.message })
    }
  }

  async function simpanDokumen() {
    setSimpan({ sibuk: true, pesan: '', error: '' })
    const body = { ...kepala, jenis, data }
    try {
      const r = id ? await api.updateDokumenPendukung(id, body) : await api.createDokumenPendukung(body)
      setId(r.id)
      setTersimpan(r)
      setData(untukForm(r.data))
      setSimpan({ sibuk: false, pesan: 'Tersimpan.', error: '' })
    } catch (e) {
      setSimpan({ sibuk: false, pesan: '', error: e.message })
    }
  }

  return (
    <div>
      <button onClick={onTutup} className="text-sm text-slate-500 hover:text-slate-800 mb-1 block">
        ← Kembali ke daftar {LABEL[jenis]}
      </button>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <h1 className="text-xl font-extrabold text-slate-900">
          {id ? 'Ubah' : 'Buat'} {LABEL[jenis]}
        </h1>
        {id && tersimpan && <TombolUnduh unduh={(f) => api.unduhDokumenPendukung(id, f, namaFile(tersimpan, f))} />}
      </div>

      <div className={`${KARTU} p-5 mb-5`}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Isian label="Tahun Ajaran">
            <select value={kepala.tahun_ajaran_id} onChange={(e) => ubahKepala('tahun_ajaran_id', e.target.value)} className={INPUT}>
              <option value="">Pilih tahun ajaran...</option>
              {(opsi?.tahun_ajaran || []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nama}
                  {t.is_active ? ' (aktif)' : ''}
                </option>
              ))}
            </select>
          </Isian>
          <Isian label="Mata Pelajaran">
            <select value={kepala.mata_pelajaran_id} onChange={(e) => ubahKepala('mata_pelajaran_id', e.target.value)} className={INPUT}>
              <option value="">Pilih mata pelajaran...</option>
              {mapelDiajar(mengajar).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nama_mapel}
                </option>
              ))}
            </select>
          </Isian>
          <Isian label="Kelas">
            <select value={kepala.kelas_id} onChange={(e) => ubahKepala('kelas_id', e.target.value)} className={INPUT} disabled={!kepala.mata_pelajaran_id}>
              <option value="">{kepala.mata_pelajaran_id ? 'Pilih kelas...' : 'Pilih mata pelajaran dulu'}</option>
              {pilihanKelas.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama_kelas}
                  {k.fase ? ` (Fase ${k.fase})` : ''}
                </option>
              ))}
            </select>
          </Isian>
          <Isian label="Semester">
            <select value={kepala.semester} onChange={(e) => ubahKepala('semester', e.target.value)} className={INPUT}>
              <option value="ganjil">Ganjil</option>
              <option value="genap">Genap</option>
            </select>
          </Isian>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-100">
          <button onClick={ambilSumber} disabled={!lengkap || sumber.sibuk} className={TOMBOL_KEDUA}>
            {sumber.sibuk ? 'Mengambil...' : '↻ Isi dari Modul Ajar'}
          </button>
          {jenis === 'jurnal' && (
            <button onClick={isiKehadiran} disabled={!kepala.kelas_id || sumber.sibuk} className={TOMBOL_KEDUA}>
              Isi kehadiran dari absensi
            </button>
          )}
          <p className="text-xs text-slate-500 flex-1 min-w-[220px]">
            {sumber.pesan ||
              (lengkap
                ? 'Mengambil CP, TP, ATP, dan pertemuan dari Modul Ajar Anda untuk kelas & semester ini (atau CP/TP Kurikulum bila belum ada modul).'
                : 'Pilih tahun ajaran, mata pelajaran, kelas, dan semester terlebih dahulu.')}
          </p>
        </div>
      </div>

      {jenis === 'silabus' && (
        <div className={`${KARTU} p-5 mb-5`}>
          <Isian label="Capaian Pembelajaran fase (umum)">
            <textarea rows={3} value={data.cp_umum} onChange={(e) => ubahData('cp_umum', e.target.value)} className={INPUT} />
          </Isian>
        </div>
      )}

      {jenis === 'pemetaan_atp' ? (
        <TabelPemetaan data={data} ubahData={ubahData} ubahBaris={ubahBaris} hapusBaris={hapusBaris} />
      ) : (
        <div className="space-y-4">
          {data.baris.map((b, i) => (
            <div key={i} className={`${KARTU} p-5`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-slate-800">
                  {jenis === 'silabus' ? `Topik / Unit ${i + 1}` : `Pertemuan${b.pertemuan_ke ? ` ke-${b.pertemuan_ke}` : ''} (baris ${i + 1})`}
                </p>
                <AksiBaris i={i} jumlah={data.baris.length} onGeser={geserBaris} onHapus={hapusBaris} />
              </div>
              {jenis === 'silabus' ? (
                <BarisSilabus b={b} ubah={(p) => ubahBaris(i, p)} profil={opsi?.profil_pelajar || []} />
              ) : (
                <BarisJurnal b={b} ubah={(p) => ubahBaris(i, p)} />
              )}
            </div>
          ))}
        </div>
      )}
      <button onClick={tambahBaris} className={`${TOMBOL_KEDUA} mt-4`}>
        + Tambah {jenis === 'silabus' ? 'topik' : jenis === 'jurnal' ? 'pertemuan' : 'baris ATP'}
      </button>

      <div className={`${KARTU} p-5 mt-5`}>
        <Isian label="Catatan (opsional)">
          <textarea rows={2} value={data.catatan} onChange={(e) => ubahData('catatan', e.target.value)} className={INPUT} />
        </Isian>
      </div>

      <div className="sticky bottom-0 -mx-6 sm:-mx-8 mt-6 px-6 sm:px-8 py-3 bg-white/95 backdrop-blur border-t border-slate-200 flex flex-wrap items-center justify-end gap-3">
        {simpan.error && <p className="text-sm text-red-600 mr-auto">{simpan.error}</p>}
        {simpan.pesan && <p className="text-sm text-emerald-700 mr-auto">{simpan.pesan}</p>}
        <button onClick={onTutup} className={TOMBOL_KEDUA}>
          Tutup
        </button>
        <button onClick={simpanDokumen} disabled={!lengkap || simpan.sibuk} className={TOMBOL_UTAMA}>
          {simpan.sibuk ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>

      {gantiDenganSumber && (
        <ModalKonfirmasi
          judul="Ganti isian yang ada?"
          pesan={`${gantiDenganSumber.asal} Isian tabel saat ini (${data.baris.length} baris) akan diganti dengan ${gantiDenganSumber.data.baris.length} baris hasil ini. Catatan tetap dipertahankan.`}
          labelYa="Ganti isian"
          onBatal={() => setGantiDenganSumber(null)}
          onYa={() => terapkanSumber(gantiDenganSumber)}
        />
      )}
    </div>
  )
}

function Isian({ label, bantu, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-600 mb-1">{label}</span>
      {children}
      {bantu && <span className="block text-[11px] text-slate-400 mt-1">{bantu}</span>}
    </label>
  )
}

function AksiBaris({ i, jumlah, onGeser, onHapus }) {
  const kelas = 'h-8 w-8 rounded-full text-slate-500 hover:bg-slate-100 disabled:opacity-30'
  return (
    <div className="flex items-center gap-1 shrink-0">
      <button type="button" onClick={() => onGeser(i, -1)} disabled={i === 0} className={kelas} aria-label="Naikkan">
        ↑
      </button>
      <button type="button" onClick={() => onGeser(i, 1)} disabled={i === jumlah - 1} className={kelas} aria-label="Turunkan">
        ↓
      </button>
      <button type="button" onClick={() => onHapus(i)} className="h-8 w-8 rounded-full text-red-500 hover:bg-red-50 text-lg leading-none" aria-label="Hapus baris">
        &times;
      </button>
    </div>
  )
}

function BarisSilabus({ b, ubah, profil }) {
  const teks = (field, label, rows = 3, bantu) => (
    <Isian label={label} bantu={bantu}>
      <textarea rows={rows} value={b[field]} onChange={(e) => ubah({ [field]: e.target.value })} className={INPUT} />
    </Isian>
  )
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Isian label="Elemen">
        <input value={b.elemen} onChange={(e) => ubah({ elemen: e.target.value })} className={INPUT} placeholder="mis. Menyimak, Membaca dan Memirsa" />
      </Isian>
      <Isian label="Alokasi Waktu">
        <input value={b.alokasi} onChange={(e) => ubah({ alokasi: e.target.value })} className={INPUT} placeholder="mis. 4 JP (2 pertemuan)" />
      </Isian>
      {teks('cp', 'Capaian Pembelajaran')}
      {teks('tp', 'Tujuan Pembelajaran', 3, 'Satu tujuan per baris.')}
      {teks('materi', 'Materi Pokok')}
      {teks('kegiatan', 'Kegiatan Pembelajaran')}
      {teks('asesmen', 'Asesmen', 3, 'Diagnostik, formatif, sumatif.')}
      {teks('media', 'Media / Sumber Belajar')}
      <div className="md:col-span-2">
        <span className="block text-xs font-semibold text-slate-600 mb-1.5">Profil Pelajar Pancasila</span>
        <div className="flex flex-wrap gap-2">
          {profil.map((p) => {
            const aktif = b.profil.includes(p)
            return (
              <button
                key={p}
                type="button"
                onClick={() => ubah({ profil: aktif ? b.profil.filter((x) => x !== p) : [...b.profil, p] })}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
                  aktif ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-300 text-slate-600 hover:border-emerald-400'
                }`}
              >
                {p}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function BarisJurnal({ b, ubah }) {
  const teks = (field, label, placeholder) => (
    <Isian label={label}>
      <textarea rows={2} value={b[field]} onChange={(e) => ubah({ [field]: e.target.value })} className={INPUT} placeholder={placeholder} />
    </Isian>
  )
  const angka = (field) => (e) => ubah({ [field]: e.target.value === '' ? '' : Math.max(0, Number(e.target.value)) })
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="col-span-2">
          <Isian label="Tanggal pelaksanaan">
            <input type="date" value={b.tanggal} onChange={(e) => ubah({ tanggal: e.target.value })} className={INPUT} />
          </Isian>
        </div>
        <Isian label="Pertemuan ke">
          <input type="number" min="1" value={b.pertemuan_ke} onChange={angka('pertemuan_ke')} className={INPUT} />
        </Isian>
        <Isian label="Jam ke">
          <input value={b.jam_ke} onChange={(e) => ubah({ jam_ke: e.target.value })} className={INPUT} placeholder="mis. 3-4" />
        </Isian>
        <Isian label="Hadir">
          <input type="number" min="0" value={b.hadir} onChange={angka('hadir')} className={INPUT} />
        </Isian>
        <Isian label="Tidak hadir">
          <input type="number" min="0" value={b.tidak_hadir} onChange={angka('tidak_hadir')} className={INPUT} />
        </Isian>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {teks('atp', 'ATP / Tujuan Pembelajaran')}
        {teks('materi', 'Materi')}
        {teks('asesmen', 'Asesmen', 'mis. Formatif: kuis 5 soal')}
        {teks('catatan', 'Catatan / Kendala', 'mis. 3 siswa belum tuntas, remedial pertemuan berikutnya')}
      </div>
      <Isian label="Keterlaksanaan">
        <select value={b.terlaksana} onChange={(e) => ubah({ terlaksana: e.target.value })} className={`${INPUT} sm:w-60`}>
          <option value="">Belum diisi</option>
          {Object.entries(TERLAKSANA).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </Isian>
    </div>
  )
}

function TabelPemetaan({ data, ubahData, ubahBaris, hapusBaris }) {
  const jumlah = Number(data.jumlah_pertemuan) || 1
  const pertemuan = Array.from({ length: jumlah }, (_, i) => i + 1)

  function ubahJumlah(v) {
    const n = Math.min(60, Math.max(1, Number(v) || 1))
    ubahData('jumlah_pertemuan', n)
  }

  function centang(i, p) {
    const b = data.baris[i]
    ubahBaris(i, { pertemuan: b.pertemuan.includes(p) ? b.pertemuan.filter((x) => x !== p) : [...b.pertemuan, p].sort((x, y) => x - y) })
  }

  const sel = 'w-full min-w-0 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-emerald-500 resize-y'
  return (
    <div className={`${KARTU} p-5`}>
      <div className="flex flex-wrap items-end gap-4 mb-4">
        <Isian label="Jumlah pertemuan dalam semester" bantu="Kolom P1, P2, … pada matriks. Centang pertemuan saat ATP diajarkan.">
          <input type="number" min="1" max="60" value={data.jumlah_pertemuan} onChange={(e) => ubahJumlah(e.target.value)} className={`${INPUT} w-32`} />
        </Isian>
        <p className="text-xs text-slate-500 max-w-md pb-1">
          Tulis ATP dengan pola <i>&ldquo;Melalui kegiatan …, peserta didik dapat …&rdquo;</i>.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="text-sm border-collapse" style={{ minWidth: 760 + jumlah * 34 }}>
          <thead>
            <tr className="text-[11px] uppercase text-slate-500 text-left">
              <th className="py-2 pr-2 w-8">No</th>
              <th className="py-2 pr-2 w-36">Elemen</th>
              <th className="py-2 pr-2 w-56">Tujuan Pembelajaran</th>
              <th className="py-2 pr-2 w-72">Alur Tujuan Pembelajaran</th>
              <th className="py-2 pr-2 w-16">JP</th>
              {pertemuan.map((p) => (
                <th key={p} className="py-2 w-8 text-center">
                  P{p}
                </th>
              ))}
              <th className="py-2 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.baris.map((b, i) => (
              <tr key={i} className="align-top">
                <td className="py-2 pr-2 text-xs text-slate-500 pt-3">{i + 1}</td>
                <td className="py-2 pr-2">
                  <textarea rows={2} value={b.elemen} onChange={(e) => ubahBaris(i, { elemen: e.target.value })} className={sel} />
                </td>
                <td className="py-2 pr-2">
                  <textarea rows={3} value={b.tp} onChange={(e) => ubahBaris(i, { tp: e.target.value })} className={sel} />
                </td>
                <td className="py-2 pr-2">
                  <textarea rows={3} value={b.atp} onChange={(e) => ubahBaris(i, { atp: e.target.value })} className={sel} />
                </td>
                <td className="py-2 pr-2">
                  <input
                    type="number"
                    min="0"
                    value={b.alokasi_jp}
                    onChange={(e) => ubahBaris(i, { alokasi_jp: e.target.value === '' ? '' : Math.max(0, Number(e.target.value)) })}
                    className={sel}
                  />
                </td>
                {pertemuan.map((p) => (
                  <td key={p} className="py-2 text-center">
                    <input
                      type="checkbox"
                      checked={b.pertemuan.includes(p)}
                      onChange={() => centang(i, p)}
                      aria-label={`ATP ${i + 1} di pertemuan ${p}`}
                      className="h-4 w-4 accent-emerald-600 mt-2"
                    />
                  </td>
                ))}
                <td className="py-2 text-center">
                  <button type="button" onClick={() => hapusBaris(i)} className="h-8 w-8 rounded-full text-red-500 hover:bg-red-50 text-lg leading-none" aria-label="Hapus baris">
                    &times;
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.baris.some((b) => b.pertemuan.some((p) => p > jumlah)) && (
        <p className="text-xs text-amber-700 mt-2">Sebagian centang berada di luar jumlah pertemuan dan akan dibuang saat disimpan.</p>
      )}
    </div>
  )
}
