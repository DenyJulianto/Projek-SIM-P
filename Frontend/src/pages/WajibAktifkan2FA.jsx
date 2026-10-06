import Setup2FA from '../components/Setup2FA'
import { WavyBackground } from '../components/AuthVisuals'
import { useAuth } from '../lib/AuthContext'
import { api } from '../lib/api'

/** Ditampilkan menggantikan dasbor selama akun admin belum mengaktifkan 2FA. */
export default function WajibAktifkan2FA() {
  const { user, setUser, logout } = useAuth()

  async function selesai() {
    setUser(await api.me())
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-12 overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100">
      <div className="pointer-events-none absolute inset-0">
        <WavyBackground className="h-full w-full" />
      </div>
      <div className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl shadow-navy/10 p-8 sm:p-10">
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-5">
          Halo {user?.name}, akun admin sekolah wajib memakai verifikasi dua langkah (2FA) untuk melindungi data sekolah.
        </p>
        <Setup2FA onSelesai={selesai} />
        <button onClick={logout} className="block mx-auto mt-6 text-xs text-navy/40 hover:text-navy">
          Keluar
        </button>
      </div>
    </div>
  )
}
