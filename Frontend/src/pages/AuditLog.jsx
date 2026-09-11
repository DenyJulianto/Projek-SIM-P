import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function AuditLog({ onBack }) {
  const [logs, setLogs] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [until, setUntil] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function load() {
    setLoading(true)
    const params = { page }
    if (search) params.search = search
    if (from) params.from = from
    if (until) params.until = until

    api
      .getAuditLog(params)
      .then((res) => {
        setLogs(res.data)
        setMeta({ current_page: res.current_page, last_page: res.last_page, total: res.total })
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [page])

  function handleFilter(e) {
    e.preventDefault()
    setPage(1)
    load()
  }

  return (
    <div>
      <div className="mb-6">
        <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
          ← Kembali ke Dashboard
        </button>
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-navy-light/15 flex items-center justify-center shrink-0">
            <LogIcon className="h-5.5 w-5.5 text-navy" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-navy">Audit Log</h1>
            <p className="text-sm text-navy/50">
              Riwayat aktivitas perubahan data oleh pengguna admin.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleFilter} className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari aktivitas..."
          className="flex-1 min-w-[200px] bg-white rounded-full border border-navy/10 px-4 py-2.5 text-sm text-navy placeholder-navy/40 focus:outline-none"
        />
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="bg-white rounded-full border border-navy/10 px-4 py-2.5 text-sm text-navy focus:outline-none"
        />
        <input
          type="date"
          value={until}
          onChange={(e) => setUntil(e.target.value)}
          className="bg-white rounded-full border border-navy/10 px-4 py-2.5 text-sm text-navy focus:outline-none"
        />
        <button
          type="submit"
          className="text-sm font-semibold text-white bg-navy-light hover:bg-emerald-700 rounded-full px-5 transition-colors"
        >
          Filter
        </button>
      </form>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">Waktu</th>
              <th className="px-4 py-3">Pengguna</th>
              <th className="px-4 py-3">Aktivitas</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-navy/40">
                  Memuat...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-navy/40">
                  Belum ada aktivitas tercatat.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-t border-navy/5">
                  <td className="px-4 py-3 text-navy/60 text-xs whitespace-nowrap">
                    {formatDateTime(log.created_at)}
                  </td>
                  <td className="px-4 py-3 font-medium text-navy whitespace-nowrap">
                    {log.causer_name || log.causer?.name || 'Sistem'}
                  </td>
                  <td className="px-4 py-3 text-navy/70">{log.description}</td>
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

function formatDateTime(value) {
  return new Date(value).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function LogIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16v16H4z" />
      <path d="M8 9h8M8 13h8M8 17h4" />
    </svg>
  )
}
