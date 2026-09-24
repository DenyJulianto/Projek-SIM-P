export default function SuperAdminHeroIllustration(props) {
  return (
    <svg viewBox="0 0 600 440" fill="none" {...props}>
      <defs>
        <clipPath id="sahiCard">
          <rect x="90" y="50" width="420" height="300" rx="18" />
        </clipPath>
        <linearGradient id="sahiChartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#14a673" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#14a673" stopOpacity="0" />
        </linearGradient>
        <filter id="sahiShadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#0b3d2e" floodOpacity="0.18" />
        </filter>
        <filter id="sahiShadowSm" x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0b3d2e" floodOpacity="0.16" />
        </filter>
      </defs>

      {/* ambient background blobs */}
      <circle cx="470" cy="70" r="140" fill="#14a673" fillOpacity="0.07" />
      <circle cx="70" cy="380" r="110" fill="#e3a13c" fillOpacity="0.08" />
      <g opacity="0.5">
        {[0, 1, 2, 3, 4].map((row) =>
          [0, 1, 2, 3].map((col) => (
            <circle key={`${row}-${col}`} cx={30 + col * 14} cy={20 + row * 14} r="1.6" fill="#0b3d2e" fillOpacity="0.25" />
          ))
        )}
      </g>

      {/* main app window mockup */}
      <g filter="url(#sahiShadow)">
        <rect x="90" y="50" width="420" height="300" rx="18" fill="#ffffff" stroke="#e6ebe8" />
      </g>
      <g clipPath="url(#sahiCard)">
        {/* title bar */}
        <rect x="90" y="50" width="420" height="32" fill="#f6f8f7" />
        <circle cx="108" cy="66" r="4" fill="#f87171" />
        <circle cx="122" cy="66" r="4" fill="#e3a13c" />
        <circle cx="136" cy="66" r="4" fill="#14a673" />
        <rect x="158" y="61" width="160" height="10" rx="5" fill="#e2e8e5" />

        {/* sidebar */}
        <rect x="90" y="82" width="62" height="268" fill="#0b3d2e" />
        <rect x="102" y="98" width="38" height="9" rx="4.5" fill="#ffffff" fillOpacity="0.95" />
        <rect x="102" y="120" width="38" height="9" rx="4.5" fill="#ffffff" fillOpacity="0.2" />
        <rect x="102" y="142" width="38" height="9" rx="4.5" fill="#ffffff" fillOpacity="0.2" />
        <rect x="102" y="164" width="38" height="9" rx="4.5" fill="#ffffff" fillOpacity="0.2" />
        <rect x="102" y="186" width="38" height="9" rx="4.5" fill="#ffffff" fillOpacity="0.2" />

        {/* header row */}
        <rect x="170" y="97" width="130" height="10" rx="5" fill="#0b3d2e" fillOpacity="0.14" />
        <rect x="170" y="113" width="80" height="7" rx="3.5" fill="#0b3d2e" fillOpacity="0.08" />
        <circle cx="484" cy="104" r="13" fill="#14a673" />

        {/* KPI cards */}
        {[
          { x: 170, bg: '#ecfdf5', dot: '#10b981' },
          { x: 258, bg: '#eff6ff', dot: '#3b82f6' },
          { x: 346, bg: '#fdf6e9', dot: '#e3a13c' },
          { x: 434, bg: '#f5f0fb', dot: '#a855f7' },
        ].map((card) => (
          <g key={card.x}>
            <rect x={card.x} y="140" width="68" height="58" rx="10" fill={card.bg} />
            <circle cx={card.x + 16} cy="156" r="8" fill={card.dot} />
            <rect x={card.x + 12} y="174" width="40" height="8" rx="4" fill="#0b3d2e" fillOpacity="0.35" />
            <rect x={card.x + 12} y="186" width="26" height="6" rx="3" fill="#0b3d2e" fillOpacity="0.15" />
          </g>
        ))}

        {/* chart card */}
        <rect x="170" y="212" width="180" height="122" rx="10" fill="#f8faf9" />
        <rect x="184" y="224" width="70" height="8" rx="4" fill="#0b3d2e" fillOpacity="0.18" />
        <path
          d="M188 306 L214 288 L240 296 L266 270 L292 278 L318 254 L334 262"
          fill="none"
          stroke="#14a673"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M188 306 L214 288 L240 296 L266 270 L292 278 L318 254 L334 262 L334 322 L188 322 Z"
          fill="url(#sahiChartFill)"
        />
        {[
          [188, 306],
          [240, 296],
          [292, 278],
          [334, 262],
        ].map(([cx, cy]) => (
          <circle key={cx} cx={cx} cy={cy} r="3.5" fill="#0b3d2e" />
        ))}

        {/* donut card */}
        <rect x="362" y="212" width="140" height="122" rx="10" fill="#f8faf9" />
        <rect x="376" y="224" width="60" height="8" rx="4" fill="#0b3d2e" fillOpacity="0.18" />
        <g transform="translate(432,278)">
          <circle r="34" fill="none" stroke="#e2e8e5" strokeWidth="14" />
          <circle
            r="34"
            fill="none"
            stroke="#14a673"
            strokeWidth="14"
            strokeDasharray="95 118"
            strokeLinecap="round"
            transform="rotate(-90)"
          />
          <circle
            r="34"
            fill="none"
            stroke="#e3a13c"
            strokeWidth="14"
            strokeDasharray="45 168"
            strokeDashoffset="-95"
            strokeLinecap="round"
            transform="rotate(-90)"
          />
          <circle
            r="34"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="14"
            strokeDasharray="30 183"
            strokeDashoffset="-140"
            strokeLinecap="round"
            transform="rotate(-90)"
          />
        </g>
      </g>

      {/* floating notification card */}
      <g filter="url(#sahiShadowSm)" transform="rotate(-4 470 96)">
        <rect x="420" y="66" width="120" height="58" rx="14" fill="#ffffff" />
      </g>
      <g transform="rotate(-4 470 96)">
        <circle cx="440" cy="95" r="12" fill="#ecfdf5" />
        <path d="m435 95 3.5 3.5L446 90" stroke="#14a673" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <rect x="460" y="86" width="64" height="8" rx="4" fill="#0b3d2e" fillOpacity="0.4" />
        <rect x="460" y="100" width="44" height="6" rx="3" fill="#0b3d2e" fillOpacity="0.18" />
      </g>

      {/* floating security badge */}
      <g filter="url(#sahiShadowSm)">
        <circle cx="112" cy="368" r="30" fill="#0b3d2e" />
      </g>
      <path
        d="M112 355c-7 0-13 3-13 3v9c0 8 5.5 14 13 16.5 7.5-2.5 13-8.5 13-16.5v-9s-6-3-13-3Z"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinejoin="round"
        transform="translate(0,-4)"
      />
      <path d="m106 369 4 4 8-8" stroke="#f0c078" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" transform="translate(0,-4)" />
    </svg>
  )
}
