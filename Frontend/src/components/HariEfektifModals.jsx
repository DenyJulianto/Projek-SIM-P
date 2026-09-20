import { useState } from 'react'
import { api } from '../lib/api'

const JENIS_OPTIONS = [
  ['efektif', 'Hari Efektif'],
  ['libur', 'Libur'],
  ['kegiatan_sekolah', 'Kegiatan Sekolah'],
  ['ujian', 'Ujian'],
  ['lainnya', 'Lainnya'],
]

const primaryBtn = 'bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2 rounded-md disabled:opacity-50'

function Shell({ title, subtitle, children }) {
  return (
    <div className="fixed inset-0 bg-navy/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-lg font-bold text-navy mb-1">{title}</h2>
        {subtitle && <p className="text-xs text-navy/50 mb-4">{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-navy/70 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-navy/40 mt-1">{hint}</span>}
    </label>
  )
}

function Actions({ onClose, saving, label }) {
  return (
    <div className="flex justify-end gap-3 pt-2">
      <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-navy/70 hover:text-navy">
        Batal
      </button>
      <button type="submit" disabled={saving} className={primaryBtn}>
        {saving ? 'Menyimpan...' : label}
      </button>
    </div>
  )
}

/** Generate otomatis dari kalender akademik (data Semester) atau tanggal manual. */
export function GenerateModal({ konteks, periode, semesterInfo, onClose, onSaved }) {
  const [form, setForm] = useState({
    tanggal_mulai: periode?.tanggal_mulai ?? semesterInfo?.tanggal_mulai ?? '',
    tanggal_selesai: periode?.tanggal_selesai ?? semesterInfo?.tanggal_selesai ?? '',
    hari_sekolah: periode?.hari_sekolah ?? 5,
    timpa: false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    if (form.timpa && !window.confirm('Semua tanggal yang sudah ada (termasuk tanda libur/kegiatan manual) akan dibuat ulang. Lanjutkan?')) return
    setSaving(true)
    setError('')
    try {
      const res = await api.generateHariEfektif({
        tahun_ajaran_id: konteks.tahun_ajaran_id,
        semester: konteks.semester,
        ...form,
        hari_sekolah: Number(form.hari_sekolah),
        tanggal_mulai: form.tanggal_mulai || null,
        tanggal_selesai: form.tanggal_selesai || null,
      })
      onSaved(res.message)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Shell
      title="Generate Otomatis"
      subtitle={
        semesterInfo
          ? `Rentang mengikuti kalender akademik: ${semesterInfo.tanggal_mulai} s.d. ${semesterInfo.tanggal_selesai}. Akhir pekan otomatis ditandai libur; libur nasional/cuti bersama ditandai manual.`
          : 'Semester ini belum ada di kalender akademik, isi tanggal secara manual. Akhir pekan otomatis ditandai libur.'
      }
    >
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tanggal Mulai">
            <input type="date" required value={form.tanggal_mulai} onChange={(e) => setForm((f) => ({ ...f, tanggal_mulai: e.target.value }))} className="input" />
          </Field>
          <Field label="Tanggal Selesai">
            <input type="date" required value={form.tanggal_selesai} onChange={(e) => setForm((f) => ({ ...f, tanggal_selesai: e.target.value }))} className="input" />
          </Field>
        </div>
        <Field label="Hari Sekolah per Minggu">
          <select value={form.hari_sekolah} onChange={(e) => setForm((f) => ({ ...f, hari_sekolah: e.target.value }))} className="input">
            <option value={5}>5 hari (Senin–Jumat)</option>
            <option value={6}>6 hari (Senin–Sabtu)</option>
          </select>
        </Field>
        {periode && (
          <label className="flex items-start gap-2 text-sm text-navy/70">
            <input type="checkbox" className="mt-1" checked={form.timpa} onChange={(e) => setForm((f) => ({ ...f, timpa: e.target.checked }))} />
            <span>
              Timpa semua tanggal yang sudah ada
              <span className="block text-[11px] text-navy/40">Bila tidak dicentang, tanggal yang sudah ada (mis. libur manual) dipertahankan dan hanya tanggal yang kosong yang diisi.</span>
            </span>
          </label>
        )}
        <Actions onClose={onClose} saving={saving} label="Generate" />
      </form>
    </Shell>
  )
}

/** Tandai rentang tanggal sebagai libur / kegiatan sekolah / ujian / dll. */
export function TandaiModal({ konteks, periode, jenisAwal, onClose, onSaved }) {
  const [form, setForm] = useState({
    tanggal_mulai: periode.tanggal_mulai,
    tanggal_selesai: periode.tanggal_mulai,
    jenis: jenisAwal,
    keterangan: '',
    hanya_hari_sekolah: true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await api.tandaiHariEfektif({
        tahun_ajaran_id: konteks.tahun_ajaran_id,
        semester: konteks.semester,
        ...form,
        keterangan: form.keterangan || null,
      })
      onSaved(res.message)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const min = periode.tanggal_mulai
  const max = periode.tanggal_selesai

  return (
    <Shell title="Tandai Tanggal" subtitle={`Periode ${min} s.d. ${max}. Tanggal yang belum ada akan dibuat, yang sudah ada akan diubah.`}  >
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <form onSubmit={submit} className="space-y-4">
        <Field label="Tandai sebagai">
          <select value={form.jenis} onChange={(e) => setForm((f) => ({ ...f, jenis: e.target.value }))} className="input">
            {JENIS_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dari Tanggal">
            <input
              type="date"
              required
              min={min}
              max={max}
              value={form.tanggal_mulai}
              onChange={(e) => setForm((f) => ({ ...f, tanggal_mulai: e.target.value, tanggal_selesai: f.tanggal_selesai < e.target.value ? e.target.value : f.tanggal_selesai }))}
              className="input"
            />
          </Field>
          <Field label="Sampai Tanggal">
            <input type="date" required min={form.tanggal_mulai || min} max={max} value={form.tanggal_selesai} onChange={(e) => setForm((f) => ({ ...f, tanggal_selesai: e.target.value }))} className="input" />
          </Field>
        </div>
        <Field label="Keterangan">
          <input type="text" value={form.keterangan} maxLength={255} onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))} className="input" placeholder="mis. Libur Hari Raya, PTS, Class meeting" />
        </Field>
        <label className="flex items-center gap-2 text-sm text-navy/70">
          <input type="checkbox" checked={form.hanya_hari_sekolah} onChange={(e) => setForm((f) => ({ ...f, hanya_hari_sekolah: e.target.checked }))} />
          Lewati akhir pekan (hanya hari sekolah)
        </label>
        <Actions onClose={onClose} saving={saving} label="Tandai" />
      </form>
    </Shell>
  )
}

/** Tambah / edit satu tanggal. */
export function HariFormModal({ konteks, periode, item, onClose, onSaved }) {
  const isEdit = Boolean(item)
  const [form, setForm] = useState({
    tanggal: item?.tanggal ?? '',
    jenis: item?.jenis ?? 'efektif',
    keterangan: item?.keterangan ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { ...form, keterangan: form.keterangan || null }
      if (isEdit) {
        await api.updateHariEfektif(item.id, payload)
      } else {
        await api.createHariEfektif({ tahun_ajaran_id: konteks.tahun_ajaran_id, semester: konteks.semester, ...payload })
      }
      onSaved(isEdit ? 'Tanggal diperbarui.' : 'Tanggal ditambahkan.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Shell title={isEdit ? 'Edit Tanggal' : 'Tambah Tanggal'} subtitle={`Periode ${periode.tanggal_mulai} s.d. ${periode.tanggal_selesai}`}  >
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <form onSubmit={submit} className="space-y-4">
        <Field label="Tanggal">
          <input type="date" required min={periode.tanggal_mulai} max={periode.tanggal_selesai} value={form.tanggal} onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))} className="input" />
        </Field>
        <Field label="Status Hari">
          <select value={form.jenis} onChange={(e) => setForm((f) => ({ ...f, jenis: e.target.value }))} className="input">
            {JENIS_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Keterangan">
          <input type="text" maxLength={255} value={form.keterangan} onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))} className="input" />
        </Field>
        <Actions onClose={onClose} saving={saving} label="Simpan" />
      </form>
    </Shell>
  )
}

/** Import jenis dan keterangan per tanggal dari Excel. */
export function ImportHariModal({ konteks, onClose, onSaved }) {
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  async function submit() {
    setBusy(true)
    setError('')
    try {
      const res = await api.importHariEfektif({ tahun_ajaran_id: konteks.tahun_ajaran_id, semester: konteks.semester }, file)
      setResult(res)
      if (res.berhasil > 0) onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell
      title="Import Hari Efektif"
      subtitle="Isi kolom Tanggal (YYYY-MM-DD atau DD/MM/YYYY), Jenis (Hari Efektif, Libur, Kegiatan Sekolah, Ujian, Lainnya), dan Keterangan. Tanggal yang sudah ada akan diubah."
    >
      <button onClick={() => api.downloadTemplateHariEfektif().catch((e) => setError(e.message))} className="text-xs font-semibold text-navy underline mb-3">
        Unduh template
      </button>
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      <input type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block text-sm mb-3" />
      <div className="flex items-center gap-3">
        <button onClick={submit} disabled={!file || busy} className={primaryBtn}>
          {busy ? 'Mengimpor...' : 'Import'}
        </button>
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-navy/70 hover:text-navy">
          Tutup
        </button>
      </div>
      {result && (
        <div className="mt-4 text-sm">
          <p className="font-semibold text-navy">
            {result.berhasil} berhasil, {result.errors.length} bermasalah.
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-2 max-h-40 overflow-y-auto text-xs text-red-600 space-y-1 list-disc pl-4">
              {result.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Shell>
  )
}
