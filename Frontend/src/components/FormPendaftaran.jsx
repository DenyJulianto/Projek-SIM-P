// Baris isian (label, tanda wajib, petunjuk, pesan galat) untuk form pendaftaran.

export function Isian({ label, wajib = false, petunjuk = '', galat = '', className = '', children }) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-navy/70 mb-1.5">
        {label} {wajib && <span className="text-red-500">*</span>}
        {petunjuk && <span className="font-normal text-navy/40"> · {petunjuk}</span>}
      </label>
      {children}
      {galat && <p className="text-[11px] text-red-600 mt-1">{galat}</p>}
    </div>
  )
}
