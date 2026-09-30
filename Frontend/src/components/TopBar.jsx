import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { EditableText, useLandingEdit } from './landing/LandingEdit'

export default function TopBar({ profil }) {
  const { user: authUser, logout } = useAuth()
  const editing = !!useLandingEdit()
  // Di editor tampilkan versi pengunjung (tombol Daftar/Login), bukan sesi admin.
  const user = editing ? null : authUser

  return (
    <div className="bg-gradient-to-r from-navy via-emerald-800 to-navy-light text-white text-xs sm:text-sm">
      <div className="mx-auto max-w-7xl px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-white/80">
          {(editing || profil?.alamat) && (
            <span>
              📍 <EditableText field="alamat" value={profil?.alamat} placeholder="Alamat sekolah" />
            </span>
          )}
          {(editing || profil?.telepon) && (
            <span>
              📞 <EditableText field="telepon" value={profil?.telepon} placeholder="Telepon" />
            </span>
          )}
          {(editing || profil?.email) && (
            <span>
              ✉️ <EditableText field="email" value={profil?.email} placeholder="Email sekolah" />
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-white/80 hidden sm:inline">Halo, {user.name}</span>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full px-3.5 py-1.5 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/register"
                className="flex items-center gap-1.5 bg-white text-navy font-semibold rounded-full px-3.5 py-1.5 shadow-md shadow-black/10 transition-all hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5"
              >
                Daftar
              </Link>
              <Link
                to="/login"
                className="flex items-center gap-1.5 bg-gradient-to-r from-gold to-gold-light text-navy font-semibold rounded-full px-3.5 py-1.5 shadow-md shadow-gold/30 transition-all hover:shadow-lg hover:shadow-gold/40 hover:-translate-y-0.5"
              >
                <UserIcon className="h-3.5 w-3.5" />
                Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function UserIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  )
}
