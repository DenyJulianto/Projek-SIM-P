import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Btn, Field, ModalShell, Pagination, Pesan } from './LabUI'
import { inputClass, KONDISI_ALAT, LABEL_JENIS_PEMELIHARAAN, LABEL_KONDISI_ALAT, rupiah, selectClass, tgl } from './labKonstanta'

export default function LabPemeliharaanTab() {
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [jenis, setJenis] = useState('')
  const [showForm, setShowForm] = useState(false)

  function load() {
    const params = { page, per_page: 15 }
    if (jenis) params.jenis_pemeliharaan = jenis
    api.labListPemeliharaan(params).then(setResult).catch((e) => setError(e.message))
  }

  useEffect(load, [page, jenis])

  const items = result?.data ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-navy">Pemeliharaan Peralatan</h2>
          <p className="text-xs text-navy/50 mt-0.5">Riwayat maintenance berkala — mengubah kondisi alat secara otomatis.</p>
        </div>
        <Btn utama onClick={() => setShowForm(true)}>+ Catat Pemeliharaan</Btn>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <select value={jenis} onChange={(e) => { setJenis(e.target.value); setPage(1) }} className={selectClass}>
          <option value="">Semua Jenis</option>
          {Object.entries(LABEL_JENIS_PEMELIHARAAN).map(([k, l]) => (<option key={k} value={k}>{l}</option>))}
        </select>
      </div>

      <Pesan error={error} />

      <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">Alat</th>
              <th className="px-4 py-3">Jenis</th>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Teknisi</th>
              <th className="px-4 py-3">Biaya</th>
              <th className="px-4 py-3">Pemeliharaan Berikutnya</th>
            </tr>
          </thead>
          <tbody>
            {!result ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-navy/40">Memuat...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-navy/40">Belum ada riwayat pemeliharaan.</td></tr>
            ) : (
              items.map((p) => (
                <tr key={p.id} className="border-t border-navy/5 hover:bg-navy/[0.02]">
                  <td className="px-4 py-3 font-semibold text-navy">{p.inventaris?.nama_barang}</td>
                  <td className="px-4 py-3 text-navy/70">{LABEL_JENIS_PEMELIHARAAN[p.jenis_pemeliharaan]}</td>
                  <td className="px-4 py-3 text-navy/70">{tgl(p.tanggal)}</td>
                  <td className="px-4 py-3 text-navy/70">{p.teknisi || '-'}</td>
                  <td className="px-4 py-3 text-navy/70">{p.biaya ? rupiah(p.biaya) : '-'}</td>
                  <td className="px-4 py-3 text-navy/70">{p.tanggal_berikutnya ? tgl(p.tanggal_berikutnya) : '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination result={result} page={page} onPage={setPage} />
      </div>

      {showForm && (
        <PemeliharaanFormModal onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load() }} />
      )}
    </div>
  )
}

function PemeliharaanFormModal({ onClose, onSaved }) {
  const [searchAlat, setSearchAlat] = useState('')
  const [daftarAlat, setDaftarAlat] = useState([])
  const [alat, setAlat] = useState(null)
  const [form, setForm] = useState({
    jenis_pemeliharaan: 'rutin',
    tanggal: new Date().toISOString().slice(0, 10),
    teknisi: '',
    tindakan: '',
    kondisi_setelah: 'baik',
    biaya: '',
    catatan: '',
    tanggal_berikutnya: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!searchAlat.trim()) {
      setDaftarAlat([])
      return
    }
    const timer = setTimeout(() => {
      api.labListPeralatan({ search: searchAlat, per_page: 8 }).then((r) => setDaftarAlat(r.data)).catch(() => {})
    }, 250)
    return () => clearTimeout(timer)
  }, [searchAlat])

  function set(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function submit() {
    setSaving(true)
    setError('')
    try {
      await api.labCreatePemeliharaan({ ...form, inventaris_id: alat.id })
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell
      title="Catat Pemeliharaan Alat"
      onClose={onClose}
      footer={
        <>
          <Btn onClick={onClose}>Batal</Btn>
          <Btn utama disabled={saving || !alat} onClick={submit}>{saving ? 'Menyimpan...' : 'Simpan'}</Btn>
        </>
      }
    >
      <Pesan error={error} />
      <Field label="Cari Alat *" className="mb-2">
        <input value={searchAlat} onChange={(e) => setSearchAlat(e.target.value)} className={inputClass} placeholder="Ketik nama alat…" />
      </Field>
      {daftarAlat.length > 0 && (
        <div className="border border-navy/10 rounded-lg mb-3 max-h-36 overflow-y-auto">
          {daftarAlat.map((a) => (
            <label key={a.id} className="flex items-center gap-2 px-3 py-2 border-b border-navy/5 last:border-0 text-sm cursor-pointer hover:bg-navy/5">
              <input type="radio" name="alat" checked={alat?.id === a.id} onChange={() => setAlat(a)} />
              <span className="text-navy">{a.nama_barang}</span>
              <span className="text-xs text-navy/40">({a.laboratorium?.nama})</span>
            </label>
          ))}
        </div>
      )}
      {alat && <p className="text-sm text-sky-700 bg-sky-50 border border-sky-200 rounded-lg px-3 py-2 mb-3">Dipilih: {alat.nama_barang}</p>}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Jenis Pemeliharaan *">
          <select value={form.jenis_pemeliharaan} onChange={set('jenis_pemeliharaan')} className={selectClass + ' w-full'}>
            {Object.entries(LABEL_JENIS_PEMELIHARAAN).map(([k, l]) => (<option key={k} value={k}>{l}</option>))}
          </select>
        </Field>
        <Field label="Tanggal *">
          <input type="date" value={form.tanggal} onChange={set('tanggal')} className={inputClass} />
        </Field>
        <Field label="Teknisi/Petugas">
          <input value={form.teknisi} onChange={set('teknisi')} className={inputClass} />
        </Field>
        <Field label="Biaya (Rp)">
          <input type="number" min="0" value={form.biaya} onChange={set('biaya')} className={inputClass} />
        </Field>
        <Field label="Tindakan" className="col-span-2">
          <textarea value={form.tindakan} onChange={set('tindakan')} rows={2} className={inputClass} />
        </Field>
        <Field label="Kondisi Setelah">
          <select value={form.kondisi_setelah} onChange={set('kondisi_setelah')} className={selectClass + ' w-full'}>
            {KONDISI_ALAT.map((k) => (<option key={k} value={k}>{LABEL_KONDISI_ALAT[k]}</option>))}
          </select>
        </Field>
        <Field label="Pemeliharaan Berikutnya">
          <input type="date" value={form.tanggal_berikutnya} onChange={set('tanggal_berikutnya')} className={inputClass} />
        </Field>
        <Field label="Catatan" className="col-span-2">
          <textarea value={form.catatan} onChange={set('catatan')} rows={2} className={inputClass} />
        </Field>
      </div>
    </ModalShell>
  )
}
