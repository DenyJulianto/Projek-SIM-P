import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Badge, Btn, Field, ModalShell, Pagination, Pesan } from './PerpusUI'
import { inputClass, LABEL_JENIS_KEGIATAN, selectClass, tgl, TONE_STATUS_KEGIATAN } from './perpusKonstanta'

export default function PerpusKegiatanTab() {
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [jenis, setJenis] = useState('')
  const [status, setStatus] = useState('')
  const [showForm, setShowForm] = useState(null)

  function load() {
    const params = { page, per_page: 15 }
    if (jenis) params.jenis_kegiatan = jenis
    if (status) params.status = status
    api.perpusListKegiatan(params).then(setResult).catch((e) => setError(e.message))
  }

  useEffect(load, [page, jenis, status])

  async function hapus(id) {
    if (!confirm('Hapus kegiatan ini?')) return
    try {
      await api.perpusHapusKegiatan(id)
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
          <h2 className="text-lg font-bold text-navy">Kegiatan Perpustakaan</h2>
          <p className="text-xs text-navy/50 mt-0.5">Literasi sekolah, kunjungan, bedah buku, pameran, dan program membaca.</p>
        </div>
        <Btn utama onClick={() => setShowForm({})}>+ Tambah Kegiatan</Btn>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <select value={jenis} onChange={(e) => { setJenis(e.target.value); setPage(1) }} className={selectClass}>
          <option value="">Semua Jenis</option>
          {Object.entries(LABEL_JENIS_KEGIATAN).map(([k, l]) => (
            <option key={k} value={k}>{l}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className={selectClass}>
          <option value="">Semua Status</option>
          <option value="direncanakan">Direncanakan</option>
          <option value="berlangsung">Berlangsung</option>
          <option value="selesai">Selesai</option>
          <option value="dibatalkan">Dibatalkan</option>
        </select>
      </div>

      <Pesan error={error} />

      <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">Nama Kegiatan</th>
              <th className="px-4 py-3">Jenis</th>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Lokasi</th>
              <th className="px-4 py-3">Peserta</th>
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
                  <td className="px-4 py-3 text-navy/70">{LABEL_JENIS_KEGIATAN[k.jenis_kegiatan]}</td>
                  <td className="px-4 py-3 text-navy/70">{tgl(k.tanggal)}</td>
                  <td className="px-4 py-3 text-navy/70">{k.lokasi || '-'}</td>
                  <td className="px-4 py-3 text-navy/70">{k.jumlah_peserta ?? '-'}</td>
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
          onClose={() => setShowForm(null)}
          onSaved={() => {
            setShowForm(null)
            load()
          }}
        />
      )}
    </div>
  )
}

function KegiatanFormModal({ kegiatan, onClose, onSaved }) {
  const [form, setForm] = useState({
    nama_kegiatan: kegiatan?.nama_kegiatan ?? '',
    jenis_kegiatan: kegiatan?.jenis_kegiatan ?? 'literasi',
    tanggal: kegiatan?.tanggal ? String(kegiatan.tanggal).slice(0, 10) : '',
    lokasi: kegiatan?.lokasi ?? '',
    penanggung_jawab: kegiatan?.penanggung_jawab ?? '',
    jumlah_peserta: kegiatan?.jumlah_peserta ?? '',
    deskripsi: kegiatan?.deskripsi ?? '',
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

      if (kegiatan) await api.perpusUpdateKegiatan(kegiatan.id, formData)
      else await api.perpusBuatKegiatan(formData)
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
      footer={
        <>
          <Btn onClick={onClose}>Batal</Btn>
          <Btn utama disabled={saving || !form.nama_kegiatan || !form.tanggal} onClick={submit}>{saving ? 'Menyimpan...' : 'Simpan'}</Btn>
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
            {Object.entries(LABEL_JENIS_KEGIATAN).map(([k, l]) => (
              <option key={k} value={k}>{l}</option>
            ))}
          </select>
        </Field>
        <Field label="Tanggal *">
          <input type="date" value={form.tanggal} onChange={set('tanggal')} className={inputClass} />
        </Field>
        <Field label="Lokasi">
          <input value={form.lokasi} onChange={set('lokasi')} className={inputClass} />
        </Field>
        <Field label="Penanggung Jawab">
          <input value={form.penanggung_jawab} onChange={set('penanggung_jawab')} className={inputClass} />
        </Field>
        <Field label="Jumlah Peserta">
          <input type="number" min="0" value={form.jumlah_peserta} onChange={set('jumlah_peserta')} className={inputClass} />
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={set('status')} className={selectClass + ' w-full'}>
            <option value="direncanakan">Direncanakan</option>
            <option value="berlangsung">Berlangsung</option>
            <option value="selesai">Selesai</option>
            <option value="dibatalkan">Dibatalkan</option>
          </select>
        </Field>
        <Field label="Deskripsi" className="col-span-2">
          <textarea value={form.deskripsi} onChange={set('deskripsi')} rows={3} className={inputClass} />
        </Field>
        <Field label="Dokumentasi (Foto)" className="col-span-2">
          <input type="file" accept="image/*" onChange={(e) => setDokumentasi(e.target.files?.[0] ?? null)} className="text-sm" />
        </Field>
      </div>
    </ModalShell>
  )
}
