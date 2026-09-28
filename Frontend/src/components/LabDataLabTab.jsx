import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Badge, Btn, Field, ModalShell, Pagination, Pesan } from './LabUI'
import { inputClass, selectClass, TONE_STATUS_LAB, waktu } from './labKonstanta'

export default function LabDataLabTab() {
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [showForm, setShowForm] = useState(null)
  const [detailId, setDetailId] = useState(null)

  function load() {
    const params = { page, per_page: 15 }
    if (search.trim()) params.search = search.trim()
    if (status) params.status = status
    api.labListLab(params).then(setResult).catch((e) => setError(e.message))
  }

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, status])

  const items = result?.data ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-navy">Data Laboratorium</h2>
          <p className="text-xs text-navy/50 mt-0.5">Ruang laboratorium sekolah beserta penanggung jawab dan kapasitasnya.</p>
        </div>
        <Btn utama onClick={() => setShowForm({})}>+ Tambah Laboratorium</Btn>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Cari nama laboratorium…" className={`${selectClass} w-56`} />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className={selectClass}>
          <option value="">Semua Status</option>
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Nonaktif</option>
        </select>
      </div>

      <Pesan error={error} />

      <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Penanggung Jawab</th>
              <th className="px-4 py-3">Kapasitas</th>
              <th className="px-4 py-3">Jumlah Alat</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {!result ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-navy/40">Memuat...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-navy/40">Belum ada laboratorium.</td></tr>
            ) : (
              items.map((l) => (
                <tr key={l.id} className="border-t border-navy/5 hover:bg-navy/[0.02]">
                  <td className="px-4 py-3 font-semibold text-navy">{l.nama}</td>
                  <td className="px-4 py-3 text-navy/70">{l.kategori || '-'}</td>
                  <td className="px-4 py-3 text-navy/70">{l.penanggung_jawab?.nama || '-'}</td>
                  <td className="px-4 py-3 text-navy/70">{l.kapasitas ?? '-'}</td>
                  <td className="px-4 py-3 text-navy/70">{l.peralatan_count}</td>
                  <td className="px-4 py-3"><Badge tone={TONE_STATUS_LAB[l.status]}>{l.status === 'aktif' ? 'Aktif' : 'Nonaktif'}</Badge></td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => setDetailId(l.id)} className="text-xs font-semibold text-navy-light hover:underline">Detail</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination result={result} page={page} onPage={setPage} />
      </div>

      {showForm && (
        <LabFormModal
          lab={showForm.id ? showForm : null}
          onClose={() => setShowForm(null)}
          onSaved={() => {
            setShowForm(null)
            load()
          }}
        />
      )}
      {detailId && (
        <LabDetailModal
          id={detailId}
          onClose={() => setDetailId(null)}
          onEdit={(lab) => {
            setDetailId(null)
            setShowForm(lab)
          }}
          onChanged={load}
        />
      )}
    </div>
  )
}

function LabFormModal({ lab, onClose, onSaved }) {
  const [opsi, setOpsi] = useState({ guru: [] })
  const [form, setForm] = useState({
    nama: lab?.nama ?? '',
    kategori: lab?.kategori ?? '',
    penanggung_jawab_guru_id: lab?.penanggung_jawab_guru_id ?? '',
    kapasitas: lab?.kapasitas ?? '',
    deskripsi: lab?.deskripsi ?? '',
    status: lab?.status ?? 'aktif',
  })
  const [foto, setFoto] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.labOpsiJadwal().then((r) => setOpsi({ guru: r.guru })).catch(() => {})
  }, [])

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
      if (foto) formData.append('foto', foto)

      if (lab) await api.labUpdateLab(lab.id, formData)
      else await api.labCreateLab(formData)
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell
      title={lab ? 'Edit Laboratorium' : 'Tambah Laboratorium'}
      onClose={onClose}
      footer={
        <>
          <Btn onClick={onClose}>Batal</Btn>
          <Btn utama disabled={saving || !form.nama} onClick={submit}>{saving ? 'Menyimpan...' : 'Simpan'}</Btn>
        </>
      }
    >
      <Pesan error={error} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nama Laboratorium *" className="col-span-2">
          <input value={form.nama} onChange={set('nama')} className={inputClass} placeholder="Contoh: Lab IPA" />
        </Field>
        <Field label="Kategori">
          <input value={form.kategori} onChange={set('kategori')} className={inputClass} placeholder="Komputer / IPA / Bahasa / dst." />
        </Field>
        <Field label="Kapasitas">
          <input type="number" min="0" value={form.kapasitas} onChange={set('kapasitas')} className={inputClass} />
        </Field>
        <Field label="Penanggung Jawab" className="col-span-2">
          <select value={form.penanggung_jawab_guru_id} onChange={set('penanggung_jawab_guru_id')} className={selectClass + ' w-full'}>
            <option value="">— Pilih Guru —</option>
            {opsi.guru.map((g) => (
              <option key={g.id} value={g.id}>{g.nama}</option>
            ))}
          </select>
        </Field>
        <Field label="Deskripsi" className="col-span-2">
          <textarea value={form.deskripsi} onChange={set('deskripsi')} rows={3} className={inputClass} />
        </Field>
        <Field label="Foto Laboratorium" className="col-span-2">
          <input type="file" accept="image/*" onChange={(e) => setFoto(e.target.files?.[0] ?? null)} className="text-sm" />
        </Field>
        {lab && (
          <Field label="Status">
            <select value={form.status} onChange={set('status')} className={selectClass + ' w-full'}>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </Field>
        )}
      </div>
    </ModalShell>
  )
}

function LabDetailModal({ id, onClose, onEdit, onChanged }) {
  const [lab, setLab] = useState(null)
  const [riwayat, setRiwayat] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.labGetLab(id).then(setLab).catch((e) => setError(e.message))
    api.labRiwayatLab(id).then(setRiwayat).catch(() => {})
  }, [id])

  async function nonaktifkan() {
    if (!confirm(`Nonaktifkan laboratorium "${lab.nama}"?`)) return
    try {
      await api.labNonaktifkanLab(id)
      onChanged()
      onClose()
    } catch (err) {
      setError(err.message)
    }
  }

  if (!lab) {
    return (
      <ModalShell title="Detail Laboratorium" onClose={onClose}>
        <Pesan error={error} />
      </ModalShell>
    )
  }

  return (
    <ModalShell
      title={lab.nama}
      onClose={onClose}
      footer={
        <>
          <Btn bahaya onClick={nonaktifkan}>Nonaktifkan</Btn>
          <Btn onClick={() => onEdit(lab)}>Edit</Btn>
        </>
      }
    >
      <Pesan error={error} />
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-5">
        <p><span className="text-navy/50">Kategori:</span> {lab.kategori || '-'}</p>
        <p><span className="text-navy/50">Kapasitas:</span> {lab.kapasitas ?? '-'}</p>
        <p><span className="text-navy/50">Penanggung Jawab:</span> {lab.penanggung_jawab?.nama || '-'}</p>
        <p><span className="text-navy/50">Status:</span> {lab.status === 'aktif' ? 'Aktif' : 'Nonaktif'}</p>
        {lab.deskripsi && <p className="col-span-2"><span className="text-navy/50">Deskripsi:</span> {lab.deskripsi}</p>}
      </div>

      <h3 className="text-sm font-bold text-navy mb-2">Riwayat Perubahan</h3>
      {!riwayat ? (
        <p className="text-xs text-navy/40">Memuat riwayat…</p>
      ) : riwayat.length === 0 ? (
        <p className="text-xs text-navy/40">Belum ada riwayat.</p>
      ) : (
        <ol className="space-y-2">
          {riwayat.map((r, i) => (
            <li key={i} className="border-l-2 border-navy/15 pl-3">
              <p className="text-sm text-navy">{r.keterangan}</p>
              <p className="text-[11px] text-navy/40">{waktu(r.waktu)} · {r.pengguna}</p>
            </li>
          ))}
        </ol>
      )}
    </ModalShell>
  )
}
