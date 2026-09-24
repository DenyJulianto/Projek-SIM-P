export const TAGIHAN_JENIS = [
  { key: 'spp', label: 'SPP' },
  { key: 'uang_kegiatan', label: 'Uang Kegiatan' },
  { key: 'uang_ujian', label: 'Uang Ujian' },
  { key: 'seragam', label: 'Seragam' },
  { key: 'buku', label: 'Buku' },
  { key: 'study_tour', label: 'Study Tour' },
  { key: 'ekstrakurikuler', label: 'Ekstrakurikuler' },
  { key: 'daftar_ulang', label: 'Daftar Ulang' },
  { key: 'lainnya', label: 'Biaya Lainnya' },
]

export function jenisLabel(key) {
  return TAGIHAN_JENIS.find((j) => j.key === key)?.label || 'Biaya Lainnya'
}
