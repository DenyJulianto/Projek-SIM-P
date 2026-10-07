import heroSekolah from '../assets/hero-sekolah.jpg'

/** Gambar kartu: foto sekolah atau cuplikan dasbor sederhana (tanpa data rekaan). */
export default function IlustrasiFitur({ jenis }) {
  if (jenis === 'foto') {
    return <img src={heroSekolah} alt="" className="h-44 w-full object-cover" />
  }

  return (
    <div className="h-44 bg-gradient-to-br from-emerald-100 via-emerald-50 to-teal-100 p-5 overflow-hidden">
      {jenis === 'grafik' && (
        <div className="h-full flex items-end gap-2">
          {[45, 70, 55, 85, 65, 95, 75].map((t, i) => (
            <span key={i} className="flex-1 rounded-t bg-navy-light/70" style={{ height: `${t}%` }} />
          ))}
        </div>
      )}
      {jenis === 'tabel' && (
        <div className="space-y-2.5 pt-2">
          <span className="block h-3.5 w-2/5 rounded bg-navy-light/60" />
          {[90, 75, 85, 60, 70].map((w, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-navy-light/50 shrink-0" />
              <span className="h-2.5 rounded bg-white/90" style={{ width: `${w}%` }} />
            </span>
          ))}
        </div>
      )}
      {jenis === 'pengguna' && (
        <div className="h-full grid grid-cols-3 gap-3 content-center">
          {['bg-navy-light', 'bg-emerald-400', 'bg-teal-500', 'bg-emerald-600', 'bg-teal-400', 'bg-navy-light/70'].map((w, i) => (
            <span key={i} className="flex flex-col items-center gap-1.5">
              <span className={`h-8 w-8 rounded-full ${w}`} />
              <span className="h-2 w-10 rounded bg-white/90" />
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
