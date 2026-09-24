import ModalCloseButton from './ModalCloseButton'
import { useState } from 'react'
import { api } from '../lib/api'

export default function ConfirmStatusModal({ user, onClose, onDone }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const willDeactivate = user.is_active

  async function handleConfirm() {
    setSaving(true)
    setError('')
    try {
      await api.updateUser(user.id, {
        name: user.name,
        email: user.email,
        is_active: !user.is_active,
        roles: user.roles?.map((r) => r.name) || [],
      })
      onDone()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-teal-950/50 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="tm-panel relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white rounded-3xl max-w-sm w-full shadow-2xl shadow-teal-900/20 p-6">
<ModalCloseButton onClose={onClose} />
        <div className="flex items-start gap-3 mb-4">
          <div
            className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
              willDeactivate ? 'bg-red-100' : 'bg-emerald-100'
            }`}
          >
            <WarningIcon
              className={`h-5 w-5 ${willDeactivate ? 'text-red-600' : 'text-emerald-700'}`}
            />
          </div>
          <div>
            <h2 className="text-base font-bold text-navy">
              {willDeactivate ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
            </h2>
            <p className="text-sm text-navy/60 mt-1">
              Apakah Anda yakin ingin {willDeactivate ? 'menonaktifkan' : 'mengaktifkan'} akun{' '}
              <span className="font-semibold text-navy">{user.name}</span>?
              {willDeactivate && ' Akun tidak dapat digunakan untuk login.'}
            </p>
          </div>
        </div>

        {willDeactivate && (
          <div className="bg-navy/5 rounded-lg p-3 text-xs text-navy/60 mb-4">
            Akun dinonaktifkan, bukan dihapus — data dan riwayat historis tetap utuh.
          </div>
        )}

        {error && <p className="text-red-600 text-xs mb-3">{error}</p>}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-navy/70 hover:text-navy"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            className={`text-white text-sm font-semibold px-5 py-2 rounded-full disabled:opacity-50 ${
              willDeactivate ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {saving ? 'Memproses...' : willDeactivate ? 'Nonaktifkan' : 'Aktifkan'}
          </button>
        </div>
      </div>
    </div>
  )
}

function WarningIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </svg>
  )
}
