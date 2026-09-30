import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PasswordInput from '../components/PasswordInput'
import { api } from '../lib/api'
import {
  WavyBackground,
  AuthHeroPanel,
  AuthTagline,
  LockIcon,
  AlertIcon,
  CheckIcon,
  ArrowRightIcon,
} from '../components/AuthVisuals'

const PASSWORD_RULES = [
  { key: 'length', label: 'Minimal 8 karakter', test: (p) => p.length >= 8 },
  { key: 'upper', label: 'Ada huruf besar', test: (p) => /[A-Z]/.test(p) },
  { key: 'number', label: 'Ada angka', test: (p) => /[0-9]/.test(p) },
]

export default function ResetPasswordLink() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  const token = searchParams.get('token') || ''

  const [status, setStatus] = useState(email && token ? 'form' : 'error')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const passwordChecks = useMemo(() => PASSWORD_RULES.map((r) => ({ ...r, ok: r.test(password) })), [password])
  const passwordValid = passwordChecks.every((r) => r.ok)
  const formValid = passwordValid && password === passwordConfirmation && passwordConfirmation.length > 0

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formValid) return
    setLoading(true)
    setError('')
    try {
      await api.resetPassword(email, token, password, passwordConfirmation)
      setStatus('success')
      setError('')
      setPassword('')
      setPasswordConfirmation('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-12 overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100">
      <div className="pointer-events-none absolute inset-0">
        <WavyBackground className="h-full w-full" />
      </div>

      <div className="relative w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl shadow-navy/10 overflow-hidden grid md:grid-cols-2">
        <div className="order-2 md:order-1 p-8 sm:p-10 flex flex-col justify-center">
          {status === 'form' && (
            <>
              <AuthTagline />

              <h1 className="text-4xl font-extrabold text-navy">Password Baru</h1>
              <p className="text-navy/50 text-sm mt-1 mb-6">
                Buat password baru untuk <span className="font-semibold text-navy">{email}</span>.
              </p>

              {error && (
                <div className="flex items-start gap-3 text-red-600 bg-red-50 border border-red-200 rounded-xl text-sm py-3 px-4 mb-4">
                  <span className="flex-shrink-0 h-7 w-7 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                    <AlertIcon className="h-4 w-4" />
                  </span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <PasswordInput
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password Baru"
                  leftIcon={<LockIcon className="h-4.5 w-4.5" />}
                />

                {password.length > 0 && (
                  <ul className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 -mt-1">
                    {passwordChecks.map((r) => (
                      <li
                        key={r.key}
                        className={`flex items-center gap-1.5 text-[11px] ${r.ok ? 'text-emerald-600' : 'text-navy/35'}`}
                      >
                        <CheckIcon className="h-3 w-3 shrink-0" />
                        {r.label}
                      </li>
                    ))}
                  </ul>
                )}

                <PasswordInput
                  required
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  placeholder="Konfirmasi Password Baru"
                  leftIcon={<LockIcon className="h-4.5 w-4.5" />}
                />
                {passwordConfirmation.length > 0 && password !== passwordConfirmation && (
                  <p className="text-[11px] text-red-600 -mt-2">Konfirmasi password tidak sama.</p>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || !formValid}
                    className="w-full inline-flex items-center justify-center gap-2 bg-navy-light hover:bg-emerald-700 text-white font-bold tracking-wide py-3 rounded-full transition-colors disabled:opacity-50"
                  >
                    {loading ? 'MENYIMPAN...' : 'GANTI PASSWORD'}
                    {!loading && <ArrowRightIcon className="h-4 w-4" />}
                  </button>
                </div>
              </form>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <CheckIcon className="h-7 w-7 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-extrabold text-navy">Password Berhasil Diubah</h1>
              <p className="text-navy/50 text-sm mt-1 mb-6">
                Semua sesi login Anda sebelumnya telah dikeluarkan demi keamanan. Silakan masuk dengan
                password baru Anda.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 bg-navy-light hover:bg-emerald-700 text-white font-bold tracking-wide py-3 px-8 rounded-full transition-colors w-fit"
              >
                Ke Halaman Login
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertIcon className="h-7 w-7 text-red-600" />
              </div>
              <h1 className="text-2xl font-extrabold text-navy">Link Tidak Valid</h1>
              <p className="text-navy/50 text-sm mt-1 mb-6">
                Link reset password tidak lengkap atau sudah tidak berlaku. Silakan minta link baru.
              </p>
              <Link to="/forgot-password" className="text-navy-light font-semibold hover:underline text-sm">
                Minta Link Reset Baru
              </Link>
            </>
          )}
        </div>

        <AuthHeroPanel
          className="order-1 md:order-2"
          titleLine1="Buat"
          titleLine2="Password Baru"
          description="Pastikan password baru Anda kuat dan tidak dipakai di layanan lain."
        />
      </div>
    </div>
  )
}
