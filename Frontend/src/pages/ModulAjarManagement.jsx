import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { api } from '../lib/api'

const GLASS = 'bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm'

const P3_OPTIONS = [
  'Beriman, bertakwa kepada Tuhan YME, dan berakhlak mulia',
  'Berkebinekaan global',
  'Bergotong royong',
  'Mandiri',
  'Bernalar kritis',
  'Kreatif',
]

const TARGET_OPTIONS = [
  'Siswa reguler / tipikal',
  'Siswa dengan kesulitan belajar',
  'Siswa dengan pencapaian tinggi',
]

const KURIKULUM_META = {
  merdeka: { label: 'Kurikulum Merdeka', short: 'Modul Ajar', badge: 'bg-teal-100 text-teal-800' },
  k13: { label: 'Kurikulum 2013', short: 'RPP 1 Lembar', badge: 'bg-amber-100 text-amber-800' },
}

const SECTIONS = {
  merdeka: [
    {
      title: 'Informasi Umum',
      fields: [
        { k: 'nama_guru', label: 'Nama Guru' },
        { k: 'institusi', label: 'Institusi / Sekolah' },
        { k: 'tahun_penyusunan', label: 'Tahun Penyusunan' },
        { k: 'jenjang', label: 'Jenjang Sekolah', type: 'select', options: ['SD', 'SMP', 'SMA', 'SMK'] },
        { k: 'fase', label: 'Fase', type: 'select', options: ['A', 'B', 'C', 'D', 'E', 'F'] },
        { k: 'alokasi_waktu', label: 'Alokasi Waktu', placeholder: 'mis. 2 x 40 menit' },
      ],
    },
    {
      title: 'Kompetensi Awal',
      fields: [{ k: 'kompetensi_awal', label: 'Kemampuan awal yang perlu dimiliki siswa', type: 'textarea' }],
    },
    {
      title: 'Profil Pelajar Pancasila',
      fields: [{ k: 'profil_pelajar', label: 'Karakter yang ditanamkan', type: 'checks', options: P3_OPTIONS }],
    },
    {
      title: 'Sarana & Prasarana',
      fields: [{ k: 'sarana_prasarana', label: 'Media, alat, dan bahan ajar', type: 'textarea' }],
    },
    {
      title: 'Target Peserta Didik',
      fields: [{ k: 'target_peserta', label: 'Kategori siswa', type: 'checks', options: TARGET_OPTIONS }],
    },
    {
      title: 'Tujuan Pembelajaran (TP)',
      fields: [{ k: 'tujuan_pembelajaran', label: 'Target konkret yang harus dicapai siswa', type: 'textarea', rows: 4 }],
    },
    {
      title: 'Pemahaman Bermakna',
      fields: [{ k: 'pemahaman_bermakna', label: 'Manfaat nyata bagi kehidupan sehari-hari', type: 'textarea' }],
    },
    {
      title: 'Pertanyaan Pemantik',
      fields: [{ k: 'pertanyaan_pemantik', label: 'Pertanyaan pembuka untuk memancing rasa ingin tahu', type: 'textarea' }],
    },
    {
      title: 'Kegiatan Pembelajaran',
      fields: [
        { k: 'pendahuluan', label: 'Pendahuluan', type: 'textarea', rows: 4 },
        { k: 'kegiatan_inti', label: 'Kegiatan Inti', type: 'textarea', rows: 6 },
        { k: 'penutup', label: 'Penutup', type: 'textarea', rows: 4 },
        { k: 'strategi_diferensiasi', label: 'Strategi Diferensiasi', type: 'textarea' },
      ],
    },
    {
      title: 'Asesmen (Penilaian)',
      fields: [
        { k: 'asesmen_diagnostik', label: 'Asesmen Diagnostik (awal)', type: 'textarea' },
        { k: 'asesmen_formatif', label: 'Asesmen Formatif (proses)', type: 'textarea' },
        { k: 'asesmen_sumatif', label: 'Asesmen Sumatif (akhir)', type: 'textarea' },
        { k: 'kktp', label: 'KKTP (Kriteria Ketercapaian Tujuan Pembelajaran)', type: 'textarea' },
      ],
    },
    {
      title: 'Pengayaan & Remedial',
      fields: [
        { k: 'pengayaan', label: 'Pengayaan (siswa yang cepat belajar)', type: 'textarea' },
        { k: 'remedial', label: 'Remedial (siswa yang butuh bimbingan)', type: 'textarea' },
      ],
    },
    {
      title: 'Glosarium & Daftar Pustaka',
      fields: [
        { k: 'glosarium', label: 'Glosarium', type: 'textarea' },
        { k: 'daftar_pustaka', label: 'Daftar Pustaka', type: 'textarea' },
      ],
    },
  ],
  k13: [
    {
      title: 'Identitas RPP',
      fields: [
        { k: 'nama_sekolah', label: 'Nama Sekolah' },
        { k: 'materi_pokok', label: 'Materi Pokok' },
        { k: 'alokasi_waktu', label: 'Alokasi Waktu', placeholder: 'mis. 2 x 45 menit' },
      ],
    },
    {
      title: 'Komponen 1: Tujuan Pembelajaran',
      fields: [
        { k: 'kompetensi_dasar', label: 'Kompetensi Dasar (KD)', type: 'textarea' },
        {
          k: 'tujuan_pembelajaran',
          label: 'Tujuan Pembelajaran (gunakan kata kerja operasional yang terukur)',
          type: 'textarea',
          rows: 4,
        },
        { k: 'kkm', label: 'KKM', placeholder: 'mis. 75' },
      ],
    },
    {
      title: 'Komponen 2: Langkah-Langkah Pembelajaran',
      fields: [
        { k: 'pendahuluan', label: 'Pendahuluan (apersepsi, motivasi, penyampaian tujuan)', type: 'textarea', rows: 4 },
        { k: 'model_pembelajaran', label: 'Model Pembelajaran', placeholder: 'mis. Problem Based Learning' },
        { k: 'kegiatan_inti', label: 'Kegiatan Inti (eksplorasi materi)', type: 'textarea', rows: 6 },
        { k: 'penutup', label: 'Penutup (kesimpulan, refleksi, materi pertemuan berikutnya)', type: 'textarea', rows: 4 },
      ],
    },
    {
      title: 'Komponen 3: Penilaian Pembelajaran',
      fields: [
        { k: 'penilaian_sikap', label: 'Penilaian Sikap (observasi)', type: 'textarea' },
        { k: 'penilaian_pengetahuan', label: 'Penilaian Pengetahuan (tes tertulis / lisan)', type: 'textarea' },
        { k: 'penilaian_keterampilan', label: 'Penilaian Keterampilan (unjuk kerja / proyek)', type: 'textarea' },
      ],
    },
  ],
}

function formatDate(v) {
  return v ? new Date(v).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-'
}

export default function ModulAjarManagement({ onBack }) {
  const [items, setItems] = useState(null)
  const [mode, setMode] = useState('list')
  const [pickKurikulum, setPickKurikulum] = useState(false)
  const [editing, setEditing] = useState(null)
  const [kurikulumBaru, setKurikulumBaru] = useState('merdeka')
  const [viewing, setViewing] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [filter, setFilter] = useState('semua')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  function load() {
    api.listModulAjar().then(setItems).catch((e) => {
      setItems([])
      setError(e.message)
    })
  }

  useEffect(load, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (items || [])
      .filter((m) => filter === 'semua' || m.kurikulum === filter)
      .filter((m) => !q || `${m.judul} ${m.mata_pelajaran || ''} ${m.kelas || ''}`.toLowerCase().includes(q))
  }, [items, filter, search])

  async function confirmDelete() {
    setDeleting(true)
    try {
      await api.deleteModulAjar(toDelete.id)
      setItems((list) => list.filter((m) => m.id !== toDelete.id))
      setToDelete(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setDeleting(false)
    }
  }

  if (mode === 'form') {
    return (
      <ModulAjarForm
        modul={editing}
        kurikulum={editing ? editing.kurikulum : kurikulumBaru}
        onCancel={() => setMode('list')}
        onSaved={() => {
          setMode('list')
          load()
        }}
      />
    )
  }

  return (
    <div>
      <button onClick={onBack} className="text-sm text-navy/60 hover:text-navy mb-1 block">
        ← Kembali ke Dashboard
      </button>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
        <div>
          <h1 className="text-xl font-extrabold text-navy">Manajemen RPP / Modul Ajar</h1>
          <p className="text-sm text-navy/55 mt-0.5 max-w-2xl">
            Susun perangkat ajar Anda: Modul Ajar untuk Kurikulum Merdeka atau RPP 1 lembar untuk Kurikulum 2013.
          </p>
        </div>
        <button
          onClick={() => setPickKurikulum(true)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-md shadow-teal-600/30"
        >
          + Buat Perangkat Ajar
        </button>
      </div>

      {error && <p className="text-red-700 text-sm mb-3">{error}</p>}

      <div className={`${GLASS} p-4 mb-4 flex flex-wrap items-center gap-3`}>
        <div className="flex gap-1.5">
          {[
            ['semua', 'Semua'],
            ['merdeka', 'Kurikulum Merdeka'],
            ['k13', 'Kurikulum 2013'],
          ].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              className={`text-xs font-semibold px-4 py-2 rounded-full transition-colors ${
                filter === v ? 'bg-teal-700 text-white' : 'bg-white/70 text-teal-800 hover:bg-white'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari judul, mapel, kelas..."
          className="input bg-white !w-auto flex-1 min-w-[200px] max-w-sm !rounded-full ml-auto"
        />
      </div>

      {items === null && <p className="text-sm text-navy/50 py-10 text-center">Memuat...</p>}
      {items !== null && filtered.length === 0 && (
        <div className={`${GLASS} py-14 text-center`}>
          <p className="text-sm font-bold text-navy">
            {items.length === 0 ? 'Belum ada perangkat ajar.' : 'Tidak ditemukan.'}
          </p>
          {items.length === 0 && (
            <p className="text-xs text-navy/50 mt-1">Klik &ldquo;Buat Perangkat Ajar&rdquo; untuk memulai.</p>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((m) => {
          const meta = KURIKULUM_META[m.kurikulum]
          return (
            <div key={m.id} className={`${GLASS} p-5 flex flex-col`}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${meta.badge}`}>{meta.short}</span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    m.status === 'final' ? 'bg-emerald-100 text-emerald-800' : 'bg-white/80 text-navy/60'
                  }`}
                >
                  {m.status === 'final' ? 'Final' : 'Draft'}
                </span>
              </div>
              <h3 className="font-bold text-navy leading-snug">{m.judul}</h3>
              <p className="text-xs text-navy/55 mt-1">
                {[m.mata_pelajaran, m.kelas].filter(Boolean).join(' · ') || meta.label}
              </p>
              <p className="text-[11px] text-navy/40 mt-auto pt-4">Diperbarui {formatDate(m.updated_at)}</p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setViewing(m)}
                  className="flex-1 text-xs font-semibold py-2 rounded-full bg-white/80 hover:bg-white text-teal-800 border border-teal-200"
                >
                  Lihat
                </button>
                <button
                  onClick={() => {
                    setEditing(m)
                    setMode('form')
                  }}
                  className="flex-1 text-xs font-semibold py-2 rounded-full bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Edit
                </button>
                <button
                  onClick={() => setToDelete(m)}
                  className="text-xs font-semibold px-3 py-2 rounded-full text-red-600 hover:bg-white/80"
                >
                  Hapus
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {pickKurikulum && (
        <PickKurikulumModal
          onClose={() => setPickKurikulum(false)}
          onPick={(k) => {
            setKurikulumBaru(k)
            setEditing(null)
            setPickKurikulum(false)
            setMode('form')
          }}
        />
      )}
      {viewing && <ViewModal modul={viewing} onClose={() => setViewing(null)} />}
      {toDelete && (
        <ModalShell onClose={() => !deleting && setToDelete(null)} narrow>
          <div className="px-8 pt-8 pb-7 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 ring-8 ring-emerald-50 flex items-center justify-center mb-4">
              <div className="h-9 w-9 rounded-full border-2 border-teal-600 text-teal-600 flex items-center justify-center text-lg font-bold">
                !
              </div>
            </div>
            <h2 className="text-2xl font-bold text-teal-900">Hapus perangkat ajar</h2>
            <p className="text-sm text-navy/60 mt-2 leading-relaxed">
              Yakin ingin menghapus <span className="font-semibold text-navy">{toDelete.judul}</span>?
              <br />
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-7">
              <button
                onClick={() => setToDelete(null)}
                disabled={deleting}
                className="rounded-xl bg-white/80 hover:bg-white border border-teal-200 text-teal-800 font-semibold py-3 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 text-white font-semibold py-3 shadow-md shadow-teal-600/30 disabled:opacity-50"
              >
                {deleting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  )
}

function ModalShell({ children, onClose, narrow }) {
  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-teal-950/50 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`bg-gradient-to-br from-white via-emerald-50 to-teal-100 border border-white rounded-3xl w-full shadow-2xl shadow-teal-900/30 max-h-[90vh] overflow-y-auto ${
          narrow ? 'max-w-md' : 'max-w-3xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}

function PickKurikulumModal({ onClose, onPick }) {
  return (
    <ModalShell onClose={onClose}>
      <div className="p-7">
        <h2 className="text-xl font-bold text-teal-900">Pilih kurikulum</h2>
        <p className="text-sm text-navy/55 mt-1 mb-5">Bentuk formulir menyesuaikan kurikulum yang Anda pilih.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <button
            onClick={() => onPick('merdeka')}
            className="text-left rounded-2xl bg-white/80 hover:bg-white border-2 border-transparent hover:border-teal-500 p-5 transition-colors"
          >
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-100 text-teal-800">Modul Ajar</span>
            <h3 className="font-bold text-navy mt-3">Kurikulum Merdeka</h3>
            <p className="text-xs text-navy/55 mt-1.5 leading-relaxed">
              Formulir lengkap: informasi umum, Profil Pelajar Pancasila, pemahaman bermakna, pertanyaan pemantik,
              asesmen diagnostik/formatif/sumatif, pengayaan &amp; remedial. Target per Fase, kriteria KKTP.
            </p>
          </button>
          <button
            onClick={() => onPick('k13')}
            className="text-left rounded-2xl bg-white/80 hover:bg-white border-2 border-transparent hover:border-amber-500 p-5 transition-colors"
          >
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">RPP 1 Lembar</span>
            <h3 className="font-bold text-navy mt-3">Kurikulum 2013</h3>
            <p className="text-xs text-navy/55 mt-1.5 leading-relaxed">
              Formulir ringkas sesuai Permendikbud No. 14/2019: identitas RPP, tujuan pembelajaran (berdasar KD),
              langkah pembelajaran, dan penilaian. Kriteria KKM.
            </p>
          </button>
        </div>
        <button onClick={onClose} className="mt-5 text-sm font-semibold text-teal-800 hover:text-teal-900">
          Batal
        </button>
      </div>
    </ModalShell>
  )
}

function ViewModal({ modul, onClose }) {
  const meta = KURIKULUM_META[modul.kurikulum]
  const data = modul.data || {}
  return (
    <ModalShell onClose={onClose}>
      <div className="p-7">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${meta.badge}`}>{meta.label}</span>
            <h2 className="text-xl font-bold text-teal-900 mt-2">{modul.judul}</h2>
            <p className="text-xs text-navy/55 mt-0.5">
              {[modul.mata_pelajaran, modul.kelas].filter(Boolean).join(' · ')}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="h-8 w-8 rounded-full bg-white/80 hover:bg-white border border-teal-200 text-teal-800 font-bold leading-none shrink-0"
          >
            &times;
          </button>
        </div>

        <div className="space-y-5 mt-5">
          {SECTIONS[modul.kurikulum].map((sec) => {
            const rows = sec.fields.filter((f) => {
              const v = data[f.k]
              return Array.isArray(v) ? v.length > 0 : String(v ?? '').trim() !== ''
            })
            if (rows.length === 0) return null
            return (
              <section key={sec.title}>
                <h3 className="text-xs font-bold uppercase tracking-wide text-teal-700 border-b border-teal-200 pb-1 mb-2">
                  {sec.title}
                </h3>
                <div className="space-y-2.5">
                  {rows.map((f) => (
                    <div key={f.k}>
                      <p className="text-[11px] font-semibold text-navy/50">{f.label}</p>
                      {Array.isArray(data[f.k]) ? (
                        <ul className="list-disc pl-5 text-sm text-navy">
                          {data[f.k].map((x) => (
                            <li key={x}>{x}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-navy whitespace-pre-line">{data[f.k]}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </ModalShell>
  )
}

function ModulAjarForm({ modul, kurikulum, onCancel, onSaved }) {
  const [judul, setJudul] = useState(modul?.judul || '')
  const [mapel, setMapel] = useState(modul?.mata_pelajaran || '')
  const [kelas, setKelas] = useState(modul?.kelas || '')
  const [status, setStatus] = useState(modul?.status || 'draft')
  const [data, setData] = useState(modul?.data || {})
  const [mapelOptions, setMapelOptions] = useState([])
  const [kelasOptions, setKelasOptions] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const meta = KURIKULUM_META[kurikulum]

  useEffect(() => {
    api.getMyGuruMataPelajaran().then((r) => setMapelOptions(r.map((m) => m.nama_mapel))).catch(() => {})
    api.getMyGuruKelas().then((r) => setKelasOptions(r.map((k) => k.nama_kelas))).catch(() => {})
    if (modul) return
    Promise.all([api.getMyGuruProfil().catch(() => null), api.getProfil().catch(() => null)]).then(([guru, profil]) => {
      const nama = guru ? [guru.nama, guru.gelar].filter(Boolean).join(', ') : ''
      const sekolah = profil?.nama_sekolah || ''
      const thn = String(new Date().getFullYear())
      setMapel((m) => m || guru?.mata_pelajaran || '')
      setData((d) =>
        kurikulum === 'merdeka'
          ? { nama_guru: nama, institusi: sekolah, tahun_penyusunan: thn, jenjang: profil?.jenjang || '', ...d }
          : { nama_sekolah: sekolah, ...d }
      )
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function setField(k, v) {
    setData((d) => ({ ...d, [k]: v }))
  }

  function toggleCheck(k, opt) {
    const cur = data[k] || []
    setField(k, cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      kurikulum,
      judul: judul.trim(),
      mata_pelajaran: mapel.trim() || null,
      kelas: kelas.trim() || null,
      status,
      data,
    }
    try {
      if (modul) await api.updateModulAjar(modul.id, payload)
      else await api.createModulAjar(payload)
      onSaved()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div>
      <button onClick={onCancel} className="text-sm text-navy/60 hover:text-navy mb-1 block">
        ← Kembali ke daftar
      </button>
      <div className="flex items-center gap-3 mb-5">
        <h1 className="text-xl font-extrabold text-navy">{modul ? 'Edit' : 'Buat'} {meta.short}</h1>
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${meta.badge}`}>{meta.label}</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-4xl">
        <div className={`${GLASS} p-5 space-y-4`}>
          <h2 className="text-xs font-bold uppercase tracking-wide text-teal-700 border-b border-teal-200 pb-1.5">
            {kurikulum === 'merdeka' ? 'Identitas Modul' : 'Identitas RPP'}
          </h2>
          <Field label={kurikulum === 'merdeka' ? 'Judul Modul Ajar' : 'Judul RPP'}>
            <input required value={judul} onChange={(e) => setJudul(e.target.value)} className="input bg-white" maxLength={255} />
          </Field>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Mata Pelajaran">
              <input
                list="mapel-options"
                value={mapel}
                onChange={(e) => setMapel(e.target.value)}
                className="input bg-white"
                maxLength={255}
              />
              <datalist id="mapel-options">
                {mapelOptions.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </Field>
            <Field label={kurikulum === 'merdeka' ? 'Kelas' : 'Kelas / Semester'}>
              <input
                list="kelas-options"
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                className="input bg-white"
                placeholder={kurikulum === 'merdeka' ? 'mis. VII' : 'mis. VII / Ganjil'}
                maxLength={255}
              />
              <datalist id="kelas-options">
                {kelasOptions.map((k) => (
                  <option key={k} value={k} />
                ))}
              </datalist>
            </Field>
            <Field label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="input bg-white">
                <option value="draft">Draft</option>
                <option value="final">Final</option>
              </select>
            </Field>
          </div>
        </div>

        {SECTIONS[kurikulum].map((sec) => (
          <div key={sec.title} className={`${GLASS} p-5 space-y-4`}>
            <h2 className="text-xs font-bold uppercase tracking-wide text-teal-700 border-b border-teal-200 pb-1.5">
              {sec.title}
            </h2>
            <div className={sec.fields.length > 2 && sec.fields.every((f) => !f.type || f.type === 'select') ? 'grid sm:grid-cols-2 gap-4' : 'space-y-4'}>
              {sec.fields.map((f) => (
                <Field key={f.k} label={f.label}>
                  {f.type === 'textarea' ? (
                    <textarea
                      rows={f.rows || 3}
                      value={data[f.k] || ''}
                      onChange={(e) => setField(f.k, e.target.value)}
                      className="input bg-white resize-y"
                    />
                  ) : f.type === 'select' ? (
                    <select value={data[f.k] || ''} onChange={(e) => setField(f.k, e.target.value)} className="input bg-white">
                      <option value="">Pilih...</option>
                      {f.options.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : f.type === 'checks' ? (
                    <div className="grid sm:grid-cols-2 gap-2">
                      {f.options.map((o) => {
                        const on = (data[f.k] || []).includes(o)
                        return (
                          <label
                            key={o}
                            className={`flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-sm cursor-pointer border transition-colors ${
                              on ? 'bg-teal-600 text-white border-teal-600' : 'bg-white/80 text-navy border-white hover:border-teal-300'
                            }`}
                          >
                            <input type="checkbox" checked={on} onChange={() => toggleCheck(f.k, o)} className="mt-0.5 accent-teal-700" />
                            <span>{o}</span>
                          </label>
                        )
                      })}
                    </div>
                  ) : (
                    <input
                      value={data[f.k] || ''}
                      onChange={(e) => setField(f.k, e.target.value)}
                      placeholder={f.placeholder}
                      className="input bg-white"
                    />
                  )}
                </Field>
              ))}
            </div>
          </div>
        ))}

        {error && <p className="text-red-700 text-sm">{error}</p>}

        <div className="flex gap-3 pb-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 rounded-full bg-white/80 hover:bg-white border border-teal-200 text-teal-800 text-sm font-semibold"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-2.5 rounded-full bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 text-white text-sm font-semibold shadow-md shadow-teal-600/30 disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-navy/70 mb-1.5">{label}</span>
      {children}
    </label>
  )
}
