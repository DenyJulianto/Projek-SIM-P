import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { bacaUrlDasbor, basisDasbor, slugPeran, urlDasbor, viewDariUrl } from '../lib/useViewUrl'
import WajibAktifkan2FA from '../pages/WajibAktifkan2FA'
import WajibGantiPassword from '../pages/WajibGantiPassword'
import PilihPeran, { PeranSwitcher } from './PilihPeran'

/** Peran milik user yang cocok dengan segmen peran di URL (mis. "wali-kelas"), bila ada. */
function peranDariUrl(user, pathname) {
  const { peran } = bacaUrlDasbor(pathname, user)
  if (!peran) return null
  return user?.available_roles?.find((r) => slugPeran(r) === peran) ?? null
}

export default function ProtectedRoute({ children }) {
  const { user, loading, gantiPeran } = useAuth()
  const location = useLocation()
  const [gagalGanti, setGagalGanti] = useState(null)

  // Membuka alamat untuk peran lain milik user (mis. bookmark
  // /wali-kelas/kelas-saya saat sedang memakai peran Guru Mapel)
  // langsung mengganti peran aktifnya.
  const multiPeran = (user?.available_roles?.length ?? 0) > 1
  const diminta = peranDariUrl(user, location.pathname)
  const perluGanti = multiPeran && !!diminta && diminta !== user.active_role && gagalGanti !== diminta

  // Ref mencegah permintaan ganti peran terkirim dua kali untuk peran yang
  // sama (mis. efek dijalankan ulang oleh StrictMode saat development).
  const sedangGanti = useRef(null)
  useEffect(() => {
    if (!perluGanti || sedangGanti.current === diminta) return
    sedangGanti.current = diminta
    gantiPeran(diminta)
      .catch(() => setGagalGanti(diminta))
      .finally(() => {
        sedangGanti.current = null
      })
  }, [perluGanti, diminta, gantiPeran])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-navy/50">Memuat...</div>
  }

  if (!user) {
    // Simpan halaman tujuan supaya setelah login langsung kembali ke sana
    // (mis. membuka bookmark halaman dasbor saat belum login).
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  if (user.must_change_password) {
    return <WajibGantiPassword />
  }

  if (user.two_factor_required) {
    return <WajibAktifkan2FA />
  }

  if (perluGanti) {
    return <div className="min-h-screen flex items-center justify-center text-navy/50">Mengganti peran...</div>
  }

  if ((user.available_roles?.length ?? 0) > 1 && !user.active_role) {
    return <PilihPeran />
  }

  // Rapikan alamat ke bentuk /{peran}/{halaman}. Alamat lama (/dashboard,
  // /kelas-saya, /{sekolah}/{peran}/{halaman}) dan /{peran} saja diarahkan ke
  // sana dengan halaman yang sama — kecuali URL menyebut peran yang bukan
  // milik user: halaman peran itu belum tentu ada di dasbornya, jadi ke beranda.
  const { peran } = bacaUrlDasbor(location.pathname, user)
  const peranAsing = !!peran && `/${peran}` !== basisDasbor(user)
  const kanonik = urlDasbor(user, peranAsing ? null : viewDariUrl(location.pathname, undefined, user))
  if (location.pathname.replace(/\/+$/, '') !== kanonik) {
    return <Navigate to={kanonik + location.search} replace />
  }

  return (
    <>
      {children}
      <PeranSwitcher />
    </>
  )
}
