import { useEffect, useState } from 'react'
import DuplikasiStrukturModal from '../components/DuplikasiStrukturModal'
import StrukturKurikulumImportModal from '../components/StrukturKurikulumImportModal'
import { api } from '../lib/api'

const KELOMPOK_SUGGESTIONS = [
  'Kelompok A (Umum)',
  'Kelompok B',
  'Kelompok C (Peminatan)',
  'Muatan Lokal',
  'Projek Penguatan Profil Pelajar Pancasila',
  'Pengembangan Diri / Ekstrakurikuler',
]

const TINGKAT_SUGGESTIONS = ['1', '2', '3', '4', '5', '6', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

const KURIKULUM_SUGGESTIONS = ['Kurikulum Merdeka', 'Kurikulum 2013', 'Kurikulum Darurat']

const FASE_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F']

function emptyMapelRow() {
  return {
    _key: Math.random().toString(36).slice(2),
    kelompok: 'Kelompok A (Umum)',
    mata_pelajaran_id: '',
    nama_custom: '',
    jenis: 'wajib',
    is_muatan_lokal: false,
    is_projek: false,
    jp_per_minggu: 0,
    alokasi_jp_ganjil: '',
    alokasi_jp_genap: '',
  }
}

export default function StrukturKurikulumManagement({ onBack }) {
  const [mode, setMode] = useState('list')
  const [list, setList] = useState(null)
  const [tahunAjaranList, setTahunAjaranList] = useState([])
  const [mapelCatalog, setMapelCatalog] = useState([])
  const [filterTahun, setFilterTahun] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const [duplicating, setDuplicating] = useState(null)

  function load() {
    setList(null)
    const params = {}
    if (filterTahun) params.tahun_ajaran_id = filterTahun
    if (filterStatus) params.status = filterStatus
    api
      .listStrukturKurikulum(params)
      .then(setList)
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterTahun, filterStatus])

  useEffect(() => {
    api.listTahunAjaranKurikulum().then((r) => setTahunAjaranList(r.data ?? r)).catch(() => {})
    api.listMataPelajaran().then((r) => setMapelCatalog(r.data ?? r)).catch(() => {})
  }, [])

  function openCreate() {
    setEditingId(null)
    setMode('editor')
  }

  function openEdit(item) {
    setEditingId(item.id)
    setMode('editor')
  }

  function backToList() {
    setMode('list')
    setEditingId(null)
    load()
  }

  async function handleDelete(item) {
    if (!window.confirm(`Hapus struktur kurikulum "${item.kurikulum}" tingkat ${item.tingkat}?`)) return
    setBusyId(item.id)
    try {
      await api.deleteStrukturKurikulum(item.id)
      load()
    } catch (err) {
      window.alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleToggleAktif(item) {
    setBusyId(item.id)
    try {
      if (item.is_aktif) {
        await api.nonaktifkanStrukturKurikulum(item.id)
      } else {
        await api.aktifkanStrukturKurikulum(item.id)
      }
      load()
    } catch (err) {
      window.alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleExport() {
    try {
      await api.exportStrukturKurikulum(filterTahun ? { tahun_ajaran_id: filterTahun } : {})
    } catch (err) {
      window.alert(err.message)
    }
  }

  if (mode === 'editor') {
    return (
      <StrukturKurikulumEditor
        id={editingId}
        tahunAjaranList={tahunAjaranList}
        mapelCatalog={mapelCatalog}
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
          <h1 className="text-2xl font-extrabold text-navy">Struktur Kurikulum</h1>
          <p className="text-sm text-navy/50 mt-1 max-w-xl">
            Susun mata pelajaran per tingkat/fase untuk setiap tahun ajaran dan kurikulum yang digunakan.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExport}
            className="text-sm font-semibold text-navy border border-navy/20 rounded-full px-4 py-2 hover:bg-navy hover:text-white transition-colors"
          >
            Export Excel
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="text-sm font-semibold text-navy border border-navy/20 rounded-full px-4 py-2 hover:bg-navy hover:text-white transition-colors"
          >
            Import Excel
          </button>
          <button
            onClick={openCreate}
            className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-full"
          >
            + Tambah Struktur Kurikulum
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <select
          value={filterTahun}
          onChange={(e) => setFilterTahun(e.target.value)}
          className="border border-navy/15 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Semua Tahun Ajaran</option>
          {tahunAjaranList.map((ta) => (
            <option key={ta.id} value={ta.id}>
              {ta.nama}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-navy/15 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Semua Status</option>
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Nonaktif</option>
        </select>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {tahunAjaranList.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-4 text-sm text-amber-800">
          Belum ada Tahun Ajaran. Tambahkan Tahun Ajaran terlebih dahulu sebelum menyusun struktur kurikulum.
        </div>
      )}

      <div className="space-y-3">
        {(list || []).map((s) => (
          <div key={s.id} className="bg-white rounded-2xl border border-navy/10 p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-bold text-navy">
                    Tingkat {s.tingkat}
                    {s.fase ? ` — Fase ${s.fase}` : ''}
                  </p>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      s.is_aktif ? 'bg-emerald-100 text-emerald-700' : 'bg-navy/10 text-navy/50'
                    }`}
                  >
                    {s.is_aktif ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <p className="text-sm text-navy/60">
                  {s.kurikulum} — Tahun Ajaran {s.tahun_ajaran}
                </p>
                <p className="text-xs text-navy/40 mt-1">
                  {s.jumlah_mapel} mata pelajaran — total {s.total_jp_per_minggu} JP/minggu
                </p>
                {s.keterangan && <p className="text-xs text-navy/50 mt-1">{s.keterangan}</p>}
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
                <button
                  onClick={() => openEdit(s)}
                  className="text-xs font-semibold text-navy border border-navy/20 rounded-full px-3.5 py-1.5 hover:bg-navy hover:text-white transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDuplicating(s)}
                  className="text-xs font-semibold text-navy border border-navy/20 rounded-full px-3.5 py-1.5 hover:bg-navy hover:text-white transition-colors"
                >
                  Duplikasi
                </button>
                <button
                  onClick={() => handleToggleAktif(s)}
                  disabled={busyId === s.id}
                  className={`text-xs font-semibold rounded-full px-3.5 py-1.5 transition-colors disabled:opacity-50 ${
                    s.is_aktif
                      ? 'text-red-600 border border-red-200 hover:bg-red-600 hover:text-white'
                      : 'text-white bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {s.is_aktif ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
                <button
                  onClick={() => handleDelete(s)}
                  disabled={busyId === s.id}
                  className="text-xs font-semibold text-red-600 border border-red-200 rounded-full px-3.5 py-1.5 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        ))}
        {list && list.length === 0 && <p className="text-sm text-navy/40 text-center py-10">Belum ada struktur kurikulum.</p>}
        {list === null && <p className="text-sm text-navy/40 text-center py-10">Memuat...</p>}
      </div>

      {showImport && (
        <StrukturKurikulumImportModal
          onClose={() => setShowImport(false)}
          onImported={() => {
            setShowImport(false)
            load()
          }}
        />
      )}

      {duplicating && (
        <DuplikasiStrukturModal
          struktur={duplicating}
          tahunAjaranList={tahunAjaranList}
          onClose={() => setDuplicating(null)}
          onDuplicated={() => {
            setDuplicating(null)
            load()
          }}
        />
      )}
    </div>
  )
}

function StrukturKurikulumEditor({ id, tahunAjaranList, mapelCatalog, onCancel, onSaved }) {
  const [loading, setLoading] = useState(!!id)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [header, setHeader] = useState({
    tahun_ajaran_id: '',
    tingkat: '',
    fase: '',
    kurikulum: '',
    keterangan: '',
  })
  const [rows, setRows] = useState([emptyMapelRow()])

  useEffect(() => {
    if (!id) return
    api
      .getStrukturKurikulum(id)
      .then((s) => {
        setHeader({
          tahun_ajaran_id: s.tahun_ajaran_id,
          tingkat: s.tingkat,
          fase: s.fase || '',
          kurikulum: s.kurikulum,
          keterangan: s.keterangan || '',
        })
        setRows(
          (s.mapel || []).map((m) => ({
            _key: `m${m.id}`,
            kelompok: m.kelompok,
            mata_pelajaran_id: m.mata_pelajaran_id || '',
            nama_custom: m.nama_custom || '',
            jenis: m.jenis,
            is_muatan_lokal: m.is_muatan_lokal,
            is_projek: m.is_projek,
            jp_per_minggu: m.jp_per_minggu,
            alokasi_jp_ganjil: m.alokasi_jp_ganjil ?? '',
            alokasi_jp_genap: m.alokasi_jp_genap ?? '',
          }))
        )
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  function updateHeader(field, value) {
    setHeader((h) => ({ ...h, [field]: value }))
  }

  function updateRow(key, field, value) {
    setRows((rs) => rs.map((r) => (r._key === key ? { ...r, [field]: value } : r)))
  }

  function addRow() {
    setRows((rs) => [...rs, emptyMapelRow()])
  }

  function removeRow(key) {
    setRows((rs) => rs.filter((r) => r._key !== key))
  }

  const totalJp = rows.reduce((sum, r) => sum + (Number(r.jp_per_minggu) || 0), 0)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (rows.length === 0) {
      setError('Tambahkan minimal satu mata pelajaran.')
      return
    }

    const payload = {
      tahun_ajaran_id: header.tahun_ajaran_id,
      tingkat: header.tingkat,
      fase: header.fase || null,
      kurikulum: header.kurikulum,
      keterangan: header.keterangan || null,
      mapel: rows.map((r) => ({
        kelompok: r.kelompok,
        mata_pelajaran_id: r.mata_pelajaran_id || null,
        nama_custom: r.mata_pelajaran_id ? null : r.nama_custom || null,
        jenis: r.jenis,
        is_muatan_lokal: r.is_muatan_lokal,
        is_projek: r.is_projek,
        jp_per_minggu: Number(r.jp_per_minggu) || 0,
        alokasi_jp_ganjil: r.alokasi_jp_ganjil === '' ? null : Number(r.alokasi_jp_ganjil),
        alokasi_jp_genap: r.alokasi_jp_genap === '' ? null : Number(r.alokasi_jp_genap),
      })),
    }

    setSaving(true)
    try {
      if (id) {
        await api.updateStrukturKurikulum(id, payload)
      } else {
        await api.createStrukturKurikulum(payload)
      }
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-navy/40 text-center py-10">Memuat...</p>
  }

  return (
    <div>
      <button onClick={onCancel} className="text-sm text-navy/50 hover:text-navy mb-1">
        ← Kembali ke Daftar Struktur Kurikulum
      </button>
      <h1 className="text-2xl font-extrabold text-navy mb-5">{id ? 'Edit' : 'Tambah'} Struktur Kurikulum</h1>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl border border-navy/10 p-5 mb-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Tahun Ajaran">
            <select
              value={header.tahun_ajaran_id}
              onChange={(e) => updateHeader('tahun_ajaran_id', e.target.value)}
              className="input"
              required
            >
              <option value="">Pilih tahun ajaran...</option>
              {tahunAjaranList.map((ta) => (
                <option key={ta.id} value={ta.id}>
                  {ta.nama}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tingkat / Jenjang Kelas">
            <input
              list="tingkat-suggestions"
              value={header.tingkat}
              onChange={(e) => updateHeader('tingkat', e.target.value)}
              className="input"
              placeholder="mis. VII"
              required
            />
            <datalist id="tingkat-suggestions">
              {TINGKAT_SUGGESTIONS.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </Field>
          <Field label="Fase">
            <select value={header.fase} onChange={(e) => updateHeader('fase', e.target.value)} className="input">
              <option value="">Tidak menggunakan fase</option>
              {FASE_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  Fase {f}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Kurikulum yang Digunakan">
            <input
              list="kurikulum-suggestions"
              value={header.kurikulum}
              onChange={(e) => updateHeader('kurikulum', e.target.value)}
              className="input"
              placeholder="mis. Kurikulum Merdeka"
              required
            />
            <datalist id="kurikulum-suggestions">
              {KURIKULUM_SUGGESTIONS.map((k) => (
                <option key={k} value={k} />
              ))}
            </datalist>
          </Field>
          <div className="sm:col-span-2 lg:col-span-4">
            <Field label="Keterangan (opsional)">
              <textarea
                value={header.keterangan}
                onChange={(e) => updateHeader('keterangan', e.target.value)}
                className="input min-h-16"
              />
            </Field>
          </div>
        </div>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <div className="bg-white rounded-2xl border border-navy/10 p-5 mb-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-sm font-bold text-navy">Susunan Mata Pelajaran</h2>
            <p className="text-xs text-navy/50">
              Total: <span className="font-bold text-navy">{totalJp} JP/minggu</span>
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="text-navy/50 text-xs uppercase text-left border-b border-navy/10">
                  <th className="py-2 pr-2">Kelompok Mapel</th>
                  <th className="py-2 pr-2">Mata Pelajaran</th>
                  <th className="py-2 pr-2">Jenis</th>
                  <th className="py-2 pr-2 text-center">Mulok</th>
                  <th className="py-2 pr-2 text-center">Projek</th>
                  <th className="py-2 pr-2 text-right">JP/Minggu</th>
                  <th className="py-2 pr-2 text-right">JP Ganjil</th>
                  <th className="py-2 pr-2 text-right">JP Genap</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                {rows.map((r) => (
                  <tr key={r._key}>
                    <td className="py-2 pr-2 align-top">
                      <input
                        list="kelompok-suggestions"
                        value={r.kelompok}
                        onChange={(e) => updateRow(r._key, 'kelompok', e.target.value)}
                        className="input w-40"
                        required
                      />
                    </td>
                    <td className="py-2 pr-2 align-top">
                      <select
                        value={r.mata_pelajaran_id}
                        onChange={(e) => updateRow(r._key, 'mata_pelajaran_id', e.target.value)}
                        className="input w-44"
                      >
                        <option value="">-- Ketik nama custom --</option>
                        {mapelCatalog.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nama_mapel}
                          </option>
                        ))}
                      </select>
                      {!r.mata_pelajaran_id && (
                        <input
                          value={r.nama_custom}
                          onChange={(e) => updateRow(r._key, 'nama_custom', e.target.value)}
                          className="input w-44 mt-1"
                          placeholder="Nama mapel/kegiatan"
                          required
                        />
                      )}
                    </td>
                    <td className="py-2 pr-2 align-top">
                      <select
                        value={r.jenis}
                        onChange={(e) => updateRow(r._key, 'jenis', e.target.value)}
                        className="input w-28"
                      >
                        <option value="wajib">Wajib</option>
                        <option value="pilihan">Pilihan</option>
                      </select>
                    </td>
                    <td className="py-2 pr-2 text-center align-top pt-3">
                      <input
                        type="checkbox"
                        checked={r.is_muatan_lokal}
                        onChange={(e) => updateRow(r._key, 'is_muatan_lokal', e.target.checked)}
                        className="h-4 w-4 accent-navy-light"
                      />
                    </td>
                    <td className="py-2 pr-2 text-center align-top pt-3">
                      <input
                        type="checkbox"
                        checked={r.is_projek}
                        onChange={(e) => updateRow(r._key, 'is_projek', e.target.checked)}
                        className="h-4 w-4 accent-navy-light"
                      />
                    </td>
                    <td className="py-2 pr-2 align-top">
                      <input
                        type="number"
                        min="0"
                        value={r.jp_per_minggu}
                        onChange={(e) => updateRow(r._key, 'jp_per_minggu', e.target.value)}
                        className="input w-20 text-right"
                      />
                    </td>
                    <td className="py-2 pr-2 align-top">
                      <input
                        type="number"
                        min="0"
                        value={r.alokasi_jp_ganjil}
                        onChange={(e) => updateRow(r._key, 'alokasi_jp_ganjil', e.target.value)}
                        className="input w-20 text-right"
                      />
                    </td>
                    <td className="py-2 pr-2 align-top">
                      <input
                        type="number"
                        min="0"
                        value={r.alokasi_jp_genap}
                        onChange={(e) => updateRow(r._key, 'alokasi_jp_genap', e.target.value)}
                        className="input w-20 text-right"
                      />
                    </td>
                    <td className="py-2 align-top pt-3">
                      <button
                        type="button"
                        onClick={() => removeRow(r._key)}
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
            <datalist id="kelompok-suggestions">
              {KELOMPOK_SUGGESTIONS.map((k) => (
                <option key={k} value={k} />
              ))}
            </datalist>
          </div>

          <button
            type="button"
            onClick={addRow}
            className="mt-4 text-sm font-semibold text-navy border border-navy/20 rounded-full px-4 py-2 hover:bg-navy hover:text-white transition-colors"
          >
            + Tambah Mata Pelajaran
          </button>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-semibold text-navy/60 px-5 py-2.5 rounded-full hover:bg-navy/5"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-6 py-2.5 rounded-full disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan Struktur Kurikulum'}
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
