// Elemen visual bersama untuk halaman auth (Login, Register, Lupa Password)
// supaya satu tema desain konsisten di semua halaman tersebut.

import LogoStacked from './LogoStacked'

// Panel hero (kiri/kanan) yang dipakai di semua halaman auth: logo, judul,
// badge fitur, dan ilustrasi gedung. Disatukan di sini supaya susunan
// jarak vertikalnya konsisten dan tidak dobel-dobel diatur per halaman.
export function AuthHeroPanel({ titleLine1, titleLine2, description, className = '' }) {
  return (
    <div
      className={`relative bg-gradient-to-br from-emerald-500 via-emerald-700 to-navy text-white p-8 sm:p-10 flex flex-col overflow-hidden ${className}`}
    >
      <SparkleIcon className="pointer-events-none absolute top-8 right-10 h-4 w-4 text-gold-light/70" />
      <SparkleIcon className="pointer-events-none absolute top-20 right-24 h-2.5 w-2.5 text-white/40" />

      <LogoStacked />

      <div className="mt-8">
        <h2 className="text-3xl font-extrabold leading-tight mb-3">
          {titleLine1}
          <br />
          <span className="text-emerald-300">{titleLine2}</span>
        </h2>
        <p className="text-white/70 text-sm leading-relaxed max-w-xs">{description}</p>

        <AuthFeatureRow />
      </div>

      <div className="relative -mx-8 sm:-mx-10 -mb-8 sm:-mb-10 mt-auto pt-8">
        <BuildingIllustration className="w-full h-auto" />
      </div>
    </div>
  )
}

export function WavyBackground(props) {
  return (
    <svg {...props} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" fill="none">
      <defs>
        <linearGradient id="wbg1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a7f3d0" />
          <stop offset="100%" stopColor="#d1fae5" />
        </linearGradient>
        <linearGradient id="wbg2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
        <linearGradient id="wbg3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#14a673" />
          <stop offset="100%" stopColor="#0b3d2e" />
        </linearGradient>
      </defs>
      <rect width="1440" height="900" fill="#ecfdf5" />
      <path
        d="M0 120 C 240 40, 480 200, 760 120 S 1300 20, 1440 140 L1440 0 L0 0 Z"
        fill="url(#wbg1)"
        opacity="0.6"
      />
      <path
        d="M0 900 C 300 760, 620 900, 900 760 S 1250 640, 1440 760 L1440 900 L0 900 Z"
        fill="url(#wbg2)"
        opacity="0.5"
      />
      <path d="M900 900 C 1050 700, 1250 760, 1440 620 L1440 900 Z" fill="url(#wbg3)" opacity="0.45" />
      <path
        d="M0 500 C 200 420, 420 560, 640 480 S 1000 380, 1200 480 L1200 900 L0 900 Z"
        fill="url(#wbg2)"
        opacity="0.25"
      />
    </svg>
  )
}

export function BuildingIllustration(props) {
  return (
    <svg {...props} viewBox="0 0 400 150" fill="none" preserveAspectRatio="xMidYMax slice">
      <circle cx="88" cy="32" r="20" fill="#f0c078" fillOpacity="0.15" />
      <circle cx="88" cy="32" r="12" fill="#f0c078" fillOpacity="0.5" />

      <rect x="0" y="128" width="400" height="22" fill="white" fillOpacity="0.07" />
      <rect x="0" y="128" width="400" height="2" fill="white" fillOpacity="0.15" />

      <g opacity="0.55">
        <rect x="47" y="92" width="6" height="36" fill="white" fillOpacity="0.3" />
        <circle cx="42" cy="76" r="10" fill="#6ee7b7" fillOpacity="0.4" />
        <circle cx="52" cy="80" r="16" fill="#6ee7b7" fillOpacity="0.5" />
      </g>
      <g opacity="0.55">
        <rect x="347" y="92" width="6" height="36" fill="white" fillOpacity="0.3" />
        <circle cx="352" cy="76" r="10" fill="#6ee7b7" fillOpacity="0.4" />
        <circle cx="342" cy="80" r="16" fill="#6ee7b7" fillOpacity="0.5" />
      </g>

      <path d="M200 2v12" stroke="white" strokeOpacity="0.5" strokeWidth="2" />
      <path d="M200 2 214 7 200 12Z" fill="#f0c078" fillOpacity="0.85" />

      <polygon points="150,46 200,14 250,46" fill="#a7f3d0" fillOpacity="0.6" />
      <rect x="150" y="46" width="100" height="62" rx="2" fill="white" fillOpacity="0.16" stroke="white" strokeOpacity="0.25" />

      <rect x="164" y="58" width="20" height="16" rx="1" fill="#fcd34d" fillOpacity="0.6" />
      <rect x="216" y="58" width="20" height="16" rx="1" fill="#7dd3fc" fillOpacity="0.6" />
      <rect x="164" y="80" width="20" height="16" rx="1" fill="#7dd3fc" fillOpacity="0.6" />
      <rect x="216" y="80" width="20" height="16" rx="1" fill="#fcd34d" fillOpacity="0.6" />

      <rect x="190" y="88" width="20" height="20" rx="1" fill="white" fillOpacity="0.3" />
    </svg>
  )
}

export function AuthFeatureRow() {
  return (
    <div className="mt-6 flex items-center gap-6">
      <Feature icon={<CheckIcon className="h-5 w-5" />} label={['Aman', 'dan Terpercaya']} />
      <Feature icon={<BoltIcon className="h-5 w-5" />} label={['Cepat', 'dan Mudah']} />
      <Feature icon={<UsersIcon className="h-5 w-5" />} label={['Untuk', 'Semua Stakeholder']} />
    </div>
  )
}

export function SparkleIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z" />
    </svg>
  )
}

function Feature({ icon, label }) {
  return (
    <div className="flex flex-col items-center text-center gap-1.5 w-16">
      <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-emerald-300">
        {icon}
      </div>
      <p className="text-[10px] leading-tight">
        <span className="block font-semibold text-white">{label[0]}</span>
        <span className="block text-white/60">{label[1]}</span>
      </p>
    </div>
  )
}

export function AuthTagline() {
  return (
    <div className="flex items-start justify-end gap-1.5 text-emerald-700 text-xs font-medium text-right mb-4">
      <LeafIcon className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
      <span>
        Teman Digital untuk
        <br />
        Perjalanan Belajarmu
      </span>
    </div>
  )
}

export function LeafIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 20A7 7 0 0 1 4 13c0-5 5-10 12-11 1 7-4 12-9 12" />
      <path d="M4 13c3 0 6 1 8 3" />
    </svg>
  )
}

export function MailIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2 6 10 7 10-7" />
    </svg>
  )
}

export function LockIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

export function AlertIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </svg>
  )
}

export function ArrowRightIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}

export function CheckIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.5 2.5L16 9.5" />
    </svg>
  )
}

export function BoltIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />
    </svg>
  )
}

export function UsersIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" />
      <path d="M16 4.5c1.7.3 3 1.8 3 3.5s-1.3 3.2-3 3.5" />
      <path d="M18.5 13.7c2 .7 3.5 2.8 3.5 6.3" />
    </svg>
  )
}
