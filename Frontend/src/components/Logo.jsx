import { useId } from 'react'

// Ikon lambang SIM Pendidikan: buku terbuka + topi wisuda + siluet orang
// yang tumbuh dari buku, plus aksen swirl/daun kecil di kiri — meniru logo
// resmi SIM Pendidikan. useId() dipakai supaya id gradient tidak bentrok
// kalau komponen ini dirender lebih dari sekali di halaman yang sama.
export default function Logo({ className = 'h-8 w-8' }) {
  const uid = useId()
  const gBook1 = `logo-book1-${uid}`
  const gBook2 = `logo-book2-${uid}`
  const gLeaf1 = `logo-leaf1-${uid}`
  const gLeaf2 = `logo-leaf2-${uid}`
  const gSwirl = `logo-swirl-${uid}`

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
        <linearGradient id={gLeaf1} x1="50" y1="52" x2="24" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1f9d63" />
          <stop offset="1" stopColor="#6fe0a8" />
        </linearGradient>
        <linearGradient id={gLeaf2} x1="50" y1="52" x2="76" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0e7a52" />
          <stop offset="1" stopColor="#3fbf8f" />
        </linearGradient>
        <linearGradient id={gSwirl} x1="26" y1="62" x2="4" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3fbf8f" />
          <stop offset="1" stopColor="#8be8bd" />
        </linearGradient>
      </defs>

      {/* aksen swirl/daun kiri */}
      <path d="M27 63Q13 61 9 50Q6 42 12 37Q9 46 14 53Q18 59 27 63Z" fill={`url(#${gSwirl})`} />
      <circle cx="9" cy="33" r="3.4" fill="#8be8bd" />

      {/* buku terbuka */}
      <path d="M50 47 L15 57 Q11 59 15 63 L48 73 L50 73 Z" fill={`url(#${gBook1})`} />
      <path d="M50 47 L85 57 Q89 59 85 63 L52 73 L50 73 Z" fill={`url(#${gBook2})`} />

      {/* siluet orang / daun yang tumbuh dari buku */}
      <path d="M50 51 Q32 48 26 29 Q46 35 50 51 Z" fill={`url(#${gLeaf1})`} />
      <path d="M50 51 Q68 48 74 29 Q54 35 50 51 Z" fill={`url(#${gLeaf2})`} />
      <path d="M45.5 49 L54.5 49 L50 58 Z" fill="#0b3d2e" />
      <circle cx="50" cy="35" r="7.5" fill="#0b3d2e" />

      {/* topi wisuda */}
      <path d="M50 15 L70 23 L50 31 L30 23 Z" fill="#0b3d2e" />
      <rect x="42" y="23" width="16" height="7" rx="1.5" fill="#0b3d2e" />
      <path d="M66 22 Q71 29 65 36" stroke="#e3a13c" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <circle cx="65" cy="37" r="2.3" fill="#e3a13c" />
    </svg>
  )
}
