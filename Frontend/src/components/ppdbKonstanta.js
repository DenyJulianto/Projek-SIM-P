export const selectClass = 'border border-navy/15 rounded-lg px-3 py-2 text-sm bg-white'

export const STATUS_PERIODE_TONE = {
  draft: 'bg-navy/10 text-navy/60',
  dibuka: 'bg-emerald-100 text-emerald-700',
  ditutup: 'bg-amber-100 text-amber-700',
  seleksi: 'bg-sky-100 text-sky-700',
  pengumuman: 'bg-violet-100 text-violet-700',
  daftar_ulang: 'bg-teal-100 text-teal-700',
  selesai: 'bg-navy/10 text-navy/50',
}

export const TONE = {
  hijau: 'bg-emerald-100 text-emerald-700',
  merah: 'bg-red-100 text-red-700',
  kuning: 'bg-amber-100 text-amber-700',
  biru: 'bg-sky-100 text-sky-700',
  abu: 'bg-navy/10 text-navy/60',
}

export const TONE_VERIFIKASI = { belum: 'abu', diverifikasi: 'hijau', perlu_perbaikan: 'kuning', ditolak: 'merah' }
export const TONE_SELEKSI = { belum: 'abu', lolos: 'hijau', tidak_lolos: 'merah' }
export const TONE_DAFTAR_ULANG = { belum: 'kuning', sudah: 'hijau', dibatalkan: 'merah' }
export const TONE_DOKUMEN = { menunggu: 'kuning', sah: 'hijau', tidak_sah: 'merah' }
export const LABEL_DOKUMEN = { menunggu: 'Menunggu', sah: 'Sah', tidak_sah: 'Tidak sah' }

export const LABEL_EVENT = {
  created: 'Pendaftaran',
  updated: 'Ubah data',
  dokumen: 'Dokumen',
  verifikasi: 'Verifikasi',
  seleksi: 'Seleksi',
  seleksi_nilai: 'Nilai seleksi',
  daftar_ulang: 'Daftar ulang',
  penerimaan: 'Penerimaan',
  import: 'Import siswa',
  notifikasi: 'Notifikasi',
  dibatalkan: 'Pembatalan',
  dipulihkan: 'Pemulihan',
  status: 'Status PPDB',
  jalur: 'Jalur',
  persyaratan: 'Persyaratan',
  pengumuman: 'Pengumuman',
  deleted: 'Dihapus',
}

export const AGAMA = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya']

export const tgl = (iso) => (iso ? new Date(String(iso).length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-')
export const waktu = (iso) => (iso ? new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-')
export const ukuranFile = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)

export const TONE_TINGKAT_PELANGGARAN = { ringan: 'abu', sedang: 'kuning', berat: 'merah' }
export const TONE_STATUS_PELANGGARAN = { aktif: 'merah', dalam_pembinaan: 'kuning', selesai: 'hijau' }
export const TONE_STATUS_TL = { direncanakan: 'biru', berjalan: 'kuning', selesai: 'hijau', dibatalkan: 'abu' }
