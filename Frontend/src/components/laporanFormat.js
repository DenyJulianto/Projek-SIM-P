export function formatSel(kolom, nilai) {
  if (nilai === null || nilai === undefined || nilai === '') return '-'
  if (kolom.tipe === 'persen') return `${nilai}%`
  if (kolom.tipe === 'desimal') return Number(nilai).toLocaleString('id-ID', { maximumFractionDigits: 2 })
  if (kolom.tipe === 'angka') return Number(nilai).toLocaleString('id-ID')
  return String(nilai)
}
