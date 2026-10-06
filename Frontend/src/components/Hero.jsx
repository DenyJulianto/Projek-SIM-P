import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import heroBawaan from '../assets/hero-sekolah.jpg'
import { useAuth } from '../lib/AuthContext'
import { EditableImage, EditableText, useLandingEdit } from './landing/LandingEdit'

const HERO_FALLBACK =
  'Lingkungan belajar yang mendukung siswa untuk tumbuh, berkembang, dan menjadi pemimpin masa depan.'

const NAV_ITEMS = [
  { label: 'Beranda', href: '#beranda' },
  { label: 'Tentang Kami', href: '#tentang' },
  { label: 'Kegiatan', href: '#kegiatan' },
  { label: 'Prestasi', href: '#prestasi' },
  { label: 'Pengumuman', href: '#pengumuman' },
  { label: 'Kontak', href: '#kontak' },
]

const KARTU = [
  {
    icon: CapIcon,
    title: 'Calon Siswa',
    desc: 'Ingin bergabung bersama kami? Lihat informasi penerimaan peserta didik baru dan daftarkan diri Anda.',
    bg: 'bg-[#6c6fc9]',
    href: '#ppdb',
  },
  {
    icon: UsersIcon,
    title: 'Komunitas Sekolah',
    desc: 'Guru, siswa, dan orang tua bekerja sama menciptakan lingkungan belajar yang hangat dan saling mendukung.',
    bg: 'bg-[#ef7b7b]',
    href: '#tentang',
  },
  {
    icon: ClipboardIcon,
    title: 'Kurikulum Terbaik',
    desc: 'Pembelajaran yang terstruktur dan relevan untuk menyiapkan siswa menghadapi masa depan.',
    bg: 'bg-[#2e86c8]',
    href: '#tentang',
  },
  {
    icon: CalendarIcon,
    title: 'Kegiatan Beragam',
    desc: 'Ekstrakurikuler dan kegiatan sekolah untuk mengembangkan bakat, minat, dan karakter siswa.',
    bg: 'bg-[#1dbf8e]',
    href: '#kegiatan',
  },
]

const FONT_JUDUL = { fontFamily: "'Archivo', 'Segoe UI', system-ui, sans-serif" }

/**
 * Bagian pembuka landing sekolah: identitas & kontak, menu, judul besar di
 * atas foto sekolah, dan empat kartu sorotan yang menumpang di tepi bawahnya.
 */
export default function Hero({ profil, ppdb }) {
  const editing = !!useLandingEdit()
  const { user: authUser, logout } = useAuth()
  // Di editor tampilkan versi pengunjung, bukan sesi admin yang sedang login.
  const user = editing ? null : authUser
  const [menuTerbuka, setMenuTerbuka] = useState(false)
  const [melekat, setMelekat] = useState(false)
  const aktif = useBagianAktif(editing)

  const ppdbBuka = !!ppdb?.nama
  const navItems = ppdbBuka ? [NAV_ITEMS[0], { label: 'PPDB', href: '#ppdb' }, ...NAV_ITEMS.slice(1)] : NAV_ITEMS
  const kartu = KARTU.map((k) => (k.href === '#ppdb' && !ppdbBuka ? { ...k, href: '#kontak' } : k))
  const sosmed = profil?.sosial_media || {}

  // Menu berubah jadi bilah putih yang menempel di atas setelah hero terlewati.
  useEffect(() => {
    if (editing) return
    const cek = () => setMelekat(window.scrollY > 200)
    cek()
    window.addEventListener('scroll', cek, { passive: true })
    return () => window.removeEventListener('scroll', cek)
  }, [editing])

  const menu = (
    <nav
      className={`bg-white shadow-lg shadow-black/10 ${
        melekat ? 'fixed top-0 inset-x-0 z-50' : 'relative rounded-sm'
      }`}
    >
      <div className={`flex items-center justify-between gap-4 ${melekat ? 'mx-auto max-w-6xl px-4 sm:px-6' : 'px-4 sm:px-6'}`}>
        {melekat ? (
          <a href="#beranda" className="font-bold text-navy truncate py-4 lg:hidden" style={FONT_JUDUL}>
            {profil?.nama_sekolah}
          </a>
        ) : (
          <span className="lg:hidden text-[15px] font-medium text-slate-700 py-4">Menu</span>
        )}
        <ul className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className={`block px-4 py-4 text-[15px] font-medium transition-colors ${
                  aktif === item.href ? 'text-[#1a6be0]' : 'text-slate-700 hover:text-[#1a6be0]'
                }`}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="hidden lg:flex items-center gap-2 py-2">
          {user ? (
            <button onClick={logout} className="text-sm font-semibold text-slate-600 hover:text-[#1a6be0] px-3 py-2">
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 bg-[#1a6be0] hover:bg-[#1559bd] text-white text-sm font-semibold px-4 py-2 rounded-sm transition-colors"
            >
              <UserIcon className="h-4 w-4" />
              Login
            </Link>
          )}
        </div>
        <button
          type="button"
          onClick={() => setMenuTerbuka((v) => !v)}
          aria-expanded={menuTerbuka}
          aria-label="Buka menu"
          className="lg:hidden ml-auto my-2 p-2 text-slate-700"
        >
          {menuTerbuka ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
        </button>
      </div>
      {menuTerbuka && (
        <ul className="lg:hidden border-t border-slate-100 px-4 py-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={() => setMenuTerbuka(false)}
                className={`block py-2.5 text-[15px] font-medium ${aktif === item.href ? 'text-[#1a6be0]' : 'text-slate-700'}`}
              >
                {item.label}
              </a>
            </li>
          ))}
          <li className="flex gap-2 py-3">
            {user ? (
              <button onClick={logout} className="text-sm font-semibold text-slate-600">
                Logout
              </button>
            ) : (
              <>
                <Link to="/login" className="flex-1 text-center bg-[#1a6be0] text-white text-sm font-semibold py-2.5 rounded-sm">
                  Login
                </Link>
                <Link
                  to="/daftar-siswa"
                  className="flex-1 text-center border border-slate-300 text-slate-700 text-sm font-semibold py-2.5 rounded-sm"
                >
                  Daftar Siswa
                </Link>
                <Link
                  to="/register"
                  className="flex-1 text-center border border-slate-300 text-slate-700 text-sm font-semibold py-2.5 rounded-sm"
                >
                  Daftar Pegawai
                </Link>
              </>
            )}
          </li>
        </ul>
      )}
    </nav>
  )

  return (
    <>
      {melekat && menu}
      <section id="beranda" className="relative isolate overflow-hidden bg-[#0f2a4a] text-white">
        {/* Foto latar unggahan sekolah; bila belum ada, pakai foto bawaan. */}
        <img
          src={profil?.hero_image || heroBawaan}
          alt=""
          fetchPriority="high"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/55 via-black/40 to-black/55" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/45 via-black/15 to-transparent" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 pb-40 sm:pb-48">
          {/* Identitas sekolah & kontak */}
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
            <div className="flex items-center gap-3 min-w-0">
              <EditableImage field="logo" compact className="h-14 w-14 rounded-full shrink-0">
                {profil?.logo ? (
                  <img src={profil.logo} alt="Logo" className="h-14 w-14 rounded-full object-cover bg-white" />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-white text-[#1a6be0] flex items-center justify-center">
                    <CapIcon className="h-8 w-8" />
                  </div>
                )}
              </EditableImage>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-extrabold uppercase tracking-wide leading-tight truncate" style={FONT_JUDUL}>
                  <EditableText field="nama_sekolah" value={profil?.nama_sekolah || 'Nama Sekolah'} placeholder="Nama sekolah" />
                </p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/80 mt-0.5">
                  <EditableText field="jenjang" value={profil?.jenjang || 'Sekolah'} placeholder="Jenjang" />
                  {profil?.tahun_berdiri && <> · Berdiri {profil.tahun_berdiri}</>}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/90">
              {(editing || profil?.email) && (
                <span className="inline-flex items-center gap-1.5">
                  <MailIcon className="h-4 w-4 shrink-0" />
                  <EditableText field="email" value={profil?.email} placeholder="Email sekolah" />
                </span>
              )}
              {(editing || profil?.telepon) && (
                <span className="inline-flex items-center gap-1.5">
                  <PhoneIcon className="h-4 w-4 shrink-0" />
                  <EditableText field="telepon" value={profil?.telepon} placeholder="Telepon" />
                </span>
              )}
              {(sosmed.facebook || sosmed.instagram || sosmed.youtube) && (
                <span className="flex items-center gap-2.5">
                  {sosmed.facebook && <SosmedLink url={sosmed.facebook} label="Facebook" Icon={FacebookIcon} />}
                  {sosmed.instagram && <SosmedLink url={sosmed.instagram} label="Instagram" Icon={InstagramIcon} />}
                  {sosmed.youtube && <SosmedLink url={sosmed.youtube} label="YouTube" Icon={YoutubeIcon} />}
                </span>
              )}
              {user ? (
                <span className="text-white/80">Halo, {user.name}</span>
              ) : (
                <span className="hidden sm:inline-flex gap-2">
                  <Link
                    to="/daftar-siswa"
                    title="Pendaftaran calon siswa"
                    className="inline-flex bg-white text-slate-900 hover:bg-white/85 text-xs font-semibold px-3 py-1.5 rounded-sm transition-colors"
                  >
                    Daftar Siswa
                  </Link>
                  <Link
                    to="/register"
                    title="Pendaftaran khusus pendidik & tenaga kependidikan"
                    className="inline-flex border border-white/60 hover:bg-white hover:text-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-sm transition-colors"
                  >
                    Daftar Pegawai
                  </Link>
                </span>
              )}
            </div>
          </div>

          {/* Menu; menyisakan ruang yang sama saat bilahnya menempel di atas */}
          <div className="mt-7 min-h-14">{!melekat && menu}</div>

          {/* Judul utama */}
          <div className="mt-16 sm:mt-24 max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.12]" style={FONT_JUDUL}>
              Mendidik Generasi, Membangun Masa Depan
            </h1>
            <div className="mt-6 text-base sm:text-lg leading-relaxed text-white/90 max-w-xl">
              <EditableText field="visi" value={profil?.visi || HERO_FALLBACK} placeholder={HERO_FALLBACK} multiline />
            </div>
            <div className="mt-9 flex flex-wrap gap-4">
              <a
                href={ppdbBuka ? '#ppdb' : '#tentang'}
                className="bg-[#1a6be0] hover:bg-[#1559bd] text-white font-medium px-7 py-3.5 rounded-sm transition-colors"
              >
                {ppdbBuka ? 'Daftar Sekarang' : 'Kenali Kami'}
              </a>
              <a
                href="#kontak"
                className="border-2 border-white/90 hover:bg-white hover:text-slate-900 text-white font-medium px-7 py-3 rounded-sm transition-colors"
              >
                Hubungi Kami
              </a>
            </div>
          </div>
        </div>

        {editing && (
          <div className="absolute right-4 bottom-4 sm:right-6 sm:bottom-6">
            <EditableImage field="hero_image" className="rounded-lg">
              <div className="relative h-20 w-32 rounded-lg overflow-hidden border-2 border-white/70">
                <img src={profil?.hero_image || heroBawaan} alt="" className="h-full w-full object-cover" />
                <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                  {profil?.hero_image ? 'Foto latar' : 'Foto bawaan'}
                </span>
              </div>
            </EditableImage>
          </div>
        )}
      </section>

      {/* Kartu sorotan menumpang di tepi bawah hero */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 -mt-28 sm:-mt-32">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 rounded-md overflow-hidden shadow-xl shadow-black/15">
          {kartu.map(({ icon: Icon, title, desc, bg, href }) => (
            <a
              key={title}
              href={href}
              className={`${bg} group text-white text-center px-7 py-10 transition-[filter] hover:brightness-110`}
            >
              <Icon className="h-11 w-11 mx-auto mb-5 opacity-95 transition-transform group-hover:-translate-y-1" />
              <h3 className="text-xl font-bold mb-3" style={FONT_JUDUL}>
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-white/90">{desc}</p>
            </a>
          ))}
        </div>
      </div>
    </>
  )
}

/** Bagian landing yang sedang terlihat, untuk menandai menu yang aktif. */
function useBagianAktif(editing) {
  const [aktif, setAktif] = useState('#beranda')

  useEffect(() => {
    if (editing || !('IntersectionObserver' in window)) return
    const bagian = document.querySelectorAll('section[id]')
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setAktif(`#${e.target.id}`)
        })
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    bagian.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [editing])

  return aktif
}

function SosmedLink({ url, label, Icon }) {
  return (
    <a href={url} target="_blank" rel="noreferrer" aria-label={label} className="text-white/90 hover:text-white">
      <Icon className="h-4.5 w-4.5" />
    </a>
  )
}

function CapIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <path d="M2 9.5 12 5l10 4.5-10 4.5L2 9.5Z" />
      <path d="M6 11.3v4.2c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.2" />
      <path d="M22 9.5v5" strokeLinecap="round" />
    </svg>
  )
}

function UsersIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <path d="M15.5 4.6a3.5 3.5 0 0 1 0 6.8M21.5 20c0-3-1.8-5.2-4.4-5.8" strokeLinecap="round" />
    </svg>
  )
}

function ClipboardIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M9 4H6.5A1.5 1.5 0 0 0 5 5.5v14A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-14A1.5 1.5 0 0 0 17.5 4H15" />
      <rect x="9" y="2.5" width="6" height="3" rx="1" />
      <path d="M8.5 10h7M8.5 13.5h4" />
      <circle cx="15.5" cy="17" r="2.5" />
      <path d="m14.4 17 .8.8 1.4-1.5" />
    </svg>
  )
}

function CalendarIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="3.5" y="5" width="17" height="15.5" rx="1.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
      <path d="M7.5 13h1M11.5 13h1M15.5 13h1M7.5 16.5h1M11.5 16.5h1M15.5 16.5h1" strokeWidth="2" />
    </svg>
  )
}

function MailIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
    </svg>
  )
}

function PhoneIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1L6.6 10.8Z" />
    </svg>
  )
}

function UserIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  )
}

function MenuIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

function CloseIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

function FacebookIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-4.6v-6.9h2.3l.35-2.7H15.4V9.7c0-.78.22-1.3 1.33-1.3h1.42V6a19 19 0 0 0-2.07-.1c-2.05 0-3.45 1.25-3.45 3.55v1.98H10.3v2.7h2.33V21H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    </svg>
  )
}

function InstagramIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function YoutubeIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
      <path d="M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.27 5 12 5 12 5s-6.27 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.76 1.77C5.73 19 12 19 12 19s6.27 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5.2 3L10 15Z" />
    </svg>
  )
}
