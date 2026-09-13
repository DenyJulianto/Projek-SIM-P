export default function SuperAdminHeroIllustration(props) {
  return (
    <svg viewBox="0 0 600 440" fill="none" {...props}>
      {/* background blobs */}
      <circle cx="430" cy="190" r="180" fill="#0b3d2e" fillOpacity="0.06" />
      <circle cx="120" cy="90" r="90" fill="#14a673" fillOpacity="0.08" />

      {/* window */}
      <rect x="40" y="30" width="150" height="190" rx="8" fill="#14a673" fillOpacity="0.1" />
      <line x1="115" y1="30" x2="115" y2="220" stroke="#0b3d2e" strokeOpacity="0.12" strokeWidth="3" />
      <line x1="40" y1="125" x2="190" y2="125" stroke="#0b3d2e" strokeOpacity="0.12" strokeWidth="3" />

      {/* shelf, right */}
      <rect x="520" y="120" width="56" height="230" rx="6" fill="#14a673" fillOpacity="0.1" />
      <line x1="520" y1="210" x2="576" y2="210" stroke="#0b3d2e" strokeOpacity="0.15" strokeWidth="3" />
      <line x1="520" y1="280" x2="576" y2="280" stroke="#0b3d2e" strokeOpacity="0.15" strokeWidth="3" />
      <rect x="528" y="182" width="10" height="26" rx="1.5" fill="#e3a13c" />
      <rect x="541" y="178" width="10" height="30" rx="1.5" fill="#0b3d2e" />
      <rect x="554" y="185" width="10" height="23" rx="1.5" fill="#14a673" />
      <rect x="528" y="252" width="10" height="26" rx="1.5" fill="#0b3d2e" />
      <rect x="541" y="248" width="10" height="30" rx="1.5" fill="#e3a13c" />
      <rect x="554" y="255" width="10" height="23" rx="1.5" fill="#14a673" />

      {/* desk */}
      <rect x="55" y="352" width="470" height="16" rx="6" fill="#0b3d2e" />
      <rect x="70" y="368" width="14" height="46" fill="#0b3d2e" fillOpacity="0.5" />
      <rect x="490" y="368" width="14" height="46" fill="#0b3d2e" fillOpacity="0.5" />

      {/* plant */}
      <path d="M150 352 L190 352 L184 320 L156 320 Z" fill="#0b3d2e" />
      <ellipse cx="170" cy="300" rx="9" ry="24" fill="#14a673" transform="rotate(-18 170 300)" />
      <ellipse cx="170" cy="300" rx="9" ry="24" fill="#14a673" transform="rotate(18 170 300)" />
      <ellipse cx="170" cy="292" rx="9" ry="26" fill="#0b3d2e" fillOpacity="0.8" />

      {/* monitor stand */}
      <ellipse cx="330" cy="352" rx="46" ry="7" fill="#0b3d2e" fillOpacity="0.15" />
      <rect x="322" y="330" width="16" height="24" fill="#0b3d2e" />

      {/* monitor */}
      <rect x="222" y="150" width="216" height="150" rx="12" fill="#0b3d2e" />
      <rect x="234" y="162" width="192" height="126" rx="4" fill="#ffffff" />

      {/* sidebar inside screen */}
      <rect x="234" y="162" width="36" height="126" rx="4" fill="#14a673" />
      <circle cx="252" cy="180" r="5" fill="#ffffff" fillOpacity="0.9" />
      <circle cx="252" cy="198" r="5" fill="#ffffff" fillOpacity="0.5" />
      <circle cx="252" cy="216" r="5" fill="#ffffff" fillOpacity="0.5" />
      <circle cx="252" cy="234" r="5" fill="#ffffff" fillOpacity="0.5" />

      {/* header bar */}
      <rect x="282" y="172" width="132" height="10" rx="3" fill="#0b3d2e" fillOpacity="0.15" />

      {/* stat cards */}
      <rect x="282" y="192" width="60" height="42" rx="6" fill="#14a673" fillOpacity="0.12" />
      <circle cx="296" cy="206" r="7" fill="#0b3d2e" fillOpacity="0.5" />
      <rect x="288" y="218" width="36" height="6" rx="2" fill="#0b3d2e" fillOpacity="0.25" />

      <rect x="350" y="192" width="64" height="42" rx="6" fill="#e3a13c" fillOpacity="0.18" />
      <circle cx="364" cy="206" r="7" fill="#0b3d2e" fillOpacity="0.5" />
      <rect x="356" y="218" width="40" height="6" rx="2" fill="#0b3d2e" fillOpacity="0.25" />

      {/* bar chart card */}
      <rect x="282" y="242" width="132" height="38" rx="6" fill="#0b3d2e" fillOpacity="0.06" />
      <rect x="294" y="258" width="10" height="14" rx="2" fill="#14a673" />
      <rect x="310" y="250" width="10" height="22" rx="2" fill="#0b3d2e" />
      <rect x="326" y="254" width="10" height="18" rx="2" fill="#14a673" />
      <rect x="342" y="246" width="10" height="26" rx="2" fill="#e3a13c" />
      <rect x="358" y="252" width="10" height="20" rx="2" fill="#14a673" />
      <rect x="374" y="258" width="10" height="14" rx="2" fill="#0b3d2e" />

      {/* chair */}
      <rect x="418" y="196" width="96" height="148" rx="34" fill="#0b3d2e" />

      {/* person body (from behind) */}
      <path d="M432 340 C432 288 452 262 466 262 C480 262 500 288 500 340 Z" fill="#14a673" />

      {/* arm to keyboard */}
      <path d="M438 300 C420 310 400 314 388 312" stroke="#14a673" strokeWidth="16" strokeLinecap="round" fill="none" />

      {/* head + hair */}
      <circle cx="466" cy="238" r="26" fill="#caa07a" />
      <path
        d="M440 236 C438 210 452 196 466 196 C482 196 496 212 492 236 C486 226 476 220 466 220 C456 220 444 228 440 236 Z"
        fill="#0b3d2e"
      />

      {/* keyboard on desk */}
      <rect x="270" y="332" width="70" height="14" rx="3" fill="#0b3d2e" fillOpacity="0.2" />
    </svg>
  )
}
