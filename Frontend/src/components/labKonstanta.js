export const selectClass = 'border border-navy/15 rounded-lg px-3 py-2 text-sm bg-white'
export const inputClass = 'border border-navy/15 rounded-lg px-3 py-2 text-sm w-full'

export const TONE = {
  hijau: 'bg-emerald-100 text-emerald-700',
  merah: 'bg-red-100 text-red-700',
  kuning: 'bg-amber-100 text-amber-700',
  biru: 'bg-sky-100 text-sky-700',
  abu: 'bg-navy/10 text-navy/60',
}

export const KONDISI_ALAT = ['baik', 'rusak_ringan', 'rusak_berat', 'dalam_perbaikan', 'hilang', 'tidak_layak']
export const LABEL_KONDISI_ALAT = {
  baik: 'Baik',
  rusak_ringan: 'Rusak Ringan',
  rusak_berat: 'Rusak Berat',
  dalam_perbaikan: 'Dalam Perbaikan',
  hilang: 'Hilang',
  tidak_layak: 'Tidak Layak',
}
export const TONE_KONDISI_ALAT = { baik: 'hijau', rusak_ringan: 'kuning', rusak_berat: 'merah', dalam_perbaikan: 'biru', hilang: 'merah', tidak_layak: 'abu' }

export const TONE_STATUS_LAB = { aktif: 'hijau', nonaktif: 'abu' }
export const TONE_STATUS_JADWAL = { terjadwal: 'biru', berlangsung: 'kuning', selesai: 'hijau', dibatalkan: 'abu' }
export const LABEL_STATUS_PEMINJAMAN_ALAT = {
  diajukan: 'Diajukan',
  disetujui: 'Disetujui',
  ditolak: 'Ditolak',
  dipinjam: 'Dipinjam',
  dikembalikan: 'Dikembalikan',
  terlambat: 'Terlambat',
  rusak: 'Rusak',
  hilang: 'Hilang',
}
export const TONE_STATUS_PEMINJAMAN_ALAT = { diajukan: 'kuning', disetujui: 'biru', ditolak: 'abu', dipinjam: 'biru', dikembalikan: 'hijau', terlambat: 'merah', rusak: 'merah', hilang: 'merah' }

export const LABEL_JENIS_PEMELIHARAAN = { rutin: 'Pemeliharaan Rutin', perbaikan: 'Perbaikan', kalibrasi: 'Kalibrasi', pembersihan: 'Pembersihan', penggantian_komponen: 'Penggantian Komponen' }

export const LABEL_JENIS_KEGIATAN_LAB = {
  praktikum: 'Praktikum',
  pelatihan: 'Pelatihan',
  ujian_praktik: 'Ujian Praktik',
  penelitian: 'Penelitian',
  workshop: 'Workshop',
  kegiatan_guru: 'Kegiatan Guru',
  kegiatan_siswa: 'Kegiatan Siswa',
}
export const TONE_STATUS_KEGIATAN = { direncanakan: 'biru', berlangsung: 'kuning', selesai: 'hijau', dibatalkan: 'abu' }

export const tgl = (iso) => (iso ? new Date(String(iso).length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-')
export const waktu = (iso) => (iso ? new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-')
export const rupiah = (n) => `Rp ${Number(n ?? 0).toLocaleString('id-ID')}`
