export default function Footer({ profil }) {
  const sosmed = profil?.sosial_media || {}

  return (
    <footer className="bg-gradient-to-b from-navy to-emerald-950 text-white/70 pt-14 pb-8">
      <div className="mx-auto max-w-7xl px-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <p className="text-white font-bold text-lg mb-2">{profil?.nama_sekolah || 'Nama Sekolah'}</p>
          <p className="text-sm">{profil?.jenjang}</p>
          {profil?.npsn && <p className="text-sm mt-1">NPSN: {profil.npsn}</p>}
          <div className="flex gap-3 mt-4">
            {sosmed.facebook && <SocialLink label="Facebook" />}
            {sosmed.instagram && <SocialLink label="Instagram" />}
            {sosmed.youtube && <SocialLink label="YouTube" />}
          </div>
        </div>

        <div>
          <p className="text-white font-semibold mb-3">Navigasi</p>
          <ul className="space-y-2 text-sm">
            <li><a href="#beranda" className="hover:text-gold">Beranda</a></li>
            <li><a href="#tentang" className="hover:text-gold">Tentang Kami</a></li>
            <li><a href="#kegiatan" className="hover:text-gold">Kegiatan</a></li>
            <li><a href="#pengumuman" className="hover:text-gold">Pengumuman</a></li>
          </ul>
        </div>

        <div>
          <p className="text-white font-semibold mb-3">Kontak</p>
          <ul className="space-y-2 text-sm">
            {profil?.alamat && <li>{profil.alamat}</li>}
            {profil?.telepon && <li>{profil.telepon}</li>}
            {profil?.email && <li>{profil.email}</li>}
          </ul>
        </div>

        <div>
          <p className="text-white font-semibold mb-3">Akses Sistem</p>
          <p className="text-sm mb-3">Portal untuk siswa, guru, dan staf sekolah.</p>
          <a
            href="/login"
            className="inline-block bg-gold hover:bg-gold-light text-navy font-semibold text-sm px-5 py-2.5 rounded-md"
          >
            Login Sistem
          </a>
        </div>
      </div>

      <div className="mt-12 pt-6 border-t border-white/10 text-center text-xs">
        © {new Date().getFullYear()} {profil?.nama_sekolah || 'Nama Sekolah'}. Seluruh hak cipta dilindungi.
      </div>
    </footer>
  )
}

function SocialLink({ label }) {
  return (
    <span className="h-8 w-8 flex items-center justify-center rounded-full bg-white/10 text-xs hover:bg-gold hover:text-navy transition-colors cursor-pointer">
      {label[0]}
    </span>
  )
}
