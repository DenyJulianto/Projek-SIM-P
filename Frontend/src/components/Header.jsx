const NAV_ITEMS = [
  { label: 'Beranda', href: '#beranda' },
  { label: 'Tentang Kami', href: '#tentang' },
  { label: 'Kegiatan', href: '#kegiatan' },
  { label: 'Pengumuman', href: '#pengumuman' },
  { label: 'Kontak', href: '#kontak' },
]

export default function Header({ profil }) {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {profil?.logo ? (
            <img src={profil.logo} alt="Logo" className="h-11 w-11 rounded-full object-cover" />
          ) : (
            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-navy to-navy-light text-white flex items-center justify-center font-bold text-lg">
              {profil?.nama_sekolah?.[0] || 'S'}
            </div>
          )}
          <div>
            <p className="font-bold text-navy leading-tight">{profil?.nama_sekolah || 'Nama Sekolah'}</p>
            <p className="text-[11px] uppercase tracking-wide text-gold font-semibold">
              {profil?.jenjang || 'Sistem Informasi Manajemen Pendidikan'}
            </p>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-navy/80">
          {NAV_ITEMS.map((item) => (
            <a key={item.href} href={item.href} className="hover:text-gold transition-colors">
              {item.label}
            </a>
          ))}
        </nav>

        <a
          href="#kontak"
          className="hidden sm:inline-block bg-gold hover:bg-gold-light text-navy font-semibold text-sm px-5 py-2.5 rounded-md transition-colors"
        >
          Hubungi Kami
        </a>
      </div>
    </header>
  )
}
