import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const STATUS_OPTIONS = [
  ['draft', 'Draft'],
  ['aktif', 'Aktif'],
  ['nonaktif', 'Nonaktif'],
]

export default function PembagianMapelFormModal({ item, konteks, onClose, onSaved }) {
  const isEdit = Boolean(item)
  const [form, setForm] = useState({
    kelas_id: item?.kelas_id || '',
    mata_pelajaran_id: item?.mata_pelajaran_id || '',
    guru_id: item?.guru_id || '',
    alokasi_jp: item?.alokasi_jp ?? '',
    status: item?.status || 'draft',
    catatan: item?.catatan || '',
  })
  const [opsi, setOpsi] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function loadOpsi() {
    const params = { tahun_ajaran_id: konteks.tahun_ajaran_id, semester: konteks.semester }
    if (form.kelas_id) params.kelas_id = form.kelas_id
    api
      .getOpsiPembagianMapel(params)
      .then(setOpsi)
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    loadOpsi()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.kelas_id])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function pilihMapel(id) {
    const dariStruktur = opsi?.struktur?.mapel.find((m) => String(m.mata_pelajaran_id) === String(id))
    const dariMapel = opsi?.mata_pelajaran.find((m) => String(m.id) === String(id))
    setForm((f) => ({
      ...f,
      mata_pelajaran_id: id,
      alokasi_jp: f.alokasi_jp === '' ? (dariStruktur?.jp_per_minggu ?? dariMapel?.alokasi_jp_default ?? '') : f.alokasi_jp,
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...konteks,
        kelas_id: Number(form.kelas_id),
        mata_pelajaran_id: Number(form.mata_pelajaran_id),
        guru_id: Number(form.guru_id),
        alokasi_jp: Number(form.alokasi_jp),
        status: form.status,
        catatan: form.catatan || null,
      }
      const saved = isEdit ? await api.updatePembagianMapel(item.id, payload) : await api.createPembagianMapel(payload)
      onSaved(saved.peringatan ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const struktur = opsi?.struktur
  const mapelOptions = struktur
    ? struktur.mapel.map((m) => ({ id: m.mata_pelajaran_id, label: `${m.nama} (${m.jp_per_minggu} JP)` }))
    : (opsi?.mata_pelajaran ?? []).map((m) => ({ id: m.id, label: m.nama_mapel }))

  const guruTerpilih = opsi?.guru.find((g) => String(g.id) === String(form.guru_id))
  const jp = Number(form.alokasi_jp) || 0
  let sesudah = null
  if (guruTerpilih) {
    const sendiri = isEdit && item.status !== 'nonaktif' && String(item.guru_id) === String(form.guru_id) ? item.alokasi_jp : 0
    sesudah = guruTerpilih.beban_jp - sendiri + (form.status === 'nonaktif' ? 0 : jp)
  }
  const batas = opsi?.batas_jp_guru
  const jpStruktur = struktur?.mapel.find((m) => String(m.mata_pelajaran_id) === String(form.mata_pelajaran_id))?.jp_per_minggu

  return (
    <div className="fixed inset-0 bg-navy/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-lg font-bold text-navy mb-1">{isEdit ? 'Edit Pembagian' : 'Tambah Pembagian'}</h2>
        <p className="text-xs text-navy/50 mb-4 capitalize">
          {konteks.tahun_ajaran_nama} — Semester {konteks.semester}
        </p>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Rombel">
            <select required value={form.kelas_id} onChange={(e) => update('kelas_id', e.target.value)} className="input">
              <option value="">Pilih rombel</option>
              {(opsi?.rombel ?? []).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nama_kelas}
                  {r.tingkat ? ` (Tingkat ${r.tingkat})` : ''}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Mata Pelajaran">
            <select required value={form.mata_pelajaran_id} onChange={(e) => pilihMapel(e.target.value)} className="input" disabled={!form.kelas_id}>
              <option value="">{form.kelas_id ? 'Pilih mata pelajaran' : 'Pilih rombel dulu'}</option>
              {mapelOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            {form.kelas_id && opsi && (
              <p className="text-[11px] text-navy/50 mt-1">
                {struktur
                  ? `Mengacu pada Struktur Kurikulum ${struktur.kurikulum} tingkat ${struktur.tingkat}.`
                  : 'Belum ada Struktur Kurikulum aktif untuk rombel ini, semua mata pelajaran aktif ditampilkan tanpa validasi JP.'}
              </p>
            )}
          </Field>

          <Field label="Guru Pengampu">
            <select required value={form.guru_id} onChange={(e) => update('guru_id', e.target.value)} className="input">
              <option value="">Pilih guru</option>
              {(opsi?.guru ?? []).map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nama} — beban {g.beban_jp} JP
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Alokasi JP / minggu">
              <input
                type="number"
                min="1"
                max="40"
                required
                value={form.alokasi_jp}
                onChange={(e) => update('alokasi_jp', e.target.value)}
                className="input"
              />
              {jpStruktur != null && (
                <p className={`text-[11px] mt-1 ${jp > jpStruktur ? 'text-red-600 font-semibold' : 'text-navy/50'}`}>Struktur: {jpStruktur} JP/minggu</p>
              )}
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => update('status', e.target.value)} className="input">
                {STATUS_OPTIONS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {sesudah != null && (
            <p className={`text-xs ${sesudah > batas ? 'text-amber-700 font-semibold' : 'text-navy/50'}`}>
              Beban {guruTerpilih.nama} setelah disimpan: {sesudah} JP/minggu{sesudah > batas ? ` (melebihi batas ${batas} JP)` : ''}.
            </p>
          )}

          <Field label="Catatan">
            <textarea value={form.catatan} onChange={(e) => update('catatan', e.target.value)} className="input min-h-16" />
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
