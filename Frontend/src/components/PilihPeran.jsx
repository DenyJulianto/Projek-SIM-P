import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { ArrowRightIcon, WavyBackground } from './AuthVisuals'

const DESKRIPSI = {
  'Admin Sekolah': 'Kelola pengguna, data, dan pengaturan sekolah',
  'Kepala Sekolah': 'Pantau akademik, keuangan, dan kepegawaian',
  'Wakil Kepala Sekolah': 'Koordinasi akademik, kesiswaan, dan sarpras',
  'Tata Usaha': 'Administrasi, persuratan, dan data sekolah',
  Kurikulum: 'Jadwal, kurikulum, dan penilaian',
  Kesiswaan: 'Data siswa, prestasi, dan pembinaan',
  Bendahara: 'Tagihan, pembayaran, dan laporan keuangan',
  'Guru BK': 'Konseling, kasus, dan pembinaan siswa',
  'Wali Kelas': 'Kelas binaan, rapor, dan komunikasi orang tua',
  'Guru Mata Pelajaran': 'Materi, tugas, ujian, dan nilai',
  Siswa: 'Jadwal, tugas, nilai, dan absensi',
  'Orang Tua': 'Pantau perkembangan anak',
}

/** Layar pilih peran setelah login, untuk akun yang punya lebih dari satu peran. */
export default function PilihPeran() {
  const { user, gantiPeran, logout } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState('')

  async function pilih(role) {
    setBusy(role)
    setError('')
    try {
      await gantiPeran(role)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
      setBusy(null)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-12 overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100">
      <div className="pointer-events-none absolute inset-0">
        <WavyBackground className="h-full w-full" />
      </div>
      <div className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl shadow-navy/10 p-8 sm:p-10">
        <h1 className="text-2xl font-extrabold text-navy">Masuk sebagai…</h1>
        <p className="text-navy/50 text-sm mt-1 mb-6">
          Halo {user?.name}, akun Anda punya beberapa peran. Pilih peran yang ingin dipakai sekarang — Anda bisa
          berganti kapan saja.
        </p>
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-4">{error}</p>}
        <div className="space-y-2.5">
          {user?.available_roles?.map((role) => (
            <button
              key={role}
              onClick={() => pilih(role)}
              disabled={busy !== null}
              className="w-full flex items-center gap-3 text-left border border-navy/10 hover:border-navy-light hover:bg-emerald-50/60 rounded-2xl px-4 py-3.5 transition-colors disabled:opacity-60"
            >
              <span className="h-10 w-10 rounded-full bg-navy-light/15 text-navy font-bold flex items-center justify-center shrink-0">
                {role[0]}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-navy">{role}</span>
                <span className="block text-xs text-navy/50">{DESKRIPSI[role] ?? ''}</span>
              </span>
              {busy === role ? <span className="text-xs text-navy/40">Memuat…</span> : <ArrowRightIcon className="h-4 w-4 text-navy/30" />}
            </button>
          ))}
        </div>
        <button onClick={logout} className="block mx-auto mt-6 text-xs text-navy/40 hover:text-navy">
          Keluar
        </button>
      </div>
    </div>
  )
}

/** Tombol ganti peran yang mengambang di semua dasbor (hanya untuk akun multi-peran). */
export function PeranSwitcher() {
  const { user, gantiPeran } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const tutup = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', tutup)
    return () => document.removeEventListener('mousedown', tutup)
  }, [open])

  if ((user?.available_roles?.length ?? 0) < 2) return null

  async function pilih(role) {
    setOpen(false)
    if (role === user.active_role) return
    setBusy(true)
    try {
      await gantiPeran(role)
      navigate('/dashboard', { replace: true })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div ref={ref} className="fixed bottom-4 right-4 z-40">
      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-60 bg-white rounded-2xl shadow-xl border border-navy/10 p-1.5">
          <p className="text-[11px] font-bold text-navy/40 uppercase tracking-wide px-3 pt-2 pb-1">Ganti peran</p>
          {user.available_roles.map((role) => (
            <button
              key={role}
              onClick={() => pilih(role)}
              className={`w-full text-left text-sm px-3 py-2 rounded-xl ${
                role === user.active_role ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-navy hover:bg-navy/5'
              }`}
            >
              {role}
              {role === user.active_role && <span className="float-right text-xs">aktif</span>}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
        className="flex items-center gap-2 bg-navy text-white text-xs font-semibold pl-4 pr-3 py-2.5 rounded-full shadow-lg shadow-navy/30 hover:bg-navy-light disabled:opacity-60"
      >
        {busy ? 'Mengganti…' : `Peran: ${user.active_role}`}
        <span className="text-white/60">▾</span>
      </button>
    </div>
  )
}
