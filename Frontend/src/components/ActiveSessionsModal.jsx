import ModalCloseButton from './ModalCloseButton'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function ActiveSessionsModal({ user, onClose }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revokingId, setRevokingId] = useState(null)

  function load() {
    setLoading(true)
    api
      .getUserSessions(user.id)
      .then(setSessions)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleRevoke(tokenId) {
    setRevokingId(tokenId)
    try {
      await api.revokeUserSession(user.id, tokenId)
      setSessions((s) => s.filter((t) => t.id !== tokenId))
    } catch (err) {
      setError(err.message)
    } finally {
      setRevokingId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-teal-950/50 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="tm-panel relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white rounded-3xl max-w-md w-full shadow-2xl shadow-teal-900/20 max-h-[85vh] overflow-y-auto p-6">
<ModalCloseButton onClose={onClose} />
        <div className="flex items-start justify-between mb-1">
          <div>
            <h2 className="text-base font-bold text-navy">Sesi Aktif Pengguna</h2>
            <p className="text-xs text-navy/50 mt-0.5">
              Pantau sesi login {user.name} dan akhiri bila diperlukan.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-navy/40 hover:text-navy text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {error && <p className="text-red-600 text-xs mt-3">{error}</p>}

        <div className="mt-4 space-y-2">
          {loading ? (
            <p className="text-sm text-navy/40 text-center py-6">Memuat...</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-navy/40 text-center py-6">Tidak ada sesi aktif.</p>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between border border-navy/10 rounded-xl p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-navy-light/15 flex items-center justify-center shrink-0">
                    <DeviceIcon className="h-4.5 w-4.5 text-navy" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-navy truncate">{s.name}</p>
                    <p className="text-[11px] text-navy/50">
                      {s.last_used_at
                        ? `Terakhir dipakai ${formatDateTime(s.last_used_at)}`
                        : `Dibuat ${formatDateTime(s.created_at)}`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevoke(s.id)}
                  disabled={revokingId === s.id}
                  className="text-xs font-semibold text-red-600 border border-red-200 rounded-full px-3 py-1.5 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50 shrink-0"
                >
                  {revokingId === s.id ? '...' : 'Logout'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function formatDateTime(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function DeviceIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  )
}
