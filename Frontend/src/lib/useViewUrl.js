import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

// Pengganti `useState('home')` untuk halaman aktif di dasbor tiap peran.
// Halaman aktif disimpan di URL (mis. /kelas-saya, /notifikasi-siswa),
// bukan di state — supaya refresh tidak kembali ke beranda, tombol Back
// browser berfungsi, dan halaman bisa di-bookmark. Beranda tetap /dashboard.
const BERANDA = 'home'
const POLA_KUNCI = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function pathDariView(view) {
  return !view || view === BERANDA ? '/dashboard' : `/${view}`
}

export function viewDariUrl(pathname) {
  const segmen = pathname.replace(/\/+$/, '').split('/').filter(Boolean)
  if (segmen.length === 1 && segmen[0] !== 'dashboard' && POLA_KUNCI.test(segmen[0])) return segmen[0]
  return BERANDA
}

export function useViewUrl() {
  const location = useLocation()
  const navigate = useNavigate()
  const view = viewDariUrl(location.pathname)

  const setView = useCallback(
    (berikut) => {
      const kunci = typeof berikut === 'function' ? berikut(viewDariUrl(window.location.pathname)) : berikut
      const tujuan = pathDariView(kunci)
      if (tujuan !== window.location.pathname) navigate(tujuan)
    },
    [navigate],
  )

  return [view, setView]
}
