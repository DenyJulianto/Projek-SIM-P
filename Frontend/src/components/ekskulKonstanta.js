export const KATEGORI_TONE = {
  olahraga: 'bg-emerald-100 text-emerald-700',
  seni: 'bg-fuchsia-100 text-fuchsia-700',
  akademik: 'bg-sky-100 text-sky-700',
  keagamaan: 'bg-teal-100 text-teal-700',
  bahasa: 'bg-indigo-100 text-indigo-700',
  teknologi: 'bg-violet-100 text-violet-700',
  kepemimpinan: 'bg-amber-100 text-amber-700',
  keterampilan: 'bg-orange-100 text-orange-700',
  lainnya: 'bg-navy/10 text-navy/60',
}

export const KATEGORI_TITIK = {
  olahraga: 'bg-emerald-500',
  seni: 'bg-fuchsia-500',
  akademik: 'bg-sky-500',
  keagamaan: 'bg-teal-500',
  bahasa: 'bg-indigo-500',
  teknologi: 'bg-violet-500',
  kepemimpinan: 'bg-amber-500',
  keterampilan: 'bg-orange-500',
  lainnya: 'bg-navy/40',
}

export const TONE_KEANGGOTAAN = { aktif: 'hijau', keluar: 'merah', pindah: 'biru' }
export const TONE_KEGIATAN = { terjadwal: 'biru', terlaksana: 'hijau', dibatalkan: 'merah' }
export const TONE_HADIR = { hadir: 'hijau', izin: 'biru', sakit: 'kuning', alpha: 'merah' }
export const LABEL_HADIR = { hadir: 'Hadir', izin: 'Izin', sakit: 'Sakit', alpha: 'Alpa' }
export const TONE_NILAI = { belum: 'abu', draft: 'kuning', tervalidasi: 'biru', terkunci: 'hijau' }
export const TONE_PREDIKAT = { A: 'hijau', B: 'biru', C: 'kuning', D: 'merah' }

export const HARI_PENDEK = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
export const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

export const toIso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Saran deskripsi perkembangan dari aspek & predikat (bisa disunting guru pembina). */
export function saranDeskripsi(nama, aspek, predikat) {
  const isi = Object.entries(aspek || {}).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  if (isi.length === 0) return ''
  const urut = [...isi].sort((a, b) => Number(b[1]) - Number(a[1]))
  const kuat = urut[0][0].toLowerCase()
  const lemah = urut[urut.length - 1]
  const awal = `${nama || 'Ananda'} menunjukkan perkembangan ${{ A: 'yang sangat baik', B: 'yang baik', C: 'yang cukup', D: 'yang masih perlu bimbingan' }[predikat] ?? 'yang positif'} dalam kegiatan ini.`
  const kuatan = ` Aspek yang paling menonjol adalah ${kuat}.`
  const saran = urut.length > 1 && Number(lemah[1]) < 80 ? ` Perlu ditingkatkan pada aspek ${lemah[0].toLowerCase()}.` : ''
  return awal + kuatan + saran
}
