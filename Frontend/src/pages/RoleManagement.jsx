import { useEffect, useState } from 'react'
import RoleFormModal from '../components/RoleFormModal'
import { useAuth } from '../lib/AuthContext'
import { api } from '../lib/api'
import { roleBadgeClass } from '../lib/roleColors'

export default function RoleManagement({ onBack }) {
  const { hasRole } = useAuth()
  const isSuperAdmin = hasRole('Super Admin')
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingRole, setEditingRole] = useState(null)
  const [showForm, setShowForm] = useState(false)

  function load() {
    setLoading(true)
    Promise.all([api.listRoles(), api.listPermissions()])
      .then(([r, p]) => {
        setRoles(r)
        setPermissions(p)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  function openCreate() {
    setEditingRole(null)
    setShowForm(true)
  }

  function openEdit(role) {
    setEditingRole(role)
    setShowForm(true)
  }

  async function handleDelete(role) {
    if (!window.confirm(`Hapus role "${role.name}"? Tindakan ini tidak bisa dibatalkan.`)) return
    try {
      await api.deleteRole(role.id)
      load()
    } catch (err) {
      window.alert(err.message)
    }
  }

  function handleSaved() {
    setShowForm(false)
    load()
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
              <ShieldIcon className="h-5.5 w-5.5 text-navy" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-navy">Hak Akses</h1>
              <p className="text-sm text-navy/50">
                Kelola role dan atur hak akses (permission) untuk setiap peran.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-navy-light hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors shrink-0"
        >
          <PlusIcon className="h-4 w-4" />
          Tambah Role
        </button>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {loading ? (
        <p className="text-navy/40 text-center py-10">Memuat...</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <div key={role.id} className="bg-white rounded-2xl border border-navy/10 p-5">
              <div className="flex items-start justify-between mb-3">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${roleBadgeClass(role.name)}`}
                >
                  {role.name}
                </span>
                {(isSuperAdmin || role.name !== 'Super Admin') && (
                  <div className="flex items-center gap-1">
                    <IconButton title="Edit" onClick={() => openEdit(role)}>
                      <PencilIcon className="h-3.5 w-3.5" />
                    </IconButton>
                    <IconButton title="Hapus" onClick={() => handleDelete(role)}>
                      <TrashIcon className="h-3.5 w-3.5" />
                    </IconButton>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-navy/50">
                <span className="flex items-center gap-1">
                  <KeyIcon className="h-3.5 w-3.5" />
                  {role.permissions?.length || 0} hak akses
                </span>
                <span className="flex items-center gap-1">
                  <UsersIcon className="h-3.5 w-3.5" />
                  {role.users_count || 0} pengguna
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <RoleFormModal
          role={editingRole}
          permissions={permissions}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />
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
      className="h-7 w-7 rounded-full flex items-center justify-center text-navy/50 hover:bg-navy/5 hover:text-navy transition-colors"
    >
      {children}
    </button>
  )
}

function ShieldIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
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

function PencilIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

function TrashIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
    </svg>
  )
}

function KeyIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="8" cy="15" r="4" />
      <path d="m10.5 12.5 8-8M16 5l3 3M13 8l2.5 2.5" />
    </svg>
  )
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
