import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PasswordInput from '../components/PasswordInput'
import { api } from '../lib/api'
import { AlertIcon, ArrowRightIcon, CheckIcon, LockIcon, WavyBackground } from '../components/AuthVisuals'

const PASSWORD_RULES = [
  { key: 'length', label: 'Minimal 8 karakter', test: (p) => p.length >= 8 },
  { key: 'upper', label: 'Ada huruf besar', test: (p) => /[A-Z]/.test(p) },
  { key: 'lower', label: 'Ada huruf kecil', test: (p) => /[a-z]/.test(p) },
  { key: 'number', label: 'Ada angka', test: (p) => /[0-9]/.test(p) },
]

/** Halaman tujuan link undangan: staf membuat password sendiri. */
export default function AktivasiAkun() {
  const [params] = useSearchParams()
  const userId = params.get('u') || ''
  const query = useMemo(() => {
    const q = new URLSearchParams()
    for (const k of ['expires', 'token', 'signature']) q.set(k, params.get(k) || '')
    return q.toString()
  }, [params])

  const lengkap = Boolean(userId && params.get('signature'))
  const [status, setStatus] = useState(lengkap ? 'memeriksa' : 'gagal')
  const [akun, setAkun] = useState(null)
  const [pesan, setPesan] = useState(lengkap ? '' : 'Link undangan tidak lengkap.')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const sudahDicek = useRef(false)

  useEffect(() => {
    if (sudahDicek.current || !lengkap) return
    sudahDicek.current = true
    api
      .cekUndangan(userId, query)
      .then((res) => {
        setAkun(res)
        setStatus('form')
      })
      .catch((err) => {
        setStatus('gagal')
        setPesan(err.errors ? Object.values(err.errors).flat()[0] : err.message)
      })
  }, [userId, query, lengkap])

  const checks = useMemo(() => PASSWORD_RULES.map((r) => ({ ...r, ok: r.test(password) })), [password])
  const valid = checks.every((c) => c.ok) && password === confirmation

  async function simpan(e) {
    e.preventDefault()
    if (!valid) return
    setBusy(true)
    setPesan('')
    try {
      const res = await api.terimaUndangan(userId, query, password, confirmation)
      setPesan(res.message)
      setStatus('selesai')
    } catch (err) {
      setPesan(err.errors ? Object.values(err.errors).flat()[0] : err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-12 overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100">
      <div className="pointer-events-none absolute inset-0">
        <WavyBackground className="h-full w-full" />
      </div>

      <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl shadow-navy/10 p-8 sm:p-10">
        {status === 'memeriksa' && <p className="text-center text-navy/50 text-sm">Memeriksa link undangan…</p>}

        {status === 'gagal' && (
          <div className="text-center">
            <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertIcon className="h-7 w-7 text-red-600" />
            </div>
            <h1 className="text-xl font-extrabold text-navy">Undangan Tidak Bisa Dipakai</h1>
            <p className="text-navy/50 text-sm mt-1 mb-6">{pesan}</p>
            <Link to="/login" className="text-navy-light font-semibold hover:underline text-sm">Ke Halaman Login</Link>
          </div>
        )}

        {status === 'form' && (
          <>
            <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <LockIcon className="h-7 w-7 text-navy-light" />
            </div>
            <h1 className="text-2xl font-extrabold text-navy">Aktifkan Akun</h1>
            <p className="text-navy/50 text-sm mt-1 mb-6">
              Halo {akun?.name}. Buat password untuk akun <span className="font-semibold text-navy">{akun?.email}</span>
              {akun?.sekolah ? ` di ${akun.sekolah}` : ''}.
            </p>

            {pesan && (
              <div className="flex items-start gap-3 text-red-600 bg-red-50 border border-red-200 rounded-xl text-sm py-3 px-4 mb-4">
                <AlertIcon className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{pesan}</span>
              </div>
            )}

            <form onSubmit={simpan} className="space-y-4">
              <PasswordInput required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password Baru" leftIcon={<LockIcon className="h-4.5 w-4.5" />} />
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
              <PasswordInput required value={confirmation} onChange={(e) => setConfirmation(e.target.value)} placeholder="Konfirmasi Password" leftIcon={<LockIcon className="h-4.5 w-4.5" />} />
              {confirmation.length > 0 && password !== confirmation && (
                <p className="text-[11px] text-red-600 -mt-2">Konfirmasi password tidak sama.</p>
              )}
              <button
                type="submit"
                disabled={busy || !valid}
                className="w-full inline-flex items-center justify-center gap-2 bg-navy-light hover:bg-emerald-700 text-white font-bold tracking-wide py-3 rounded-full transition-colors disabled:opacity-50"
              >
                {busy ? 'MENYIMPAN...' : 'AKTIFKAN AKUN'}
                {!busy && <ArrowRightIcon className="h-4 w-4" />}
              </button>
            </form>
          </>
        )}

        {status === 'selesai' && (
          <div className="text-center">
            <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckIcon className="h-7 w-7 text-emerald-600" />
            </div>
            <h1 className="text-xl font-extrabold text-navy">Akun Aktif</h1>
            <p className="text-navy/50 text-sm mt-1 mb-6">{pesan}</p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 bg-navy-light hover:bg-emerald-700 text-white font-bold tracking-wide py-3 px-8 rounded-full transition-colors"
            >
              Ke Halaman Login
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
