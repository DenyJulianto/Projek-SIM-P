import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import About from '../components/About'
import Footer from '../components/Footer'
import Hero from '../components/Hero'
import Kegiatan from '../components/Kegiatan'
import Kontak from '../components/Kontak'
import Pengumuman from '../components/Pengumuman'
import PpdbInfo from '../components/PpdbInfo'
import Prestasi from '../components/Prestasi'
import heroSekolah from '../assets/hero-sekolah.jpg'
import IlustrasiFitur from '../components/IlustrasiFitur'
import gambarAdmin from '../assets/showcase/admin-dasbor.jpg'
import gambarGuru from '../assets/showcase/guru-absensi.jpg'
import gambarOrtu from '../assets/showcase/orangtua-pantau.jpg'
import gambarSiswa from '../assets/showcase/siswa-ujian.jpg'
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
  // Konten yang dikelola Super Admin (menu Kelola Landing Page). null = masih memuat.
  const [konten, setKonten] = useState(null)

  useEffect(() => {
    api
      .getKontenPlatform()
      .then(setKonten)
      .catch(() => setKonten(KONTEN_CADANGAN))
  }, [])

  const k = { ...KONTEN_KOSONG, ...konten }
  const p = k.pengaturan

  return (
    <div className="min-h-screen bg-white">
      <PlatformHeaderEdu menu={menuPlatform(k)} />
      <PlatformSliderHero slides={konten && (k.slide.length > 0 ? k.slide.map(slideDariServer) : SLIDE_HERO)} />
      <PlatformStatistik />
      {konten && <PlatformModulUnggulan fitur={k.fitur} />}
      {konten && <PlatformManfaatPeran manfaat={k.manfaat} />}
      <PlatformWhySection />
      <PlatformTestimoni testimoni={k.testimoni} />
      <PlatformKontak whatsapp={p.whatsapp} />
      <PlatformFooter pengaturan={p} />
    </div>
  )
}

// Fitur Unggulan bawaan — isi aslinya kini dikelola di Kelola Landing Page;
// ini hanya cadangan bila server tidak terjangkau.
const MODUL_UNGGULAN = [
  {
    id: 'sekolah',
    judul: 'Manajemen Sekolah',
    deskripsi: 'Daftarkan sekolah negeri & swasta, kelola profil, modul, dan status tiap sekolah dari satu tempat.',
    ilustrasi: 'foto',
    label: 'Inti',
    meta: ['Multi-sekolah', 'Negeri & swasta'],
  },
  {
    id: 'pengguna',
    judul: 'Pengguna & Hak Akses',
    deskripsi: 'Atur akun, peran, dan hak akses seluruh pengguna sekolah secara fleksibel dan aman.',
    ilustrasi: 'pengguna',
    label: 'Keamanan',
    meta: ['Peran & izin', 'Semua pengguna'],
  },
  {
    id: 'data',
    judul: 'Data & Backup',
    deskripsi: 'Data tiap sekolah tersimpan terpisah, dicadangkan berkala, dan siap dipulihkan kapan saja.',
    ilustrasi: 'tabel',
    label: 'Data',
    meta: ['Database per sekolah', 'Backup otomatis'],
  },
  {
    id: 'laporan',
    judul: 'Monitoring & Laporan',
    deskripsi: 'Pantau perkembangan seluruh sekolah dan telusuri setiap aksi lewat audit log yang lengkap.',
    ilustrasi: 'grafik',
    label: 'Laporan',
    meta: ['Laporan', 'Audit log'],
  },
]

const KONTEN_KOSONG = { pengaturan: {}, slide: [], fitur: [], manfaat: [], testimoni: [] }

const slideDariServer = (s) => ({
  putih: s.judul_putih,
  emas: s.judul_emas,
  lanjutan: s.judul_lanjutan,
  teks: s.teks,
  gambar: s.gambar_url,
})

// Slide hero bawaan (judul dua warna putih + emas), dipakai bila belum ada
// slide aktif di Kelola Landing Page atau server tidak terjangkau.
const SLIDE_HERO = [
  {
    putih: 'Kelola Semua',
    emas: 'Sekolah',
    lanjutan: 'Dalam Satu Platform',
    teks: 'SIM Pendidikan membantu Administrator mengelola data, pengguna, dan seluruh aspek manajemen pendidikan secara terpusat.',
  },
  {
    putih: 'Data',
    emas: 'Aman',
    lanjutan: '& Terpisah per Sekolah',
    teks: 'Setiap sekolah memiliki database sendiri, dicadangkan berkala, dan setiap aksi tercatat di audit log.',
  },
  {
    putih: 'Satu Akses',
    emas: 'Untuk',
    lanjutan: 'Semua Peran',
    teks: 'Admin, kepala sekolah, guru, siswa, dan orang tua bekerja di sistem yang sama sesuai hak aksesnya.',
  },
]

// Menu Fitur, Manfaat, Testimoni & Kontak hanya muncul bila bagiannya berisi (Kelola Landing Page).
const menuPlatform = (k) => [
  ['#beranda', 'Beranda'],
  ...(k.fitur.length > 0 ? [['#fitur', 'Fitur']] : []),
  ...(k.manfaat.length > 0 ? [['#manfaat', 'Manfaat']] : []),
  ['#tentang', 'Tentang'],
  ...(k.testimoni.length > 0 ? [['#testimoni', 'Testimoni']] : []),
  ...(k.pengaturan.whatsapp ? [['#kontak', 'Kontak']] : []),
]

const FONT_JUDUL = { fontFamily: "'Archivo', 'Segoe UI', system-ui, sans-serif" }

function PlatformHeaderEdu({ menu }) {
  const [menuBuka, setMenuBuka] = useState(false)

  return (
    <header id="beranda">
      {/* Pita identitas */}
      <div className="bg-navy text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-10 md:pb-12 flex flex-wrap items-center justify-between gap-6">
          <LogoHorizontal
            subtitle="Manajemen Pendidikan"
            badgeClassName="h-11 w-11"
            ringClassName="ring-white/40"
            iconClassName="h-6.5 w-6.5"
            textClassName="text-xl"
          />
          <div className="hidden lg:flex items-center divide-x divide-white/15">
            <InfoHeader Icon={GridIcon} judul="Terpusat" teks="Semua sekolah dalam satu sistem" />
            <InfoHeader Icon={ShieldIcon} judul="Aman" teks="Data tiap sekolah terpisah" />
            <InfoHeader Icon={UsersIcon} judul="Untuk Semua" teks="Admin, guru, siswa & orang tua" />
          </div>
        </div>
      </div>

      {/* Bilah menu emas yang menumpang di antara pita & hero */}
      <div className="relative z-20 h-0">
        <nav className="max-w-5xl mx-auto -translate-y-1/2 bg-gold rounded-sm shadow-lg shadow-black/15 mx-4 sm:mx-6 lg:mx-auto">
          <div className="hidden md:flex items-center justify-around px-4">
            {menu.map(([href, label], i) => (
              <a
                key={href}
                href={href}
                className={`relative py-3 text-[17px] font-semibold uppercase tracking-wide transition-colors ${
                  i === 0 ? 'text-navy' : 'text-white hover:text-navy'
                }`}
                style={FONT_JUDUL}
              >
                {label}
                {i === 0 && <span className="absolute left-1/2 -translate-x-1/2 bottom-1.5 h-0.5 w-8 bg-navy" />}
              </a>
            ))}
            <Link to="/login" className="py-3 text-[17px] font-semibold uppercase tracking-wide text-white hover:text-navy transition-colors" style={FONT_JUDUL}>
              Masuk
            </Link>
          </div>
          <div className="md:hidden flex items-center justify-between px-4">
            <span className="py-3 text-sm font-semibold uppercase tracking-wide text-navy" style={FONT_JUDUL}>Menu</span>
            <button
              type="button"
              onClick={() => setMenuBuka((v) => !v)}
              aria-expanded={menuBuka}
              aria-label="Buka menu"
              className="p-2 text-navy"
            >
              <MenuIcon className="h-6 w-6" />
            </button>
          </div>
          {menuBuka && (
            <div className="md:hidden border-t border-white/30 px-4 pb-2">
              {menu.map(([href, label]) => (
                <a key={href} href={href} onClick={() => setMenuBuka(false)} className="block py-2 text-sm font-semibold uppercase text-white">
                  {label}
                </a>
              ))}
              <Link to="/login" className="block py-2 text-sm font-semibold uppercase text-navy">Masuk</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}

function InfoHeader({ Icon, judul, teks }) {
  return (
    <div className="flex items-center gap-3 px-7 first:pl-0 last:pr-0">
      <Icon className="h-8 w-8 text-white shrink-0" />
      <div>
        <p className="font-semibold italic leading-tight" style={FONT_JUDUL}>{judul}</p>
        <p className="text-xs text-white/75">{teks}</p>
      </div>
    </div>
  )
}

/** slides null = konten masih dimuat: tampilkan latar saja agar tidak berkedip dari slide bawaan. */
function PlatformSliderHero({ slides }) {
  const [aktif, setAktif] = useState(0)
  const jumlah = slides?.length || 0
  const idx = jumlah ? aktif % jumlah : 0
  const slide = slides?.[idx]
  const geser = (arah) => jumlah && setAktif((i) => (i + arah + jumlah) % jumlah)

  // Berganti slide otomatis; jeda saat pengguna menekan panah (aktif berubah).
  useEffect(() => {
    if (jumlah < 2) return
    const t = setTimeout(() => setAktif((i) => (i + 1) % jumlah), 7000)
    return () => clearTimeout(t)
  }, [aktif, jumlah])

  return (
    <section className="relative isolate overflow-hidden bg-navy text-white">
      <img
        key={slide?.gambar || 'bawaan'}
        src={slide?.gambar || heroSekolah}
        alt=""
        className="absolute inset-0 -z-20 h-full w-full object-cover animate-[muncul_0.5s_ease-out]"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy/90 via-navy/70 to-navy/20" />

      <div className="relative max-w-6xl mx-auto px-6 sm:px-20 pt-24 pb-20 md:pt-28 md:pb-24 min-h-[420px]">
        {slide && (
          <div key={idx} className="max-w-3xl animate-[muncul_0.5s_ease-out]">
            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold uppercase leading-[1.1]" style={FONT_JUDUL}>
              {slide.putih} {slide.emas && <span className="text-gold">{slide.emas}</span>}
              {slide.lanjutan && (
                <>
                  <br />
                  {slide.lanjutan}
                </>
              )}
            </h1>
            <span className="block h-1 w-28 bg-gold my-6" />
            <p className="text-white/90 max-w-md leading-relaxed">{slide.teks}</p>
            <Link
              to="/login"
              className="inline-block mt-8 bg-gold hover:bg-gold-light text-navy text-sm font-bold uppercase tracking-wide px-6 py-3 rounded-sm shadow-md transition-colors"
            >
              Masuk ke Sistem
            </Link>
          </div>
        )}

        {jumlah > 1 && (
          <div className="flex gap-2 mt-10">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setAktif(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-2 rounded-full transition-all ${i === idx ? 'w-8 bg-gold' : 'w-2 bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </div>

      {jumlah > 1 && (
        <>
          <TombolPanah arah="kiri" onClick={() => geser(-1)} className="hidden sm:flex absolute left-6 top-1/2 -translate-y-1/2" />
          <TombolPanah arah="kanan" onClick={() => geser(1)} garis className="hidden sm:flex absolute right-6 top-1/2 -translate-y-1/2" />
        </>
      )}
    </section>
  )
}

function TombolPanah({ arah, onClick, garis = false, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={arah === 'kiri' ? 'Sebelumnya' : 'Berikutnya'}
      className={`h-11 w-11 rounded-full flex items-center justify-center transition-colors ${
        garis ? 'border border-white/70 text-white hover:bg-white/15' : 'bg-gold text-white hover:bg-gold-light'
      } ${className}`}
    >
      <ChevronIcon className={`h-5 w-5 ${arah === 'kiri' ? 'rotate-180' : ''}`} />
    </button>
  )
}

function PlatformModulUnggulan({ fitur }) {
  const jalurRef = useRef(null)
  const geser = (arah) => {
    const el = jalurRef.current
    if (!el) return
    el.scrollBy({ left: arah * (el.clientWidth / 3 + 8), behavior: 'smooth' })
  }

  if (fitur.length === 0) return null

  return (
    <section id="fitur" className="bg-emerald-50/70 py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl font-extrabold uppercase text-navy" style={FONT_JUDUL}>Fitur Unggulan</h2>
        <span className="block h-1 w-16 bg-navy mt-3 mb-10" />

        <div className="relative">
          <TombolPanah arah="kiri" onClick={() => geser(-1)} className="hidden sm:flex absolute -left-6 lg:-left-14 top-1/2 -translate-y-1/2 z-10 shadow-md" />
          <div
            ref={jalurRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {fitur.map((m, i) => (
              <KartuModulEdu key={m.id} modul={m} labelGelap={i % 2 === 1} />
            ))}
          </div>
          <button
            type="button"
            onClick={() => geser(1)}
            aria-label="Berikutnya"
            className="hidden sm:flex absolute -right-6 lg:-right-14 top-1/2 -translate-y-1/2 z-10 h-11 w-11 rounded-full border border-navy/40 bg-white text-navy items-center justify-center hover:bg-navy hover:text-white transition-colors"
          >
            <ChevronIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  )
}

function KartuModulEdu({ modul, labelGelap }) {
  return (
    <div className="snap-start shrink-0 w-[85%] sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)] bg-white shadow-md shadow-navy/10 flex flex-col">
      <div className="relative">
        {modul.gambar_url ? (
          <img src={modul.gambar_url} alt="" className="h-44 w-full object-cover" loading="lazy" />
        ) : (
          <IlustrasiFitur jenis={modul.ilustrasi} />
        )}
        {modul.label && (
          <span className={`absolute top-0 right-0 px-4 py-1.5 text-sm font-bold ${labelGelap ? 'bg-navy text-white' : 'bg-gold text-navy'}`}>
            {modul.label}
          </span>
        )}
      </div>
      <div className="px-6 py-5 text-center flex flex-col flex-1">
        <h3 className="text-lg font-bold uppercase text-slate-900" style={FONT_JUDUL}>{modul.judul}</h3>
        {modul.meta?.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-2">
            {modul.meta.map((m) => (
              <span key={m} className="inline-flex items-center gap-1">
                <CheckIcon className="h-3 w-3 text-navy-light" />
                {m}
              </span>
            ))}
          </div>
        )}
        <p className="text-sm text-slate-600 leading-relaxed mt-3 flex-1">{modul.deskripsi}</p>
        <Link
          to="/login"
          className="self-center mt-5 bg-gold hover:bg-gold-light text-navy text-sm font-bold uppercase tracking-wide px-6 py-2.5 rounded-sm transition-colors"
        >
          Selengkapnya
        </Link>
      </div>
    </div>
  )
}

const PLATFORM_WHY_ITEMS = [
  { title: 'Akses Terpusat', desc: 'Kelola seluruh data dan aktivitas sistem dari satu tempat.', Icon: GridIcon },
  { title: 'Mudah Digunakan', desc: 'Antarmuka yang intuitif dan responsif di berbagai perangkat.', Icon: MonitorIcon },
  { title: 'Keamanan Data', desc: 'Sistem dilengkapi dengan keamanan berlapis dan backup data.', Icon: ShieldIcon },
  { title: 'Dukungan Teknis', desc: 'Tim kami siap membantu kapan saja jika Anda membutuhkan bantuan.', Icon: HeadsetIcon },
]

function PlatformWhySection() {
  return (
    <section id="tentang" className="bg-white py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-10 items-start">
          <div>
            <h2 className="text-3xl font-extrabold uppercase text-navy" style={FONT_JUDUL}>
              Mengapa SIM <span className="text-gold">Pendidikan?</span>
            </h2>
            <span className="block h-1 w-16 bg-navy mt-3 mb-6" />
            <p className="text-slate-600 leading-relaxed">
              Solusi terbaik untuk pengelolaan pendidikan — dirancang khusus untuk mempermudah pekerjaan Administrator
              dalam mengelola sistem pendidikan secara efektif, efisien, dan transparan.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {PLATFORM_WHY_ITEMS.map(({ title, desc, Icon }, i) => (
              <div key={title} className="bg-white border-t-4 border-gold shadow-md shadow-navy/10 p-6 flex items-start gap-4">
                <span
                  className={`h-12 w-12 flex items-center justify-center shrink-0 ${
                    i % 2 === 0 ? 'bg-gold text-navy' : 'bg-navy text-white'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="font-bold uppercase text-slate-900" style={FONT_JUDUL}>{title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mt-1.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/** Tautan chat WhatsApp tim sales, dengan pesan awal (kosong bila nomor belum diatur). */
function tautanWhatsApp(whatsapp, pesan = '') {
  if (!whatsapp) return ''
  const nomor = whatsapp.replace(/\D/g, '')
  return `https://wa.me/${nomor}${pesan ? `?text=${encodeURIComponent(pesan)}` : ''}`
}

/** Social proof: angka asli dari sistem (sekolah, siswa & guru aktif). */
function PlatformStatistik() {
  const [angka, setAngka] = useState(null)

  useEffect(() => {
    api.getStatistikPlatform().then(setAngka).catch(() => setAngka(null))
  }, [])

  if (!angka) return null

  const item = [
    { nilai: angka.sekolah, label: 'Sekolah Terintegrasi', Icon: GridIcon },
    { nilai: angka.siswa, label: 'Siswa Aktif', Icon: UsersIcon },
    { nilai: angka.guru, label: 'Guru Terdukung', Icon: ShieldIcon },
  ]

  return (
    <section aria-label="Pencapaian platform" className="bg-navy text-white border-t-4 border-gold">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid sm:grid-cols-3 gap-8">
        {item.map(({ nilai, label, Icon }) => (
          <div key={label} className="flex items-center gap-4 sm:justify-center">
            <span className="h-14 w-14 bg-gold text-navy flex items-center justify-center shrink-0">
              <Icon className="h-7 w-7" />
            </span>
            <div>
              <p className="text-4xl font-extrabold text-gold leading-none" style={FONT_JUDUL}>
                {Number(nilai).toLocaleString('id-ID')}
              </p>
              <p className="uppercase tracking-wide text-sm text-white/85 mt-1.5">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// Tangkapan layar asli aplikasi (sekolah demo) yang bisa dipilih untuk tab Manfaat.
const GAMBAR_MANFAAT = { guru: gambarGuru, siswa: gambarSiswa, orangtua: gambarOrtu, admin: gambarAdmin }

// Manfaat per pengguna bawaan — isi aslinya kini dikelola di Kelola Landing
// Page; ini hanya cadangan bila server tidak terjangkau.
const MANFAAT_PERAN = [
  {
    peran: 'Guru',
    judul: 'Absensi Digital untuk Guru',
    teks: 'Catat kehadiran siswa per kelas dalam beberapa klik, lalu kelola nilai, tugas, dan ujian online dari satu dasbor.',
    poin: ['Status hadir, izin, sakit, dan alfa', 'Input nilai, tugas & ujian online', 'Perangkat ajar dan jadwal mengajar'],
    gambar_bawaan: 'guru',
  },
  {
    peran: 'Siswa',
    judul: 'Ujian & Rapor Online untuk Siswa',
    teks: 'Siswa mengerjakan ujian dalam mode aman, langsung melihat hasilnya, dan mengunduh e-rapor dalam format PDF.',
    poin: ['Ujian online dengan mode aman', 'Hasil & nilai ujian langsung terlihat', 'E-rapor, jadwal, materi, dan tugas'],
    gambar_bawaan: 'siswa',
  },
  {
    peran: 'Orang Tua',
    judul: 'Pantau Nilai & Kehadiran Anak',
    teks: 'Orang tua memantau perkembangan anak: nilai, kehadiran, tagihan, dan pengumuman sekolah dalam satu tempat.',
    poin: ['Ringkasan nilai & tren perkembangan', 'Kehadiran mingguan anak', 'Tagihan, saldo, dan notifikasi sekolah'],
    gambar_bawaan: 'orangtua',
  },
  {
    peran: 'Admin Sekolah',
    judul: 'Kendali Penuh untuk Admin Sekolah',
    teks: 'Admin mengelola pengguna, menyetujui pendaftaran, memantau aktivitas sistem, dan menjaga data tetap aman.',
    poin: ['Kelola pengguna & konfirmasi pendaftaran', 'Data siswa, guru, dan kelas', 'Backup data & audit log'],
    gambar_bawaan: 'admin',
  },
]

// Dipakai bila konten dari server gagal dimuat.
const KONTEN_CADANGAN = { ...KONTEN_KOSONG, fitur: MODUL_UNGGULAN, manfaat: MANFAAT_PERAN }

function PlatformManfaatPeran({ manfaat }) {
  const [aktif, setAktif] = useState(0)
  if (manfaat.length === 0) return null

  const m = manfaat[Math.min(aktif, manfaat.length - 1)]
  const gambar = m.gambar_url || GAMBAR_MANFAAT[m.gambar_bawaan]
  const adaTangkapanAsli = manfaat.some((x) => !x.gambar_url && GAMBAR_MANFAAT[x.gambar_bawaan])

  return (
    <section id="manfaat" className="bg-white py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl font-extrabold uppercase text-navy" style={FONT_JUDUL}>
          Manfaat untuk <span className="text-gold">Setiap Pengguna</span>
        </h2>
        <span className="block h-1 w-16 bg-navy mt-3 mb-8" />

        <div role="tablist" className="flex flex-wrap gap-2 mb-8">
          {manfaat.map((x, i) => (
            <button
              key={x.id ?? x.peran}
              role="tab"
              aria-selected={x === m}
              onClick={() => setAktif(i)}
              className={`px-5 py-2.5 text-sm font-bold uppercase tracking-wide transition-colors ${
                x === m ? 'bg-gold text-navy' : 'bg-emerald-50 text-navy hover:bg-emerald-100'
              }`}
              style={FONT_JUDUL}
            >
              {x.peran}
            </button>
          ))}
        </div>

        <div className={`grid gap-10 items-center ${gambar ? 'lg:grid-cols-[1fr_1.5fr]' : ''}`}>
          <div key={m.id ?? m.peran} className="animate-[muncul_0.4s_ease-out]">
            <h3 className="text-2xl font-extrabold text-slate-900" style={FONT_JUDUL}>{m.judul}</h3>
            <p className="text-slate-600 leading-relaxed mt-3">{m.teks}</p>
            <ul className="mt-5 space-y-2.5">
              {(m.poin || []).map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-slate-700">
                  <span className="h-5 w-5 bg-navy-light text-white flex items-center justify-center shrink-0 mt-0.5">
                    <CheckIcon className="h-3 w-3" />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* Bingkai jendela browser di sekitar tangkapan layar */}
          {gambar && (
            <figure className="shadow-xl shadow-navy/15 border border-slate-200 bg-white">
              <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 border-b border-slate-200">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="ml-3 text-[11px] text-slate-500">Tampilan {m.peran} · SIM Pendidikan</span>
              </div>
              <img src={gambar} alt={`Tangkapan layar aplikasi untuk ${m.peran}`} className="w-full h-auto block" loading="lazy" />
            </figure>
          )}
        </div>
        {adaTangkapanAsli && <p className="text-xs text-slate-400 mt-4">Tangkapan layar asli dari aplikasi (data sekolah demo).</p>}
      </div>
    </section>
  )
}

/** Testimoni asli dari Kelola Landing Page; bagian ini tidak tampil bila daftarnya kosong. */
function PlatformTestimoni({ testimoni }) {
  if (testimoni.length === 0) return null

  return (
    <section id="testimoni" className="bg-emerald-50/70 py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl font-extrabold uppercase text-navy" style={FONT_JUDUL}>
          Kata <span className="text-gold">Mereka</span>
        </h2>
        <span className="block h-1 w-16 bg-navy mt-3 mb-10" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimoni.map((t) => (
            <figure key={t.id} className="bg-white border-t-4 border-gold shadow-md shadow-navy/10 p-6 flex flex-col">
              <span className="text-5xl leading-none text-gold font-serif" aria-hidden="true">&ldquo;</span>
              <blockquote className="text-slate-700 leading-relaxed flex-1 -mt-2">{t.kutipan}</blockquote>
              <figcaption className="mt-5 pt-4 border-t border-slate-100">
                <p className="font-bold text-slate-900">{t.nama}</p>
                <p className="text-sm text-slate-500">{[t.jabatan, t.sekolah].filter(Boolean).join(' · ')}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

/** Hubungi Kami: form kemitraan yang membuka chat WhatsApp tim sales dengan pesan terisi. */
function PlatformKontak({ whatsapp }) {
  const [f, setF] = useState({ sekolah: '', nama: '', jabatan: '', hp: '', pesan: '' })
  if (!whatsapp) return null

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }))
  const kelasInput = 'w-full bg-white border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-navy-light'

  function kirim(e) {
    e.preventDefault()
    const pesan = [
      'Halo Tim SIM Pendidikan, kami tertarik bermitra.',
      `Sekolah/Lembaga: ${f.sekolah}`,
      `Nama: ${f.nama}${f.jabatan ? ` (${f.jabatan})` : ''}`,
      `No. HP: ${f.hp}`,
      f.pesan && `Pesan: ${f.pesan}`,
    ]
      .filter(Boolean)
      .join('\n')
    window.open(tautanWhatsApp(whatsapp, pesan), '_blank', 'noopener')
  }

  return (
    <section id="kontak" className="bg-white py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12">
        <div>
          <h2 className="text-3xl font-extrabold uppercase text-navy" style={FONT_JUDUL}>
            Hubungi <span className="text-gold">Kami</span>
          </h2>
          <span className="block h-1 w-16 bg-navy mt-3 mb-6" />
          <p className="text-slate-600 leading-relaxed">
            Ingin sekolah Anda bergabung atau menjadi mitra? Isi formulir permintaan kemitraan — pesan Anda langsung terkirim
            ke WhatsApp tim sales kami. Atau mulai chat sekarang.
          </p>
          <a
            href={tautanWhatsApp(whatsapp, 'Halo Tim SIM Pendidikan, saya ingin bertanya tentang SIM Pendidikan.')}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 mt-7 bg-[#25D366] hover:bg-[#1ebe5b] text-white text-sm font-bold uppercase tracking-wide px-6 py-3 rounded-sm shadow-md transition-colors"
          >
            <WhatsAppIcon className="h-5 w-5" />
            Chat WhatsApp Tim Sales
          </a>
        </div>

        <form onSubmit={kirim} className="bg-emerald-50/70 border-t-4 border-gold p-6 grid sm:grid-cols-2 gap-4">
          <p className="sm:col-span-2 font-bold uppercase text-navy" style={FONT_JUDUL}>Formulir Permintaan Kemitraan</p>
          <label className="sm:col-span-2 text-xs font-semibold text-slate-600">
            Nama Sekolah / Lembaga *
            <input required value={f.sekolah} onChange={set('sekolah')} className={`${kelasInput} mt-1`} maxLength={150} />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Nama Lengkap *
            <input required value={f.nama} onChange={set('nama')} className={`${kelasInput} mt-1`} maxLength={100} />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Jabatan
            <input value={f.jabatan} onChange={set('jabatan')} placeholder="mis. Kepala Sekolah" className={`${kelasInput} mt-1`} maxLength={100} />
          </label>
          <label className="sm:col-span-2 text-xs font-semibold text-slate-600">
            Nomor HP/WhatsApp *
            <input
              required
              inputMode="numeric"
              pattern="[0-9+ ]{9,16}"
              value={f.hp}
              onChange={set('hp')}
              placeholder="08xxxxxxxxxx"
              className={`${kelasInput} mt-1`}
            />
          </label>
          <label className="sm:col-span-2 text-xs font-semibold text-slate-600">
            Pesan
            <textarea value={f.pesan} onChange={set('pesan')} rows={3} className={`${kelasInput} mt-1 resize-none`} maxLength={500} />
          </label>
          <button
            type="submit"
            className="sm:col-span-2 justify-self-start inline-flex items-center gap-2 bg-gold hover:bg-gold-light text-navy text-sm font-bold uppercase tracking-wide px-6 py-3 rounded-sm transition-colors"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Kirim via WhatsApp
          </button>
        </form>
      </div>
    </section>
  )
}

function WhatsAppIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a9.9 9.9 0 0 0-8.5 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
    </svg>
  )
}

// Akun media sosial platform (tautannya diisi di Kelola Landing Page). Ikon
// tanpa url ditampilkan tetapi tidak bisa diklik (tidak mengarah ke akun palsu).
const SOSMED_PLATFORM = [
  { nama: 'X', kolom: 'sosmed_x', Icon: XIcon },
  { nama: 'Instagram', kolom: 'sosmed_instagram', Icon: InstagramIcon },
  { nama: 'Facebook', kolom: 'sosmed_facebook', Icon: FacebookIcon },
  { nama: 'YouTube', kolom: 'sosmed_youtube', Icon: YoutubeIcon },
]

function PlatformFooter({ pengaturan }) {
  return (
    <footer id="bantuan" className="bg-white pt-4">
      <div className="rounded-t-2xl bg-gradient-to-r from-navy-light via-emerald-700 to-navy text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div>
            <div className="flex items-center gap-5">
              <span className="h-20 w-20 rounded-full bg-white flex items-center justify-center shrink-0 shadow-md">
                <Logo className="h-12 w-12" />
              </span>
              <p className="text-xl sm:text-2xl font-bold leading-snug max-w-md" style={FONT_JUDUL}>
                SIM Pendidikan
                <br />
                Sistem Informasi Manajemen Pendidikan
              </p>
            </div>
            <p className="text-lg text-white/90 mt-5">Platform Multi-Sekolah Terpusat · Negeri &amp; Swasta</p>
          </div>

          <div className="flex flex-wrap lg:flex-nowrap items-center gap-x-6 gap-y-4 text-xl whitespace-nowrap shrink-0">
            <Link to="/login" className="hover:text-gold-light transition-colors">Masuk ke Sistem</Link>
            <span className="text-white/70" aria-hidden="true">|</span>
            <span>Ikuti kami</span>
            <div className="flex items-center gap-5 ml-2">
              {SOSMED_PLATFORM.map(({ nama, kolom, Icon }) => {
                const url = pengaturan[kolom]
                return url ? (
                  <a key={nama} href={url} target="_blank" rel="noreferrer" aria-label={nama} className="hover:text-gold-light transition-colors">
                    <Icon className="h-10 w-10" />
                  </a>
                ) : (
                  <span key={nama} title={`${nama} — tautan belum diatur`} aria-label={`${nama} (belum diatur)`} className="opacity-90">
                    <Icon className="h-10 w-10" />
                  </span>
                )
              })}
            </div>
          </div>
        </div>
        <FooterLegal p={pengaturan} />
      </div>
    </footer>
  )
}

/**
 * Baris paling bawah footer: info legal, alamat kantor, email resmi, telepon
 * dukungan, dan Kebijakan Privasi — dari Kelola Landing Page. Hanya isian yang
 * sudah diisi yang tampil; bila semuanya kosong, baris ini tidak ditampilkan.
 */
function FooterLegal({ p }) {
  const kontak = [
    p.alamat && { key: 'alamat', isi: p.alamat },
    p.email && { key: 'email', isi: <a href={`mailto:${p.email}`} className="hover:text-gold-light">{p.email}</a> },
    p.telepon && { key: 'telepon', isi: <a href={`tel:${p.telepon.replace(/[^\d+]/g, '')}`} className="hover:text-gold-light">{p.telepon}</a> },
  ].filter(Boolean)

  if (!p.nama_legal && !p.info_legal && kontak.length === 0 && !p.kebijakan_privasi_url) return null

  return (
    <div className="border-t border-white/15">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col lg:flex-row lg:items-start justify-between gap-4 text-sm text-white/80">
        <div>
          {p.nama_legal && (
            <p className="font-semibold text-white">
              © {new Date().getFullYear()} {p.nama_legal}
            </p>
          )}
          {p.info_legal && <p className="text-white/65 mt-0.5">{p.info_legal}</p>}
        </div>
        <ul className="flex flex-wrap gap-x-5 gap-y-1.5 lg:justify-end">
          {kontak.map((k) => (
            <li key={k.key}>{k.isi}</li>
          ))}
          {p.kebijakan_privasi_url && (
            <li>
              <a href={p.kebijakan_privasi_url} className="font-semibold underline underline-offset-2 hover:text-gold-light">
                Kebijakan Privasi
              </a>
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}

function XIcon(props) {
  return (
    <svg {...props} viewBox="0 0 40 40" fill="currentColor">
      <circle cx="20" cy="20" r="20" />
      <path d="M11.5 11h5.6l4.4 5.9 5-5.9h2.6l-6.4 7.5 7.8 10.5h-5.6l-4.8-6.4-5.5 6.4h-2.6l6.9-8.1L11.5 11Zm3.5 1.8 10.5 14.4h1.8L16.8 12.8H15Z" fill="#0b3d2e" />
    </svg>
  )
}

function InstagramIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17.6" cy="6.4" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

function FacebookIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a10 10 0 0 0-1.6 19.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0 0 12 2Z" />
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

function MonitorIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 4h18a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-7v2h3v2H7v-2h3v-2H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm1 2v9h16V6H4Z" />
    </svg>
  )
}

function HeadsetIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3a8 8 0 0 0-8 8v5a3 3 0 0 0 3 3h1v-7H6v-1a6 6 0 0 1 12 0v1h-2v7h1.9a2.5 2.5 0 0 1-2.4 2H13v2h2.5a4.5 4.5 0 0 0 4.4-3.6A3 3 0 0 0 20 16v-5a8 8 0 0 0-8-8Z" />
    </svg>
  )
}

function GridIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
    </svg>
  )
}

function ShieldIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2 4 5v6c0 5.3 3.4 10 8 11 4.6-1 8-5.7 8-11V5l-8-3Zm-1.2 14.2-3.5-3.5 1.4-1.4 2.1 2.1 4.6-4.6 1.4 1.4-6 6Z" />
    </svg>
  )
}

function UsersIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2 20c0-3.9 3.1-6.5 7-6.5s7 2.6 7 6.5H2Z" />
      <circle cx="17" cy="9" r="2.8" />
      <path d="M17.5 13.5c2.8.3 4.5 2.6 4.5 5.5h-4.2c-.1-2.1-.9-4-2.3-5.3.6-.1 1.3-.2 2-.2Z" />
    </svg>
  )
}

function ChevronIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 6 6 6-6 6" />
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

function CheckIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="m5 13 4 4L19 7" />
    </svg>
  )
}

function SekolahLanding() {
  const [profil, setProfil] = useState(null)
  const [pengumuman, setPengumuman] = useState(null)
  const [kegiatan, setKegiatan] = useState(null)
  const [prestasi, setPrestasi] = useState(null)
  const [ppdb, setPpdb] = useState(null)
  const [error, setError] = useState('')

  function loadProfil() {
    api.getProfil().then(setProfil).catch((err) => setError(err.message))
  }

  useEffect(() => {
    loadProfil()
    api.getPengumuman().then(setPengumuman).catch(() => {})
    api.getKegiatan().then(setKegiatan).catch(() => {})
    api.getPrestasiPublik().then(setPrestasi).catch(() => {})
    api.getPpdbPublik().then(setPpdb).catch(() => {})
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
      <Hero profil={profil} ppdb={ppdb} />
      <PpdbInfo ppdb={ppdb} profil={profil} />
      <About profil={profil} onProfilUpdated={loadProfil} />
      <Kegiatan kegiatan={kegiatan} />
      <Prestasi prestasi={prestasi} />
      <Pengumuman pengumuman={pengumuman} />
      <Kontak profil={profil} />
      <Footer profil={profil} ppdb={ppdb} />
    </div>
  )
}
