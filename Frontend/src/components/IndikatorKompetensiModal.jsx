import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const STATUS_LABEL = { belum_tercapai: 'Belum Tercapai', tercapai: 'Tercapai' }
const STATUS_TONE = {
  belum_tercapai: 'bg-navy/10 text-navy/50',
  tercapai: 'bg-emerald-100 text-emerald-700',
}

const EMPTY_FORM = { deskripsi: '', kriteria_ketercapaian: '', status_ketercapaian: 'belum_tercapai' }

export default function IndikatorKompetensiModal({ tp, onClose }) {
  const [list, setList] = useState(null)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)

  function load() {
    api
      .listIndikatorTp(tp.id)
      .then(setList)
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(item) {
    setEditingId(item.id)
    setForm({
      deskripsi: item.deskripsi,
      kriteria_ketercapaian: item.kriteria_ketercapaian || '',
      status_ketercapaian: item.status_ketercapaian,
    })
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editingId) {
        await api.updateIndikatorTp(editingId, form)
      } else {
        await api.createIndikatorTp(tp.id, form)
      }
      setShowForm(false)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Hapus indikator #${item.urutan} — "${item.deskripsi.slice(0, 60)}..."?`)) return
    setBusyId(item.id)
    try {
      await api.deleteIndikatorTp(item.id)
      load()
    } catch (err) {
      window.alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleMove(index, direction) {
    const target = index + direction
    if (!list || target < 0 || target >= list.length) return

    const reordered = [...list]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(target, 0, moved)

    setList(reordered)
    setBusyId(moved.id)
    try {
      const updated = await api.reorderIndikatorTp(tp.id, reordered.map((i) => i.id))
      setList(updated)
    } catch (err) {
      setError(err.message)
      load()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-navy/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-1">
          <div>
            <h2 className="text-lg font-extrabold text-navy">Indikator Kompetensi</h2>
            <p className="text-xs text-navy/50 mt-0.5">
              TP #{tp.urutan} — {tp.deskripsi?.slice(0, 80)}
              {tp.deskripsi?.length > 80 ? '...' : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-navy/40 hover:text-navy text-xl leading-none shrink-0">
            ×
          </button>
        </div>

        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

        <div className="flex justify-end mt-4 mb-3">
          <button
            onClick={openCreate}
            className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-4 py-2 rounded-full"
          >
            + Tambah Indikator
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-navy/[0.03] border border-navy/10 rounded-xl p-4 mb-4 space-y-3">
            <label className="block">
              <span className="block text-xs font-semibold text-navy/70 mb-1">Deskripsi Indikator</span>
              <textarea
                value={form.deskripsi}
                onChange={(e) => setForm((f) => ({ ...f, deskripsi: e.target.value }))}
                className="input"
                rows={2}
                required
              />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-navy/70 mb-1">Kriteria Ketercapaian</span>
              <textarea
                value={form.kriteria_ketercapaian}
                onChange={(e) => setForm((f) => ({ ...f, kriteria_ketercapaian: e.target.value }))}
                className="input"
                rows={2}
                placeholder="Opsional — patokan kapan indikator ini dianggap tercapai"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-navy/70 mb-1">Status Ketercapaian</span>
              <select
                value={form.status_ketercapaian}
                onChange={(e) => setForm((f) => ({ ...f, status_ketercapaian: e.target.value }))}
                className="input"
              >
                <option value="belum_tercapai">Belum Tercapai</option>
                <option value="tercapai">Tercapai</option>
              </select>
            </label>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-sm font-semibold text-navy/60 px-4 py-2 rounded-full hover:bg-navy/5"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-navy-light hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2 rounded-full disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah'}
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {list === null ? (
            <p className="text-sm text-navy/40 text-center py-8">Memuat...</p>
          ) : list.length === 0 ? (
            <p className="text-sm text-navy/40 text-center py-8">Belum ada indikator untuk TP ini.</p>
          ) : (
            list.map((item, index) => (
              <div key={item.id} className="border border-navy/10 rounded-xl p-3.5">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5">
                    <button
                      onClick={() => handleMove(index, -1)}
                      disabled={index === 0 || busyId === item.id}
                      className="text-navy/40 hover:text-navy disabled:opacity-20 leading-none"
                      title="Naikkan urutan"
                    >
                      ▲
                    </button>
                    <span className="text-xs font-bold text-navy/50">{item.urutan}</span>
                    <button
                      onClick={() => handleMove(index, 1)}
                      disabled={index === list.length - 1 || busyId === item.id}
                      className="text-navy/40 hover:text-navy disabled:opacity-20 leading-none"
                      title="Turunkan urutan"
                    >
                      ▼
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-navy">{item.deskripsi}</p>
                    {item.kriteria_ketercapaian && (
                      <p className="text-xs text-navy/50 mt-1">
                        Kriteria: {item.kriteria_ketercapaian}
                      </p>
                    )}
                    <span
                      className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mt-2 ${STATUS_TONE[item.status_ketercapaian]}`}
                    >
                      {STATUS_LABEL[item.status_ketercapaian]}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openEdit(item)}
                      className="text-xs font-semibold text-navy border border-navy/20 rounded-md px-3 py-1.5 hover:bg-navy hover:text-white transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      disabled={busyId === item.id}
                      className="text-xs font-semibold text-red-600 border border-red-200 rounded-md px-3 py-1.5 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
