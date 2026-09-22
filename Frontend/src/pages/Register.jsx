import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CompleteNameForm from '../components/CompleteNameForm'
import PasswordInput from '../components/PasswordInput'
import { useAuth } from '../lib/AuthContext'
import { api, IS_CENTRAL_DOMAIN } from '../lib/api'
import LogoStacked from '../components/LogoStacked'

export default function Register() {
  const { register, verifyEmail, resendVerificationCode, setUser } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState('form')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [background, setBackground] = useState('')

  useEffect(() => {
    if (IS_CENTRAL_DOMAIN) return
    api.getProfil().then((p) => setBackground(p.auth_background || '')).catch(() => {})
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await register(email, password, passwordConfirmation)
      setStep('verify')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const verifiedUser = await verifyEmail(email, code)
      if (!verifiedUser.name) {
        setStep('complete-name')
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleNameCompleted(updatedUser) {
    setUser(updatedUser)
    navigate('/')
  }

  async function handleResend() {
    setResending(true)
    setError('')
    setInfo('')
    try {
      await resendVerificationCode(email)
      setInfo('Kode baru telah dikirim ke email Anda.')
    } catch (err) {
      setError(err.message)
    } finally {
      setResending(false)
    }
  }

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-4 py-12 ${
        background ? 'bg-cover bg-center' : 'bg-gradient-to-br from-teal-300 via-emerald-600 to-navy'
      }`}
      style={background ? { backgroundImage: `url(${background})` } : undefined}
    >
      <div className="w-full max-w-3xl bg-white rounded-[2rem] shadow-2xl shadow-navy/10 overflow-hidden grid md:grid-cols-2">
        <div className="order-2 md:order-1 p-8 sm:p-10 flex flex-col justify-center">
          {step === 'form' ? (
            <>
              <h1 className="text-3xl font-extrabold text-navy uppercase">Daftar</h1>
              <p className="text-navy/50 text-sm mt-1 mb-6">Buat akun baru untuk mulai terhubung</p>

              {error && (
                <p className="text-red-600 bg-red-50 border border-red-200 rounded-lg text-sm text-center py-2 px-3 mb-4">
                  {error}
                </p>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email..............."
                  className="w-full bg-emerald-50 rounded-full px-5 py-3 text-sm text-navy placeholder-navy/40 focus:outline-none focus:ring-2 focus:ring-navy-light/50"
                />
                <PasswordInput
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (min. 8)..............."
                />
                <PasswordInput
                  required
                  minLength={8}
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  placeholder="Konfirmasi Password..............."
                />

                <div className="flex justify-center pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-navy-light hover:bg-emerald-700 text-white font-bold tracking-wide px-10 py-2.5 rounded-full transition-colors disabled:opacity-50"
                  >
                    {loading ? 'MEMPROSES...' : 'DAFTAR'}
                  </button>
                </div>
              </form>

              <p className="text-center text-sm text-navy/50 mt-6">
                Sudah punya akun?{' '}
                <Link to="/login" className="text-navy-light font-semibold hover:underline uppercase">
                  Masuk
                </Link>
              </p>

              <a href="/" className="block text-center text-xs text-navy/40 hover:text-navy mt-3">
                ← Kembali ke Beranda
              </a>
            </>
          ) : step === 'verify' ? (
            <>
              <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                <MailIcon className="h-7 w-7 text-navy-light" />
              </div>
              <h1 className="text-2xl font-extrabold text-navy">Verifikasi Email</h1>
              <p className="text-navy/50 text-sm mt-1 mb-6">
                Kami telah mengirim kode verifikasi 6 digit ke{' '}
                <span className="font-semibold text-navy">{email}</span>. Masukkan kodenya di bawah
                untuk melanjutkan.
              </p>

              {error && (
                <p className="text-red-600 bg-red-50 border border-red-200 rounded-lg text-sm text-center py-2 px-3 mb-4">
                  {error}
                </p>
              )}
              {info && (
                <p className="text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-center py-2 px-3 mb-4">
                  {info}
                </p>
              )}

              <form onSubmit={handleVerify} className="space-y-4">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full bg-emerald-50 rounded-full px-5 py-3 text-center text-2xl tracking-[0.5em] font-bold text-navy placeholder-navy/20 focus:outline-none focus:ring-2 focus:ring-navy-light/50"
                />

                <div className="flex justify-center pt-2">
                  <button
                    type="submit"
                    disabled={loading || code.length !== 6}
                    className="bg-navy-light hover:bg-emerald-700 text-white font-bold tracking-wide px-10 py-2.5 rounded-full transition-colors disabled:opacity-50"
                  >
                    {loading ? 'MEMVERIFIKASI...' : 'VERIFIKASI'}
                  </button>
                </div>
              </form>

              <p className="text-center text-sm text-navy/50 mt-6">
                Tidak menerima kode?{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="text-navy-light font-semibold hover:underline disabled:opacity-50"
                >
                  {resending ? 'Mengirim...' : 'Kirim Ulang'}
                </button>
              </p>

              <button
                type="button"
                onClick={() => setStep('form')}
                className="block text-center text-xs text-navy/40 hover:text-navy mt-3 mx-auto"
              >
                ← Kembali ke Form Daftar
              </button>
            </>
          ) : (
            <CompleteNameForm user={{ email }} onDone={handleNameCompleted} />
          )}
        </div>

        <div className="order-1 md:order-2 bg-gradient-to-br from-navy via-navy to-navy-light text-white p-10 flex flex-col items-center text-center justify-between">
          <LogoStacked />

          <div>
            <h2 className="text-2xl font-extrabold mb-3">Halo, Teman!</h2>
            <p className="text-white/70 text-sm leading-relaxed">
              Daftarkan diri Anda untuk mulai terhubung dan mendapatkan informasi terbaru dari
              sekolah.
            </p>
          </div>

          <Link
            to="/login"
            className="border border-white/70 rounded-full px-8 py-2.5 text-sm font-semibold hover:bg-white hover:text-navy transition-colors"
          >
            MASUK
          </Link>
        </div>
      </div>
    </div>
  )
}


function MailIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  )
}
