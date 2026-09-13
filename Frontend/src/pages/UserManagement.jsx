import { useEffect, useState } from 'react'
import ActiveSessionsModal from '../components/ActiveSessionsModal'
import ConfirmStatusModal from '../components/ConfirmStatusModal'
import UserDetailModal from '../components/UserDetailModal'
import UserFormModal from '../components/UserFormModal'
import { useAuth } from '../lib/AuthContext'
import { api, BASE_URL } from '../lib/api'
import { roleBadgeClass } from '../lib/roleColors'

export default function UserManagement({ onBack }) {
  const { user: currentUser, hasRole } = useAuth()
  const isSuperAdmin = hasRole('Super Admin')
  const [users, setUsers] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [roles, setRoles] = useState([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [editingUser, setEditingUser] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [detailUser, setDetailUser] = useState(null)
  const [statusUser, setStatusUser] = useState(null)
  const [sessionsUser, setSessionsUser] = useState(null)

  function loadUsers() {
    setLoading(true)
    const params = { page }
    if (search) params.search = search
    if (roleFilter) params.role = roleFilter
    if (statusFilter) params.status = statusFilter

    api
      .listUsers(params)
      .then((res) => {
        setUsers(res.data)
        setMeta({ current_page: res.current_page, last_page: res.last_page, total: res.total })
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    api.listRoles().then(setRoles).catch(() => {})
  }, [])

  useEffect(() => {
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, roleFilter, statusFilter])

  function handleSearch(e) {
    e.preventDefault()
    setPage(1)
    loadUsers()
  }

  function openEdit(u) {
    setEditingUser(u)
    setShowForm(true)
  }

  function openCreate() {
    setEditingUser(null)
    setShowForm(true)
  }

  function handleSaved() {
    setShowForm(false)
    loadUsers()
  }

  function refreshDetail(updated) {
    setUsers((list) => list.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)))
    setDetailUser((d) => (d ? { ...d, ...updated } : d))
  }

  // Hanya Super Admin yang boleh memberikan/mencabut peran Super Admin —
  // sembunyikan pilihan ini dari form untuk aktor selain Super Admin
  // (backend tetap menegakkan aturan yang sama sebagai jaring pengaman).
  const assignableRoles = isSuperAdmin ? roles : roles.filter((r) => r.name !== 'Super Admin')

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
            ← Kembali ke Dashboard
          </button>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-navy-light/15 flex items-center justify-center shrink-0">
              <UsersIcon className="h-5.5 w-5.5 text-navy" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-navy">Kelola Pengguna</h1>
              <p className="text-sm text-navy/50">
                Kelola akun pengguna sekolah, atur status, dan pantau aktivitas akun.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-navy-light hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors shrink-0"
        >
          <PlusIcon className="h-4 w-4" />
          Tambah Pengguna
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
          <label className="flex items-center gap-2 bg-white rounded-full border border-navy/10 px-4 py-2.5">
            <SearchIcon className="h-4 w-4 text-navy/40 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, email, atau NIP..."
              className="w-full text-sm text-navy placeholder-navy/40 focus:outline-none"
            />
          </label>
        </form>

        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value)
            setPage(1)
          }}
          className="bg-white rounded-full border border-navy/10 px-4 py-2.5 text-sm text-navy focus:outline-none"
        >
          <option value="">Semua Peran</option>
          {roles.map((r) => (
            <option key={r.id} value={r.name}>
              {r.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
          className="bg-white rounded-full border border-navy/10 px-4 py-2.5 text-sm text-navy focus:outline-none"
        >
          <option value="">Semua Status</option>
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Nonaktif</option>
        </select>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left whitespace-nowrap">
                <th className="px-4 py-3 w-10">No</th>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">NIP / NIS</th>
                <th className="px-4 py-3">Peran</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Terakhir Login</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-navy/40">
                    Memuat...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-navy/40">
                    Tidak ada pengguna.
                  </td>
                </tr>
              ) : (
                users.map((u, i) => (
                  <tr key={u.id} className="border-t border-navy/5">
                    <td className="px-4 py-3 text-navy/50">
                      {(meta.current_page - 1) * 15 + i + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-navy to-navy-light text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                          {u.avatar_url ? (
                            <img
                              src={`${BASE_URL}${u.avatar_url}`}
                              alt={u.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            u.name?.[0]?.toUpperCase() || '?'
                          )}
                        </div>
                        <span className="font-medium text-navy whitespace-nowrap">
                          {u.name}
                          {u.id === currentUser?.id && (
                            <span className="ml-1.5 text-[10px] text-navy/40 uppercase">Anda</span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-navy/70">{u.email}</td>
                    <td className="px-4 py-3 text-navy/60">{u.nip_nis || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {u.roles?.length ? (
                          u.roles.map((r) => (
                            <span
                              key={r.id}
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleBadgeClass(r.name)}`}
                            >
                              {r.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-navy/30 text-xs">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          u.is_active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {u.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-navy/60 text-xs whitespace-nowrap">
                      {u.last_login_at ? formatDateTime(u.last_login_at) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <IconButton title="Detail" onClick={() => setDetailUser(u)}>
                          <EyeIcon className="h-4 w-4" />
                        </IconButton>
                        {(isSuperAdmin || !u.roles?.some((r) => r.name === 'Super Admin')) && (
                          <IconButton title="Edit" onClick={() => openEdit(u)}>
                            <PencilIcon className="h-4 w-4" />
                          </IconButton>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-navy/5 text-xs text-navy/50">
            <span>
              Menampilkan {(meta.current_page - 1) * 15 + 1}–
              {Math.min(meta.current_page * 15, meta.total)} dari {meta.total} data
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={meta.current_page === 1}
                className="h-7 w-7 rounded-full flex items-center justify-center border border-navy/10 disabled:opacity-30 hover:bg-navy/5"
              >
                ‹
              </button>
              {Array.from({ length: meta.last_page }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-7 w-7 rounded-full flex items-center justify-center font-semibold ${
                    p === meta.current_page
                      ? 'bg-navy-light text-white'
                      : 'text-navy/60 hover:bg-navy/5'
                  }`}
                >
                  {p}
                </button>
              ))}
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

      {showForm && (
        <UserFormModal
          user={editingUser}
          roles={assignableRoles}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />
      )}

      {detailUser && (
        <UserDetailModal
          user={detailUser}
          currentUserId={currentUser?.id}
          onClose={() => setDetailUser(null)}
          onChanged={loadUsers}
          onOpenDeactivate={(u) => setStatusUser(u)}
          onOpenSessions={(u) => setSessionsUser(u)}
        />
      )}

      {statusUser && (
        <ConfirmStatusModal
          user={statusUser}
          onClose={() => setStatusUser(null)}
          onDone={() => {
            setStatusUser(null)
            setDetailUser(null)
            loadUsers()
          }}
        />
      )}

      {sessionsUser && (
        <ActiveSessionsModal user={sessionsUser} onClose={() => setSessionsUser(null)} />
      )}
    </div>
  )
}

function IconButton({ children, title, onClick }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="h-8 w-8 rounded-full flex items-center justify-center text-navy/50 hover:bg-navy/5 hover:text-navy transition-colors"
    >
      {children}
    </button>
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

function UsersIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <path d="M16.5 6.5a3 3 0 0 1 0 5.8M21 20c0-2.9-1.9-5-4.5-5.7" />
    </svg>
  )
}

function PlusIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function SearchIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

function EyeIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function PencilIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}
