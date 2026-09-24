import Logo from './Logo'
import LogoWordmark from './LogoWordmark'

// Logo penuh (ikon + wordmark + tagline) tersusun vertikal, dipakai di
// halaman besar (login, daftar, lupa password) yang punya cukup ruang —
// meniru komposisi logo resmi SIM Pendidikan.
export default function LogoStacked({ className = '' }) {
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <div className="h-16 w-16 rounded-full bg-white ring-2 ring-white/30 flex items-center justify-center mb-3 shrink-0">
        <Logo className="h-10 w-10" />
      </div>
      <LogoWordmark stacked size="text-xl" className="text-white" />
      <p className="flex items-center gap-2 text-white/60 text-[10px] tracking-wide mt-1.5">
        <span className="h-px w-4 bg-white/40" />
        Sistem Informasi Manajemen Pendidikan
        <span className="h-px w-4 bg-white/40" />
      </p>
    </div>
  )
}
