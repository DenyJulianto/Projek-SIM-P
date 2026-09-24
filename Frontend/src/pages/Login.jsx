import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CompleteNameForm from '../components/CompleteNameForm'
import PasswordInput from '../components/PasswordInput'
import { useAuth } from '../lib/AuthContext'
import { api, IS_CENTRAL_DOMAIN } from '../lib/api'
import {
  WavyBackground,
  AuthHeroPanel,
  AuthTagline,
  MailIcon,
  LockIcon,
  AlertIcon,
  ArrowRightIcon,
} from '../components/AuthVisuals'

export default function Login() {
  const { login, verifyTwoFactor, setUser } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [background, setBackground] = useState('')
  const [needsName, setNeedsName] = useState(false)
  const [twoFactorChallenge, setTwoFactorChallenge] = useState(null)
  const [twoFactorCode, setTwoFactorCode] = useState('')

  useEffect(() => {
    // /public/profil khusus data satu sekolah, tidak ada artinya di domain central.
    if (IS_CENTRAL_DOMAIN) return
    api.getProfil().then((p) => setBackground(p.auth_background || '')).catch(() => {})
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await login(email, password, remember)
      if (result.requiresTwoFactor) {
        setTwoFactorChallenge(result.challenge)
      } else if (!result.name) {
        setNeedsName(true)
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleTwoFactorSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await verifyTwoFactor(twoFactorChallenge, twoFactorCode, remember)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleNameCompleted(updatedUser) {
    setUser(updatedUser)
    navigate('/dashboard')
  }

  return (
    <div
      className={`min-h-screen relative flex items-center justify-center px-4 py-12 overflow-hidden ${
        background ? 'bg-cover bg-center' : 'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100'
      }`}
      style={background ? { backgroundImage: `url(${background})` } : undefined}
    >
      {!background && (
        <div className="pointer-events-none absolute inset-0">
          <WavyBackground className="h-full w-full" />
        </div>
      )}

      <div className="relative w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl shadow-navy/10 overflow-hidden grid md:grid-cols-2">
        <AuthHeroPanel
          titleLine1="Selamat Datang"
          titleLine2="Kembali!"
          description="Tetap terhubung dengan sekolah — masuk dengan akun Anda untuk mengakses informasi terbaru."
        />

        <div className="p-8 sm:p-10 flex flex-col justify-center">
          {twoFactorChallenge ? (
            <>
              <h1 className="text-3xl font-extrabold text-navy uppercase">Verifikasi 2FA</h1>
              <p className="text-navy/50 text-sm mt-1 mb-6">
                Masukkan kode 6 digit dari aplikasi authenticator Anda, atau salah satu kode
                pemulihan.
              </p>

              {error && (
                <p className="text-red-600 bg-red-50 border border-red-200 rounded-lg text-sm text-center py-2 px-3 mb-4">
                  {error}
                </p>
              )}

              <form onSubmit={handleTwoFactorSubmit} className="space-y-4">
                <input
                  type="text"
                  required
                  autoFocus
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="Kode 6 digit atau kode pemulihan"
                  className="w-full bg-emerald-50 rounded-full px-5 py-3 text-sm text-navy placeholder-navy/40 focus:outline-none focus:ring-2 focus:ring-navy-light/50 text-center tracking-widest"
                />

                <div className="flex justify-center pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-navy-light hover:bg-emerald-700 text-white font-bold tracking-wide px-10 py-2.5 rounded-full transition-colors disabled:opacity-50"
                  >
                    {loading ? 'MEMPROSES...' : 'VERIFIKASI'}
                  </button>
                </div>
              </form>

              <button
                onClick={() => {
                  setTwoFactorChallenge(null)
                  setTwoFactorCode('')
                  setError('')
                }}
                className="block text-center text-xs text-navy/40 hover:text-navy mt-4 mx-auto"
              >
                ← Kembali ke halaman login
              </button>
            </>
          ) : needsName ? (
            <CompleteNameForm user={{ email }} onDone={handleNameCompleted} />
          ) : (
            <>
              <AuthTagline />

              <h1 className="text-4xl font-extrabold text-navy">Masuk</h1>
              <p className="text-navy/50 text-sm mt-1 mb-6">
                Masuk ke akun Anda untuk melanjutkan
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
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-light">
                    <MailIcon className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full bg-emerald-50 rounded-full pl-11 pr-5 py-3 text-sm text-navy placeholder-navy/40 focus:outline-none focus:ring-2 focus:ring-navy-light/50"
                  />
                </div>
                <PasswordInput
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  leftIcon={<LockIcon className="h-4.5 w-4.5" />}
                />

                <div className="flex items-center justify-between text-xs px-1">
                  <label className="flex items-center gap-2 text-navy/60 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-3.5 w-3.5 rounded accent-navy-light cursor-pointer"
                    />
                    Ingat saya
                  </label>
                  <Link to="/forgot-password" className="text-navy/60 hover:text-navy hover:underline">
                    Lupa password?
                  </Link>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 bg-navy-light hover:bg-emerald-700 text-white font-bold tracking-wide py-3 rounded-full transition-colors disabled:opacity-50"
                  >
                    {loading ? 'MEMPROSES...' : 'MASUK'}
                    {!loading && <ArrowRightIcon className="h-4 w-4" />}
                  </button>
                </div>
              </form>

              <hr className="border-navy/10 mt-6" />

              <p className="text-center text-sm text-navy/50 mt-4">
                Belum punya akun?{' '}
                <Link to="/register" className="text-navy-light font-semibold hover:underline uppercase">
                  Daftar
                </Link>
              </p>

              <a href="/" className="block text-center text-xs text-navy/40 hover:text-navy mt-3">
                ← Kembali ke Beranda
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

