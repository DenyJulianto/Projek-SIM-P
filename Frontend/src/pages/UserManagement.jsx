import { useEffect, useState } from 'react'
import UserFormModal from '../components/UserFormModal'
import { useAuth } from '../lib/AuthContext'
import { api } from '../lib/api'

export default function UserManagement({ onBack }) {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingUser, setEditingUser] = useState(null)
  const [showForm, setShowForm] = useState(false)

  function loadUsers(params = {}) {
    setLoading(true)
    api
      .listUsers(params)
      .then((res) => setUsers(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    api.listRoles().then(setRoles).catch(() => {})
    loadUsers()
  }, [])

  function handleSearch(e) {
    e.preventDefault()
    loadUsers(search ? { search } : {})
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
    loadUsers(search ? { search } : {})
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={onBack} className="text-sm text-navy/50 hover:text-navy mb-1">
            ← Kembali ke Dashboard
          </button>
          <h1 className="text-2xl font-extrabold text-navy">Pengguna & Hak Akses</h1>
        </div>
        <button
          onClick={openCreate}
          className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2.5 rounded-full"
        >
          + Tambah Pengguna
        </button>
      </div>

      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau email..."
          className="input max-w-xs"
        />
        <button
          type="submit"
          className="text-sm font-semibold text-navy border border-navy/20 rounded-md px-4 hover:bg-navy hover:text-white transition-colors"
        >
          Cari
        </button>
      </form>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy/5 text-navy/60 text-xs uppercase text-left">
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-navy/40">
                  Memuat...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-navy/40">
                  Tidak ada pengguna.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-t border-navy/5">
                  <td className="px-4 py-3 font-medium text-navy">
                    {u.name}
                    {u.id === currentUser?.id && (
                      <span className="ml-2 text-[10px] text-navy/40 uppercase">Anda</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-navy/70">{u.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.roles?.length ? (
                        u.roles.map((r) => (
                          <span
                            key={r.id}
                            className="text-[10px] font-semibold bg-gold-light/40 text-navy px-2 py-0.5 rounded-full"
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
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(u)}
                      className="text-xs font-semibold text-navy border border-navy/20 rounded-md px-3 py-1.5 hover:bg-navy hover:text-white transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <UserFormModal
          user={editingUser}
          roles={roles}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
