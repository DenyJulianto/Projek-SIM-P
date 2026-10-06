import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import WajibAktifkan2FA from '../pages/WajibAktifkan2FA'
import WajibGantiPassword from '../pages/WajibGantiPassword'
import PilihPeran, { PeranSwitcher } from './PilihPeran'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-navy/50">Memuat...</div>
  }

  if (!user) {
    // Simpan halaman tujuan supaya setelah login langsung kembali ke sana
    // (mis. membuka bookmark /kelas-saya saat belum login).
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  if (user.must_change_password) {
    return <WajibGantiPassword />
  }

  if (user.two_factor_required) {
    return <WajibAktifkan2FA />
  }

  if ((user.available_roles?.length ?? 0) > 1 && !user.active_role) {
    return <PilihPeran />
  }

  return (
    <>
      {children}
      <PeranSwitcher />
    </>
  )
}
