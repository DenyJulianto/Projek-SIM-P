import { useMemo, useState } from 'react'
import PasswordInput from '../components/PasswordInput'
import { useAuth } from '../lib/AuthContext'
import { api } from '../lib/api'
import { AlertIcon, ArrowRightIcon, CheckIcon, LockIcon, WavyBackground } from '../components/AuthVisuals'

const PASSWORD_RULES = [
  { key: 'length', label: 'Minimal 8 karakter', test: (p) => p.length >= 8 },
  { key: 'upper', label: 'Ada huruf besar', test: (p) => /[A-Z]/.test(p) },
  { key: 'lower', label: 'Ada huruf kecil', test: (p) => /[a-z]/.test(p) },
  { key: 'number', label: 'Ada angka', test: (p) => /[0-9]/.test(p) },
]

/** Ditampilkan menggantikan dasbor selama akun masih wajib ganti password. */
export default function WajibGantiPassword() {
  const { user, setUser, logout } = useAuth()
  const [current, setCurrent] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const checks = useMemo(() => PASSWORD_RULES.map((r) => ({ ...r, ok: r.test(password) })), [password])
  const valid =
    current.length > 0 && checks.every((c) => c.ok) && password === confirmation && password !== current

  async function handleSubmit(e) {
    e.preventDefault()
    if (!valid) return
    setLoading(true)
    setError('')
    try {
      const res = await api.changePassword(current, password, confirmation)
      setUser(res.user)
    } catch (err) {
      setError(err.errors ? Object.values(err.errors).flat()[0] : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-12 overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100">
      <div className="pointer-events-none absolute inset-0">
        <WavyBackground className="h-full w-full" />
      </div>

      <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl shadow-navy/10 p-8 sm:p-10">
        <div className="h-14 w-14 rounded-full bg-amber-50 flex items-center justify-center mb-4">
          <LockIcon className="h-7 w-7 text-amber-600" />
        </div>
        <h1 className="text-2xl font-extrabold text-navy">Ganti Password Anda</h1>
        <p className="text-navy/50 text-sm mt-1 mb-6">
          Halo {user?.name}, akun Anda masih memakai password dari sekolah. Buat password baru sebelum melanjutkan.
        </p>

        {error && (
          <div className="flex items-start gap-3 text-red-600 bg-red-50 border border-red-200 rounded-xl text-sm py-3 px-4 mb-4">
            <AlertIcon className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordInput
            required
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder="Password Saat Ini (dari sekolah)"
            leftIcon={<LockIcon className="h-4.5 w-4.5" />}
          />
          <PasswordInput
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password Baru"
            leftIcon={<LockIcon className="h-4.5 w-4.5" />}
          />
          {password.length > 0 && (
            <ul className="grid grid-cols-2 gap-1.5 -mt-1">
              {checks.map((c) => (
                <li key={c.key} className={`flex items-center gap-1.5 text-[11px] ${c.ok ? 'text-emerald-600' : 'text-navy/35'}`}>
                  <CheckIcon className="h-3 w-3 shrink-0" />
                  {c.label}
                </li>
              ))}
            </ul>
          )}
          <PasswordInput
            required
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="Konfirmasi Password Baru"
            leftIcon={<LockIcon className="h-4.5 w-4.5" />}
          />
          {confirmation.length > 0 && password !== confirmation && (
            <p className="text-[11px] text-red-600 -mt-2">Konfirmasi password tidak sama.</p>
          )}
          {password.length > 0 && password === current && (
            <p className="text-[11px] text-red-600 -mt-2">Password baru harus berbeda dari password saat ini.</p>
          )}

          <button
            type="submit"
            disabled={loading || !valid}
            className="w-full inline-flex items-center justify-center gap-2 bg-navy-light hover:bg-emerald-700 text-white font-bold tracking-wide py-3 rounded-full transition-colors disabled:opacity-50"
          >
            {loading ? 'MENYIMPAN...' : 'SIMPAN & LANJUTKAN'}
            {!loading && <ArrowRightIcon className="h-4 w-4" />}
          </button>
        </form>

        <button onClick={logout} className="block mx-auto mt-5 text-xs text-navy/40 hover:text-navy">
          Keluar
        </button>
      </div>
    </div>
  )
}
