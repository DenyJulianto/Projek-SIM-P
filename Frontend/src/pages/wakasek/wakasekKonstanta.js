const iso = (d) => d.toISOString().slice(0, 10)

/** Periode bawaan: awal bulan ini sampai hari ini. */
export const periodeBulanIni = () => {
  const n = new Date()
  return { dari: iso(new Date(n.getFullYear(), n.getMonth(), 1)), sampai: iso(n) }
}

export const th = 'px-3 py-2 text-left text-[11px] uppercase text-navy/50 font-semibold whitespace-nowrap'
export const td = 'px-3 py-2.5 text-sm text-navy align-top'
