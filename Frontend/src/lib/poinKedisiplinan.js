/**
 * Pedoman poin per tingkat pelanggaran — sama dengan CatatanPoin::KATEGORI
 * di backend (yang tetap memvalidasi). Dipakai form pengajuan BK.
 */
export const PEDOMAN_TINGKAT = {
  ringan: { label: 'Pelanggaran Ringan', min: 5, max: 10 },
  sedang: { label: 'Pelanggaran Sedang', min: 15, max: 30 },
  berat: { label: 'Pelanggaran Berat', min: 40, max: 75 },
  sangat_berat: { label: 'Pelanggaran Sangat Berat', min: 100, max: 100 },
}

/** Keterangan pelanggaran yang poinnya tidak bisa dipotong lagi (null bila masih bisa). */
export function statusPotongPoin(p) {
  if (p.poin_dipotong) return 'poin sudah dipotong'
  if (p.poin_diajukan) return 'sedang diajukan BK'
  return null
}

/** Warna & label status sisa poin kedisiplinan (dari poin awal 100). */
export function nadaPoin(sisa, awal = 100) {
  const persen = awal ? (sisa / awal) * 100 : 0
  if (persen >= 75) return { teks: 'text-emerald-600', bar: 'bg-emerald-500', label: 'Baik' }
  if (persen >= 50) return { teks: 'text-amber-600', bar: 'bg-amber-500', label: 'Perlu perhatian' }
  return { teks: 'text-red-600', bar: 'bg-red-500', label: 'Kritis' }
}

export function formatTanggalPoin(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}
