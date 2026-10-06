import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'

const STATUS = {
  antri: { label: 'Menunggu antrean', tone: 'bg-navy/10 text-navy/60' },
  proses: { label: 'Sedang diproses', tone: 'bg-amber-100 text-amber-700' },
  selesai: { label: 'Selesai', tone: 'bg-emerald-100 text-emerald-700' },
  gagal: { label: 'Gagal', tone: 'bg-red-100 text-red-600' },
}

/** Buat akun siswa (username NISN) & orang tua (ortu.NISN) secara massal. */
export default function AkunSiswaModal({ kelasList, onClose }) {
  const [data, setData] = useState(null)
  const [kelasId, setKelasId] = useState('')
  const [sertakanOrtu, setSertakanOrtu] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const muat = useCallback(() => {
    api.getAkunSiswa().then(setData).catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    muat()
  }, [muat])

  const berjalan = data?.batch?.some((b) => b.status === 'antri' || b.status === 'proses')

  useEffect(() => {
    if (!berjalan) return
    const id = setInterval(muat, 3000)
    return () => clearInterval(id)
  }, [berjalan, muat])

  async function mulai() {
    setBusy(true)
    setError('')
    try {
      await api.mulaiAkunSiswa({ kelas_id: kelasId || null, sertakan_ortu: sertakanOrtu })
      muat()
    } catch (err) {
      setError(err.errors ? Object.values(err.errors).flat()[0] : err.message)
    } finally {
      setBusy(false)
    }
  }

  async function aksi(fn) {
    setError('')
    try {
      await fn()
      muat()
    } catch (err) {
      setError(err.message)
    }
  }

  const r = data?.ringkasan

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-lg font-extrabold text-navy">Buat Akun Siswa &amp; Orang Tua</h2>
          <button onClick={onClose} className="text-navy/40 hover:text-navy text-xl leading-none">×</button>
        </div>
        <p className="text-sm text-navy/50 mb-5">
          Akun dibuat untuk siswa aktif yang belum punya akun. Username siswa = NISN, username orang tua = ortu.NISN.
          Semua akun wajib mengganti password saat login pertama.
        </p>

        {r && (
          <div className="grid grid-cols-3 gap-3 mb-5">
            <Angka label="Siswa belum punya akun" nilai={r.siswa_belum_punya_akun} />
            <Angka label="…di antaranya tanpa NISN" nilai={r.siswa_tanpa_nisn} warn={r.siswa_tanpa_nisn > 0} />
            <Angka label="Siswa tanpa akun ortu" nilai={r.siswa_tanpa_akun_ortu} />
          </div>
        )}
        {r?.siswa_tanpa_nisn > 0 && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4">
            Siswa tanpa NISN akan dilewati. Lengkapi NISN-nya di Data Siswa lalu jalankan lagi.
          </p>
        )}

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-4">{error}</p>}

        <div className="flex flex-wrap items-end gap-3 mb-6">
          <label className="text-sm text-navy/70">
            <span className="block text-xs font-semibold mb-1">Kelas</span>
            <select value={kelasId} onChange={(e) => setKelasId(e.target.value)} className="border border-navy/15 rounded-xl px-3 py-2 text-sm">
              <option value="">Semua kelas</option>
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>{k.nama_kelas}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-navy/70 pb-2">
            <input type="checkbox" checked={sertakanOrtu} onChange={(e) => setSertakanOrtu(e.target.checked)} />
            Sertakan akun orang tua
          </label>
          <button
            onClick={mulai}
            disabled={busy || berjalan}
            className="ml-auto bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-full disabled:opacity-50"
          >
            {berjalan ? 'Sedang diproses…' : busy ? 'Memulai…' : 'Buat Akun'}
          </button>
        </div>

        <h3 className="text-sm font-bold text-navy/60 uppercase tracking-wide mb-2">Riwayat</h3>
        {!data && <p className="text-sm text-navy/40">Memuat…</p>}
        {data?.batch?.length === 0 && <p className="text-sm text-navy/40">Belum pernah dijalankan.</p>}
        <div className="space-y-2">
          {data?.batch?.map((b) => {
            const s = STATUS[b.status] ?? STATUS.antri
            return (
              <div key={b.id} className="border border-navy/10 rounded-xl p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${s.tone}`}>{s.label}</span>
                  <span className="text-navy/70">{b.kelas?.nama_kelas ?? 'Semua kelas'}</span>
                  <span className="text-navy/40 text-xs">{new Date(b.created_at).toLocaleString('id-ID')} · {b.pembuat?.name ?? '-'}</span>
                </div>
                <p className="text-xs text-navy/60 mt-1">
                  {b.akun_siswa} akun siswa · {b.akun_ortu} akun orang tua · {b.dilewati} dilewati
                  {b.status === 'proses' && b.total ? ` · dari ${b.total} siswa` : ''}
                </p>
                {b.pesan && <p className="text-xs text-red-600 mt-1">{b.pesan}</p>}
                {b.ada_kredensial && (
                  <div className="flex gap-3 mt-2">
                    <button onClick={() => aksi(() => api.unduhKredensialAkunSiswa(b.id))} className="text-xs font-semibold text-emerald-700 hover:underline">
                      Unduh daftar password (CSV)
                    </button>
                    <button
                      onClick={() => window.confirm('Hapus daftar password ini? File tidak bisa diunduh lagi.') && aksi(() => api.hapusKredensialAkunSiswa(b.id))}
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      Hapus file
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <p className="text-[11px] text-navy/40 mt-4">
          Daftar password berisi data rahasia. Bagikan ke siswa/orang tua lalu hapus file-nya.
        </p>
      </div>
    </div>
  )
}

function Angka({ label, nilai, warn = false }) {
  return (
    <div className={`rounded-xl p-3 ${warn ? 'bg-amber-50' : 'bg-navy/5'}`}>
      <p className={`text-xl font-extrabold ${warn ? 'text-amber-700' : 'text-navy'}`}>{nilai}</p>
      <p className="text-[11px] text-navy/50 leading-snug">{label}</p>
    </div>
  )
}
