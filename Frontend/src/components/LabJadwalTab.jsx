import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Btn, Field, ModalShell, Pesan } from './LabUI'
import { inputClass, selectClass, tgl } from './labKonstanta'

export default function LabJadwalTab() {
  const [items, setItems] = useState(null)
  const [opsi, setOpsi] = useState({ laboratorium: [], kelas: [], guru: [] })
  const [error, setError] = useState('')
  const [laboratoriumId, setLaboratoriumId] = useState('')
  const [kelasId, setKelasId] = useState('')
  const [guruId, setGuruId] = useState('')
  const [tanggalMulai, setTanggalMulai] = useState('')
  const [tanggalSelesai, setTanggalSelesai] = useState('')
  const [showForm, setShowForm] = useState(null)

  function load() {
    const params = {}
    if (laboratoriumId) params.laboratorium_id = laboratoriumId
    if (kelasId) params.kelas_id = kelasId
    if (guruId) params.guru_id = guruId
    if (tanggalMulai) params.tanggal_mulai = tanggalMulai
    if (tanggalSelesai) params.tanggal_selesai = tanggalSelesai
    api.labListJadwal(params).then((r) => setItems(r.data)).catch((e) => setError(e.message))
  }

  useEffect(load, [laboratoriumId, kelasId, guruId, tanggalMulai, tanggalSelesai])

  useEffect(() => {
    api.labOpsiJadwal().then(setOpsi).catch(() => {})
  }, [])

  async function hapus(id) {
    if (!confirm('Hapus jadwal ini?')) return
    try {
      await api.labHapusJadwal(id)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function ubahStatus(id, status) {
    try {
      await api.labUpdateJadwal(id, { status })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-navy">Jadwal Penggunaan Laboratorium</h2>
          <p className="text-xs text-navy/50 mt-0.5">Kapan setiap kelas menggunakan laboratorium — sistem otomatis mengecek bentrok jadwal.</p>
        </div>
        <Btn utama onClick={() => setShowForm({})}>+ Buat Jadwal</Btn>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <select value={laboratoriumId} onChange={(e) => setLaboratoriumId(e.target.value)} className={selectClass}>
          <option value="">Semua Laboratorium</option>
          {opsi.laboratorium.map((l) => (<option key={l.id} value={l.id}>{l.nama}</option>))}
        </select>
        <select value={kelasId} onChange={(e) => setKelasId(e.target.value)} className={selectClass}>
          <option value="">Semua Kelas</option>
          {opsi.kelas.map((k) => (<option key={k.id} value={k.id}>{k.nama_kelas}</option>))}
        </select>
        <select value={guruId} onChange={(e) => setGuruId(e.target.value)} className={selectClass}>
          <option value="">Semua Guru</option>
          {opsi.guru.map((g) => (<option key={g.id} value={g.id}>{g.nama}</option>))}
        </select>
        <input type="date" value={tanggalMulai} onChange={(e) => setTanggalMulai(e.target.value)} className={selectClass} />
        <input type="date" value={tanggalSelesai} onChange={(e) => setTanggalSelesai(e.target.value)} className={selectClass} />
      </div>

      <Pesan error={error} />

      <div className="bg-white rounded-2xl border border-navy/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Jam</th>
              <th className="px-4 py-3">Laboratorium</th>
              <th className="px-4 py-3">Kelas</th>
              <th className="px-4 py-3">Guru</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {!items ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-navy/40">Memuat...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-navy/40">Belum ada jadwal.</td></tr>
            ) : (
              items.map((j) => (
                <tr key={j.id} className="border-t border-navy/5 hover:bg-navy/[0.02]">
                  <td className="px-4 py-3 text-navy">{tgl(j.tanggal)}</td>
                  <td className="px-4 py-3 text-navy/70">{j.jam_mulai}–{j.jam_selesai}</td>
                  <td className="px-4 py-3 text-navy/70">{j.laboratorium?.nama}</td>
                  <td className="px-4 py-3 text-navy/70">{j.kelas?.nama_kelas || '-'}</td>
                  <td className="px-4 py-3 text-navy/70">{j.guru?.nama || '-'}</td>
                  <td className="px-4 py-3">
                    <select value={j.status} onChange={(e) => ubahStatus(j.id, e.target.value)} className="text-xs border border-navy/15 rounded px-2 py-1">
                      <option value="terjadwal">Terjadwal</option>
                      <option value="berlangsung">Berlangsung</option>
                      <option value="selesai">Selesai</option>
                      <option value="dibatalkan">Dibatalkan</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => setShowForm(j)} className="text-xs font-semibold text-navy-light hover:underline">Edit</button>
                    <button onClick={() => hapus(j.id)} className="text-xs font-semibold text-red-600 hover:underline">Hapus</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <JadwalFormModal
          jadwal={showForm.id ? showForm : null}
          opsi={opsi}
          onClose={() => setShowForm(null)}
          onSaved={() => { setShowForm(null); load() }}
        />
      )}
    </div>
  )
}

function JadwalFormModal({ jadwal, opsi, onClose, onSaved }) {
  const [form, setForm] = useState({
    laboratorium_id: jadwal?.laboratorium_id ?? '',
    kelas_id: jadwal?.kelas_id ?? '',
    guru_id: jadwal?.guru_id ?? '',
    tanggal: jadwal?.tanggal ? String(jadwal.tanggal).slice(0, 10) : '',
    jam_mulai: jadwal?.jam_mulai ?? '',
    jam_selesai: jadwal?.jam_selesai ?? '',
    keterangan: jadwal?.keterangan ?? '',
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
      const data = { ...form, kelas_id: form.kelas_id || undefined, guru_id: form.guru_id || undefined }
      if (jadwal) await api.labUpdateJadwal(jadwal.id, data)
      else await api.labCreateJadwal(data)
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell
      title={jadwal ? 'Edit Jadwal' : 'Buat Jadwal Penggunaan'}
      onClose={onClose}
      footer={
        <>
          <Btn onClick={onClose}>Batal</Btn>
          <Btn utama disabled={saving || !form.laboratorium_id || !form.tanggal || !form.jam_mulai || !form.jam_selesai} onClick={submit}>{saving ? 'Menyimpan...' : 'Simpan'}</Btn>
        </>
      }
    >
      <Pesan error={error} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Laboratorium *" className="col-span-2">
          <select value={form.laboratorium_id} onChange={set('laboratorium_id')} className={selectClass + ' w-full'}>
            <option value="">— Pilih —</option>
            {opsi.laboratorium.map((l) => (<option key={l.id} value={l.id}>{l.nama}</option>))}
          </select>
        </Field>
        <Field label="Kelas">
          <select value={form.kelas_id} onChange={set('kelas_id')} className={selectClass + ' w-full'}>
            <option value="">— Tidak diisi —</option>
            {opsi.kelas.map((k) => (<option key={k.id} value={k.id}>{k.nama_kelas}</option>))}
          </select>
        </Field>
        <Field label="Guru">
          <select value={form.guru_id} onChange={set('guru_id')} className={selectClass + ' w-full'}>
            <option value="">— Tidak diisi —</option>
            {opsi.guru.map((g) => (<option key={g.id} value={g.id}>{g.nama}</option>))}
          </select>
        </Field>
        <Field label="Tanggal *">
          <input type="date" value={form.tanggal} onChange={set('tanggal')} className={inputClass} />
        </Field>
        <Field label="Jam Mulai *">
          <input type="time" value={form.jam_mulai} onChange={set('jam_mulai')} className={inputClass} />
        </Field>
        <Field label="Jam Selesai *">
          <input type="time" value={form.jam_selesai} onChange={set('jam_selesai')} className={inputClass} />
        </Field>
        <Field label="Keterangan" className="col-span-2">
          <input value={form.keterangan} onChange={set('keterangan')} className={inputClass} />
        </Field>
      </div>
    </ModalShell>
  )
}
