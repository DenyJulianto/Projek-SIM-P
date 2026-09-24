export default function PageBanner({ onBack, icon: Icon, title, description, chips, illustration, onSettings, action }) {
  return (
    <>
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs font-semibold text-navy/60 bg-white/70 hover:bg-white border border-navy/15 rounded-full pl-2 pr-3.5 py-1.5 mb-3 transition-colors"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 6-6 6 6 6" />
          </svg>
          Kembali ke Dashboard
        </button>
      )}

      <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-100 via-emerald-50 to-emerald-100 p-6 mb-5">
        <div className="relative z-10 md:pr-80">
          <div className="flex items-center gap-4">
            <span className="h-14 w-14 rounded-2xl bg-navy-light text-white flex items-center justify-center shrink-0 shadow-md shadow-navy-light/30">
              <Icon className="h-7 w-7" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold text-navy">{title}</h1>
              <p className="text-sm text-navy/60 max-w-md">{description}</p>
            </div>
          </div>
          {chips && (
            <div className="flex items-center gap-4 mt-4 text-xs text-navy/60 flex-wrap">
              {chips.map(([label, value], i) => (
                <span key={label} className="flex items-center gap-4">
                  {i > 0 && <span className="h-4 w-px bg-navy/20" />}
                  <span>
                    {label}: <span className="font-bold text-navy">{value || '-'}</span>
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="hidden md:block absolute right-28 top-1/2 -translate-y-1/2 h-32">{illustration}</div>

        <div className="absolute right-5 top-5 z-10">
          {action ?? (
            <button
              onClick={onSettings}
              className="inline-flex items-center gap-2 bg-navy hover:bg-navy/90 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Pengaturan
            </button>
          )}
        </div>
      </div>
    </>
  )
}
