import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Badge, Btn, Field, Kosong, ModalShell, Pagination, Pesan } from './LabUI'
import { inputClass, selectClass, tgl } from './labKonstanta'

export default function LabBahanTab() {
  const [result, setResult] = useState(null)
  const [opsi, setOpsi] = useState({ laboratorium: [] })
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [hampirHabis, setHampirHabis] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [detailId, setDetailId] = useState(null)

  function load() {
    const params = { page, per_page: 15 }
    if (search.trim()) params.search = search.trim()
    if (hampirHabis) params.hampir_habis = 1
    api.labListBahan(params).then(setResult).catch((e) => setError(e.message))
  }

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, hampirHabis])

  useEffect(() => {
    api.labOpsiBahan().then(setOpsi).catch(() => {})
  }, [])

  const items = result?.data ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-navy">Bahan &amp; Persediaan</h2>
          <p className="text-xs text-navy/50 mt-0.5">Bahan habis pakai laboratorium IPA, kimia, biologi, dan lainnya.</p>
        </div>
        <Btn utama onClick={() => setShowForm(true)}>+ Tambah Bahan</Btn>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Cari nama / kode bahan…" className={`${selectClass} w-56`} />
        <label className="flex items-center gap-2 text-sm text-navy/70">
          <input type="checkbox" checked={hampirHabis} onChange={(e) => { setHampirHabis(e.target.checked); setPage(1) }} />
          Hanya yang hampir habis
        </label>
      </div>

      <Pesan error={error} />

      <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">Nama Bahan</th>
              <th className="px-4 py-3">Laboratorium</th>
              <th className="px-4 py-3">Stok</th>
              <th className="px-4 py-3">Stok Minimum</th>
              <th className="px-4 py-3">Kedaluwarsa</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {!result ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-navy/40">Memuat...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-navy/40">Belum ada bahan.</td></tr>
            ) : (
              items.map((b) => (
                <tr key={b.id} className="border-t border-navy/5 hover:bg-navy/[0.02]">
                  <td className="px-4 py-3 font-semibold text-navy">{b.nama_bahan}</td>
                  <td className="px-4 py-3 text-navy/70">{b.laboratorium?.nama || '-'}</td>
                  <td className="px-4 py-3 text-navy/70">
                    {b.jumlah_stok} {b.satuan}
                    {Number(b.jumlah_stok) <= Number(b.stok_minimum) && <Badge tone="merah"> Hampir Habis</Badge>}
                  </td>
                  <td className="px-4 py-3 text-navy/70">{b.stok_minimum} {b.satuan}</td>
                  <td className="px-4 py-3 text-navy/70">{b.tanggal_kedaluwarsa ? tgl(b.tanggal_kedaluwarsa) : '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setDetailId(b.id)} className="text-xs font-semibold text-navy-light hover:underline">Kartu Stok</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination result={result} page={page} onPage={setPage} />
      </div>

      {showForm && (
        <BahanFormModal opsi={opsi} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load() }} />
      )}
      {detailId && <BahanDetailModal id={detailId} onClose={() => setDetailId(null)} onChanged={load} />}
    </div>
  )
}

function BahanFormModal({ opsi, onClose, onSaved }) {
  const [form, setForm] = useState({
    kode_bahan: '',
    nama_bahan: '',
    jenis_kategori: '',
    satuan: 'unit',
    jumlah_stok: 0,
    stok_minimum: 0,
    laboratorium_id: '',
    lokasi_penyimpanan: '',
    tanggal_masuk: new Date().toISOString().slice(0, 10),
    tanggal_kedaluwarsa: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function submit() {
    setSaving(true)
    setError('')
    try {
      await api.labCreateBahan(form)
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell
      title="Tambah Bahan"
      onClose={onClose}
      footer={
        <>
          <Btn onClick={onClose}>Batal</Btn>
          <Btn utama disabled={saving || !form.kode_bahan || !form.nama_bahan} onClick={submit}>{saving ? 'Menyimpan...' : 'Simpan'}</Btn>
        </>
      }
    >
      <Pesan error={error} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Kode Bahan *">
          <input value={form.kode_bahan} onChange={set('kode_bahan')} className={inputClass} />
        </Field>
        <Field label="Nama Bahan *">
          <input value={form.nama_bahan} onChange={set('nama_bahan')} className={inputClass} />
        </Field>
        <Field label="Jenis/Kategori">
          <input value={form.jenis_kategori} onChange={set('jenis_kategori')} className={inputClass} />
        </Field>
        <Field label="Satuan">
          <input value={form.satuan} onChange={set('satuan')} className={inputClass} />
        </Field>
        <Field label="Jumlah Stok Awal">
          <input type="number" min="0" step="0.01" value={form.jumlah_stok} onChange={set('jumlah_stok')} className={inputClass} />
        </Field>
        <Field label="Stok Minimum">
          <input type="number" min="0" step="0.01" value={form.stok_minimum} onChange={set('stok_minimum')} className={inputClass} />
        </Field>
        <Field label="Laboratorium">
          <select value={form.laboratorium_id} onChange={set('laboratorium_id')} className={selectClass + ' w-full'}>
            <option value="">— Tidak diisi —</option>
            {opsi.laboratorium.map((l) => (<option key={l.id} value={l.id}>{l.nama}</option>))}
          </select>
        </Field>
        <Field label="Lokasi Penyimpanan">
          <input value={form.lokasi_penyimpanan} onChange={set('lokasi_penyimpanan')} className={inputClass} />
        </Field>
        <Field label="Tanggal Masuk">
          <input type="date" value={form.tanggal_masuk} onChange={set('tanggal_masuk')} className={inputClass} />
        </Field>
        <Field label="Tanggal Kedaluwarsa">
          <input type="date" value={form.tanggal_kedaluwarsa} onChange={set('tanggal_kedaluwarsa')} className={inputClass} />
        </Field>
      </div>
    </ModalShell>
  )
}

function BahanDetailModal({ id, onClose, onChanged }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [aksi, setAksi] = useState('masuk')
  const [jumlah, setJumlah] = useState('')
  const [keterangan, setKeterangan] = useState('')

  function load() {
    api.labGetBahan(id).then(setData).catch((e) => setError(e.message))
  }

  useEffect(load, [id])

  async function submit() {
    setError('')
    try {
      if (aksi === 'masuk') await api.labStokMasukBahan(id, Number(jumlah), keterangan || undefined)
      else if (aksi === 'keluar') await api.labStokKeluarBahan(id, Number(jumlah), keterangan || undefined)
      else await api.labPenyesuaianBahan(id, Number(jumlah), keterangan || undefined)
      setJumlah('')
      setKeterangan('')
      load()
      onChanged()
    } catch (err) {
      setError(err.message)
    }
  }

  if (!data) {
    return (
      <ModalShell title="Kartu Stok" onClose={onClose}>
        <Pesan error={error} />
      </ModalShell>
    )
  }

  const { bahan, kartu_stok } = data

  return (
    <ModalShell title={`Kartu Stok — ${bahan.nama_bahan}`} onClose={onClose} lebar="max-w-2xl">
      <Pesan error={error} />
      <p className="text-sm text-navy mb-4">Stok saat ini: <span className="font-bold">{bahan.jumlah_stok} {bahan.satuan}</span> (minimum {bahan.stok_minimum})</p>

      <div className="flex items-end gap-2 mb-4 flex-wrap">
        <div>
          <span className="block text-[11px] font-semibold text-navy/60 mb-1">Aksi</span>
          <select value={aksi} onChange={(e) => setAksi(e.target.value)} className={selectClass}>
            <option value="masuk">Stok Masuk</option>
            <option value="keluar">Stok Keluar</option>
            <option value="penyesuaian">Penyesuaian (jumlah baru)</option>
          </select>
        </div>
        <div>
          <span className="block text-[11px] font-semibold text-navy/60 mb-1">{aksi === 'penyesuaian' ? 'Jumlah Baru' : 'Jumlah'}</span>
          <input type="number" min="0" step="0.01" value={jumlah} onChange={(e) => setJumlah(e.target.value)} className={`${inputClass} w-28`} />
        </div>
        <div className="flex-1 min-w-32">
          <span className="block text-[11px] font-semibold text-navy/60 mb-1">Keterangan</span>
          <input value={keterangan} onChange={(e) => setKeterangan(e.target.value)} className={inputClass} />
        </div>
        <Btn utama disabled={!jumlah} onClick={submit}>Simpan</Btn>
      </div>

      <h3 className="text-sm font-bold text-navy mb-2">Riwayat Stok</h3>
      {kartu_stok.length === 0 ? (
        <Kosong>Belum ada mutasi stok.</Kosong>
      ) : (
        <div className="border border-navy/10 rounded-lg divide-y divide-navy/5 max-h-64 overflow-y-auto">
          {kartu_stok.map((m) => (
            <div key={m.id} className="px-3 py-2 text-sm flex items-center justify-between">
              <div>
                <span className="font-semibold text-navy capitalize">{m.jenis}</span>
                <span className="text-navy/60"> — {m.jumlah} {bahan.satuan}</span>
                {m.keterangan && <p className="text-xs text-navy/40">{m.keterangan}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs text-navy/50">{tgl(m.tanggal)}</p>
                <p className="text-xs text-navy/40">Sisa: {m.stok_setelah}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </ModalShell>
  )
}
