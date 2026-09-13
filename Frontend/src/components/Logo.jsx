import { useId } from 'react'

// Ikon lambang SIM Pendidikan: buku terbuka + topi wisuda + siluet orang
// yang tumbuh dari buku, plus aksen kotak kecil ala data/teknologi di
// kanan atas. useId() dipakai supaya id gradient tidak bentrok kalau
// komponen ini dirender lebih dari sekali di halaman yang sama.
export default function Logo({ className = 'h-8 w-8' }) {
  const uid = useId()
  const gBook1 = `logo-book1-${uid}`
  const gBook2 = `logo-book2-${uid}`
  const gLeaf1 = `logo-leaf1-${uid}`
  const gLeaf2 = `logo-leaf2-${uid}`

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gBook1} x1="50" y1="46" x2="15" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0b3d2e" />
          <stop offset="1" stopColor="#3fbf8f" />
        </linearGradient>
        <linearGradient id={gBook2} x1="50" y1="46" x2="85" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0b3d2e" />
          <stop offset="1" stopColor="#14a673" />
        </linearGradient>
        <linearGradient id={gLeaf1} x1="50" y1="50" x2="26" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0b3d2e" />
          <stop offset="1" stopColor="#5ecf9c" />
        </linearGradient>
        <linearGradient id={gLeaf2} x1="50" y1="50" x2="74" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0b3d2e" />
          <stop offset="1" stopColor="#14a673" />
        </linearGradient>
      </defs>

      {/* aksen kotak kanan atas */}
      <rect x="74" y="9" width="12" height="12" rx="2.5" fill="#14a673" />
      <rect x="87" y="20" width="8" height="8" rx="1.5" fill="#e3a13c" />
      <rect x="76" y="25" width="6" height="6" rx="1.5" fill="#0b3d2e" />

      {/* buku terbuka */}
      <path d="M50 47 L15 57 Q11 59 15 63 L48 73 L50 73 Z" fill={`url(#${gBook1})`} />
      <path d="M50 47 L85 57 Q89 59 85 63 L52 73 L50 73 Z" fill={`url(#${gBook2})`} />

      {/* siluet orang / daun yang tumbuh dari buku */}
      <path d="M50 51 Q33 47 27 30 Q46 36 50 51 Z" fill={`url(#${gLeaf1})`} />
      <path d="M50 51 Q67 47 73 30 Q54 36 50 51 Z" fill={`url(#${gLeaf2})`} />
      <path d="M45.5 49 L54.5 49 L50 58 Z" fill="#0b3d2e" />
      <circle cx="50" cy="35" r="7.5" fill="#0b3d2e" />

      {/* topi wisuda */}
      <path d="M50 17 L69 24.5 L50 32 L31 24.5 Z" fill="#0b3d2e" />
      <rect x="42.5" y="24.5" width="15" height="6.5" rx="1.5" fill="#0b3d2e" />
      <path d="M65 23.5 Q69.5 30 64 36.5" stroke="#e3a13c" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <circle cx="64" cy="37.5" r="2.3" fill="#e3a13c" />
    </svg>
  )
}
