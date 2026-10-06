// Kelas & helper bersama form pendaftaran (pegawai & siswa).

export const kelasInput =
  'w-full bg-emerald-50 rounded-full px-4 py-2.5 text-sm text-navy placeholder-navy/40 focus:outline-none focus:ring-2 focus:ring-navy-light/50'

export const hanyaAngka = (v, maks) => v.replace(/\D/g, '').slice(0, maks)
