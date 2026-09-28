export const selectClass = 'border border-navy/15 rounded-lg px-3 py-2 text-sm bg-white'
export const inputClass = 'border border-navy/15 rounded-lg px-3 py-2 text-sm w-full'

export const TONE = {
  hijau: 'bg-emerald-100 text-emerald-700',
  merah: 'bg-red-100 text-red-700',
  kuning: 'bg-amber-100 text-amber-700',
  biru: 'bg-sky-100 text-sky-700',
  abu: 'bg-navy/10 text-navy/60',
}

export const TONE_STATUS_BUKU = { aktif: 'hijau', nonaktif: 'abu' }
export const TONE_STATUS_EKSEMPLAR = { tersedia: 'hijau', dipinjam: 'biru', rusak: 'kuning', hilang: 'merah', nonaktif: 'abu' }
export const TONE_STATUS_ANGGOTA = { aktif: 'hijau', nonaktif: 'abu' }
export const TONE_STATUS_PEMINJAMAN = { dipinjam: 'biru', sebagian_kembali: 'kuning', selesai: 'hijau', dibatalkan: 'abu' }
export const TONE_STATUS_RESERVASI = { menunggu: 'kuning', siap_diambil: 'biru', selesai: 'hijau', dibatalkan: 'abu', kadaluarsa: 'merah' }
export const TONE_STATUS_DENDA = { belum_bayar: 'kuning', lunas: 'hijau' }
export const TONE_STATUS_KEGIATAN = { direncanakan: 'biru', berlangsung: 'kuning', selesai: 'hijau', dibatalkan: 'abu' }

export const LABEL_JENIS_ANGGOTA = { siswa: 'Siswa', guru: 'Guru', pegawai: 'Pegawai' }
export const LABEL_JENIS_KEGIATAN = {
  literasi: 'Literasi Sekolah',
  kunjungan: 'Kunjungan Perpustakaan',
  bedah_buku: 'Bedah Buku',
  pameran_buku: 'Pameran Buku',
  program_membaca: 'Program Membaca',
  lainnya: 'Lainnya',
}
export const LABEL_JENIS_DENDA = { keterlambatan: 'Keterlambatan', kerusakan: 'Kerusakan', kehilangan: 'Kehilangan', lainnya: 'Lainnya' }
export const LABEL_KONDISI = { baik: 'Baik', rusak_ringan: 'Rusak Ringan', rusak_berat: 'Rusak Berat', hilang: 'Hilang' }

export const tgl = (iso) => (iso ? new Date(String(iso).length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-')
export const waktu = (iso) => (iso ? new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-')
export const rupiah = (n) => `Rp ${Number(n ?? 0).toLocaleString('id-ID')}`
