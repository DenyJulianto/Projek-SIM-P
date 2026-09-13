import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import About from '../components/About'
import Footer from '../components/Footer'
import Header from '../components/Header'
import Hero from '../components/Hero'
import Kegiatan from '../components/Kegiatan'
import Kontak from '../components/Kontak'
import Pengumuman from '../components/Pengumuman'
import SuperAdminHeroIllustration from '../components/SuperAdminHeroIllustration'
import TopBar from '../components/TopBar'
import { api, IS_CENTRAL_DOMAIN } from '../lib/api'
import Logo from '../components/Logo'
import LogoHorizontal from '../components/LogoHorizontal'

export default function Landing() {
  if (IS_CENTRAL_DOMAIN) {
    return <PlatformLanding />
  }

  return <SekolahLanding />
}

/**
 * Landing page platform (bukan landing satu sekolah tertentu) — dipakai
 * saat frontend dibuka lewat domain central (127.0.0.1/localhost), mis.
 * untuk masuk sebagai Super Admin. Tidak memanggil endpoint /public/*
 * karena itu khusus data satu sekolah dan tidak ada artinya di sini.
 */
function PlatformLanding() {
  return (
    <div className="min-h-screen bg-white">
      <PlatformNav />
      <PlatformHero />
      <PlatformFeatureIcons />
      <PlatformWhySection />
      <PlatformCta />
      <PlatformFooter />
    </div>
  )
}

function PlatformNav() {
  return (
    <header className="border-b border-navy/10">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <LogoHorizontal
          subtitle="Sistem Informasi Manajemen Pendidikan"
          badgeClassName="h-11 w-11"
          ringClassName="ring-navy-light/30"
          iconClassName="h-6.5 w-6.5"
          textClassName="text-lg"
          textColorClassName="text-navy"
        />

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-navy/60 shrink-0">
          <a href="#beranda" className="text-navy font-semibold border-b-2 border-navy-light pb-1">
            Beranda
          </a>
          <a href="#fitur" className="hover:text-navy transition-colors">
            Fitur
          </a>
          <a href="#tentang" className="hover:text-navy transition-colors">
            Tentang
          </a>
          <a href="#bantuan" className="hover:text-navy transition-colors">
            Bantuan
          </a>
        </nav>

        <Link
          to="/login"
          className="shrink-0 flex items-center gap-2 border border-navy/15 rounded-full px-5 py-2 text-sm font-semibold text-navy hover:bg-navy hover:text-white transition-colors"
        >
          <UserIcon className="h-4 w-4" />
          Masuk
        </Link>
      </div>
    </header>
  )
}

function PlatformHero() {
  return (
    <section id="beranda" className="bg-emerald-50/60 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 py-16 md:py-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-flex items-center gap-2 bg-white text-navy text-xs font-semibold px-4 py-1.5 rounded-full border border-navy/10 mb-5">
            <ShieldIcon className="h-3.5 w-3.5" />
            Untuk Super Admin
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-navy leading-tight mb-5">
            Kelola Seluruh Sistem Pendidikan dengan{' '}
            <span className="text-navy-light">Mudah, Aman, dan Terintegrasi</span>
          </h1>
          <p className="text-navy/60 text-base leading-relaxed mb-8 max-w-lg">
            SIM Pendidikan hadir sebagai solusi digital untuk membantu Super Admin dalam mengelola
            data, pengguna, dan seluruh aspek manajemen pendidikan secara terpusat dan efisien.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-navy hover:bg-navy-light text-white font-semibold px-6 py-3 rounded-full transition-colors"
            >
              <ArrowRightIcon className="h-4 w-4" />
              Masuk ke Sistem
            </Link>
            <a
              href="#fitur"
              className="inline-flex items-center gap-2 border border-navy/15 text-navy font-semibold px-6 py-3 rounded-full hover:bg-white transition-colors"
            >
              <PlayIcon className="h-4 w-4" />
              Pelajari Fitur
            </a>
          </div>
        </div>

        <div className="relative">
          <p
            className="hidden md:block absolute -top-8 right-2 text-navy-light text-xl leading-snug rotate-[-6deg] text-right"
            style={{ fontFamily: "'Caveat', cursive" }}
          >
            Manajemen Pendidikan
            <br />
            Lebih Baik, Masa Depan
            <br />
            Lebih Cerah
          </p>
          <SuperAdminHeroIllustration className="w-full h-auto" />
        </div>
      </div>
    </section>
  )
}

const PLATFORM_FEATURES = [
  { icon: UsersIcon, title: 'Kelola Pengguna', desc: 'Atur hak akses dan data pengguna sistem dengan fleksibel.' },
  { icon: SchoolIcon, title: 'Manajemen Sekolah', desc: 'Kelola data sekolah, profil, dan informasi umum.' },
  { icon: DatabaseIcon, title: 'Data Terpusat', desc: 'Semua data terintegrasi dalam satu sistem yang aman.' },
  {
    icon: ChartIcon,
    title: 'Monitoring & Laporan',
    desc: 'Pantau perkembangan dan hasil melalui laporan yang komprehensif.',
  },
]

function PlatformFeatureIcons() {
  return (
    <section id="fitur" className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-8">
      {PLATFORM_FEATURES.map((f) => {
        const Icon = f.icon
        return (
          <div key={f.title}>
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
              <Icon className="h-6 w-6 text-navy" />
            </div>
            <h3 className="font-bold text-navy mb-1.5">{f.title}</h3>
            <p className="text-sm text-navy/55 leading-relaxed">{f.desc}</p>
          </div>
        )
      })}
    </section>
  )
}

const PLATFORM_WHY_ITEMS = [
  { title: 'Akses Terpusat', desc: 'Kelola seluruh data dan aktivitas sistem dari satu tempat.' },
  { title: 'Mudah Digunakan', desc: 'Antarmuka yang intuitif dan responsif di berbagai perangkat.' },
  { title: 'Keamanan Data', desc: 'Sistem dilengkapi dengan keamanan berlapis dan backup data.' },
  { title: 'Dukungan Teknis', desc: 'Tim kami siap membantu kapan saja jika Anda membutuhkan bantuan.' },
]

function PlatformWhySection() {
  return (
    <section id="tentang" className="max-w-6xl mx-auto px-6 pb-16">
      <div className="bg-emerald-50/60 rounded-[2rem] p-8 md:p-12 grid md:grid-cols-2 gap-10">
        <div>
          <span className="inline-block bg-white text-navy text-xs font-semibold px-4 py-1.5 rounded-full border border-navy/10 mb-5">
            Mengapa SIM Pendidikan?
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-navy leading-snug mb-4">
            Solusi Terbaik untuk Pengelolaan Pendidikan
          </h2>
          <p className="text-navy/60 text-sm leading-relaxed">
            Dirancang khusus untuk mempermudah pekerjaan Super Admin dalam mengelola sistem
            pendidikan secara efektif, efisien, dan transparan.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
          {PLATFORM_WHY_ITEMS.map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-navy-light flex items-center justify-center shrink-0 mt-0.5">
                <CheckIcon className="h-3.5 w-3.5 text-white" />
              </div>
              <div>
                <p className="font-bold text-navy text-sm mb-1">{item.title}</p>
                <p className="text-xs text-navy/55 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function PlatformCta() {
  return (
    <section id="bantuan" className="max-w-6xl mx-auto px-6 pb-16">
      <div className="relative overflow-hidden bg-gradient-to-r from-navy to-navy-light rounded-[2rem] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <LeafDecoration className="absolute -left-4 -bottom-6 h-28 w-28 text-white/10" />
        <div className="relative flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-white ring-2 ring-white/30 flex items-center justify-center shrink-0">
            <Logo className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-white font-extrabold text-lg md:text-xl mb-1 leading-snug">
              Bersama Wujudkan Manajemen Pendidikan yang Lebih Baik
            </h3>
            <p className="text-white/70 text-sm">Mulai kelola sistem pendidikan sekolah Anda sekarang.</p>
          </div>
        </div>
        <Link
          to="/login"
          className="relative shrink-0 inline-flex items-center gap-2 bg-white text-navy font-semibold px-6 py-3 rounded-full hover:bg-emerald-50 transition-colors whitespace-nowrap"
        >
          Masuk ke Sistem
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}

function PlatformFooter() {
  return (
    <footer className="border-t border-navy/10">
      <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-navy/50">
        <p>© {new Date().getFullYear()} SIM Pendidikan. Seluruh hak cipta dilindungi.</p>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-navy transition-colors">
            Kebijakan Privasi
          </a>
          <a href="#" className="hover:text-navy transition-colors">
            Syarat &amp; Ketentuan
          </a>
          <a href="#bantuan" className="hover:text-navy transition-colors">
            Bantuan
          </a>
        </div>
      </div>
    </footer>
  )
}


function UserIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  )
}

function ShieldIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </svg>
  )
}

function ArrowRightIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  )
}

function PlayIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M8 5v14l11-7Z" />
    </svg>
  )
}

function UsersIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <path d="M16.5 6.5a3 3 0 0 1 0 5.8M21 20c0-2.9-1.9-5-4.5-5.7" />
    </svg>
  )
}

function SchoolIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21V10l9-6 9 6v11" />
      <path d="M9 21v-6h6v6M3 21h18" />
    </svg>
  )
}

function DatabaseIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
      <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
    </svg>
  )
}

function ChartIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3v18h18" />
      <rect x="7" y="12" width="3" height="6" rx="0.5" fill="currentColor" stroke="none" />
      <rect x="12.5" y="8" width="3" height="10" rx="0.5" fill="currentColor" stroke="none" />
      <rect x="18" y="5" width="3" height="13" rx="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function CheckIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="m5 13 4 4L19 7" />
    </svg>
  )
}

function LeafDecoration(props) {
  return (
    <svg {...props} viewBox="0 0 100 100" fill="none">
      <path
        d="M10 90C10 60 30 20 90 10C90 50 70 90 10 90Z"
        fill="currentColor"
      />
    </svg>
  )
}

function SekolahLanding() {
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
