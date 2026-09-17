import { useAuth } from '../lib/AuthContext'

export default function LogoutConfirmModal({ onConfirm, onClose }) {
  const { user } = useAuth()
  const roleName = user?.roles?.[0]?.name || 'Anda'

  return (
    <div className="fixed inset-0 bg-navy/50 flex items-center justify-center z-50 p-4">
      <div className="relative bg-white rounded-3xl max-w-sm w-full p-7 text-center shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-navy/30 hover:text-navy/60 transition-colors"
          aria-label="Tutup"
        >
          <CloseIcon className="h-5 w-5" />
        </button>

        <DoorIllustration className="h-32 w-auto mx-auto mb-4" />

        <h2 className="text-lg font-extrabold text-navy mb-2">Keluar dari Akun?</h2>
        <p className="text-sm text-navy/50 mb-6 leading-relaxed">
          Apakah kamu yakin ingin keluar dari akun {roleName}? Kamu harus login kembali untuk mengakses sistem.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-navy-light text-navy-light font-bold py-2.5 rounded-full hover:bg-navy-light/5 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-navy hover:bg-navy/90 text-white font-bold py-2.5 rounded-full transition-colors"
          >
            <LogoutDoorIcon className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

function DoorIllustration({ className }) {
  return (
    <svg viewBox="0 0 200 170" className={className} aria-hidden="true">
      <ellipse cx="100" cy="95" rx="85" ry="68" fill="#eef6f0" />
      <path
        d="M40 130 Q18 92 54 54 Q90 18 140 34 Q176 47 165 90 Q155 131 109 146 Q64 159 40 130Z"
        fill="#e3f0e6"
        opacity="0.7"
      />

      <g>
        <path d="M32 138 L58 138 L54 112 Q45 106 36 112 Z" fill="#fdfdfb" stroke="#dfe6e0" strokeWidth="1.5" />
        <path d="M45 112 Q33 90 21 98" stroke="#2f8f5f" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M45 112 Q45 86 57 92" stroke="#3fbf8f" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M45 112 Q49 82 39 78" stroke="#1f7a4f" strokeWidth="5" strokeLinecap="round" fill="none" />
      </g>

      <rect x="78" y="28" width="64" height="112" rx="6" fill="#bfe3cd" />
      <path d="M84 34 L128 40 L128 128 L84 134 Z" fill="#2f8f5f" />
      <circle cx="119" cy="86" r="3" fill="#eaf6ee" />
      <path
        d="M96 84 H124 M114 74 L126 84 L114 94"
        stroke="#ffffff"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      <path d="M150 40 L162 32" stroke="#1f7a4f" strokeWidth="4" strokeLinecap="round" />
      <path d="M157 55 L171 51" stroke="#1f7a4f" strokeWidth="4" strokeLinecap="round" />
      <path d="M151 68 L164 70" stroke="#1f7a4f" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

function LogoutDoorIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  )
}

function CloseIcon({ strokeWidth = 2, ...props }) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}
