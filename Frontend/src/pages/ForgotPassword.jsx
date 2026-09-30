import { useEffect, useState } from 'react'
import { api, IS_CENTRAL_DOMAIN } from '../lib/api'
import { getRecaptchaToken } from '../lib/recaptcha'
import {
  WavyBackground,
  AuthHeroPanel,
  AuthTagline,
  MailIcon,
  AlertIcon,
  CheckIcon,
  ArrowRightIcon,
} from '../components/AuthVisuals'

export default function ForgotPassword() {
  const [step, setStep] = useState('request')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [background, setBackground] = useState('')
  const [profil, setProfil] = useState(null)

  useEffect(() => {
    if (IS_CENTRAL_DOMAIN) return
    api
      .getProfil()
      .then((p) => {
        setBackground(p.auth_background || '')
        setProfil(p)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  async function handleRequest(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const recaptchaToken = await getRecaptchaToken('forgot_password').catch(() => null)
      await api.forgotPassword(email, recaptchaToken)
      setStep('sent')
      setCooldown(60)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResending(true)
    setError('')
    setInfo('')
    try {
      const recaptchaToken = await getRecaptchaToken('forgot_password').catch(() => null)
      await api.forgotPassword(email, recaptchaToken)
      setInfo('Jika email terdaftar, link reset password baru telah dikirim.')
      setCooldown(60)
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
          {step === 'request' ? (
            <>
              <AuthTagline />

              <h1 className="text-4xl font-extrabold text-navy">Lupa Password</h1>
              <p className="text-navy/50 text-sm mt-1 mb-6">
                Masukkan email akun Anda, kami kirimkan link reset password.
              </p>

              {error && (
                <div className="flex items-start gap-3 text-red-600 bg-red-50 border border-red-200 rounded-xl text-sm py-3 px-4 mb-4">
                  <span className="flex-shrink-0 h-7 w-7 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                    <AlertIcon className="h-4 w-4" />
                  </span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleRequest} className="space-y-4">
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

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 bg-navy-light hover:bg-emerald-700 text-white font-bold tracking-wide py-3 rounded-full transition-colors disabled:opacity-50"
                  >
                    {loading ? 'MENGIRIM...' : 'KIRIM LINK RESET'}
                    {!loading && <ArrowRightIcon className="h-4 w-4" />}
                  </button>
                </div>
              </form>

              <BantuanAdmin profil={profil} />

              <hr className="border-navy/10 mt-6" />

              <a href="/login" className="block text-center text-xs text-navy/40 hover:text-navy mt-4">
                ← Kembali ke Login
              </a>
            </>
          ) : (
            <>
              <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                <MailIcon className="h-7 w-7 text-navy-light" />
              </div>
              <h1 className="text-2xl font-extrabold text-navy">Cek Email Anda</h1>
              <p className="text-navy/50 text-sm mt-1 mb-6">
                Jika email <span className="font-semibold text-navy">{email}</span> terdaftar, link reset
                password telah dikirim ke sana. Klik link di dalamnya untuk membuat password baru. Link
                berlaku 60 menit.
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

              <p className="text-center text-sm text-navy/50 mt-2">
                Tidak menerima email?{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || cooldown > 0}
                  className="text-navy-light font-semibold hover:underline disabled:opacity-50"
                >
                  {resending ? 'Mengirim...' : cooldown > 0 ? `Kirim Ulang (${cooldown}s)` : 'Kirim Ulang'}
                </button>
              </p>

              <button
                type="button"
                onClick={() => setStep('request')}
                className="block text-center text-xs text-navy/40 hover:text-navy mt-3 mx-auto"
              >
                ← Ganti Email
              </button>

              <BantuanAdmin profil={profil} />
            </>
          )}
        </div>

        <AuthHeroPanel
          className="order-1 md:order-2"
          titleLine1="Lupa"
          titleLine2="Password?"
          description="Tenang, kami kirimkan link reset ke email akun Anda supaya bisa masuk lagi."
        />
      </div>
    </div>
  )
}

/**
 * Jalur cadangan untuk pengguna yang emailnya tidak aktif / tidak bisa
 * dibuka (umum pada akun siswa & orang tua): password direset oleh Admin
 * Sekolah lewat menu Pengguna, lalu password sementara diserahkan langsung.
 */
function BantuanAdmin({ profil }) {
  if (IS_CENTRAL_DOMAIN) return null

  const kontak = [profil?.telepon, profil?.email].filter(Boolean).join(' · ')

  return (
    <div className="mt-6 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-900 leading-relaxed">
      <p className="font-semibold mb-0.5">Tidak bisa membuka email akun Anda?</p>
      <p>
        Hubungi Admin Sekolah atau Tata Usaha{profil?.nama_sekolah ? ` ${profil.nama_sekolah}` : ''} untuk
        mereset password. Anda akan diberi password sementara — segera ganti lewat menu Profil setelah
        masuk.
      </p>
      {kontak && <p className="mt-1 font-semibold">{kontak}</p>}
    </div>
  )
}
