// Gaya (kelas Tailwind statis) per kategori kegiatan kalender akademik.
export const KATEGORI_STYLE = {
  pembelajaran: { chip: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
  ujian: { chip: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  penilaian: { chip: 'bg-orange-100 text-orange-800', dot: 'bg-orange-500' },
  rapat: { chip: 'bg-violet-100 text-violet-800', dot: 'bg-violet-500' },
  kegiatan_sekolah: { chip: 'bg-sky-100 text-sky-800', dot: 'bg-sky-500' },
  kegiatan_siswa: { chip: 'bg-cyan-100 text-cyan-800', dot: 'bg-cyan-500' },
  libur: { chip: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
  hari_besar: { chip: 'bg-rose-100 text-rose-800', dot: 'bg-rose-500' },
  administrasi: { chip: 'bg-slate-200 text-slate-800', dot: 'bg-slate-500' },
  lainnya: { chip: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' },
  periode: { chip: 'bg-navy text-white', dot: 'bg-navy' },
}

export const KATEGORI_LABEL = {
  pembelajaran: 'Pembelajaran',
  ujian: 'Ujian',
  penilaian: 'Penilaian',
  rapat: 'Rapat',
  kegiatan_sekolah: 'Kegiatan Sekolah',
  kegiatan_siswa: 'Kegiatan Siswa',
  libur: 'Libur',
  hari_besar: 'Hari Besar',
  administrasi: 'Administrasi',
  lainnya: 'Lainnya',
  periode: 'Periode Akademik',
}

export const STATUS_KEGIATAN = {
  direncanakan: 'Direncanakan',
  berlangsung: 'Berlangsung',
  selesai: 'Selesai',
  ditunda: 'Ditunda',
  dibatalkan: 'Dibatalkan',
}

export const HARI_PENDEK = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

export const namaBulan = (m) => BULAN[m]

export function toIso(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function fromIso(s) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Senin sebagai awal minggu. */
export function awalMinggu(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}
