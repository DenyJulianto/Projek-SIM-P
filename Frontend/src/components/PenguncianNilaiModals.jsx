import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const JENIS_LABEL = { harian: 'Harian', tugas: 'Tugas', uts: 'UTS', uas: 'UAS' }
const primaryBtn = 'bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 shadow-md shadow-teal-600/30 text-white text-sm font-semibold px-5 py-2 rounded-md disabled:opacity-50'

function Shell({ title, subtitle, children }) {
  return (
    <div className="fixed inset-0 z-[100] bg-teal-950/50 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="tm-panel relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white rounded-3xl max-w-xl w-full shadow-2xl shadow-teal-900/20 max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-lg font-bold text-navy mb-1">{title}</h2>
        {subtitle && <p className="text-xs text-navy/50 mb-4 capitalize">{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}

function labelKonteks(row, konteks) {
  return `${row.mata_pelajaran.nama_mapel} — ${row.kelas.nama_kelas} · Tahun Ajaran ${konteks.tahun_ajaran} · Semester ${konteks.semester}`
}

/** Cek kelengkapan lalu konfirmasi sebelum mengunci (atau hanya melihat hasil cek). */
export function KunciModal({ row, konteks, params, hanyaCek, onClose, onSaved }) {
  const [cek, setCek] = useState(null)
  const [konfirmasi, setKonfirmasi] = useState(false)
  const [lanjutkan, setLanjutkan] = useState(false)
  const [catatan, setCatatan] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .cekPenguncianNilai({ ...params, kelas_id: row.kelas.id, mata_pelajaran_id: row.mata_pelajaran.id })
      .then(setCek)
      .catch((err) => setError(err.message))
  }, [params, row])

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.kunciNilai({
        ...params,
        kelas_id: row.kelas.id,
        mata_pelajaran_id: row.mata_pelajaran.id,
        konfirmasi: true,
        lanjutkan_tidak_lengkap: lanjutkan,
        catatan: catatan || null,
      })
      onSaved('Nilai dikunci.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const b = cek?.baris
  const siswaKosong = (cek?.siswa ?? []).filter((s) => s.kosong.length > 0)

  return (
    <Shell title={hanyaCek ? 'Cek Kelengkapan Nilai' : 'Kunci Nilai'} subtitle={labelKonteks(row, konteks)}>
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      {!cek && !error && <p className="text-sm text-navy/40 py-6 text-center">Memeriksa kelengkapan...</p>}

      {cek && (
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Kelengkapan" value={b.persen == null ? '-' : `${b.persen}%`} tone={cek.lengkap ? 'text-emerald-700' : 'text-amber-700'} />
            <Stat label="Terinput" value={`${b.nilai_diinput}/${b.total_seharusnya}`} />
            <Stat label="Jumlah Siswa" value={b.jumlah_siswa} />
          </div>

          {cek.lengkap ? (
            <p className="text-xs text-emerald-700">Seluruh siswa memiliki semua komponen nilai wajib.</p>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-amber-900 mb-1">
                {siswaKosong.length} siswa memiliki nilai kosong ({b.nilai_belum} komponen):
              </p>
              <ul className="text-xs text-amber-900 space-y-0.5 max-h-36 overflow-y-auto">
                {siswaKosong.map((s) => (
                  <li key={s.id}>
                    {s.nama} — {s.kosong.map((j) => JENIS_LABEL[j]).join(', ')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!hanyaCek && (
            <>
              {!cek.dapat_dikunci && <p className="text-xs text-red-600">Nilai tidak dapat dikunci: belum ada nilai atau sudah terkunci.</p>}
              {cek.dapat_dikunci && !cek.lengkap && (
                <label className="flex items-start gap-2 text-xs text-navy/70">
                  <input type="checkbox" className="mt-0.5" checked={lanjutkan} onChange={(e) => setLanjutkan(e.target.checked)} />
                  Tetap kunci walaupun nilai belum lengkap. Nilai yang kosong tidak bisa diisi guru sampai kunci dibuka.
                </label>
              )}
              <label className="block">
                <span className="block text-xs font-semibold text-navy/70 mb-1">Catatan penguncian (opsional)</span>
                <input type="text" maxLength={2000} value={catatan} onChange={(e) => setCatatan(e.target.value)} className="input" placeholder="mis. Batas akhir input nilai" />
              </label>
              <label className="flex items-start gap-2 text-sm text-navy">
                <input type="checkbox" className="mt-1" checked={konfirmasi} onChange={(e) => setKonfirmasi(e.target.checked)} />
                <span>
                  Saya konfirmasi mengunci nilai ini. Setelah dikunci, guru tidak dapat menambah, mengubah, atau menghapus nilai.
                </span>
              </label>
            </>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-navy/70 hover:text-navy">
              {hanyaCek ? 'Tutup' : 'Batal'}
            </button>
            {!hanyaCek && (
              <button type="submit" disabled={saving || !konfirmasi || !cek.dapat_dikunci || (!cek.lengkap && !lanjutkan)} className={primaryBtn}>
                {saving ? 'Mengunci...' : 'Kunci Nilai'}
              </button>
            )}
          </div>
        </form>
      )}
    </Shell>
  )
}

/** Buka kunci: catatan wajib dan tercatat di riwayat. */
export function BukaKunciModal({ row, konteks, params, onClose, onSaved }) {
  const [catatan, setCatatan] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.bukaKunciNilai({ ...params, kelas_id: row.kelas.id, mata_pelajaran_id: row.mata_pelajaran.id, catatan_buka: catatan })
      onSaved('Kunci nilai dibuka.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Shell title="Buka Kunci Nilai" subtitle={labelKonteks(row, konteks)}>
      <p className="text-xs text-navy/60 mb-3">
        Dikunci {row.tanggal_kunci ? new Date(row.tanggal_kunci).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'} oleh {row.pengunci || '-'}. Setelah dibuka, guru dapat mengubah nilai kembali.
      </p>
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="block text-xs font-semibold text-navy/70 mb-1">Alasan membuka kunci (wajib, min. 5 karakter)</span>
          <textarea required minLength={5} maxLength={2000} value={catatan} onChange={(e) => setCatatan(e.target.value)} className="input min-h-20" placeholder="mis. Koreksi nilai UTS siswa atas permintaan guru" />
        </label>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-navy/70 hover:text-navy">
            Batal
          </button>
          <button type="submit" disabled={saving || catatan.trim().length < 5} className={primaryBtn}>
            {saving ? 'Membuka...' : 'Buka Kunci'}
          </button>
        </div>
      </form>
    </Shell>
  )
}

function Stat({ label, value, tone = 'text-navy' }) {
  return (
    <div className="bg-navy/5 rounded-xl p-3">
      <p className="text-[11px] font-semibold text-navy/50 uppercase tracking-wide">{label}</p>
      <p className={`text-xl font-extrabold ${tone}`}>{value}</p>
    </div>
  )
}
