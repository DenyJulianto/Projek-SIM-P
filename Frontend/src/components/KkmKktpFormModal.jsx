import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const FASE_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F']
const TINGKAT_SUGGESTIONS = ['1', '2', '3', '4', '5', '6', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

export default function KkmKktpFormModal({ item, tahunAjaranList, mapelList, onClose, onSaved }) {
  const isEdit = Boolean(item)
  const [form, setForm] = useState({
    tahun_ajaran_id: item?.tahun_ajaran_id || '',
    mata_pelajaran_id: item?.mata_pelajaran_id || '',
    fase: item?.fase || '',
    tingkat: item?.tingkat || '',
    semester: item?.semester || 'ganjil',
    nilai_batas: item?.nilai_batas ?? '',
    kriteria_ketercapaian: item?.kriteria_ketercapaian || '',
    status: item?.status || 'draft',
  })
  const [tpIds, setTpIds] = useState((item?.tujuan_pembelajaran || []).map((t) => t.id))
  const [indikatorIds, setIndikatorIds] = useState((item?.indikator || []).map((i) => i.id))
  const [opsi, setOpsi] = useState([])
  const [loadingOpsi, setLoadingOpsi] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const konteksLengkap = form.tahun_ajaran_id && form.mata_pelajaran_id && form.semester

  function loadOpsi() {
    if (!konteksLengkap) {
      setOpsi([])
      return
    }
    setLoadingOpsi(true)
    api
      .getOpsiTautanKkmKktp({
        tahun_ajaran_id: form.tahun_ajaran_id,
        mata_pelajaran_id: form.mata_pelajaran_id,
        semester: form.semester,
      })
      .then(setOpsi)
      .catch(() => setOpsi([]))
      .finally(() => setLoadingOpsi(false))
  }

  useEffect(() => {
    loadOpsi()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.tahun_ajaran_id, form.mata_pelajaran_id, form.semester])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function changeKonteks(field, value) {
    update(field, value)
    setTpIds([])
    setIndikatorIds([])
  }

  function toggle(list, setList, id) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])
  }

  function toggleTp(tp) {
    if (tpIds.includes(tp.id)) {
      setTpIds(tpIds.filter((x) => x !== tp.id))
      const milik = tp.indikator.map((i) => i.id)
      setIndikatorIds(indikatorIds.filter((x) => !milik.includes(x)))
    } else {
      setTpIds([...tpIds, tp.id])
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        tingkat: form.tingkat || null,
        nilai_batas: form.nilai_batas === '' ? null : Number(form.nilai_batas),
        kriteria_ketercapaian: form.kriteria_ketercapaian || null,
        tujuan_pembelajaran_ids: tpIds,
        indikator_ids: indikatorIds,
      }
      if (isEdit) await api.updateKkmKktp(item.id, payload)
      else await api.createKkmKktp(payload)
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-navy/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-navy mb-4">{isEdit ? 'Edit KKM / KKTP' : 'Tambah KKM / KKTP'}</h2>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Tahun Ajaran">
              <select value={form.tahun_ajaran_id} onChange={(e) => changeKonteks('tahun_ajaran_id', e.target.value)} className="input" required>
                <option value="">Pilih tahun ajaran...</option>
                {tahunAjaranList.map((ta) => (
                  <option key={ta.id} value={ta.id}>
                    {ta.nama}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Mata Pelajaran">
              <select value={form.mata_pelajaran_id} onChange={(e) => changeKonteks('mata_pelajaran_id', e.target.value)} className="input" required>
                <option value="">Pilih mata pelajaran...</option>
                {mapelList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nama_mapel}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Fase">
              <select value={form.fase} onChange={(e) => update('fase', e.target.value)} className="input" required>
                <option value="">Pilih fase...</option>
                {FASE_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    Fase {f}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Kelas (opsional)">
              <input
                list="kkm-tingkat-suggestions"
                value={form.tingkat}
                onChange={(e) => update('tingkat', e.target.value)}
                className="input"
                placeholder="mis. VII"
              />
              <datalist id="kkm-tingkat-suggestions">
                {TINGKAT_SUGGESTIONS.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </Field>
            <Field label="Semester">
              <select value={form.semester} onChange={(e) => changeKonteks('semester', e.target.value)} className="input">
                <option value="ganjil">Ganjil</option>
                <option value="genap">Genap</option>
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => update('status', e.target.value)} className="input">
                <option value="draft">Draft</option>
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Tidak Aktif</option>
              </select>
            </Field>
            <Field label="Nilai Batas / KKM (0–100)">
              <input type="number" min="0" max="100" value={form.nilai_batas} onChange={(e) => update('nilai_batas', e.target.value)} className="input" placeholder="mis. 75" />
            </Field>
          </div>

          <Field label="Kriteria Ketercapaian (KKTP)">
            <textarea
              rows={4}
              value={form.kriteria_ketercapaian}
              onChange={(e) => update('kriteria_ketercapaian', e.target.value)}
              className="input"
              placeholder="mis. Peserta didik mampu menyelesaikan minimal 75% soal dengan benar dan dapat menjelaskan langkahnya."
            />
          </Field>
          <p className="text-[11px] text-navy/40 -mt-2">Isi nilai batas, kriteria ketercapaian, atau keduanya.</p>

          <div>
            <p className="text-xs font-semibold text-navy/70 mb-1">Hubungkan dengan TP &amp; Indikator</p>
            {!konteksLengkap && <p className="text-xs text-navy/40">Pilih tahun ajaran, mata pelajaran, dan semester terlebih dahulu.</p>}
            {konteksLengkap && loadingOpsi && <p className="text-xs text-navy/40">Memuat...</p>}
            {konteksLengkap && !loadingOpsi && opsi.length === 0 && (
              <p className="text-xs text-amber-600">Belum ada Tujuan Pembelajaran untuk konteks ini. Tambahkan TP terlebih dahulu di menu Tujuan Pembelajaran.</p>
            )}
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {opsi.map((tp) => (
                <div key={tp.id} className="border border-navy/10 rounded-lg p-2.5">
                  <label className="flex items-start gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={tpIds.includes(tp.id)} onChange={() => toggleTp(tp)} className="mt-1 h-4 w-4 accent-navy-light" />
                    <span className="text-navy">
                      <span className="text-xs text-navy/40">
                        Kelas {tp.tingkat} — TP #{tp.urutan}
                      </span>
                      <br />
                      {tp.deskripsi}
                    </span>
                  </label>
                  {tpIds.includes(tp.id) && tp.indikator.length > 0 && (
                    <div className="mt-2 ml-6 space-y-1">
                      {tp.indikator.map((ind) => (
                        <label key={ind.id} className="flex items-start gap-2 text-xs text-navy/70 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={indikatorIds.includes(ind.id)}
                            onChange={() => toggle(indikatorIds, setIndikatorIds, ind.id)}
                            className="mt-0.5 h-3.5 w-3.5 accent-navy-light"
                          />
                          <span>
                            Indikator #{ind.urutan}: {ind.deskripsi}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-navy/70 hover:text-navy">
              Batal
            </button>
            <button type="submit" disabled={saving} className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2 rounded-md disabled:opacity-50">
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
