import { useState } from 'react'

export default function PasswordInput({ className = '', leftIcon = null, ...props }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      {leftIcon && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-light">
          {leftIcon}
        </span>
      )}
      <input
        type={visible ? 'text' : 'password'}
        className={`w-full bg-emerald-50 rounded-full py-3 pr-12 ${leftIcon ? 'pl-11' : 'pl-5'} text-sm text-navy placeholder-navy/40 focus:outline-none focus:ring-2 focus:ring-navy-light/50 ${className}`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-navy/40 hover:text-navy transition-colors"
      >
        {visible ? <EyeOffIcon className="h-4.5 w-4.5" /> : <EyeIcon className="h-4.5 w-4.5" />}
      </button>
    </div>
  )
}

function EyeIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.3 20.3 0 0 1 5.06-6.06M9.9 4.24A10.4 10.4 0 0 1 12 4c7 0 11 8 11 8a20.3 20.3 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <path d="M1 1l22 22" />
    </svg>
  )
}
