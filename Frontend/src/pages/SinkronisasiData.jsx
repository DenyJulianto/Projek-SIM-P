import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function SinkronisasiData({ onBack }) {
  const [logs, setLogs] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState(null)

  function load() {
    setLoading(true)
    setError('')
    api
      .getSyncLogSekolah({ page, per_page: 10 })
      .then((res) => {
        setLogs(res.data)
        setMeta({ current_page: res.current_page, last_page: res.last_page, total: res.total })
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [page])

  async function handleSync() {
    setSyncing(true)
    setError('')
    setResult(null)
    try {
      const res = await api.tarikDataSekarang()
      setResult(res)
      setPage(1)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
            ← Kembali ke Dashboard
          </button>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-navy-light/15 flex items-center justify-center shrink-0">
              <SyncIcon className="h-5.5 w-5.5 text-navy" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-navy">Sinkronisasi Data</h1>
              <p className="text-sm text-navy/50">
                Pastikan data guru &amp; siswa sekolah Anda sudah tercermin di Direktori Nasional.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-1.5 bg-navy-light hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors disabled:opacity-50 shrink-0"
        >
          <SyncIcon className="h-4 w-4" />
          {syncing ? 'Menyinkronkan...' : 'Tarik Data Sekarang'}
        </button>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {result && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-4">
          <p className="text-sm text-navy">
            Sinkronisasi berhasil — <span className="font-semibold">{result.jumlah_guru}</span>{' '}
            guru dan <span className="font-semibold">{result.jumlah_siswa}</span> siswa
            diperbarui di Direktori Nasional.
          </p>
        </div>
      )}

      <h2 className="text-sm font-bold text-navy/60 uppercase tracking-wide mb-2">
        Riwayat Sinkronisasi
      </h2>
      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">Waktu</th>
              <th className="px-4 py-3">Dipicu Oleh</th>
              <th className="px-4 py-3">Guru</th>
              <th className="px-4 py-3">Siswa</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-navy/40">
                  Memuat...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-navy/40">
                  Belum pernah sinkronisasi. Klik "Tarik Data Sekarang" untuk memulai.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-t border-navy/5">
                  <td className="px-4 py-3 text-navy/70">
                    {new Date(log.created_at).toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3 text-navy/70">
                    {log.triggered_by_name}{' '}
                    <span className="text-xs text-navy/40">
                      ({log.triggered_by_role === 'super_admin' ? 'Super Admin' : 'Anda'})
                    </span>
                  </td>
                  <td className="px-4 py-3 text-navy/70">{log.jumlah_guru}</td>
                  <td className="px-4 py-3 text-navy/70">{log.jumlah_siswa}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        log.status === 'berhasil'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {log.status === 'berhasil' ? 'Berhasil' : 'Gagal'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {meta.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-navy/5 text-xs text-navy/50">
            <span>
              Halaman {meta.current_page} dari {meta.last_page} ({meta.total} data)
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={meta.current_page === 1}
                className="h-7 w-7 rounded-full flex items-center justify-center border border-navy/10 disabled:opacity-30 hover:bg-navy/5"
              >
                ‹
              </button>
              <button
                onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                disabled={meta.current_page === meta.last_page}
                className="h-7 w-7 rounded-full flex items-center justify-center border border-navy/10 disabled:opacity-30 hover:bg-navy/5"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SyncIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 0 1-15.3 6.4M3 12a9 9 0 0 1 15.3-6.4" />
      <path d="M21 3v6h-6M3 21v-6h6" />
    </svg>
  )
}
