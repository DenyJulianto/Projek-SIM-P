import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Badge, Btn, Field, ModalShell, Pagination, Pesan } from './LabUI'
import { inputClass, LABEL_JENIS_KEGIATAN_LAB, selectClass, tgl, TONE_STATUS_KEGIATAN } from './labKonstanta'

export default function LabKegiatanTab() {
  const [result, setResult] = useState(null)
  const [opsi, setOpsi] = useState({ laboratorium: [] })
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [laboratoriumId, setLaboratoriumId] = useState('')
  const [jenis, setJenis] = useState('')
  const [showForm, setShowForm] = useState(null)

  function load() {
    const params = { page, per_page: 15 }
    if (laboratoriumId) params.laboratorium_id = laboratoriumId
    if (jenis) params.jenis_kegiatan = jenis
    api.labListKegiatan(params).then(setResult).catch((e) => setError(e.message))
  }

  useEffect(load, [page, laboratoriumId, jenis])

  useEffect(() => {
    api.labOpsiPeralatan().then((r) => setOpsi({ laboratorium: r.laboratorium })).catch(() => {})
  }, [])

  async function hapus(id) {
    if (!confirm('Hapus kegiatan ini?')) return
    try {
      await api.labHapusKegiatan(id)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const items = result?.data ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-navy">Kegiatan Laboratorium</h2>
          <p className="text-xs text-navy/50 mt-0.5">Praktikum, pelatihan, ujian praktik, penelitian, dan workshop.</p>
        </div>
        <Btn utama onClick={() => setShowForm({})}>+ Tambah Kegiatan</Btn>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <select value={laboratoriumId} onChange={(e) => { setLaboratoriumId(e.target.value); setPage(1) }} className={selectClass}>
          <option value="">Semua Laboratorium</option>
          {opsi.laboratorium.map((l) => (<option key={l.id} value={l.id}>{l.nama}</option>))}
        </select>
        <select value={jenis} onChange={(e) => { setJenis(e.target.value); setPage(1) }} className={selectClass}>
          <option value="">Semua Jenis</option>
          {Object.entries(LABEL_JENIS_KEGIATAN_LAB).map(([k, l]) => (<option key={k} value={k}>{l}</option>))}
        </select>
      </div>

      <Pesan error={error} />

      <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">Nama Kegiatan</th>
              <th className="px-4 py-3">Jenis</th>
              <th className="px-4 py-3">Lab</th>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Kelas</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {!result ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-navy/40">Memuat...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-navy/40">Belum ada kegiatan.</td></tr>
            ) : (
              items.map((k) => (
                <tr key={k.id} className="border-t border-navy/5 hover:bg-navy/[0.02]">
                  <td className="px-4 py-3 font-semibold text-navy">{k.nama_kegiatan}</td>
                  <td className="px-4 py-3 text-navy/70">{LABEL_JENIS_KEGIATAN_LAB[k.jenis_kegiatan]}</td>
                  <td className="px-4 py-3 text-navy/70">{k.laboratorium?.nama}</td>
                  <td className="px-4 py-3 text-navy/70">{tgl(k.tanggal)}</td>
                  <td className="px-4 py-3 text-navy/70">{k.kelas?.nama_kelas || k.peserta_lainnya || '-'}</td>
                  <td className="px-4 py-3"><Badge tone={TONE_STATUS_KEGIATAN[k.status]}>{k.status}</Badge></td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => setShowForm(k)} className="text-xs font-semibold text-navy-light hover:underline">Edit</button>
                    <button onClick={() => hapus(k.id)} className="text-xs font-semibold text-red-600 hover:underline">Hapus</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination result={result} page={page} onPage={setPage} />
      </div>

      {showForm && (
        <KegiatanFormModal
          kegiatan={showForm.id ? showForm : null}
          opsi={opsi}
          onClose={() => setShowForm(null)}
          onSaved={() => { setShowForm(null); load() }}
        />
      )}
    </div>
  )
}

function KegiatanFormModal({ kegiatan, opsi, onClose, onSaved }) {
  const [form, setForm] = useState({
    nama_kegiatan: kegiatan?.nama_kegiatan ?? '',
    jenis_kegiatan: kegiatan?.jenis_kegiatan ?? 'praktikum',
    laboratorium_id: kegiatan?.laboratorium_id ?? '',
    tanggal: kegiatan?.tanggal ? String(kegiatan.tanggal).slice(0, 10) : '',
    jam_mulai: kegiatan?.jam_mulai ?? '',
    jam_selesai: kegiatan?.jam_selesai ?? '',
    penanggung_jawab: kegiatan?.penanggung_jawab ?? '',
    peserta_lainnya: kegiatan?.peserta_lainnya ?? '',
    tujuan: kegiatan?.tujuan ?? '',
    peralatan_digunakan: kegiatan?.peralatan_digunakan ?? '',
    bahan_digunakan: kegiatan?.bahan_digunakan ?? '',
    catatan: kegiatan?.catatan ?? '',
    status: kegiatan?.status ?? 'direncanakan',
  })
  const [dokumentasi, setDokumentasi] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function submit() {
    setSaving(true)
    setError('')
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '' && v !== null) formData.append(k, v)
      })
      if (dokumentasi) formData.append('dokumentasi', dokumentasi)

      if (kegiatan) await api.labUpdateKegiatan(kegiatan.id, formData)
      else await api.labCreateKegiatan(formData)
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell
      title={kegiatan ? 'Edit Kegiatan' : 'Tambah Kegiatan'}
      onClose={onClose}
      lebar="max-w-2xl"
      footer={
        <>
          <Btn onClick={onClose}>Batal</Btn>
          <Btn utama disabled={saving || !form.nama_kegiatan || !form.laboratorium_id || !form.tanggal} onClick={submit}>{saving ? 'Menyimpan...' : 'Simpan'}</Btn>
        </>
      }
    >
      <Pesan error={error} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nama Kegiatan *" className="col-span-2">
          <input value={form.nama_kegiatan} onChange={set('nama_kegiatan')} className={inputClass} />
        </Field>
        <Field label="Jenis Kegiatan *">
          <select value={form.jenis_kegiatan} onChange={set('jenis_kegiatan')} className={selectClass + ' w-full'}>
            {Object.entries(LABEL_JENIS_KEGIATAN_LAB).map(([k, l]) => (<option key={k} value={k}>{l}</option>))}
          </select>
        </Field>
        <Field label="Laboratorium *">
          <select value={form.laboratorium_id} onChange={set('laboratorium_id')} className={selectClass + ' w-full'}>
            <option value="">— Pilih —</option>
            {opsi.laboratorium.map((l) => (<option key={l.id} value={l.id}>{l.nama}</option>))}
          </select>
        </Field>
        <Field label="Tanggal *">
          <input type="date" value={form.tanggal} onChange={set('tanggal')} className={inputClass} />
        </Field>
        <Field label="Jam Mulai">
          <input type="time" value={form.jam_mulai} onChange={set('jam_mulai')} className={inputClass} />
        </Field>
        <Field label="Jam Selesai">
          <input type="time" value={form.jam_selesai} onChange={set('jam_selesai')} className={inputClass} />
        </Field>
        <Field label="Penanggung Jawab">
          <input value={form.penanggung_jawab} onChange={set('penanggung_jawab')} className={inputClass} />
        </Field>
        <Field label="Kelas/Peserta">
          <input value={form.peserta_lainnya} onChange={set('peserta_lainnya')} className={inputClass} placeholder="Contoh: Kelas VIII-A / Guru IPA" />
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={set('status')} className={selectClass + ' w-full'}>
            <option value="direncanakan">Direncanakan</option>
            <option value="berlangsung">Berlangsung</option>
            <option value="selesai">Selesai</option>
            <option value="dibatalkan">Dibatalkan</option>
          </select>
        </Field>
        <Field label="Tujuan" className="col-span-2">
          <textarea value={form.tujuan} onChange={set('tujuan')} rows={2} className={inputClass} />
        </Field>
        <Field label="Peralatan Digunakan" className="col-span-2">
          <input value={form.peralatan_digunakan} onChange={set('peralatan_digunakan')} className={inputClass} placeholder="Contoh: Mikroskop, tabung reaksi" />
        </Field>
        <Field label="Bahan Digunakan" className="col-span-2">
          <input value={form.bahan_digunakan} onChange={set('bahan_digunakan')} className={inputClass} placeholder="Contoh: Alkohol 70%, larutan iodin" />
        </Field>
        <Field label="Catatan" className="col-span-2">
          <textarea value={form.catatan} onChange={set('catatan')} rows={2} className={inputClass} />
        </Field>
        <Field label="Dokumentasi (Foto)" className="col-span-2">
          <input type="file" accept="image/*" onChange={(e) => setDokumentasi(e.target.files?.[0] ?? null)} className="text-sm" />
        </Field>
      </div>
    </ModalShell>
  )
}
