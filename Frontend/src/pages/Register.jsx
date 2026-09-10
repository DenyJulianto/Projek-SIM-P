import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await register(name, email, password, passwordConfirmation)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-300 via-emerald-600 to-navy flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl bg-white rounded-[2rem] shadow-2xl shadow-navy/10 overflow-hidden grid md:grid-cols-2">
        <div className="order-2 md:order-1 p-8 sm:p-10 flex flex-col justify-center">
          <h1 className="text-3xl font-extrabold text-navy uppercase">Daftar</h1>
          <p className="text-navy/50 text-sm mt-1 mb-6">Buat akun baru untuk mulai terhubung</p>

          {error && (
            <p className="text-red-600 bg-red-50 border border-red-200 rounded-lg text-sm text-center py-2 px-3 mb-4">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama Lengkap..............."
              className="w-full bg-emerald-50 rounded-full px-5 py-3 text-sm text-navy placeholder-navy/40 focus:outline-none focus:ring-2 focus:ring-navy-light/50"
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email..............."
              className="w-full bg-emerald-50 rounded-full px-5 py-3 text-sm text-navy placeholder-navy/40 focus:outline-none focus:ring-2 focus:ring-navy-light/50"
            />
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min. 8)..............."
              className="w-full bg-emerald-50 rounded-full px-5 py-3 text-sm text-navy placeholder-navy/40 focus:outline-none focus:ring-2 focus:ring-navy-light/50"
            />
            <input
              type="password"
              required
              minLength={8}
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              placeholder="Konfirmasi Password..............."
              className="w-full bg-emerald-50 rounded-full px-5 py-3 text-sm text-navy placeholder-navy/40 focus:outline-none focus:ring-2 focus:ring-navy-light/50"
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
        </div>

        <div className="order-1 md:order-2 bg-gradient-to-br from-navy via-navy to-navy-light text-white p-10 flex flex-col items-center text-center justify-between">
          <div className="flex flex-col items-center">
            <div className="h-14 w-14 rounded-full bg-white/10 flex items-center justify-center">
              <CapIcon className="h-7 w-7 text-white" />
            </div>
            <p className="mt-3 font-bold tracking-wide">SIM Pendidikan</p>
          </div>

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

function CapIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m2 9 10-5 10 5-10 5-10-5Z" />
      <path d="M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
    </svg>
  )
}
