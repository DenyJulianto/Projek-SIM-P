import { useEffect, useState } from 'react'
import ProgramTahunanDetailModal from '../components/ProgramTahunanDetailModal'
import { api } from '../lib/api'

const DOKUMEN_LABEL = { draft: 'Draft', diajukan: 'Diajukan', terverifikasi: 'Terverifikasi' }
const DOKUMEN_TONE = {
  draft: 'bg-amber-100 text-amber-700',
  diajukan: 'bg-sky-100 text-sky-700',
  terverifikasi: 'bg-emerald-100 text-emerald-700',
}
const FASE_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F']

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const BULAN_SEMESTER = { ganjil: [7, 8, 9, 10, 11, 12], genap: [1, 2, 3, 4, 5, 6] }

const STATUS_LABEL = { belum_terlaksana: 'Belum Terlaksana', berjalan: 'Berjalan', terlaksana: 'Terlaksana', ditunda: 'Ditunda' }
const STATUS_TONE = {
  belum_terlaksana: 'bg-navy/10 text-navy/50',
  berjalan: 'bg-sky-100 text-sky-700',
  terlaksana: 'bg-emerald-100 text-emerald-700',
  ditunda: 'bg-amber-100 text-amber-700',
}

function emptyRow(semester = 'ganjil') {
  return {
    _key: Math.random().toString(36).slice(2),
    semester,
    tujuan_pembelajaran_id: '',
    indikator_id: '',
    materi: '',
    bulan_mulai: BULAN_SEMESTER[semester][0],
    bulan_selesai: BULAN_SEMESTER[semester][0],
    alokasi_jp: 4,
    status_pelaksanaan: 'belum_terlaksana',
    catatan: '',
  }
}

export default function ProgramTahunanManagement({ onBack }) {
  const [mode, setMode] = useState('list')
  const [editingId, setEditingId] = useState(null)
  const [list, setList] = useState(null)
  const [tahunAjaranList, setTahunAjaranList] = useState([])
  const [kelasList, setKelasList] = useState([])
  const [mapelList, setMapelList] = useState([])
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [detailId, setDetailId] = useState(null)

  const [tahunFilter, setTahunFilter] = useState('')
  const [kelasFilter, setKelasFilter] = useState('')
  const [faseFilter, setFaseFilter] = useState('')
  const [mapelFilter, setMapelFilter] = useState('')
  const [dokumenFilter, setDokumenFilter] = useState('')

  function load() {
    setList(null)
    const params = {}
    if (tahunFilter) params.tahun_ajaran_id = tahunFilter
    if (kelasFilter) params.kelas_id = kelasFilter
    if (faseFilter) params.fase = faseFilter
    if (mapelFilter) params.mata_pelajaran_id = mapelFilter
    if (dokumenFilter) params.status_dokumen = dokumenFilter
    api
      .listProgramTahunan(params)
      .then((r) => setList(r.data ?? r))
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tahunFilter, kelasFilter, faseFilter, mapelFilter, dokumenFilter])

  useEffect(() => {
    api.listTahunAjaranKurikulum().then(setTahunAjaranList).catch(() => {})
    api.listKelasAll().then((r) => setKelasList(r.data ?? r)).catch(() => {})
    api.listMataPelajaran().then((r) => setMapelList(r.data ?? r)).catch(() => {})
  }, [])

  async function handleDelete(item) {
    if (!window.confirm(`Hapus Program Tahunan ${item.mata_pelajaran?.nama_mapel} — ${item.kelas?.nama_kelas}?`)) return
    setBusyId(item.id)
    try {
      await api.deleteProgramTahunan(item.id)
      load()
    } catch (err) {
      window.alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  function backToList() {
    setMode('list')
    setEditingId(null)
    load()
  }

  if (mode === 'editor') {
    return (
      <ProgramTahunanEditor
        id={editingId}
        tahunAjaranList={tahunAjaranList}
        kelasList={kelasList}
        mapelList={mapelList}
        onCancel={backToList}
        onSaved={backToList}
      />
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
            ← Kembali ke Dashboard
          </button>
          <h1 className="text-2xl font-extrabold text-navy">Program Tahunan</h1>
          <p className="text-sm text-navy/50 mt-1 max-w-xl">
            Susun rencana pembelajaran satu tahun ajaran per kelas dan mata pelajaran: TP, indikator, materi, semester, bulan, JP, dan minggu efektif.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null)
            setMode('editor')
          }}
          className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-full"
        >
          + Susun Program Tahunan
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <select value={tahunFilter} onChange={(e) => setTahunFilter(e.target.value)} className="border border-navy/15 rounded-lg px-3 py-2 text-sm">
          <option value="">Semua Tahun Ajaran</option>
          {tahunAjaranList.map((ta) => (
            <option key={ta.id} value={ta.id}>
              {ta.nama}
            </option>
          ))}
        </select>
        <select value={kelasFilter} onChange={(e) => setKelasFilter(e.target.value)} className="border border-navy/15 rounded-lg px-3 py-2 text-sm">
          <option value="">Semua Kelas</option>
          {kelasList.map((k) => (
            <option key={k.id} value={k.id}>
              {k.nama_kelas}
            </option>
          ))}
        </select>
        <select value={faseFilter} onChange={(e) => setFaseFilter(e.target.value)} className="border border-navy/15 rounded-lg px-3 py-2 text-sm">
          <option value="">Semua Fase</option>
          {FASE_OPTIONS.map((f) => (
            <option key={f} value={f}>
              Fase {f}
            </option>
          ))}
        </select>
        <select value={mapelFilter} onChange={(e) => setMapelFilter(e.target.value)} className="border border-navy/15 rounded-lg px-3 py-2 text-sm">
          <option value="">Semua Mata Pelajaran</option>
          {mapelList.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nama_mapel}
            </option>
          ))}
        </select>
        <select value={dokumenFilter} onChange={(e) => setDokumenFilter(e.target.value)} className="border border-navy/15 rounded-lg px-3 py-2 text-sm">
          <option value="">Semua Status Dokumen</option>
          {Object.entries(DOKUMEN_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="space-y-3">
        {(list || []).map((p) => {
          const persen = p.item_count > 0 ? Math.round((p.item_terlaksana / p.item_count) * 100) : 0
          const jpTerlaksana = Number(p.jp_terlaksana ?? 0)
          const persenJp = Number(p.total_jp) > 0 ? Math.round((jpTerlaksana / Number(p.total_jp)) * 100) : 0
          return (
            <div key={p.id} className="bg-white rounded-2xl border border-navy/10 p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-navy">
                      {p.mata_pelajaran?.nama_mapel} — {p.kelas?.nama_kelas}
                      {p.fase ? ` (Fase ${p.fase})` : ''}
                    </p>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${DOKUMEN_TONE[p.status_dokumen]}`}>{DOKUMEN_LABEL[p.status_dokumen]}</span>
                  </div>
                  <p className="text-sm text-navy/60">Tahun Ajaran {p.tahun_ajaran?.nama}</p>
                  <p className="text-xs text-navy/40 mt-1">
                    Guru: {p.guru?.nama || '-'} — {p.item_count} topik — total {p.total_jp ?? 0} JP — minggu efektif {p.minggu_efektif_ganjil ?? '-'} (ganjil) / {p.minggu_efektif_genap ?? '-'} (genap)
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-2 w-40 rounded-full bg-navy/5 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${persen}%` }} />
                    </div>
                    <span className="text-[11px] text-navy/50">
                      {persen}% baris — {persenJp}% JP terlaksana
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDetailId(p.id)}
                    className="text-xs font-semibold text-navy border border-navy/20 rounded-full px-3.5 py-1.5 hover:bg-navy hover:text-white transition-colors"
                  >
                    Detail / Cetak
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(p.id)
                      setMode('editor')
                    }}
                    className="text-xs font-semibold text-navy border border-navy/20 rounded-full px-3.5 py-1.5 hover:bg-navy hover:text-white transition-colors"
                  >
                    Buka / Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p)}
                    disabled={busyId === p.id}
                    className="text-xs font-semibold text-red-600 border border-red-200 rounded-full px-3.5 py-1.5 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        {list && list.length === 0 && <p className="text-sm text-navy/40 text-center py-10">Belum ada Program Tahunan.</p>}
        {list === null && <p className="text-sm text-navy/40 text-center py-10">Memuat...</p>}
      </div>

      {detailId && <ProgramTahunanDetailModal id={detailId} onClose={() => setDetailId(null)} onChanged={load} />}
    </div>
  )
}

function ProgramTahunanEditor({ id, tahunAjaranList, kelasList, mapelList, onCancel, onSaved }) {
  const [loading, setLoading] = useState(!!id)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [header, setHeader] = useState({
    tahun_ajaran_id: '',
    kelas_id: '',
    fase: '',
    mata_pelajaran_id: '',
    guru_id: '',
    minggu_efektif_ganjil: '',
    minggu_efektif_genap: '',
    catatan: '',
  })
  const [rows, setRows] = useState([emptyRow('ganjil')])
  const [opsi, setOpsi] = useState({ guru: [], alokasi_jp_default: null, tujuan_pembelajaran: [] })

  useEffect(() => {
    if (!id) return
    api
      .getProgramTahunan(id)
      .then((p) => {
        setHeader({
          tahun_ajaran_id: p.tahun_ajaran_id,
          kelas_id: p.kelas_id,
          fase: p.fase || '',
          mata_pelajaran_id: p.mata_pelajaran_id,
          guru_id: p.guru_id || '',
          minggu_efektif_ganjil: p.minggu_efektif_ganjil ?? '',
          minggu_efektif_genap: p.minggu_efektif_genap ?? '',
          catatan: p.catatan || '',
        })
        setRows(
          p.item.map((i) => ({
            _key: `i${i.id}`,
            semester: i.semester,
            tujuan_pembelajaran_id: i.tujuan_pembelajaran_id || '',
            indikator_id: i.indikator_id || '',
            materi: i.materi || '',
            bulan_mulai: i.bulan_mulai,
            bulan_selesai: i.bulan_selesai,
            alokasi_jp: i.alokasi_jp,
            status_pelaksanaan: i.status_pelaksanaan,
            catatan: i.catatan || '',
          }))
        )
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  function loadOpsi() {
    const params = {}
    if (header.mata_pelajaran_id) params.mata_pelajaran_id = header.mata_pelajaran_id
    if (header.tahun_ajaran_id && header.mata_pelajaran_id) {
      params.tahun_ajaran_id = header.tahun_ajaran_id
      if (header.kelas_id) params.kelas_id = header.kelas_id
    }
    api
      .getOpsiProgramTahunan(params)
      .then(setOpsi)
      .catch(() => {})
  }

  useEffect(() => {
    loadOpsi()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [header.tahun_ajaran_id, header.mata_pelajaran_id, header.kelas_id])

  function updateHeader(field, value) {
    setHeader((h) => ({ ...h, [field]: value }))
  }

  function updateRow(key, patch) {
    setRows((rs) => rs.map((r) => (r._key === key ? { ...r, ...patch } : r)))
  }

  function ubahSemester(key, semester) {
    updateRow(key, {
      semester,
      tujuan_pembelajaran_id: '',
      indikator_id: '',
      bulan_mulai: BULAN_SEMESTER[semester][0],
      bulan_selesai: BULAN_SEMESTER[semester][0],
    })
  }

  function ubahBulanMulai(r, value) {
    const mulai = Number(value)
    updateRow(r._key, { bulan_mulai: mulai, bulan_selesai: Number(r.bulan_selesai) < mulai ? mulai : r.bulan_selesai })
  }

  function pilihTp(key, tpId) {
    const tp = opsi.tujuan_pembelajaran.find((t) => String(t.id) === String(tpId))
    setRows((rs) =>
      rs.map((r) => {
        if (r._key !== key) return r
        return {
          ...r,
          tujuan_pembelajaran_id: tpId,
          indikator_id: '',
          materi: tp && !r.materi ? tp.materi_terkait || '' : r.materi,
          alokasi_jp: tp && tp.alokasi_waktu != null ? tp.alokasi_waktu : r.alokasi_jp,
        }
      })
    )
  }

  const ringkasan = ['ganjil', 'genap'].map((sem) => {
    const jp = rows.filter((r) => r.semester === sem).reduce((s, r) => s + (Number(r.alokasi_jp) || 0), 0)
    const minggu = header[`minggu_efektif_${sem}`]
    const kapasitas = opsi.alokasi_jp_default != null && minggu !== '' ? Number(opsi.alokasi_jp_default) * Number(minggu) : null
    return { sem, jp, minggu, kapasitas, lebih: kapasitas != null && jp > kapasitas }
  })
  const totalJp = ringkasan.reduce((s, r) => s + r.jp, 0)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const payload = {
      ...header,
      guru_id: header.guru_id || null,
      fase: header.fase || null,
      catatan: header.catatan || null,
      minggu_efektif_ganjil: header.minggu_efektif_ganjil === '' ? null : Number(header.minggu_efektif_ganjil),
      minggu_efektif_genap: header.minggu_efektif_genap === '' ? null : Number(header.minggu_efektif_genap),
      item: rows.map((r) => ({
        semester: r.semester,
        tujuan_pembelajaran_id: r.tujuan_pembelajaran_id || null,
        indikator_id: r.indikator_id || null,
        materi: r.materi || null,
        bulan_mulai: Number(r.bulan_mulai),
        bulan_selesai: Number(r.bulan_selesai),
        alokasi_jp: Number(r.alokasi_jp) || 0,
        status_pelaksanaan: r.status_pelaksanaan,
        catatan: r.catatan || null,
      })),
    }
    setSaving(true)
    try {
      if (id) await api.updateProgramTahunan(id, payload)
      else await api.createProgramTahunan(payload)
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm text-navy/40 text-center py-10">Memuat...</p>

  return (
    <div>
      <button onClick={onCancel} className="text-sm text-navy/50 hover:text-navy mb-1">
        ← Kembali ke Daftar Program Tahunan
      </button>
      <h1 className="text-2xl font-extrabold text-navy mb-5">{id ? 'Edit' : 'Susun'} Program Tahunan</h1>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl border border-navy/10 p-5 mb-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Tahun Ajaran">
            <select value={header.tahun_ajaran_id} onChange={(e) => updateHeader('tahun_ajaran_id', e.target.value)} className="input" required>
              <option value="">Pilih tahun ajaran...</option>
              {tahunAjaranList.map((ta) => (
                <option key={ta.id} value={ta.id}>
                  {ta.nama}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Kelas">
            <select value={header.kelas_id} onChange={(e) => updateHeader('kelas_id', e.target.value)} className="input" required>
              <option value="">Pilih kelas...</option>
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama_kelas}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Fase (opsional)">
            <select value={header.fase} onChange={(e) => updateHeader('fase', e.target.value)} className="input">
              <option value="">Tanpa fase</option>
              {FASE_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  Fase {f}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Mata Pelajaran">
            <select value={header.mata_pelajaran_id} onChange={(e) => updateHeader('mata_pelajaran_id', e.target.value)} className="input" required>
              <option value="">Pilih mata pelajaran...</option>
              {mapelList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nama_mapel}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Guru Pengampu">
            <select value={header.guru_id} onChange={(e) => updateHeader('guru_id', e.target.value)} className="input">
              <option value="">Belum ditentukan</option>
              {opsi.guru.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nama}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Minggu Efektif Semester Ganjil">
            <input type="number" min="0" max="30" value={header.minggu_efektif_ganjil} onChange={(e) => updateHeader('minggu_efektif_ganjil', e.target.value)} className="input" />
          </Field>
          <Field label="Minggu Efektif Semester Genap">
            <input type="number" min="0" max="30" value={header.minggu_efektif_genap} onChange={(e) => updateHeader('minggu_efektif_genap', e.target.value)} className="input" />
          </Field>
          <Field label="Catatan Program (opsional)">
            <input value={header.catatan} onChange={(e) => updateHeader('catatan', e.target.value)} className="input" />
          </Field>
        </div>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <div className="bg-white rounded-2xl border border-navy/10 p-5 mb-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-sm font-bold text-navy">Daftar Rencana Pembelajaran</h2>
            <p className="text-xs text-navy/50">
              Total setahun <span className="font-bold text-navy">{totalJp} JP</span>
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            {ringkasan.map((r) => (
              <div key={r.sem} className={`rounded-xl border px-4 py-3 text-xs ${r.lebih ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-navy/10 text-navy/60'}`}>
                <p className="font-semibold capitalize text-navy">Semester {r.sem}</p>
                <p>
                  {r.jp} JP direncanakan
                  {r.kapasitas != null ? ` dari kapasitas ${r.kapasitas} JP (${opsi.alokasi_jp_default} JP/minggu × ${r.minggu} minggu)${r.lebih ? ' — melebihi kapasitas' : ''}` : ' — kapasitas dihitung bila minggu efektif dan alokasi JP default mata pelajaran terisi'}
                </p>
              </div>
            ))}
          </div>

          {header.tahun_ajaran_id && header.mata_pelajaran_id && opsi.tujuan_pembelajaran.length === 0 && (
            <p className="text-xs text-amber-600 mb-3">
              Belum ada TP untuk tahun ajaran, mata pelajaran{header.kelas_id ? ', dan tingkat kelas' : ''} ini. Baris tetap bisa diisi dengan materi manual.
            </p>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1400px]">
              <thead>
                <tr className="text-navy/50 text-xs uppercase text-left border-b border-navy/10">
                  <th className="py-2 pr-2">Semester</th>
                  <th className="py-2 pr-2">Bulan Pelaksanaan</th>
                  <th className="py-2 pr-2">TP</th>
                  <th className="py-2 pr-2">Kompetensi / Indikator</th>
                  <th className="py-2 pr-2">Materi</th>
                  <th className="py-2 pr-2">JP</th>
                  <th className="py-2 pr-2">Status</th>
                  <th className="py-2 pr-2">Catatan</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                {rows.map((r) => {
                  const tpRow = opsi.tujuan_pembelajaran.find((t) => String(t.id) === String(r.tujuan_pembelajaran_id))
                  return (
                    <tr key={r._key} className="align-top">
                      <td className="py-2 pr-2">
                        <select value={r.semester} onChange={(e) => ubahSemester(r._key, e.target.value)} className="input w-28">
                          <option value="ganjil">Ganjil</option>
                          <option value="genap">Genap</option>
                        </select>
                      </td>
                      <td className="py-2 pr-2">
                        <div className="space-y-1">
                          <select value={r.bulan_mulai} onChange={(e) => ubahBulanMulai(r, e.target.value)} className="input w-32">
                            {BULAN_SEMESTER[r.semester].map((b) => (
                              <option key={b} value={b}>
                                {BULAN[b - 1]}
                              </option>
                            ))}
                          </select>
                          <select value={r.bulan_selesai} onChange={(e) => updateRow(r._key, { bulan_selesai: Number(e.target.value) })} className="input w-32">
                            {BULAN_SEMESTER[r.semester]
                              .filter((b) => b >= Number(r.bulan_mulai))
                              .map((b) => (
                                <option key={b} value={b}>
                                  s.d. {BULAN[b - 1]}
                                </option>
                              ))}
                          </select>
                        </div>
                      </td>
                      <td className="py-2 pr-2">
                        <select value={r.tujuan_pembelajaran_id} onChange={(e) => pilihTp(r._key, e.target.value)} className="input w-48">
                          <option value="">Tanpa TP</option>
                          {opsi.tujuan_pembelajaran
                            .filter((t) => t.semester === r.semester)
                            .map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.tingkat} #{t.urutan} — {t.deskripsi.slice(0, 40)}
                              </option>
                            ))}
                        </select>
                      </td>
                      <td className="py-2 pr-2">
                        <select value={r.indikator_id} onChange={(e) => updateRow(r._key, { indikator_id: e.target.value })} className="input w-44" disabled={!r.tujuan_pembelajaran_id}>
                          <option value="">{r.tujuan_pembelajaran_id ? 'Tanpa indikator' : 'Pilih TP dulu'}</option>
                          {(tpRow?.indikator || []).map((ind) => (
                            <option key={ind.id} value={ind.id}>
                              #{ind.urutan} — {ind.deskripsi.slice(0, 40)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 pr-2">
                        <input value={r.materi} onChange={(e) => updateRow(r._key, { materi: e.target.value })} className="input w-44" placeholder="Materi" />
                      </td>
                      <td className="py-2 pr-2">
                        <input type="number" min="0" max="200" value={r.alokasi_jp} onChange={(e) => updateRow(r._key, { alokasi_jp: e.target.value })} className="input w-20" />
                      </td>
                      <td className="py-2 pr-2">
                        <select
                          value={r.status_pelaksanaan}
                          onChange={(e) => updateRow(r._key, { status_pelaksanaan: e.target.value })}
                          className={`text-xs font-semibold px-2.5 py-2 rounded-lg border-0 ${STATUS_TONE[r.status_pelaksanaan]}`}
                        >
                          {Object.entries(STATUS_LABEL).map(([v, l]) => (
                            <option key={v} value={v}>
                              {l}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 pr-2">
                        <textarea rows={2} value={r.catatan} onChange={(e) => updateRow(r._key, { catatan: e.target.value })} className="input w-44" />
                      </td>
                      <td className="py-2 pt-3">
                        <button
                          type="button"
                          onClick={() => setRows((rs) => rs.filter((x) => x._key !== r._key))}
                          className="text-red-500 hover:text-red-700 text-lg leading-none px-1"
                          title="Hapus baris"
                        >
                          &times;
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2 mt-4 flex-wrap">
            {['ganjil', 'genap'].map((sem) => (
              <button
                key={sem}
                type="button"
                onClick={() => setRows((rs) => [...rs, emptyRow(sem)])}
                className="text-sm font-semibold text-navy border border-navy/20 rounded-full px-4 py-2 hover:bg-navy hover:text-white transition-colors capitalize"
              >
                + Baris Semester {sem}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="text-sm font-semibold text-navy/60 px-5 py-2.5 rounded-full hover:bg-navy/5">
            Batal
          </button>
          <button type="submit" disabled={saving || rows.length === 0} className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-6 py-2.5 rounded-full disabled:opacity-50">
            {saving ? 'Menyimpan...' : 'Simpan Program Tahunan'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-navy/70 mb-1">{label}</span>
      {children}
    </label>
  )
}
