import { createContext, useContext, useEffect, useState } from 'react'
import { api } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }

    api
      .me()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('token')
        sessionStorage.removeItem('token')
      })
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password, remember = true) {
    const res = await api.login(email, password)

    // Akun dengan 2FA aktif (cuma pernah terjadi untuk Super Admin) belum
    // dapat token di sini — Login.jsx perlu menampilkan langkah kedua
    // (kode TOTP/pemulihan) lalu memanggil verifyTwoFactor() di bawah.
    if (res.requires_2fa) {
      return { requiresTwoFactor: true, challenge: res.challenge }
    }

    const { user, token } = res
    if (remember) {
      localStorage.setItem('token', token)
    } else {
      sessionStorage.setItem('token', token)
    }
    setUser(user)
    return user
  }

  async function verifyTwoFactor(challenge, code, remember = true) {
    const { user, token } = await api.verifyTwoFactor(challenge, code)
    if (remember) {
      localStorage.setItem('token', token)
    } else {
      sessionStorage.setItem('token', token)
    }
    setUser(user)
    return user
  }

  async function register(name, email, password, passwordConfirmation, recaptchaToken) {
    return api.register(name, email, password, passwordConfirmation, recaptchaToken)
  }

  // Tidak auto-login: link verifikasi hanya mengaktifkan akun, pengguna
  // tetap harus masuk lewat halaman login secara terpisah.
  async function verifyEmailLink(email, token) {
    return api.verifyEmailLink(email, token)
  }

  async function resendVerificationCode(email) {
    return api.resendVerificationCode(email)
  }

  async function logout() {
    try {
      await api.logout()
    } catch {
      // token mungkin sudah invalid, tetap lanjut hapus sesi lokal
    }
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
    setUser(null)
  }

  function hasPermission(name) {
    return user?.all_permissions?.includes(name) || false
  }

  function hasRole(name) {
    return user?.roles?.some((r) => r.name === name) || false
  }

  function isSuperAdmin() {
    return user?.is_super_admin || false
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        login,
        verifyTwoFactor,
        register,
        verifyEmailLink,
        resendVerificationCode,
        logout,
        hasPermission,
        hasRole,
        isSuperAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
