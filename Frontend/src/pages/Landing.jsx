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
      <PlatformCapabilityStrip />
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
    <section id="beranda" className="relative overflow-hidden bg-gradient-to-br from-navy via-navy to-emerald-900">
      <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-navy-light/20 blur-3xl" />
      <div className="absolute left-1/3 -bottom-32 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
      <div className="absolute right-1/4 top-1/3 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-6 py-16 md:py-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-flex items-center gap-2 bg-gold-light/15 text-gold-light text-xs font-semibold px-4 py-1.5 rounded-full border border-gold-light/25 mb-5">
            <ShieldIcon className="h-3.5 w-3.5" />
            Untuk Administrator
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-5">
            Kelola Seluruh Sistem Pendidikan dengan{' '}
            <span className="text-gold-light">Mudah, Aman, dan Terintegrasi</span>
          </h1>
          <p className="text-white/65 text-base leading-relaxed mb-8 max-w-lg">
            SIM Pendidikan hadir sebagai solusi digital untuk membantu Administrator dalam mengelola
            data, pengguna, dan seluruh aspek manajemen pendidikan secara terpusat dan efisien.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-gold hover:bg-gold-light text-navy font-semibold px-6 py-3 rounded-full transition-colors"
            >
              <ArrowRightIcon className="h-4 w-4" />
              Masuk ke Sistem
            </Link>
            <a
              href="#fitur"
              className="inline-flex items-center gap-2 border border-white/25 text-white font-semibold px-6 py-3 rounded-full hover:bg-white/10 transition-colors"
            >
              <PlayIcon className="h-4 w-4" />
              Pelajari Fitur
            </a>
          </div>
        </div>

        <div className="relative">
          <p
            className="hidden md:block absolute -top-24 right-2 text-gold-light text-xl leading-snug rotate-[-6deg] text-right"
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

const PLATFORM_CAPABILITIES = [
  {
    icon: SchoolIcon,
    label: 'Multi-Sekolah / Tenant',
    desc: 'Kelola banyak sekolah, data masing-masing terpisah aman.',
    tone: 'bg-emerald-50 text-emerald-700',
  },
  {
    icon: ShieldIcon,
    label: 'Akses Berbasis Peran',
    desc: 'Tiap peran hanya melihat & mengelola yang relevan baginya.',
    tone: 'bg-blue-50 text-blue-600',
  },
  {
    icon: LogIcon,
    label: 'Audit Log Lengkap',
    desc: 'Setiap aksi tercatat otomatis, mudah ditelusuri kapan pun.',
    tone: 'bg-gold-light/25 text-gold',
  },
  {
    icon: DatabaseIcon,
    label: 'Backup & Pemulihan Otomatis',
    desc: 'Data dicadangkan berkala, siap dipulihkan kapan saja.',
    tone: 'bg-purple-50 text-purple-600',
  },
]

function PlatformCapabilityStrip() {
  return (
    <div className="bg-navy/[0.03] border-b border-navy/5">
      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-5">
        {PLATFORM_CAPABILITIES.map((c) => {
          const Icon = c.icon
          return (
            <div key={c.label} className="flex items-start gap-3">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${c.tone}`}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-navy leading-tight">{c.label}</p>
                <p className="text-xs text-navy/50 leading-snug mt-1">{c.desc}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const PLATFORM_FEATURES = [
  {
    icon: UsersIcon,
    title: 'Kelola Pengguna',
    desc: 'Atur hak akses dan data pengguna sistem dengan fleksibel.',
    tone: 'bg-emerald-100 text-emerald-700',
    card: 'bg-emerald-50/60 border-emerald-100',
    bar: 'bg-emerald-500',
  },
  {
    icon: SchoolIcon,
    title: 'Manajemen Sekolah',
    desc: 'Kelola data sekolah, profil, dan informasi umum.',
    tone: 'bg-blue-100 text-blue-600',
    card: 'bg-blue-50/60 border-blue-100',
    bar: 'bg-blue-500',
  },
  {
    icon: DatabaseIcon,
    title: 'Data Terpusat',
    desc: 'Semua data terintegrasi dalam satu sistem yang aman.',
    tone: 'bg-gold-light/35 text-gold',
    card: 'bg-gold-light/15 border-gold-light/40',
    bar: 'bg-gold',
  },
  {
    icon: ChartIcon,
    title: 'Monitoring & Laporan',
    desc: 'Pantau perkembangan dan hasil melalui laporan yang komprehensif.',
    tone: 'bg-purple-100 text-purple-600',
    card: 'bg-purple-50/60 border-purple-100',
    bar: 'bg-purple-500',
  },
]

function PlatformFeatureIcons() {
  return (
    <section id="fitur" className="bg-white py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="inline-block bg-emerald-50 text-navy text-xs font-semibold px-4 py-1.5 rounded-full border border-navy/10 mb-4">
            Fitur Utama
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-navy leading-snug">
            Semua yang Administrator Butuhkan
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {PLATFORM_FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className={`relative overflow-hidden rounded-2xl border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 p-6 pt-7 ${f.card}`}
              >
                <span className={`absolute top-0 left-0 right-0 h-1.5 ${f.bar}`} />
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-4 ${f.tone}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-navy mb-1.5">{f.title}</h3>
                <p className="text-sm text-navy/55 leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

const PLATFORM_WHY_ITEMS = [
  { title: 'Akses Terpusat', desc: 'Kelola seluruh data dan aktivitas sistem dari satu tempat.', tone: 'bg-emerald-500' },
  { title: 'Mudah Digunakan', desc: 'Antarmuka yang intuitif dan responsif di berbagai perangkat.', tone: 'bg-blue-500' },
  { title: 'Keamanan Data', desc: 'Sistem dilengkapi dengan keamanan berlapis dan backup data.', tone: 'bg-gold' },
  { title: 'Dukungan Teknis', desc: 'Tim kami siap membantu kapan saja jika Anda membutuhkan bantuan.', tone: 'bg-purple-500' },
]

function PlatformWhySection() {
  return (
    <section id="tentang" className="max-w-6xl mx-auto px-6 pb-16">
      <div className="relative overflow-hidden bg-gradient-to-br from-navy to-emerald-900 rounded-[2rem] p-8 md:p-12 grid md:grid-cols-2 gap-10">
        <div className="absolute -right-16 -bottom-16 h-64 w-64 rounded-full bg-gold-light/15 blur-3xl" />
        <div className="absolute -left-10 top-1/2 -translate-y-1/2 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative">
          <span className="inline-block bg-white/10 text-gold-light text-xs font-semibold px-4 py-1.5 rounded-full border border-white/15 mb-5">
            Mengapa SIM Pendidikan?
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-snug mb-4">
            Solusi Terbaik untuk Pengelolaan Pendidikan
          </h2>
          <p className="text-white/60 text-sm leading-relaxed">
            Dirancang khusus untuk mempermudah pekerjaan Administrator dalam mengelola sistem
            pendidikan secara efektif, efisien, dan transparan.
          </p>
        </div>

        <div className="relative grid sm:grid-cols-2 gap-4">
          {PLATFORM_WHY_ITEMS.map((item) => (
            <div
              key={item.title}
              className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 rounded-2xl p-4 flex items-start gap-3 transition-colors"
            >
              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${item.tone}`}>
                <CheckIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-sm mb-1">{item.title}</p>
                <p className="text-xs text-white/55 leading-relaxed">{item.desc}</p>
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
          className="relative shrink-0 inline-flex items-center gap-2 bg-gold hover:bg-gold-light text-navy font-semibold px-6 py-3 rounded-full transition-colors whitespace-nowrap"
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

function LogIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16v16H4z" />
      <path d="M8 9h8M8 13h8M8 17h4" />
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
