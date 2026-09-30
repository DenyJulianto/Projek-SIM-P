import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { AlertIcon, ArrowRightIcon, CheckIcon, MailIcon, WavyBackground } from '../components/AuthVisuals'

export default function VerifyEmailLink() {
  const { verifyEmailLink } = useAuth()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('verifying')
  const [message, setMessage] = useState('')

  const email = searchParams.get('email') || ''
  const token = searchParams.get('token') || ''

  useEffect(() => {
    if (!email || !token) {
      setStatus('error')
      setMessage('Link verifikasi tidak lengkap.')
      return
    }

    verifyEmailLink(email, token)
      .then((res) => {
        setStatus('success')
        setMessage(res.message)
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err.message)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, token])

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-12 overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100">
      <div className="pointer-events-none absolute inset-0">
        <WavyBackground className="h-full w-full" />
      </div>

      <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl shadow-navy/10 overflow-hidden p-8 sm:p-10 text-center">
        {status === 'verifying' && (
          <>
            <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <MailIcon className="h-7 w-7 text-navy-light" />
            </div>
            <h1 className="text-xl font-extrabold text-navy">Memverifikasi Email...</h1>
            <p className="text-navy/50 text-sm mt-1">Mohon tunggu sebentar.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckIcon className="h-7 w-7 text-emerald-600" />
            </div>
            <h1 className="text-xl font-extrabold text-navy">Email Terverifikasi</h1>
            <p className="text-navy/50 text-sm mt-1 mb-6">{message}</p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 bg-navy-light hover:bg-emerald-700 text-white font-bold tracking-wide py-3 px-8 rounded-full transition-colors"
            >
              Ke Halaman Login
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertIcon className="h-7 w-7 text-red-600" />
            </div>
            <h1 className="text-xl font-extrabold text-navy">Verifikasi Gagal</h1>
            <p className="text-navy/50 text-sm mt-1 mb-6">{message}</p>
            <Link to="/register" className="text-navy-light font-semibold hover:underline text-sm">
              Kembali ke Halaman Daftar
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
