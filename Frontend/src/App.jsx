import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './lib/AuthContext'
import AktivasiAkun from './pages/AktivasiAkun'
import Dashboard from './pages/Dashboard'
import DaftarPegawai from './pages/DaftarPegawai'
import DaftarSiswa from './pages/DaftarSiswa'
import ForgotPassword from './pages/ForgotPassword'
import Landing from './pages/Landing'
import Login from './pages/Login'
import ResetPasswordLink from './pages/ResetPasswordLink'

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPasswordLink />} />
          <Route path="/aktivasi" element={<AktivasiAkun />} />
          <Route path="/register" element={<DaftarPegawai />} />
          <Route path="/daftar-siswa" element={<DaftarSiswa />} />
          {/* /dashboard dan semua halaman dasbor lain (mis. /kelas-saya).
              Halaman mana yang tampil & siapa yang boleh membukanya ditentukan
              di Dashboard.jsx sesuai peran user. */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  )
}
