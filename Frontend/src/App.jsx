import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './lib/AuthContext'
import Dashboard from './pages/Dashboard'
import ForgotPassword from './pages/ForgotPassword'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          {/* /dashboard dan semua halaman dasbor lain (mis. /data-master/sekolah).
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
