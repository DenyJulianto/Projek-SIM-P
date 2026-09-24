import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CompleteNameForm from '../components/CompleteNameForm'
import PasswordInput from '../components/PasswordInput'
import { useAuth } from '../lib/AuthContext'
import { api } from '../lib/api'
import {
  WavyBackground,
  AuthHeroPanel,
  AuthTagline,
  MailIcon,
  LockIcon,
  AlertIcon,
  CheckIcon,
  ArrowRightIcon,
} from '../components/AuthVisuals'

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
        <div className="order-2 md:order-1 p-8 sm:p-10 flex flex-col justify-center">
          {step === 'form' ? (
            <>
              <AuthTagline />

              <h1 className="text-4xl font-extrabold text-navy">Daftar</h1>
              <p className="text-navy/50 text-sm mt-1 mb-6">Buat akun baru untuk mulai terhubung</p>

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
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (min. 8)"
                  leftIcon={<LockIcon className="h-4.5 w-4.5" />}
                />
                <PasswordInput
                  required
                  minLength={8}
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  placeholder="Konfirmasi Password"
                  leftIcon={<LockIcon className="h-4.5 w-4.5" />}
                />

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 bg-navy-light hover:bg-emerald-700 text-white font-bold tracking-wide py-3 rounded-full transition-colors disabled:opacity-50"
                  >
                    {loading ? 'MEMPROSES...' : 'DAFTAR'}
                    {!loading && <ArrowRightIcon className="h-4 w-4" />}
                  </button>
                </div>
              </form>

              <hr className="border-navy/10 mt-6" />

              <p className="text-center text-sm text-navy/50 mt-4">
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
                <div className="flex items-start gap-3 text-red-600 bg-red-50 border border-red-200 rounded-xl text-sm py-3 px-4 mb-4">
                  <span className="flex-shrink-0 h-7 w-7 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                    <AlertIcon className="h-4 w-4" />
                  </span>
                  <span>{error}</span>
                </div>
              )}
              {info && (
                <div className="flex items-start gap-3 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl text-sm py-3 px-4 mb-4">
                  <span className="flex-shrink-0 h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
                    <CheckIcon className="h-4 w-4" />
                  </span>
                  <span>{info}</span>
                </div>
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

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || code.length !== 6}
                    className="w-full inline-flex items-center justify-center gap-2 bg-navy-light hover:bg-emerald-700 text-white font-bold tracking-wide py-3 rounded-full transition-colors disabled:opacity-50"
                  >
                    {loading ? 'MEMVERIFIKASI...' : 'VERIFIKASI'}
                    {!loading && <ArrowRightIcon className="h-4 w-4" />}
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

        <AuthHeroPanel
          className="order-1 md:order-2"
          titleLine1="Halo,"
          titleLine2="Teman!"
          description="Daftarkan diri Anda untuk mulai terhubung dan mendapatkan informasi terbaru dari sekolah."
        />
      </div>
    </div>
  )
}
