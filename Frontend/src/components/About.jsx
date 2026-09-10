import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import EditProfilModal from './EditProfilModal'

export default function About({ profil, onProfilUpdated }) {
  const { hasPermission } = useAuth()
  const [editing, setEditing] = useState(false)
  const canEdit = hasPermission('humas.informasi')

  return (
    <section id="tentang" className="bg-neutral-50 py-20">
      <div className="mx-auto max-w-7xl px-4 grid lg:grid-cols-2 gap-12 items-start">
        <div>
          <p className="text-gold font-semibold text-sm tracking-wide mb-2">TENTANG KAMI</p>
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-3xl font-extrabold text-navy mb-4">
              Visi &amp; Misi <span className="text-gold">Sekolah</span>
            </h2>
            {canEdit && (
              <button
                onClick={() => setEditing(true)}
                className="shrink-0 text-xs font-semibold text-navy border border-navy/20 rounded-md px-3 py-1.5 hover:bg-navy hover:text-white transition-colors"
              >
                ✎ Edit
              </button>
            )}
          </div>

          <div className="space-y-4 text-navy/70">
            <p>
              <span className="font-semibold text-navy">Visi: </span>
              {profil?.visi || 'Belum diisi.'}
            </p>
            <p>
              <span className="font-semibold text-navy">Misi: </span>
              {profil?.misi || 'Belum diisi.'}
            </p>
          </div>

          {profil?.sambutan_kepala_sekolah && (
            <blockquote className="mt-6 border-l-4 border-gold pl-4 italic text-navy/70">
              “{profil.sambutan_kepala_sekolah}”
              <footer className="mt-2 not-italic font-semibold text-navy text-sm">— Kepala Sekolah</footer>
            </blockquote>
          )}
        </div>

        <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-navy via-emerald-700 to-navy-light aspect-4/3 shadow-xl shadow-emerald-900/20">
          {profil?.hero_image && (
            <img src={profil.hero_image} alt="Sekolah" className="h-full w-full object-cover" />
          )}
        </div>
      </div>

      {editing && (
        <EditProfilModal
          profil={profil}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false)
            onProfilUpdated()
          }}
        />
      )}
    </section>
  )
}
