// Tulisan "SiM Pendidikan" dengan aksen daun kecil menggantikan titik
// huruf "i", meniru gaya wordmark pada logo resmi SIM Pendidikan.
export default function LogoWordmark({ size = 'text-base', stacked = false, className = '' }) {
  const sim = (
    <span className="relative inline-flex items-baseline">
      S
      <span className="relative inline-block">
        i
        <LeafAccent className="absolute -top-[0.62em] left-1/2 -translate-x-1/2 h-[0.55em] w-[0.55em] text-emerald-400" />
      </span>
      M
    </span>
  )

  if (stacked) {
    return (
      <div className={`font-extrabold tracking-tight text-center leading-[1.05] ${size} ${className}`}>
        <div>{sim}</div>
        <div>Pendidikan</div>
      </div>
    )
  }

  return (
    <p className={`font-extrabold tracking-tight leading-none ${size} ${className}`}>
      {sim} Pendidikan
    </p>
  )
}

function LeafAccent(props) {
  return (
    <svg {...props} viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 1c5 1 8 5 8 10-5 0-9-3-10-8-.5-1 .5-2.3 2-2Z" />
    </svg>
  )
}
