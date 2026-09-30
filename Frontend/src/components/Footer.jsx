import { IS_CENTRAL_DOMAIN, SUPER_ADMIN_URL } from '../lib/api'

import { EditableText, useLandingEdit } from './landing/LandingEdit'

export default function Footer({ profil, ppdb }) {
  const sosmed = profil?.sosial_media || {}
  const editing = !!useLandingEdit()

  return (
    <footer className="bg-gradient-to-b from-navy to-emerald-950 text-white/70 pt-14 pb-8">
      <div className="mx-auto max-w-7xl px-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <p className="text-white font-bold text-lg mb-2">{profil?.nama_sekolah || 'Nama Sekolah'}</p>
          <p className="text-sm">{profil?.jenjang}</p>
          {profil?.npsn && <p className="text-sm mt-1">NPSN: {profil.npsn}</p>}
          {editing ? (
            <div className="mt-4 space-y-2 text-xs">
              {[
                ['facebook', 'Facebook'],
                ['instagram', 'Instagram'],
                ['youtube', 'YouTube'],
              ].map(([field, label]) => (
                <p key={field} className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-white/60">{label}</span>
                  <EditableText field={field} placeholder={`Link ${label}`} className="w-full" />
                </p>
              ))}
            </div>
          ) : (
            <div className="flex gap-3 mt-4">
              {sosmed.facebook && <SocialLink label="Facebook" url={sosmed.facebook} />}
              {sosmed.instagram && <SocialLink label="Instagram" url={sosmed.instagram} />}
              {sosmed.youtube && <SocialLink label="YouTube" url={sosmed.youtube} />}
            </div>
          )}
        </div>

        <div>
          <p className="text-white font-semibold mb-3">Navigasi</p>
          <ul className="space-y-2 text-sm">
            <li><a href="#beranda" className="hover:text-gold">Beranda</a></li>
            {ppdb?.nama && <li><a href="#ppdb" className="hover:text-gold">PPDB</a></li>}
            <li><a href="#tentang" className="hover:text-gold">Tentang Kami</a></li>
            <li><a href="#kegiatan" className="hover:text-gold">Kegiatan</a></li>
            <li><a href="#prestasi" className="hover:text-gold">Prestasi</a></li>
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

      <div className="mt-12 pt-6 border-t border-white/10 text-center text-xs flex flex-col items-center gap-2">
        <p>
          © {new Date().getFullYear()} {profil?.nama_sekolah || 'Nama Sekolah'}. Seluruh hak cipta dilindungi.
        </p>
        {!IS_CENTRAL_DOMAIN && (
          <a href={SUPER_ADMIN_URL} className="text-white/40 hover:text-white/70">
            Portal Super Admin
          </a>
        )}
      </div>
    </footer>
  )
}

function SocialLink({ label, url }) {
  const href = /^https?:\/\//i.test(url) ? url : `https://${url}`
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title={label}
      className="h-8 w-8 flex items-center justify-center rounded-full bg-white/10 text-xs hover:bg-gold hover:text-navy transition-colors"
    >
      {label[0]}
    </a>
  )
}
