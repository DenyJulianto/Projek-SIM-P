export const SUMBER_DANA_KATEGORI = [
  { key: 'pemerintah', label: 'Pemerintah' },
  { key: 'pemerintah_daerah', label: 'Pemerintah Daerah' },
  { key: 'komite', label: 'Komite' },
  { key: 'swasta', label: 'Swasta' },
  { key: 'sosial', label: 'Sosial' },
  { key: 'lainnya', label: 'Lainnya' },
]

export function kategoriLabel(key) {
  return SUMBER_DANA_KATEGORI.find((k) => k.key === key)?.label || 'Lainnya'
}
