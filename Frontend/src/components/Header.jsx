const NAV_ITEMS = [
  { label: 'Beranda', href: '#beranda' },
  { label: 'Tentang Kami', href: '#tentang' },
  { label: 'Kegiatan', href: '#kegiatan' },
  { label: 'Prestasi', href: '#prestasi' },
  { label: 'Pengumuman', href: '#pengumuman' },
  { label: 'Kontak', href: '#kontak' },
]

import { EditableImage, EditableText, useLandingEdit } from './landing/LandingEdit'

export default function Header({ profil }) {
  const editing = !!useLandingEdit()

  return (
    <header className={`bg-white shadow-sm z-40 ${editing ? 'relative' : 'sticky top-0'}`}>
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <EditableImage field="logo" compact className="h-11 w-11 rounded-full shrink-0">
            {profil?.logo ? (
              <img src={profil.logo} alt="Logo" className="h-11 w-11 rounded-full object-cover" />
            ) : (
              <div className="h-11 w-11 rounded-full bg-gradient-to-br from-navy to-navy-light text-white flex items-center justify-center font-bold text-lg">
                {profil?.nama_sekolah?.[0] || 'S'}
              </div>
            )}
          </EditableImage>
          <div>
            <p className="font-bold text-navy leading-tight">
              <EditableText
                field="nama_sekolah"
                value={profil?.nama_sekolah || 'Nama Sekolah'}
                placeholder="Nama sekolah"
              />
            </p>
            <p className="text-[11px] uppercase tracking-wide text-gold font-semibold">
              <EditableText
                field="jenjang"
                value={profil?.jenjang || 'Sistem Informasi Manajemen Pendidikan'}
                placeholder="Jenjang"
              />
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
