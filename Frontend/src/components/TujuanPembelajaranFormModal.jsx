import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const TINGKAT_SUGGESTIONS = ['1', '2', '3', '4', '5', '6', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

export default function TujuanPembelajaranFormModal({ tp, mapelList, onClose, onSaved }) {
  const isEdit = Boolean(tp)
  const [mapelId, setMapelId] = useState(tp?.capaian_pembelajaran?.mata_pelajaran_id ? String(tp.capaian_pembelajaran.mata_pelajaran_id) : '')
  const [cpList, setCpList] = useState([])
  const [loadingCp, setLoadingCp] = useState(false)
  const [form, setForm] = useState({
    capaian_pembelajaran_id: tp?.capaian_pembelajaran_id || '',
    tingkat: tp?.tingkat || '',
    semester: tp?.semester || 'ganjil',
    urutan: tp?.urutan || 1,
    deskripsi: tp?.deskripsi || '',
    materi_terkait: tp?.materi_terkait || '',
    alokasi_waktu: tp?.alokasi_waktu ?? '',
    status: tp?.status || 'draft',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function loadCpList() {
    if (!mapelId) {
      setCpList([])
      return
    }
    setLoadingCp(true)
    api
      .listCapaianPembelajaran({ mata_pelajaran_id: mapelId, per_page: 100 })
      .then((r) => setCpList(r.data ?? r))
      .catch(() => setCpList([]))
      .finally(() => setLoadingCp(false))
  }

  useEffect(() => {
    loadCpList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapelId])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleMapelChange(value) {
    setMapelId(value)
    update('capaian_pembelajaran_id', '')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        urutan: Number(form.urutan) || 1,
        alokasi_waktu: form.alokasi_waktu === '' ? null : Number(form.alokasi_waktu),
      }
      if (isEdit) {
        await api.updateTujuanPembelajaran(tp.id, payload)
      } else {
        await api.createTujuanPembelajaran(payload)
      }
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-navy/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-navy mb-4">{isEdit ? 'Edit Tujuan Pembelajaran' : 'Tambah Tujuan Pembelajaran'}</h2>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Mata Pelajaran">
              <select value={mapelId} onChange={(e) => handleMapelChange(e.target.value)} className="input" required>
                <option value="">Pilih mata pelajaran...</option>
                {mapelList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nama_mapel}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Capaian Pembelajaran (CP)">
              <select
                value={form.capaian_pembelajaran_id}
                onChange={(e) => update('capaian_pembelajaran_id', e.target.value)}
                className="input"
                required
                disabled={!mapelId || loadingCp}
              >
                <option value="">{loadingCp ? 'Memuat...' : 'Pilih CP...'}</option>
                {cpList.map((cp) => (
                  <option key={cp.id} value={cp.id}>
                    Fase {cp.fase} — {cp.elemen} ({cp.tahun_ajaran?.nama})
                  </option>
                ))}
              </select>
              {mapelId && !loadingCp && cpList.length === 0 && (
                <span className="block text-xs text-amber-600 mt-1">Belum ada CP untuk mata pelajaran ini.</span>
              )}
            </Field>
            <Field label="Fase / Kelas">
              <input
                list="tp-tingkat-suggestions"
                value={form.tingkat}
                onChange={(e) => update('tingkat', e.target.value)}
                className="input"
                placeholder="mis. VII"
                required
              />
              <datalist id="tp-tingkat-suggestions">
                {TINGKAT_SUGGESTIONS.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </Field>
            <Field label="Semester">
              <select value={form.semester} onChange={(e) => update('semester', e.target.value)} className="input">
                <option value="ganjil">Ganjil</option>
                <option value="genap">Genap</option>
              </select>
            </Field>
            <Field label="Nomor/Urutan TP">
              <input type="number" min="1" value={form.urutan} onChange={(e) => update('urutan', e.target.value)} className="input" required />
            </Field>
            <Field label="Alokasi Waktu (JP)">
              <input type="number" min="0" value={form.alokasi_waktu} onChange={(e) => update('alokasi_waktu', e.target.value)} className="input" />
            </Field>
          </div>

          <Field label="Materi Terkait">
            <input
              value={form.materi_terkait}
              onChange={(e) => update('materi_terkait', e.target.value)}
              className="input"
              placeholder="mis. Bilangan Bulat"
            />
          </Field>

          <Field label="Deskripsi Tujuan Pembelajaran">
            <textarea
              rows={5}
              value={form.deskripsi}
              onChange={(e) => update('deskripsi', e.target.value)}
              className="input"
              placeholder="Peserta didik dapat..."
              required
            />
          </Field>

          <Field label="Status">
            <select value={form.status} onChange={(e) => update('status', e.target.value)} className="input">
              <option value="draft">Draft</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </Field>

          <div className="flex justify-end gap-3 pt-2">
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
        </form>
      </div>
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
