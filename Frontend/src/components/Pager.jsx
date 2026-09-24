export function pageNumbers(current, last) {
  const pages = new Set([1, last, current - 1, current, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= last).sort((a, b) => a - b)
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? ['…', p] : [p]))
}

export default function Pager({ current, last, onChange }) {
  return (
    <div className="flex items-center gap-1.5">
      <PagerButton disabled={current <= 1} onClick={() => onChange(current - 1)} label="Sebelumnya">
        <Chevron direction="left" />
      </PagerButton>
      {pageNumbers(current, last).map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="px-1 text-navy/40">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`h-8 min-w-8 px-2 rounded-lg text-xs font-bold transition-colors ${
              p === current ? 'bg-navy-light text-white shadow-sm' : 'bg-white text-navy/70 hover:bg-emerald-100'
            }`}
          >
            {p}
          </button>
        )
      )}
      <PagerButton disabled={current >= last} onClick={() => onChange(current + 1)} label="Berikutnya">
        <Chevron direction="right" />
      </PagerButton>
    </div>
  )
}

function PagerButton({ children, disabled, onClick, label }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="h-8 w-8 rounded-lg bg-white border border-emerald-100 flex items-center justify-center text-navy/60 hover:bg-emerald-100 disabled:opacity-40 disabled:hover:bg-white"
    >
      {children}
    </button>
  )
}

function Chevron({ direction }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={direction === 'left' ? 'm15 6-6 6 6 6' : 'm9 6 6 6-6 6'} />
    </svg>
  )
}
