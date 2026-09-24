import ModalCloseButton from './ModalCloseButton'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'

function Shell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[100] bg-teal-950/50 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="tm-panel relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white rounded-3xl max-w-lg w-full shadow-2xl shadow-teal-900/20 max-h-[90vh] overflow-y-auto p-6">
<ModalCloseButton onClose={onClose} />
        <h2 className="text-lg font-bold text-navy mb-3">{title}</h2>
        {children}
        <div className="flex justify-end mt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-navy/70 hover:text-navy">
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}

const primaryBtn = 'bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 shadow-md shadow-teal-600/30 text-white text-sm font-semibold px-5 py-2 rounded-md disabled:opacity-50'

/** Pilih siswa aktif yang belum punya rombel. */
export function TambahSiswaModal({ rombel, sisa, onClose, onSaved }) {
  const [search, setSearch] = useState('')
  const [siswa, setSiswa] = useState(null)
  const [selected, setSelected] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      api
        .listSiswaTersediaRombel(search)
        .then(setSiswa)
        .catch((err) => setError(err.message))
    }, 250)
    return () => clearTimeout(timer)
  }, [search])

  function toggle(id) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  async function submit() {
    setSaving(true)
    setError('')
    try {
      await api.tambahSiswaRombel(rombel.id, selected)
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const melebihi = sisa != null && selected.length > sisa

  return (
    <Shell title={`Tambah Siswa ke ${rombel.nama_kelas}`} onClose={onClose}>
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Cari nama / NIS / NISN…"
        className="input mb-3"
      />
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      <div className="border border-navy/10 rounded-lg max-h-64 overflow-y-auto">
        {!siswa ? (
          <p className="text-xs text-navy/40 p-3">Memuat...</p>
        ) : siswa.length === 0 ? (
          <p className="text-xs text-navy/40 p-3">Tidak ada siswa aktif yang belum punya rombel.</p>
        ) : (
          siswa.map((s) => (
            <label key={s.id} className="flex items-center gap-3 px-3 py-2 border-b border-navy/5 last:border-0 text-sm cursor-pointer hover:bg-navy/5">
              <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggle(s.id)} />
              <span className="font-medium text-navy">{s.nama}</span>
              <span className="text-xs text-navy/40">{s.nis || s.nisn || ''}</span>
            </label>
          ))
        )}
      </div>
      <div className="flex items-center justify-between mt-3">
        <p className={`text-xs ${melebihi ? 'text-red-600 font-semibold' : 'text-navy/50'}`}>
          {selected.length} dipilih{sisa != null ? ` — sisa kapasitas ${sisa}` : ''}
          {melebihi ? ' (melebihi kapasitas)' : ''}
        </p>
        <button onClick={submit} disabled={saving || selected.length === 0 || melebihi} className={primaryBtn}>
          {saving ? 'Menyimpan...' : 'Tambahkan'}
        </button>
      </div>
    </Shell>
  )
}

/** Pindahkan siswa terpilih ke rombel lain pada tahun ajaran yang sama. */
export function PindahRombelModal({ rombel, siswaIds, onClose, onSaved }) {
  const [tujuan, setTujuan] = useState(null)
  const [tujuanId, setTujuanId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const params = { status: 'aktif', per_page: 100 }
    if (rombel.tahun_ajaran_id) params.tahun_ajaran_id = rombel.tahun_ajaran_id
    api
      .listKelas(params)
      .then((r) => setTujuan(r.data.filter((k) => k.id !== rombel.id)))
      .catch((err) => setError(err.message))
  }, [rombel])

  const dipilih = tujuan?.find((k) => String(k.id) === tujuanId)
  const sisa = dipilih && dipilih.kapasitas != null ? dipilih.kapasitas - dipilih.siswa_aktif_count : null
  const melebihi = sisa != null && siswaIds.length > sisa

  async function submit() {
    setSaving(true)
    setError('')
    try {
      await api.pindahSiswaRombel(rombel.id, siswaIds, Number(tujuanId))
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Shell title={`Pindahkan ${siswaIds.length} Siswa`} onClose={onClose}>
      <p className="text-xs text-navy/50 mb-3">Dari rombel {rombel.nama_kelas}. Hanya rombel aktif pada tahun ajaran yang sama yang ditampilkan.</p>
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      <select value={tujuanId} onChange={(e) => setTujuanId(e.target.value)} className="input">
        <option value="">Pilih rombel tujuan</option>
        {(tujuan ?? []).map((k) => (
          <option key={k.id} value={k.id}>
            {k.nama_kelas} — {k.siswa_aktif_count}
            {k.kapasitas != null ? ` / ${k.kapasitas}` : ''} siswa
          </option>
        ))}
      </select>
      {melebihi && <p className="text-xs text-red-600 font-semibold mt-2">Sisa kapasitas rombel tujuan hanya {sisa}.</p>}
      <div className="flex justify-end mt-4">
        <button onClick={submit} disabled={saving || !tujuanId || melebihi} className={primaryBtn}>
          {saving ? 'Memindahkan...' : 'Pindahkan'}
        </button>
      </div>
    </Shell>
  )
}

/** Import anggota berdasarkan NIS dari file Excel. */
export function ImportSiswaModal({ rombel, onClose, onSaved }) {
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  async function submit() {
    setBusy(true)
    setError('')
    try {
      const res = await api.importSiswaRombel(rombel.id, file)
      setResult(res)
      if (res.berhasil > 0) onSaved(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell title={`Import Siswa ke ${rombel.nama_kelas}`} onClose={onClose}>
      <p className="text-xs text-navy/50 mb-3">
        Isi kolom NIS pada file Excel. Siswa dicocokkan berdasarkan NIS; siswa yang sudah punya rombel lain atau melebihi kapasitas akan dilewati dan dilaporkan.
      </p>
      <button onClick={() => api.downloadTemplateSiswaRombel().catch((e) => setError(e.message))} className="text-xs font-semibold text-navy underline mb-3">
        Unduh template
      </button>
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      <input type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block text-sm mb-3" />
      <button onClick={submit} disabled={!file || busy} className={primaryBtn}>
        {busy ? 'Mengimpor...' : 'Import'}
      </button>

      {result && (
        <div className="mt-4 text-sm">
          <p className="font-semibold text-navy">
            {result.berhasil} berhasil, {result.dilewati} sudah anggota, {result.errors.length} bermasalah.
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
