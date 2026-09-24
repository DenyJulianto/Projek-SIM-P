import ModalCloseButton from './ModalCloseButton'
import { useState } from 'react'
import { api } from '../lib/api'

export default function RoleFormModal({ role, permissions, onClose, onSaved }) {
  const isEdit = Boolean(role)
  const [name, setName] = useState(role?.name || '')
  const [selected, setSelected] = useState(new Set(role?.permissions?.map((p) => p.name) || []))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const groups = groupPermissions(permissions)

  function toggle(name) {
    setSelected((s) => {
      const next = new Set(s)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  function toggleGroup(names, allChecked) {
    setSelected((s) => {
      const next = new Set(s)
      names.forEach((n) => (allChecked ? next.delete(n) : next.add(n)))
      return next
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { name, permissions: Array.from(selected) }
      if (isEdit) {
        await api.updateRole(role.id, payload)
      } else {
        await api.createRole(payload)
      }
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-teal-950/50 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="tm-panel relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white rounded-3xl max-w-2xl w-full shadow-2xl shadow-teal-900/20 max-h-[90vh] overflow-y-auto p-6">
<ModalCloseButton onClose={onClose} />
        <div className="flex items-start justify-between mb-1">
          <div>
            <h2 className="text-lg font-bold text-navy">{isEdit ? 'Edit Role' : 'Tambah Role'}</h2>
            <p className="text-xs text-navy/50 mt-0.5">
              Tentukan nama role dan hak akses (permission) yang dimiliki.
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

        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <label className="block">
            <span className="block text-xs font-semibold text-navy/70 mb-1">Nama Role</span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="mis. Kepala Sekolah"
            />
          </label>

          <div>
            <span className="block text-xs font-semibold text-navy/70 mb-2">
              Hak Akses ({selected.size} dipilih)
            </span>
            <div className="space-y-3 max-h-80 overflow-y-auto border border-navy/10 rounded-lg p-3">
              {Object.entries(groups).map(([group, perms]) => {
                const names = perms.map((p) => p.name)
                const allChecked = names.every((n) => selected.has(n))
                return (
                  <div key={group}>
                    <label className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wide cursor-pointer select-none mb-1.5">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={() => toggleGroup(names, allChecked)}
                        className="h-3.5 w-3.5 rounded accent-navy-light"
                      />
                      {group}
                    </label>
                    <div className="grid grid-cols-2 gap-1 pl-5">
                      {perms.map((p) => (
                        <label
                          key={p.id}
                          className="flex items-center gap-2 text-xs text-navy/70 cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={selected.has(p.name)}
                            onChange={() => toggle(p.name)}
                            className="h-3.5 w-3.5 rounded accent-navy-light"
                          />
                          {p.name}
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-navy/70 hover:text-navy"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-navy-light hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2 rounded-full disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function groupPermissions(permissions) {
  const groups = {}
  for (const p of permissions) {
    const prefix = p.name.includes('.') ? p.name.split('.')[0] : 'lainnya'
    if (!groups[prefix]) groups[prefix] = []
    groups[prefix].push(p)
  }
  return groups
}
