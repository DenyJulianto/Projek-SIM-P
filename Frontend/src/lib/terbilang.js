const SATUAN = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas']

function bilang(n) {
  if (n < 12) return SATUAN[n]
  if (n < 20) return `${bilang(n - 10)} belas`
  if (n < 100) return `${bilang(Math.floor(n / 10))} puluh${n % 10 ? ` ${bilang(n % 10)}` : ''}`
  if (n < 200) return `seratus${n - 100 ? ` ${bilang(n - 100)}` : ''}`
  if (n < 1000) return `${bilang(Math.floor(n / 100))} ratus${n % 100 ? ` ${bilang(n % 100)}` : ''}`
  if (n < 2000) return `seribu${n - 1000 ? ` ${bilang(n - 1000)}` : ''}`

  const units = [
    [1e12, 'triliun'],
    [1e9, 'miliar'],
    [1e6, 'juta'],
    [1e3, 'ribu'],
  ]
  for (const [size, name] of units) {
    if (n >= size) {
      const rest = n % size
      return `${bilang(Math.floor(n / size))} ${name}${rest ? ` ${bilang(rest)}` : ''}`
    }
  }
  return ''
}

export function terbilangRupiah(value) {
  const n = Math.round(Number(value) || 0)
  const text = n === 0 ? 'nol' : bilang(n)
  return `${text.charAt(0).toUpperCase()}${text.slice(1)} rupiah`
}
