import { useEffect, useState } from 'react'
import ProgramSemesterDetailModal from '../components/ProgramSemesterDetailModal'
import { api } from '../lib/api'

const DOKUMEN_LABEL = { draft: 'Draft', diajukan: 'Diajukan', disahkan: 'Disahkan' }
const DOKUMEN_TONE = {
  draft: 'bg-amber-100 text-amber-700',
  diajukan: 'bg-sky-100 text-sky-700',
  disahkan: 'bg-emerald-100 text-emerald-700',
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

function emptyRow(semester) {
  return {
    _key: Math.random().toString(36).slice(2),
    tujuan_pembelajaran_id: '',
    indikator_id: '',
    tanggal_mulai: '',
    tanggal_selesai: '',
    materi: '',
    alokasi_jp: 2,
    minggu_ke: 1,
    bulan: BULAN_SEMESTER[semester][0],
    rencana_pembelajaran: '',
    status_pelaksanaan: 'belum_terlaksana',
    catatan: '',
  }
}

export default function ProgramSemesterManagement({ onBack }) {
  const [mode, setMode] = useState('list')
  const [editingId, setEditingId] = useState(null)
  const [list, setList] = useState(null)
  const [tahunAjaranList, setTahunAjaranList] = useState([])
  const [kelasList, setKelasList] = useState([])
  const [mapelList, setMapelList] = useState([])
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [detailId, setDetailId] = useState(null)
  const [dokumenFilter, setDokumenFilter] = useState('')

  const [tahunFilter, setTahunFilter] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')
  const [kelasFilter, setKelasFilter] = useState('')
  const [mapelFilter, setMapelFilter] = useState('')

  function load() {
    setList(null)
    const params = {}
    if (tahunFilter) params.tahun_ajaran_id = tahunFilter
    if (semesterFilter) params.semester = semesterFilter
    if (kelasFilter) params.kelas_id = kelasFilter
    if (mapelFilter) params.mata_pelajaran_id = mapelFilter
    if (dokumenFilter) params.status_dokumen = dokumenFilter
    api
      .listProgramSemester(params)
      .then((r) => setList(r.data ?? r))
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tahunFilter, semesterFilter, kelasFilter, mapelFilter, dokumenFilter])

  useEffect(() => {
    api.listTahunAjaranKurikulum().then(setTahunAjaranList).catch(() => {})
    api.listKelasAll().then((r) => setKelasList(r.data ?? r)).catch(() => {})
    api.listMataPelajaran().then((r) => setMapelList(r.data ?? r)).catch(() => {})
  }, [])

  async function handleDelete(item) {
    if (!window.confirm(`Hapus Program Semester ${item.mata_pelajaran?.nama_mapel} — ${item.kelas?.nama_kelas}?`)) return
    setBusyId(item.id)
    try {
      await api.deleteProgramSemester(item.id)
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
      <ProgramSemesterEditor
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
          <h1 className="text-2xl font-extrabold text-navy">Program Semester</h1>
          <p className="text-sm text-navy/50 mt-1 max-w-xl">
            Susun rencana pembelajaran satu semester per kelas dan mata pelajaran: TP, materi, alokasi JP, minggu, dan bulan pelaksanaan.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null)
            setMode('editor')
          }}
          className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-full"
        >
          + Susun Program Semester
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
        <select value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)} className="border border-navy/15 rounded-lg px-3 py-2 text-sm">
          <option value="">Semua Semester</option>
          <option value="ganjil">Ganjil</option>
          <option value="genap">Genap</option>
        </select>
        <select value={kelasFilter} onChange={(e) => setKelasFilter(e.target.value)} className="border border-navy/15 rounded-lg px-3 py-2 text-sm">
          <option value="">Semua Kelas</option>
          {kelasList.map((k) => (
            <option key={k.id} value={k.id}>
              {k.nama_kelas}
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
                  <p className="text-sm text-navy/60 capitalize">
                    Semester {p.semester} — Tahun Ajaran {p.tahun_ajaran?.nama}
                  </p>
                  <p className="text-xs text-navy/40 mt-1">
                    Guru: {p.guru?.nama || '-'} — {p.item_count} pertemuan/topik — total {p.total_jp ?? 0} JP
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
        {list && list.length === 0 && <p className="text-sm text-navy/40 text-center py-10">Belum ada Program Semester.</p>}
        {list === null && <p className="text-sm text-navy/40 text-center py-10">Memuat...</p>}
      </div>

      {detailId && <ProgramSemesterDetailModal id={detailId} onClose={() => setDetailId(null)} onChanged={load} />}
    </div>
  )
}

function ProgramSemesterEditor({ id, tahunAjaranList, kelasList, mapelList, onCancel, onSaved }) {
  const [loading, setLoading] = useState(!!id)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [header, setHeader] = useState({ tahun_ajaran_id: '', semester: 'ganjil', kelas_id: '', fase: '', mata_pelajaran_id: '', guru_id: '', catatan: '' })
  const [rows, setRows] = useState([emptyRow('ganjil')])
  const [opsi, setOpsi] = useState({ guru: [], tujuan_pembelajaran: [] })

  useEffect(() => {
    if (!id) return
    api
      .getProgramSemester(id)
      .then((p) => {
        setHeader({
          tahun_ajaran_id: p.tahun_ajaran_id,
          semester: p.semester,
          kelas_id: p.kelas_id,
          fase: p.fase || '',
          mata_pelajaran_id: p.mata_pelajaran_id,
          guru_id: p.guru_id || '',
          catatan: p.catatan || '',
        })
        setRows(
          p.item.map((i) => ({
            _key: `i${i.id}`,
            tujuan_pembelajaran_id: i.tujuan_pembelajaran_id || '',
            indikator_id: i.indikator_id || '',
            tanggal_mulai: i.tanggal_mulai || '',
            tanggal_selesai: i.tanggal_selesai || '',
            materi: i.materi || '',
            alokasi_jp: i.alokasi_jp,
            minggu_ke: i.minggu_ke,
            bulan: i.bulan,
            rencana_pembelajaran: i.rencana_pembelajaran || '',
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
    if (header.tahun_ajaran_id && header.mata_pelajaran_id && header.semester) {
      params.tahun_ajaran_id = header.tahun_ajaran_id
      params.mata_pelajaran_id = header.mata_pelajaran_id
      params.semester = header.semester
      if (header.kelas_id) params.kelas_id = header.kelas_id
    }
    api
      .getOpsiProgramSemester(params)
      .then(setOpsi)
      .catch(() => {})
  }

  useEffect(() => {
    loadOpsi()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [header.tahun_ajaran_id, header.mata_pelajaran_id, header.semester, header.kelas_id])

  function updateHeader(field, value) {
    setHeader((h) => ({ ...h, [field]: value }))
    if (field === 'semester') {
      setRows((rs) =>
        rs.map((r) => ({
          ...r,
          tujuan_pembelajaran_id: '',
          bulan: BULAN_SEMESTER[value].includes(Number(r.bulan)) ? r.bulan : BULAN_SEMESTER[value][0],
        }))
      )
    }
  }

  function updateRow(key, patch) {
    setRows((rs) => rs.map((r) => (r._key === key ? { ...r, ...patch } : r)))
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

  const totalJp = rows.reduce((s, r) => s + (Number(r.alokasi_jp) || 0), 0)
  const terlaksana = rows.filter((r) => r.status_pelaksanaan === 'terlaksana').length

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const payload = {
      ...header,
      guru_id: header.guru_id || null,
      fase: header.fase || null,
      catatan: header.catatan || null,
      item: rows.map((r) => ({
        tujuan_pembelajaran_id: r.tujuan_pembelajaran_id || null,
        indikator_id: r.indikator_id || null,
        tanggal_mulai: r.tanggal_mulai || null,
        tanggal_selesai: r.tanggal_selesai || null,
        materi: r.materi || null,
        alokasi_jp: Number(r.alokasi_jp) || 0,
        minggu_ke: Number(r.minggu_ke) || 1,
        bulan: Number(r.bulan),
        rencana_pembelajaran: r.rencana_pembelajaran || null,
        status_pelaksanaan: r.status_pelaksanaan,
        catatan: r.catatan || null,
      })),
    }
    setSaving(true)
    try {
      if (id) await api.updateProgramSemester(id, payload)
      else await api.createProgramSemester(payload)
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
        ← Kembali ke Daftar Program Semester
      </button>
      <h1 className="text-2xl font-extrabold text-navy mb-5">{id ? 'Edit' : 'Susun'} Program Semester</h1>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl border border-navy/10 p-5 mb-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <Field label="Semester">
            <select value={header.semester} onChange={(e) => updateHeader('semester', e.target.value)} className="input">
              <option value="ganjil">Ganjil</option>
              <option value="genap">Genap</option>
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
          <Field label="Catatan Program (opsional)">
            <input value={header.catatan} onChange={(e) => updateHeader('catatan', e.target.value)} className="input" />
          </Field>
        </div>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <div className="bg-white rounded-2xl border border-navy/10 p-5 mb-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-sm font-bold text-navy">Rencana Pembelajaran</h2>
            <p className="text-xs text-navy/50">
              Total <span className="font-bold text-navy">{totalJp} JP</span> — {terlaksana}/{rows.length} terlaksana
            </p>
          </div>

          {header.tahun_ajaran_id && header.mata_pelajaran_id && opsi.tujuan_pembelajaran.length === 0 && (
            <p className="text-xs text-amber-600 mb-3">
              Belum ada TP untuk tahun ajaran, mata pelajaran, semester{header.kelas_id ? ', dan tingkat kelas' : ''} ini. Baris tetap bisa diisi dengan materi manual.
            </p>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1500px]">
              <thead>
                <tr className="text-navy/50 text-xs uppercase text-left border-b border-navy/10">
                  <th className="py-2 pr-2">Minggu ke-</th>
                  <th className="py-2 pr-2">Bulan</th>
                  <th className="py-2 pr-2">Tanggal / Rentang</th>
                  <th className="py-2 pr-2">TP</th>
                  <th className="py-2 pr-2">Kompetensi / Indikator</th>
                  <th className="py-2 pr-2">Materi</th>
                  <th className="py-2 pr-2">JP</th>
                  <th className="py-2 pr-2">Rencana Pembelajaran</th>
                  <th className="py-2 pr-2">Status</th>
                  <th className="py-2 pr-2">Catatan</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                {rows.map((r) => (
                  <tr key={r._key} className="align-top">
                    <td className="py-2 pr-2">
                      <input type="number" min="1" max="30" value={r.minggu_ke} onChange={(e) => updateRow(r._key, { minggu_ke: e.target.value })} className="input w-20" />
                    </td>
                    <td className="py-2 pr-2">
                      <select value={r.bulan} onChange={(e) => updateRow(r._key, { bulan: e.target.value })} className="input w-32">
                        {BULAN_SEMESTER[header.semester].map((b) => (
                          <option key={b} value={b}>
                            {BULAN[b - 1]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-2">
                      <div className="space-y-1">
                        <input type="date" value={r.tanggal_mulai} onChange={(e) => updateRow(r._key, { tanggal_mulai: e.target.value })} className="input w-36" />
                        <input type="date" value={r.tanggal_selesai} min={r.tanggal_mulai || undefined} onChange={(e) => updateRow(r._key, { tanggal_selesai: e.target.value })} className="input w-36" />
                      </div>
                    </td>
                    <td className="py-2 pr-2">
                      <select value={r.tujuan_pembelajaran_id} onChange={(e) => pilihTp(r._key, e.target.value)} className="input w-44">
                        <option value="">Tanpa TP</option>
                        {opsi.tujuan_pembelajaran.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.tingkat} #{t.urutan} — {t.deskripsi.slice(0, 40)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-2">
                      <select value={r.indikator_id} onChange={(e) => updateRow(r._key, { indikator_id: e.target.value })} className="input w-44" disabled={!r.tujuan_pembelajaran_id}>
                        <option value="">{r.tujuan_pembelajaran_id ? 'Tanpa indikator' : 'Pilih TP dulu'}</option>
                        {(opsi.tujuan_pembelajaran.find((t) => String(t.id) === String(r.tujuan_pembelajaran_id))?.indikator || []).map((ind) => (
                          <option key={ind.id} value={ind.id}>
                            #{ind.urutan} — {ind.deskripsi.slice(0, 40)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-2">
                      <input value={r.materi} onChange={(e) => updateRow(r._key, { materi: e.target.value })} className="input w-40" placeholder="Materi" />
                    </td>
                    <td className="py-2 pr-2">
                      <input type="number" min="0" max="50" value={r.alokasi_jp} onChange={(e) => updateRow(r._key, { alokasi_jp: e.target.value })} className="input w-20" />
                    </td>
                    <td className="py-2 pr-2">
                      <textarea rows={2} value={r.rencana_pembelajaran} onChange={(e) => updateRow(r._key, { rencana_pembelajaran: e.target.value })} className="input w-56" />
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
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={() => setRows((rs) => [...rs, { ...emptyRow(header.semester), minggu_ke: rs.length > 0 ? Number(rs[rs.length - 1].minggu_ke) + 1 : 1 }])}
            className="mt-4 text-sm font-semibold text-navy border border-navy/20 rounded-full px-4 py-2 hover:bg-navy hover:text-white transition-colors"
          >
            + Tambah Baris
          </button>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="text-sm font-semibold text-navy/60 px-5 py-2.5 rounded-full hover:bg-navy/5">
            Batal
          </button>
          <button type="submit" disabled={saving || rows.length === 0} className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-6 py-2.5 rounded-full disabled:opacity-50">
            {saving ? 'Menyimpan...' : 'Simpan Program Semester'}
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
