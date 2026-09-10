import { useEffect, useState } from 'react'
import About from '../components/About'
import Footer from '../components/Footer'
import Header from '../components/Header'
import Hero from '../components/Hero'
import Kegiatan from '../components/Kegiatan'
import Kontak from '../components/Kontak'
import Pengumuman from '../components/Pengumuman'
import TopBar from '../components/TopBar'
import { api } from '../lib/api'

export default function Landing() {
  const [profil, setProfil] = useState(null)
  const [pengumuman, setPengumuman] = useState(null)
  const [kegiatan, setKegiatan] = useState(null)
  const [error, setError] = useState('')

  function loadProfil() {
    api.getProfil().then(setProfil).catch((err) => setError(err.message))
  }

  useEffect(() => {
    loadProfil()
    api.getPengumuman().then(setPengumuman).catch(() => {})
    api.getKegiatan().then(setKegiatan).catch(() => {})
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div>
          <p className="text-red-600 font-semibold mb-2">Gagal memuat halaman.</p>
          <p className="text-navy/60 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!profil) {
    return <div className="min-h-screen flex items-center justify-center text-navy/50">Memuat...</div>
  }

  return (
    <div>
      <TopBar profil={profil} />
      <Header profil={profil} />
      <Hero profil={profil} />
      <About profil={profil} onProfilUpdated={loadProfil} />
      <Kegiatan kegiatan={kegiatan} />
      <Pengumuman pengumuman={pengumuman} />
      <Kontak profil={profil} />
      <Footer profil={profil} />
    </div>
  )
}
