import { api } from './api'

// Sumber data halaman Program Tahunan / Program Semester. Kurikulum mengelola
// semua dokumen; guru hanya miliknya sendiri (kelas & mapel dari jadwal
// mengajar) dan hanya bisa mengajukan/menarik, bukan memverifikasi.
function untukGuru(jenis) {
  return {
    guru: true,
    list: (p) => api.listProgramGuru(jenis, { ...p, per_page: 100 }),
    get: (id) => api.getProgramGuru(jenis, id),
    create: (d) => api.createProgramGuru(jenis, d),
    update: (id, d) => api.updateProgramGuru(jenis, id, d),
    remove: (id) => api.deleteProgramGuru(jenis, id),
    opsi: (p) => api.getOpsiProgramGuru(jenis, p),
    exportFile: (id) => api.exportProgramGuru(jenis, id),
    ajukan: (id) => api.ajukanProgramGuru(jenis, id),
    tarik: (id) => api.tarikProgramGuru(jenis, id),
  }
}

export const SUMBER_PROGRAM = {
  'program-tahunan': {
    kurikulum: {
      guru: false,
      list: api.listProgramTahunan,
      get: api.getProgramTahunan,
      create: api.createProgramTahunan,
      update: api.updateProgramTahunan,
      remove: api.deleteProgramTahunan,
      opsi: api.getOpsiProgramTahunan,
      exportFile: api.exportProgramTahunan,
      ubahStatus: api.updateStatusDokumenProgramTahunan,
    },
    guru: untukGuru('program-tahunan'),
  },
  'program-semester': {
    kurikulum: {
      guru: false,
      list: api.listProgramSemester,
      get: api.getProgramSemester,
      create: api.createProgramSemester,
      update: api.updateProgramSemester,
      remove: api.deleteProgramSemester,
      opsi: api.getOpsiProgramSemester,
      exportFile: api.exportProgramSemester,
      ubahStatus: api.updateStatusDokumenProgramSemester,
    },
    guru: untukGuru('program-semester'),
  },
}

// Kelas yang diajar guru untuk mapel terpilih (atau semua kelas bila mapel belum dipilih).
export function kelasDiajar(mengajar, mapelId) {
  const daftar = mengajar.filter((m) => !mapelId || String(m.mata_pelajaran_id) === String(mapelId)).flatMap((m) => m.kelas)
  return daftar.filter((k, i) => daftar.findIndex((x) => x.id === k.id) === i)
}

export function mapelDiajar(mengajar) {
  return mengajar.map((m) => ({ id: m.mata_pelajaran_id, nama_mapel: m.nama_mapel }))
}
