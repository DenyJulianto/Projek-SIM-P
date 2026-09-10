import { useState } from 'react'
import { api } from '../lib/api'

export default function UserFormModal({ user, roles, onClose, onSaved }) {
  const isEdit = Boolean(user)
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    is_active: user?.is_active ?? true,
    roles: user?.roles?.map((r) => r.name) || [],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function toggleRole(name) {
    setForm((f) => ({
      ...f,
      roles: f.roles.includes(name) ? f.roles.filter((r) => r !== name) : [...f.roles, name],
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: form.name,
        email: form.email,
        roles: form.roles,
      }
      if (form.password) payload.password = form.password
      if (isEdit) payload.is_active = form.is_active

      if (isEdit) {
        await api.updateUser(user.id, payload)
      } else {
        if (!form.password) throw new Error('Password wajib diisi untuk akun baru.')
        await api.createUser(payload)
      }
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-navy/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-lg font-bold text-navy mb-4">
          {isEdit ? 'Edit Pengguna' : 'Tambah Pengguna'}
        </h2>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nama">
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className="input"
            />
          </Field>
          <Field label={isEdit ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password'}>
            <input
              type="password"
              minLength={8}
              required={!isEdit}
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              className="input"
              placeholder={isEdit ? '••••••••' : 'Min. 8 karakter'}
            />
          </Field>

          {isEdit && (
            <label className="flex items-center gap-2 text-sm text-navy/70 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => update('is_active', e.target.checked)}
                className="h-4 w-4 rounded accent-navy-light"
              />
              Akun aktif
            </label>
          )}

          <Field label="Role">
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-navy/10 rounded-md p-3">
              {roles.map((role) => (
                <label
                  key={role.id}
                  className="flex items-center gap-2 text-xs text-navy/70 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={form.roles.includes(role.name)}
                    onChange={() => toggleRole(role.name)}
                    className="h-3.5 w-3.5 rounded accent-navy-light"
                  />
                  {role.name}
                </label>
              ))}
            </div>
          </Field>

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
              className="bg-navy hover:bg-navy-light text-white text-sm font-semibold px-5 py-2 rounded-md disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-navy/70 mb-1">{label}</span>
      {children}
    </label>
  )
}
