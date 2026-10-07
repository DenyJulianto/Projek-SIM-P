import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

// Pengganti `useState('home')` untuk halaman aktif di dasbor tiap peran.
// Halaman aktif disimpan di URL, bukan di state — supaya refresh tidak
// kembali ke beranda, tombol Back browser berfungsi, dan halaman bisa
// di-bookmark. Bentuk alamatnya:
//
//   /{peran}/{halaman}    mis. /kesiswaan/poin-siswa
//
// Sekolah tidak ditulis di path karena sudah ditentukan oleh domainnya
// (mis. demo.simpendidikan.test). Beranda tiap peran memakai halaman
// "dashboard"; Super Admin memakai /super-admin/{halaman}. Alamat lama
// (/dashboard, /kelas-saya, /{sekolah}/{peran}/{halaman}) tetap dikenali dan
// dirapikan oleh ProtectedRoute ke bentuk di atas.
const BERANDA = 'home'
const HALAMAN_BERANDA = 'dashboard'
const POLA_KUNCI = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** 'Guru Mata Pelajaran' → 'guru-mata-pelajaran' */
export function slugPeran(nama) {
  return String(nama || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Peran yang sedang dipakai user (peran aktif, atau satu-satunya peran). */
export function peranAktif(user) {
  if (!user) return null
  if (user.is_super_admin) return 'Super Admin'
  return user.active_role || user.roles?.[0]?.name || null
}

/** Awalan alamat dasbor user, mis. "/kesiswaan". */
export function basisDasbor(user) {
  if (!user) return null
  return `/${slugPeran(peranAktif(user)) || 'pengguna'}`
}

export function segmenUrl(pathname) {
  return pathname.replace(/\/+$/, '').split('/').filter(Boolean)
}

/** Slug semua peran milik user (termasuk peran yang sedang dipakai). */
function slugPeranUser(user) {
  return new Set([...(user?.available_roles ?? []), peranAktif(user)].filter(Boolean).map(slugPeran))
}

/**
 * Pecah alamat menjadi { peran, halaman } (slug; null bila tidak ada).
 * Mengenali bentuk baru /{peran}/{halaman}, bentuk lama dengan nama sekolah
 * /{sekolah}/{peran}/{halaman}, alamat satu tingkat lama (/kelas-saya,
 * /dashboard), dan /{peran} saja (bila `user` diberikan).
 */
export function bacaUrlDasbor(pathname, user = null) {
  const s = segmenUrl(pathname)
  if (s.length === 2) return { peran: s[0], halaman: s[1] }
  if (s.length === 3) return { peran: s[1], halaman: s[2] }
  if (s.length === 1 && user && slugPeranUser(user).has(s[0])) return { peran: s[0], halaman: null }
  if (s.length === 1) return { peran: null, halaman: s[0] }
  return { peran: null, halaman: null }
}

/** Kunci halaman dari URL ('home'/beranda bila beranda atau tidak valid). */
export function viewDariUrl(pathname, beranda = BERANDA, user = null) {
  const { halaman } = bacaUrlDasbor(pathname, user)
  if (!halaman || halaman === HALAMAN_BERANDA || !POLA_KUNCI.test(halaman)) return beranda
  return halaman
}

/** Alamat lengkap sebuah halaman dasbor untuk user ini. */
export function urlDasbor(user, view, beranda = BERANDA) {
  const halaman = !view || view === beranda || view === BERANDA ? HALAMAN_BERANDA : view
  return `${basisDasbor(user)}/${halaman}`
}

/**
 * `beranda` = kunci yang dipakai dasbor untuk halaman awalnya (kebanyakan
 * 'home'; Super Admin memakai 'beranda').
 */
export function useViewUrl(beranda = BERANDA) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const view = viewDariUrl(location.pathname, beranda)

  const setView = useCallback(
    (berikut) => {
      const kunci = typeof berikut === 'function' ? berikut(viewDariUrl(window.location.pathname, beranda)) : berikut
      const tujuan = urlDasbor(user, kunci, beranda)
      if (tujuan !== window.location.pathname) navigate(tujuan)
    },
    [navigate, user, beranda],
  )

  return [view, setView]
}
