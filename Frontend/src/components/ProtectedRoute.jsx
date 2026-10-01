import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-navy/50">Memuat...</div>
  }

  if (!user) {
    // Simpan halaman tujuan supaya setelah login langsung kembali ke sana
    // (mis. membuka bookmark /data-master/guru saat belum login).
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  return children
}
