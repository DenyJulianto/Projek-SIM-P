import ModalCloseButton from './ModalCloseButton'
import { useState } from 'react'
import { api } from '../lib/api'

export default function UserFormModal({ user, roles, onClose, onSaved }) {
  const isEdit = Boolean(user)
  const currentRoleNames = user?.roles?.map((r) => r.name) || []
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    is_active: user?.is_active ?? true,
    nip_nis: user?.nip_nis || '',
    primaryRole: currentRoleNames[0] || '',
    extraRoles: currentRoleNames.slice(1),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function toggleExtraRole(name) {
    setForm((f) => ({
      ...f,
      extraRoles: f.extraRoles.includes(name)
        ? f.extraRoles.filter((r) => r !== name)
        : [...f.extraRoles, name],
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const allRoles = form.primaryRole
        ? [form.primaryRole, ...form.extraRoles.filter((r) => r !== form.primaryRole)]
        : []

      const payload = {
        name: form.name,
        email: form.email,
        roles: allRoles,
      }
      if (form.password) payload.password = form.password
      if (isEdit) {
        payload.is_active = form.is_active
        if (canEditNipNis) payload.nip_nis = form.nip_nis
      }

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

  const extraRoleOptions = roles.filter((r) => r.name !== form.primaryRole)
  const canEditNipNis = isEdit && Boolean(user?.identitas_type)
  const nipNisLabel = user?.identitas_type === 'siswa' ? 'NIS' : 'NIP'

  return (
    <div className="fixed inset-0 z-[100] bg-teal-950/50 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="tm-panel relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white rounded-3xl max-w-lg w-full shadow-2xl shadow-teal-900/20 max-h-[90vh] overflow-y-auto p-6">
<ModalCloseButton onClose={onClose} />
        <div className="flex items-start justify-between mb-1">
          <div>
            <h2 className="text-lg font-bold text-navy">
              {isEdit ? 'Edit Pengguna' : 'Tambah Pengguna'}
            </h2>
            <p className="text-xs text-navy/50 mt-0.5">
              {isEdit
                ? 'Ubah data akun, peran, dan status pengguna.'
                : 'Isi data pengguna yang akan ditambahkan.'}
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
          <Field label="Nama Lengkap">
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className="input"
              placeholder="Masukkan nama lengkap"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className="input"
              placeholder="contoh@email.com"
            />
          </Field>
          <Field label={`${nipNisLabel} ${canEditNipNis ? '' : '(belum ditautkan ke profil Guru/Siswa)'}`}>
            <input
              type="text"
              value={form.nip_nis}
              onChange={(e) => update('nip_nis', e.target.value)}
              disabled={!canEditNipNis}
              className="input disabled:bg-navy/5 disabled:text-navy/40 disabled:cursor-not-allowed"
              placeholder={
                canEditNipNis
                  ? `Masukkan ${nipNisLabel}`
                  : 'Tautkan lewat menu Data Guru/Data Siswa dulu'
              }
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

          <div className="grid grid-cols-2 gap-4 items-end">
            <Field label="Peran">
              <select
                required
                value={form.primaryRole}
                onChange={(e) => update('primaryRole', e.target.value)}
                className="input"
              >
                <option value="">Pilih peran</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.name}>
                    {role.name}
                  </option>
                ))}
              </select>
            </Field>

            {isEdit && (
              <label className="flex items-center gap-2 text-sm text-navy/70 cursor-pointer select-none pb-2.5">
                <span className="text-xs font-semibold text-navy/70">Status Akun</span>
                <button
                  type="button"
                  onClick={() => update('is_active', !form.is_active)}
                  className={`relative w-10 h-5.5 rounded-full transition-colors shrink-0 ${
                    form.is_active ? 'bg-navy-light' : 'bg-navy/20'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white transition-transform ${
                      form.is_active ? 'translate-x-[22px]' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </label>
            )}
          </div>

          {extraRoleOptions.length > 0 && (
            <Field label="Multi-Peran (opsional)">
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-navy/10 rounded-md p-3">
                {extraRoleOptions.map((role) => (
                  <label
                    key={role.id}
                    className="flex items-center gap-2 text-xs text-navy/70 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={form.extraRoles.includes(role.name)}
                      onChange={() => toggleExtraRole(role.name)}
                      className="h-3.5 w-3.5 rounded accent-navy-light"
                    />
                    {role.name}
                  </label>
                ))}
              </div>
            </Field>
          )}

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

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-navy/70 mb-1">{label}</span>
      {children}
    </label>
  )
}
