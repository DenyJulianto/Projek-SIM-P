import { useId } from 'react'

// Ilustrasi bust siswa gaya flat/geometris, dipakai di banner sapaan
// dashboard siswa. Bentuk rambut berbeda untuk Laki-laki ('L') vs
// Perempuan ('P') — sisanya (wajah, seragam) sama supaya konsisten.
export default function StudentIllustration({ gender = 'P', className = 'h-32 w-32' }) {
  const uid = useId()
  const gSkin = `student-skin-${uid}`
  const gHair = `student-hair-${uid}`
  const gUniform = `student-uniform-${uid}`
  const isMale = gender === 'L'

  return (
    <svg viewBox="0 0 160 160" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gSkin} x1="50" y1="45" x2="112" y2="105" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f7cda3" />
          <stop offset="1" stopColor="#eab784" />
        </linearGradient>
        <linearGradient id={gHair} x1="40" y1="30" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5a4634" />
          <stop offset="1" stopColor="#3a2c20" />
        </linearGradient>
        <linearGradient id={gUniform} x1="30" y1="110" x2="130" y2="160" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#14a673" />
          <stop offset="1" stopColor="#0b3d2e" />
        </linearGradient>
      </defs>

      {/* bahu / seragam */}
      <path d="M80 96c-28 0-46 16-46 40v22h92v-22c0-24-18-40-46-40Z" fill={`url(#${gUniform})`} />
      {/* kerah putih */}
      <path d="M64 108 80 132 96 108 88 100h-16Z" fill="#ffffff" />
      {/* dasi kecil */}
      <path d="M80 118 86 130 80 150 74 130Z" fill="#e3a13c" />

      {/* rambut belakang (perempuan: kepang panjang) */}
      {!isMale && (
        <path
          d="M40 66c0 30-2 55 8 66 4-14 4-34 4-48Zm80 0c0 30 2 55-8 66-4-14-4-34-4-48Z"
          fill={`url(#${gHair})`}
        />
      )}

      {/* leher */}
      <rect x="70" y="90" width="20" height="18" rx="6" fill={`url(#${gSkin})`} />

      {/* kepala */}
      <circle cx="80" cy="66" r="34" fill={`url(#${gSkin})`} />

      {/* telinga */}
      <circle cx="46" cy="68" r="6" fill={`url(#${gSkin})`} />
      <circle cx="114" cy="68" r="6" fill={`url(#${gSkin})`} />

      {/* wajah: mata + senyum */}
      <circle cx="68" cy="66" r="3" fill="#0b3d2e" />
      <circle cx="92" cy="66" r="3" fill="#0b3d2e" />
      <path d="M68 80c5 5 19 5 24 0" stroke="#0b3d2e" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="58" cy="76" r="5" fill="#f0918f" opacity="0.5" />
      <circle cx="102" cy="76" r="5" fill="#f0918f" opacity="0.5" />

      {/* rambut depan + bentuk kepala rambut */}
      {isMale ? (
        <path
          d="M46 60c0-20 15-32 34-32s34 12 34 32c-6-6-14-9-20-6-4-8-14-11-22-8-9 3-14 8-16 14-4-1-8 0-10 0Z"
          fill={`url(#${gHair})`}
        />
      ) : (
        <>
          <path
            d="M44 62c-2-24 14-38 36-38s38 14 36 38c-8-10-20-14-24-8-6-10-18-13-26-8-8 5-12 10-13 18-3-1-7 0-9-2Z"
            fill={`url(#${gHair})`}
          />
          <path d="M40 60c0 14 1 30 8 40 2-12 2-26 0-38Zm80 0c0 14-1 30-8 40-2-12-2-26 0-38Z" fill={`url(#${gHair})`} />
        </>
      )}

      {/* topi wisuda kecil sebagai aksen pelajar */}
      <path d="M80 26 100 34 80 42 60 34Z" fill="#0b3d2e" />
      <rect x="73" y="34" width="14" height="6" rx="1.5" fill="#0b3d2e" />
      <path d="M96 33 100 34 99 44" stroke="#e3a13c" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="99" cy="45" r="2" fill="#e3a13c" />
    </svg>
  )
}
