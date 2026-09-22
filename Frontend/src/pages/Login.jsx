import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CompleteNameForm from '../components/CompleteNameForm'
import PasswordInput from '../components/PasswordInput'
import { useAuth } from '../lib/AuthContext'
import { api, IS_CENTRAL_DOMAIN } from '../lib/api'
import LogoStacked from '../components/LogoStacked'

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
        <div className="relative bg-gradient-to-br from-emerald-500 via-emerald-700 to-navy text-white p-10 flex flex-col justify-between overflow-hidden">
          <LogoStacked />

          <div className="py-8">
            <h2 className="text-3xl font-extrabold leading-tight mb-3">
              Selamat Datang
              <br />
              <span className="text-emerald-300">Kembali!</span>
            </h2>
            <p className="text-white/70 text-sm leading-relaxed max-w-xs">
              Tetap terhubung dengan sekolah — masuk dengan akun Anda untuk mengakses informasi
              terbaru.
            </p>

            <div className="mt-8 flex items-center gap-6">
              <Feature icon={<CheckIcon className="h-5 w-5" />} label={['Aman', 'dan Terpercaya']} />
              <Feature icon={<BoltIcon className="h-5 w-5" />} label={['Cepat', 'dan Mudah']} />
              <Feature icon={<UsersIcon className="h-5 w-5" />} label={['Untuk', 'Semua Stakeholder']} />
            </div>
          </div>

          <div className="relative -mx-10 -mb-10">
            <BuildingIllustration className="w-full h-auto" />
          </div>
        </div>

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
              <div className="flex items-start justify-end gap-1.5 text-emerald-700 text-xs font-medium text-right mb-4">
                <LeafIcon className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span>
                  Teman Digital untuk
                  <br />
                  Perjalanan Belajarmu
                </span>
              </div>

              <h1 className="text-4xl font-extrabold text-navy">Masuk</h1>
              <p className="text-navy/50 text-sm mt-1 mb-6">
                Masuk ke akun Anda untuk melanjutkan
              </p>

              {error && (
                <div className="flex items-start gap-3 text-red-600 bg-red-50 border border-red-200 rounded-xl text-sm py-3 px-4 mb-4">
                  <span className="flex-shrink-0 h-7 w-7 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                    <MailWarningIcon className="h-4 w-4" />
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

function Feature({ icon, label }) {
  return (
    <div className="flex flex-col items-center text-center gap-1.5 w-16">
      <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-emerald-300">
        {icon}
      </div>
      <p className="text-[10px] leading-tight">
        <span className="block font-semibold text-white">{label[0]}</span>
        <span className="block text-white/60">{label[1]}</span>
      </p>
    </div>
  )
}

function LeafIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 20A7 7 0 0 1 4 13c0-5 5-10 12-11 1 7-4 12-9 12" />
      <path d="M4 13c3 0 6 1 8 3" />
    </svg>
  )
}

function MailIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2 6 10 7 10-7" />
    </svg>
  )
}

function LockIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

function MailWarningIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2 6 10 7 10-7" />
    </svg>
  )
}

function ArrowRightIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}

function CheckIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.5 2.5L16 9.5" />
    </svg>
  )
}

function BoltIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />
    </svg>
  )
}

function UsersIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" />
      <path d="M16 4.5c1.7.3 3 1.8 3 3.5s-1.3 3.2-3 3.5" />
      <path d="M18.5 13.7c2 .7 3.5 2.8 3.5 6.3" />
    </svg>
  )
}

function BuildingIllustration(props) {
  return (
    <svg {...props} viewBox="0 0 400 130" fill="none" preserveAspectRatio="xMidYMax slice">
      <rect x="0" y="112" width="400" height="18" fill="white" fillOpacity="0.06" />

      <g opacity="0.5">
        <rect x="38" y="76" width="6" height="30" fill="white" fillOpacity="0.3" />
        <circle cx="41" cy="66" r="18" fill="#6ee7b7" fillOpacity="0.4" />
      </g>
      <g opacity="0.5">
        <rect x="352" y="80" width="6" height="26" fill="white" fillOpacity="0.3" />
        <circle cx="355" cy="70" r="16" fill="#6ee7b7" fillOpacity="0.4" />
      </g>

      <polygon points="128,42 200,10 272,42" fill="#6ee7b7" fillOpacity="0.55" />
      <rect x="138" y="42" width="124" height="64" rx="2" fill="white" fillOpacity="0.14" stroke="white" strokeOpacity="0.2" />

      <rect x="152" y="54" width="20" height="18" rx="1" fill="#fcd34d" fillOpacity="0.6" />
      <rect x="182" y="54" width="20" height="18" rx="1" fill="#fcd34d" fillOpacity="0.6" />
      <rect x="228" y="54" width="20" height="18" rx="1" fill="#fcd34d" fillOpacity="0.6" />

      <rect x="190" y="82" width="20" height="24" rx="1" fill="white" fillOpacity="0.25" />
    </svg>
  )
}

function WavyBackground(props) {
  return (
    <svg {...props} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" fill="none">
      <defs>
        <linearGradient id="wbg1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a7f3d0" />
          <stop offset="100%" stopColor="#d1fae5" />
        </linearGradient>
        <linearGradient id="wbg2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
        <linearGradient id="wbg3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#14a673" />
          <stop offset="100%" stopColor="#0b3d2e" />
        </linearGradient>
      </defs>
      <rect width="1440" height="900" fill="#ecfdf5" />
      <path
        d="M0 120 C 240 40, 480 200, 760 120 S 1300 20, 1440 140 L1440 0 L0 0 Z"
        fill="url(#wbg1)"
        opacity="0.6"
      />
      <path
        d="M0 900 C 300 760, 620 900, 900 760 S 1250 640, 1440 760 L1440 900 L0 900 Z"
        fill="url(#wbg2)"
        opacity="0.5"
      />
      <path d="M900 900 C 1050 700, 1250 760, 1440 620 L1440 900 Z" fill="url(#wbg3)" opacity="0.45" />
      <path
        d="M0 500 C 200 420, 420 560, 640 480 S 1000 380, 1200 480 L1200 900 L0 900 Z"
        fill="url(#wbg2)"
        opacity="0.25"
      />
    </svg>
  )
}
