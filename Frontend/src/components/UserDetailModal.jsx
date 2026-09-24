import ModalCloseButton from './ModalCloseButton'
import { useState } from 'react'
import { api, BASE_URL } from '../lib/api'
import { roleBadgeClass } from '../lib/roleColors'

const TABS = [
  { key: 'info', label: 'Informasi Akun' },
  { key: 'roles', label: 'Peran & Hak Akses' },
  { key: 'activity', label: 'Aktivitas' },
]

export default function UserDetailModal({
  user,
  currentUserId,
  onClose,
  onChanged,
  onOpenDeactivate,
  onOpenSessions,
}) {
  const [tab, setTab] = useState('info')
  const [resetting, setResetting] = useState(false)
  const [resetResult, setResetResult] = useState('')
  const [error, setError] = useState('')

  async function handleResetPassword() {
    if (!window.confirm(`Reset password untuk ${user.name}? Password lama akan tidak berlaku.`)) {
      return
    }
    setResetting(true)
    setError('')
    setResetResult('')
    try {
      const res = await api.resetUserPassword(user.id)
      setResetResult(res.password)
      onChanged?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setResetting(false)
    }
  }

  const isSelf = user.id === currentUserId

  return (
    <div className="fixed inset-0 z-[100] bg-teal-950/50 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="tm-panel relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white rounded-3xl max-w-lg w-full shadow-2xl shadow-teal-900/20 max-h-[90vh] overflow-y-auto">
<ModalCloseButton onClose={onClose} />
        <div className="p-6 pb-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-navy to-navy-light text-white flex items-center justify-center font-bold text-lg shrink-0 overflow-hidden">
                {user.avatar_url ? (
                  <img
                    src={`${BASE_URL}${user.avatar_url}`}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  user.name?.[0]?.toUpperCase() || '?'
                )}
              </div>
              <div>
                <h2 className="text-base font-bold text-navy">{user.name}</h2>
                <p className="text-xs text-navy/50">{user.email}</p>
                <div className="flex gap-1.5 mt-1.5">
                  {user.roles?.length ? (
                    user.roles.map((r) => (
                      <span
                        key={r.id}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleBadgeClass(r.name)}`}
                      >
                        {r.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-navy/30">Tanpa peran</span>
                  )}
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      user.is_active
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {user.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-navy/40 hover:text-navy text-xl leading-none"
            >
              &times;
            </button>
          </div>

          <div className="flex gap-1 mt-5 border-b border-navy/10">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3.5 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors ${
                  tab === t.key
                    ? 'border-navy-light text-navy'
                    : 'border-transparent text-navy/40 hover:text-navy/70'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 pt-4 min-h-[180px]">
          {tab === 'info' && (
            <dl className="space-y-3 text-sm">
              <Row label="Email" value={user.email} />
              <Row label="NIP / NIS" value={user.nip_nis || '-'} />
              <Row label="Nomor Telepon" value={user.phone || '-'} />
              <Row
                label="Terakhir Login"
                value={user.last_login_at ? formatDateTime(user.last_login_at) : 'Belum pernah'}
              />
              <Row label="Dibuat Pada" value={formatDateTime(user.created_at)} />
            </dl>
          )}

          {tab === 'roles' && (
            <div className="space-y-3">
              {user.roles?.length ? (
                user.roles.map((r) => (
                  <div key={r.id} className="border border-navy/10 rounded-lg p-3">
                    <p className="text-sm font-bold text-navy mb-1.5">{r.name}</p>
                    <div className="flex flex-wrap gap-1">
                      {r.permissions?.length ? (
                        r.permissions.map((p) => (
                          <span
                            key={p.id}
                            className="text-[10px] bg-navy/5 text-navy/60 px-2 py-0.5 rounded-full"
                          >
                            {p.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-navy/30">Tidak ada hak akses spesifik.</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-navy/40">Pengguna ini belum memiliki peran.</p>
              )}
            </div>
          )}

          {tab === 'activity' && (
            <div className="space-y-3 text-sm">
              <Row
                label="Terakhir Login"
                value={user.last_login_at ? formatDateTime(user.last_login_at) : 'Belum pernah'}
              />
              <Row label="Akun Dibuat" value={formatDateTime(user.created_at)} />
              <Row label="Terakhir Diperbarui" value={formatDateTime(user.updated_at)} />
              <button
                type="button"
                onClick={() => onOpenSessions(user)}
                className="w-full flex items-center gap-3 border border-navy/10 rounded-xl p-3 text-left hover:bg-navy/5 transition-colors mt-2"
              >
                <div className="h-9 w-9 rounded-full bg-navy-light/15 flex items-center justify-center shrink-0">
                  <DeviceIcon className="h-4.5 w-4.5 text-navy" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy">Kelola Sesi Aktif</p>
                  <p className="text-xs text-navy/50">
                    Pantau perangkat yang sedang login dan akhiri sesi bila diperlukan.
                  </p>
                </div>
              </button>
            </div>
          )}

          {error && <p className="text-red-600 text-xs mt-3">{error}</p>}
          {resetResult && (
            <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="text-xs text-emerald-800 font-semibold mb-1">Password baru:</p>
              <code className="text-sm font-bold text-emerald-900 select-all">{resetResult}</code>
              <p className="text-[11px] text-emerald-700 mt-1">
                Catat sekarang — password ini tidak ditampilkan lagi setelah modal ditutup.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-navy/10 p-4 flex flex-wrap gap-2 justify-end">
          <button
            type="button"
            onClick={handleResetPassword}
            disabled={resetting}
            className="flex items-center gap-1.5 text-xs font-semibold text-navy border border-navy/20 rounded-full px-4 py-2 hover:bg-navy hover:text-white transition-colors disabled:opacity-50"
          >
            <KeyIcon className="h-3.5 w-3.5" />
            {resetting ? 'Mereset...' : 'Reset Password'}
          </button>
          {!isSelf && (
            <button
              type="button"
              onClick={() => onOpenDeactivate(user)}
              className={`flex items-center gap-1.5 text-xs font-semibold rounded-full px-4 py-2 transition-colors ${
                user.is_active
                  ? 'text-red-600 border border-red-200 hover:bg-red-600 hover:text-white'
                  : 'text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white'
              }`}
            >
              {user.is_active ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-navy/5 pb-2">
      <dt className="text-navy/50">{label}</dt>
      <dd className="font-medium text-navy">{value}</dd>
    </div>
  )
}

function formatDateTime(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function KeyIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="8" cy="15" r="4" />
      <path d="m10.5 12.5 8-8M16 5l3 3M13 8l2.5 2.5" />
    </svg>
  )
}

function DeviceIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  )
}
