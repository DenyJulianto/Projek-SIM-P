// Multi-tenant: setiap sekolah diakses lewat subdomain/domain sendiri
// (mis. demo.simpendidikan.test, test-sekolah.localhost). API base URL
// diturunkan dari hostname yang sedang dibuka di browser supaya frontend
// otomatis bicara ke tenant yang benar tanpa perlu ganti .env setiap kali
// pindah sekolah. VITE_API_BASE_URL tetap bisa dipakai sebagai override
// eksplisit (mis. untuk setup production yang backend-nya di host lain).
export const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || `${window.location.protocol}//${window.location.hostname}:8000`

// Harus sama dengan config/tenancy.php > central_domains di backend. Dicek
// dari host tujuan BASE_URL (backend API), bukan host halaman frontend itu
// sendiri — keduanya bisa beda, mis. saat VITE_API_BASE_URL di-override
// manual ke satu tenant tertentu untuk development. Rute central
// (routes/api.php) didaftarkan dengan prefix /api sedangkan rute tenant
// (routes/tenant.php) tidak — jadi endpoint yang ada di kedua sisi (login,
// logout, me) perlu tahu API mana yang sedang dituju supaya memanggil path
// yang benar.
const CENTRAL_DOMAINS = ['127.0.0.1', 'localhost']
export const IS_CENTRAL_DOMAIN = CENTRAL_DOMAINS.includes(new URL(BASE_URL).hostname)

function authHeaders() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `Request gagal (${res.status})`)
  }

  return res.json()
}

async function downloadFile(path, fallbackName) {
  const res = await fetch(`${BASE_URL}${path}`, { headers: { ...authHeaders() } })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `Request gagal (${res.status})`)
  }

  const disposition = res.headers.get('Content-Disposition') || ''
  const match = disposition.match(/filename="?([^"]+)"?/)
  const filename = match ? match[1] : fallbackName

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

async function requestForm(path, formData) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { Accept: 'application/json', ...authHeaders() },
    body: formData,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `Request gagal (${res.status})`)
  }

  return res.json()
}

export const api = {
  getProfil: () => request('/public/profil'),
  getPengumuman: () => request('/public/pengumuman'),
  getKegiatan: () => request('/public/kegiatan'),

  login: (email, password) =>
    request(IS_CENTRAL_DOMAIN ? '/api/login' : '/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email, password, passwordConfirmation) =>
    request('/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        password_confirmation: passwordConfirmation,
      }),
    }),

  verifyEmail: (email, code) =>
    request('/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    }),

  resendVerificationCode: (email) =>
    request('/resend-verification-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  forgotPassword: (email) =>
    request('/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (email, code, password, passwordConfirmation) =>
    request('/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, password, password_confirmation: passwordConfirmation }),
    }),

  logout: () => request(IS_CENTRAL_DOMAIN ? '/api/logout' : '/logout', { method: 'POST' }),
  me: () => request(IS_CENTRAL_DOMAIN ? '/api/me' : '/me'),

  updateProfil: (data) =>
    request('/profil', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  createPengumuman: (data) =>
    request('/pengumuman', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listPengumumanAuth: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/pengumuman${query ? `?${query}` : ''}`)
  },

  updatePengumuman: (id, data) =>
    request(`/pengumuman/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deletePengumuman: (id) => request(`/pengumuman/${id}`, { method: 'DELETE' }),

  createKegiatan: (data) =>
    request('/kegiatan', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  countSiswa: () => request('/siswa?per_page=1'),
  countGuru: () => request('/guru?per_page=1'),
  countKelas: () => request('/kelas?per_page=1'),

  listRoles: () => request('/roles'),

  listUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/users${query ? `?${query}` : ''}`)
  },

  createUser: (data) =>
    request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateUser: (id, data) =>
    request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  resetUserPassword: (id) => request(`/users/${id}/reset-password`, { method: 'POST' }),

  getUserSessions: (id) => request(`/users/${id}/sessions`),

  revokeUserSession: (id, tokenId) =>
    request(`/users/${id}/sessions/${tokenId}`, { method: 'DELETE' }),

  listPermissions: () => request('/permissions'),

  createRole: (data) =>
    request('/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateRole: (id, data) =>
    request(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteRole: (id) => request(`/roles/${id}`, { method: 'DELETE' }),

  getAuditLog: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/audit-log${query ? `?${query}` : ''}`)
  },

  getDashboardSummary: (days) => request(`/dashboard-summary${days ? `?days=${days}` : ''}`),

  // Super Admin platform (central, lintas sekolah)
  getGuruDirectoryNasional: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/api/direktori-guru${query ? `?${query}` : ''}`)
  },

  exportGuruDirectoryNasional: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return downloadFile(`/api/direktori-guru/export${query ? `?${query}` : ''}`, 'data-guru.xlsx')
  },

  downloadGuruImportTemplate: () =>
    downloadFile('/api/direktori-guru/import-template', 'template-import-guru.xlsx'),

  importGuruDirectoryNasional: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return requestForm('/api/direktori-guru/import', formData)
  },

  getSiswaDirectoryNasional: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/api/direktori-siswa${query ? `?${query}` : ''}`)
  },

  exportSiswaDirectoryNasional: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return downloadFile(`/api/direktori-siswa/export${query ? `?${query}` : ''}`, 'data-siswa.xlsx')
  },

  downloadSiswaImportTemplate: () =>
    downloadFile('/api/direktori-siswa/import-template', 'template-import-siswa.xlsx'),

  importSiswaDirectoryNasional: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return requestForm('/api/direktori-siswa/import', formData)
  },

  getDashboardNasional: () => request('/api/dashboard-nasional'),

  getSekolahNasional: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/api/sekolah${query ? `?${query}` : ''}`)
  },

  createSekolah: (data) =>
    request('/api/sekolah', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  downloadSekolahImportTemplate: () =>
    downloadFile('/api/sekolah/import-template', 'template-import-sekolah.xlsx'),

  exportSekolahNasional: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return downloadFile(`/api/sekolah/export${query ? `?${query}` : ''}`, 'data-sekolah.xlsx')
  },

  importSekolah: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return requestForm('/api/sekolah/import', formData)
  },

  // Tahun Ajaran & Semester
  listTahunAjaran: () => request('/tahun-ajaran'),
  createTahunAjaran: (data) => request('/tahun-ajaran', { method: 'POST', body: JSON.stringify(data) }),
  updateTahunAjaran: (id, data) => request(`/tahun-ajaran/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTahunAjaran: (id) => request(`/tahun-ajaran/${id}`, { method: 'DELETE' }),

  listSemester: () => request('/semester'),
  createSemester: (data) => request('/semester', { method: 'POST', body: JSON.stringify(data) }),
  updateSemester: (id, data) => request(`/semester/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSemester: (id) => request(`/semester/${id}`, { method: 'DELETE' }),

  // Jam Belajar
  listJamBelajar: () => request('/jam-belajar'),
  createJamBelajar: (data) => request('/jam-belajar', { method: 'POST', body: JSON.stringify(data) }),
  updateJamBelajar: (id, data) => request(`/jam-belajar/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteJamBelajar: (id) => request(`/jam-belajar/${id}`, { method: 'DELETE' }),

  // Template Rapor & Surat
  getRaporTemplate: () => request('/rapor-template'),
  updateRaporTemplate: (data) => request('/rapor-template', { method: 'PUT', body: JSON.stringify(data) }),
  getSuratTemplate: () => request('/surat-template'),
  updateSuratTemplate: (data) => request('/surat-template', { method: 'PUT', body: JSON.stringify(data) }),

  // Notifikasi
  getNotificationSettings: () => request('/notification-settings'),
  updateNotificationSettings: (data) =>
    request('/notification-settings', { method: 'PUT', body: JSON.stringify(data) }),

  // Integrasi
  listIntegrations: () => request('/integrations'),
  updateIntegration: (key, data) =>
    request(`/integrations/${key}`, { method: 'PUT', body: JSON.stringify(data) }),
  testEmailIntegration: (to) =>
    request('/integrations/smtp-email/test', { method: 'POST', body: JSON.stringify({ to }) }),

  // Backup & Pemulihan
  listBackups: () => request('/backups'),
  createBackup: () => request('/backups', { method: 'POST' }),
  deleteBackup: (name) => request(`/backups/${name}`, { method: 'DELETE' }),
  restoreBackup: (name) => request(`/backups/${name}/restore`, { method: 'POST' }),
  downloadBackup: (name) => downloadFile(`/backups/${name}/download`, name),
  getBackupSchedule: () => request('/backup-schedule'),
  updateBackupSchedule: (data) => request('/backup-schedule', { method: 'PUT', body: JSON.stringify(data) }),

  listInventaris: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/inventaris${query ? `?${query}` : ''}`)
  },

  getInventaris: (id) => request(`/inventaris/${id}`),

  createInventaris: (data) =>
    request('/inventaris', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateInventaris: (id, data) =>
    request(`/inventaris/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteInventaris: (id) => request(`/inventaris/${id}`, { method: 'DELETE' }),

  addInventarisRiwayat: (id, data) =>
    request(`/inventaris/${id}/riwayat`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listKelasAll: () => request('/kelas?per_page=100'),
  listGuruAll: () => request('/guru?per_page=100'),
  listSiswaByKelas: (kelasId) => {
    const query = new URLSearchParams({ 'filter[kelas_id]': kelasId, per_page: 100 }).toString()
    return request(`/siswa?${query}`)
  },

  getRekapAbsensiSiswa: (tanggal, kelasId) =>
    request(`/absensi/rekap?tanggal=${tanggal}${kelasId ? `&kelas_id=${kelasId}` : ''}`),

  getRekapAbsensiGuru: (tanggal) => request(`/absensi-guru/rekap?tanggal=${tanggal}`),

  bulkSaveAbsensiSiswa: (tanggal, items) =>
    request('/absensi/bulk', {
      method: 'POST',
      body: JSON.stringify({ tanggal, items }),
    }),

  bulkSaveAbsensiGuru: (tanggal, items) =>
    request('/absensi-guru/bulk', {
      method: 'POST',
      body: JSON.stringify({ tanggal, items }),
    }),

  listAbsensiSiswa: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/absensi${query ? `?${query}` : ''}`)
  },

  listAbsensiGuru: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/absensi-guru${query ? `?${query}` : ''}`)
  },

  listMataPelajaran: () => request('/mata-pelajaran?per_page=100'),

  createMataPelajaran: (data) =>
    request('/mata-pelajaran', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateMataPelajaran: (id, data) =>
    request(`/mata-pelajaran/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteMataPelajaran: (id) => request(`/mata-pelajaran/${id}`, { method: 'DELETE' }),

  listJadwal: (params = {}) => {
    const query = new URLSearchParams({ include: 'kelas,mataPelajaran,guru', ...params }).toString()
    return request(`/jadwal-pelajaran?${query}`)
  },

  createJadwal: (data) =>
    request('/jadwal-pelajaran', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateJadwal: (id, data) =>
    request(`/jadwal-pelajaran/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteJadwal: (id) => request(`/jadwal-pelajaran/${id}`, { method: 'DELETE' }),

  listKegiatanAuth: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/kegiatan${query ? `?${query}` : ''}`)
  },

  updateKegiatan: (id, data) =>
    request(`/kegiatan/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteKegiatan: (id) => request(`/kegiatan/${id}`, { method: 'DELETE' }),

  updateMe: (data) =>
    request('/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  uploadAvatar: (file) => {
    const formData = new FormData()
    formData.append('avatar', file)
    return requestForm('/me/avatar', formData)
  },

  getMySiswaProfil: () => request('/me/siswa'),
  getMySiswaJadwal: () => request('/me/siswa/jadwal'),
  getMySiswaNilai: () => request('/me/siswa/nilai'),
  getMySiswaAbsensi: () => request('/me/siswa/absensi'),
  getMySiswaTagihan: () => request('/me/siswa/tagihan'),
  getMySiswaPrestasi: () => request('/me/siswa/prestasi'),

  getMyAnak: () => request('/me/anak'),
  getAnakJadwal: (siswaId) => request(`/me/anak/${siswaId}/jadwal`),
  getAnakNilai: (siswaId) => request(`/me/anak/${siswaId}/nilai`),
  getAnakAbsensi: (siswaId) => request(`/me/anak/${siswaId}/absensi`),
  getAnakTagihan: (siswaId) => request(`/me/anak/${siswaId}/tagihan`),
  getAnakRiwayatPembayaran: (siswaId) => request(`/me/anak/${siswaId}/riwayat-pembayaran`),
  getAnakPrestasi: (siswaId) => request(`/me/anak/${siswaId}/prestasi`),
  getAnakWaliKelas: (siswaId) => request(`/me/anak/${siswaId}/wali-kelas`),

  listSiswa: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/siswa${query ? `?${query}` : ''}`)
  },

  createSiswa: (data) =>
    request('/siswa', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateSiswa: (id, data) =>
    request(`/siswa/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteSiswa: (id) => request(`/siswa/${id}`, { method: 'DELETE' }),

  getMyGuruProfil: () => request('/me/guru'),
  getMyGuruJadwal: () => request('/me/guru/jadwal'),
  getMyGuruKelas: () => request('/me/guru/kelas'),
  getMyGuruMataPelajaran: () => request('/me/guru/mata-pelajaran'),
  getMyGuruRekapNilai: () => request('/me/guru/rekap-nilai'),

  getMyKelasBinaan: () => request('/me/wali-kelas'),
  getKelasBinaanSiswa: (kelasId) => request(`/me/wali-kelas/${kelasId}/siswa`),
  getKelasBinaanStruktur: (kelasId) => request(`/me/wali-kelas/${kelasId}/struktur`),
  createKelasBinaanStruktur: (kelasId, data) =>
    request(`/me/wali-kelas/${kelasId}/struktur`, { method: 'POST', body: JSON.stringify(data) }),
  deleteKelasBinaanStruktur: (kelasId, strukturId) =>
    request(`/me/wali-kelas/${kelasId}/struktur/${strukturId}`, { method: 'DELETE' }),
  getKelasBinaanRekap: (kelasId) => request(`/me/wali-kelas/${kelasId}/rekap`),
  getKelasBinaanRekapNilai: (kelasId) => request(`/me/wali-kelas/${kelasId}/rekap-nilai`),
  getKelasBinaanPerkembangan: (kelasId) => request(`/me/wali-kelas/${kelasId}/perkembangan-akademik`),
  getKelasBinaanStatusNilai: (kelasId) => request(`/me/wali-kelas/${kelasId}/status-nilai`),
  getKelasBinaanCatatanSiswa: (kelasId, params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/me/wali-kelas/${kelasId}/catatan-siswa${query ? `?${query}` : ''}`)
  },
  createCatatanSiswa: (data) =>
    request('/me/wali-kelas/catatan-siswa', { method: 'POST', body: JSON.stringify(data) }),
  updateCatatanSiswa: (id, data) =>
    request(`/me/wali-kelas/catatan-siswa/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCatatanSiswa: (id) => request(`/me/wali-kelas/catatan-siswa/${id}`, { method: 'DELETE' }),
  getKelasBinaanKonsultasiBk: (kelasId) => request(`/me/wali-kelas/${kelasId}/konsultasi-bk`),
  getKelasBinaanPengumuman: (kelasId) => request(`/me/wali-kelas/${kelasId}/pengumuman`),
  createPengumumanKelas: (kelasId, data) =>
    request(`/me/wali-kelas/${kelasId}/pengumuman`, { method: 'POST', body: JSON.stringify(data) }),
  deletePengumumanKelas: (kelasId, pengumumanId) =>
    request(`/me/wali-kelas/${kelasId}/pengumuman/${pengumumanId}`, { method: 'DELETE' }),
  getKelasBinaanKomunikasiOrtu: (kelasId) => request(`/me/wali-kelas/${kelasId}/komunikasi-ortu`),
  updateCatatanWaliKelasRapor: (raporId, data) =>
    request(`/rapor-pengesahan/${raporId}/catatan-wali-kelas`, { method: 'PUT', body: JSON.stringify(data) }),

  listNilai: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/nilai${query ? `?${query}` : ''}`)
  },
  createNilai: (data) => request('/nilai', { method: 'POST', body: JSON.stringify(data) }),
  updateNilai: (id, data) => request(`/nilai/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteNilai: (id) => request(`/nilai/${id}`, { method: 'DELETE' }),

  listNilaiSikap: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/nilai-sikap${query ? `?${query}` : ''}`)
  },
  createNilaiSikap: (data) => request('/nilai-sikap', { method: 'POST', body: JSON.stringify(data) }),
  updateNilaiSikap: (id, data) => request(`/nilai-sikap/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteNilaiSikap: (id) => request(`/nilai-sikap/${id}`, { method: 'DELETE' }),

  listGuru: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/guru${query ? `?${query}` : ''}`)
  },

  createGuru: (data) =>
    request('/guru', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateGuru: (id, data) =>
    request(`/guru/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteGuru: (id) => request(`/guru/${id}`, { method: 'DELETE' }),

  listKelas: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/kelas${query ? `?${query}` : ''}`)
  },

  createKelas: (data) =>
    request('/kelas', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateKelas: (id, data) =>
    request(`/kelas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteKelas: (id) => request(`/kelas/${id}`, { method: 'DELETE' }),

  listSurat: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/surat${query ? `?${query}` : ''}`)
  },

  createSurat: (data) => {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') formData.append(key, value)
    })
    return requestForm('/surat', formData)
  },

  updateSurat: (id, data) =>
    request(`/surat/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteSurat: (id) => request(`/surat/${id}`, { method: 'DELETE' }),

  listArsipDokumen: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/arsip-dokumen${query ? `?${query}` : ''}`)
  },

  createArsipDokumen: (data) => {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') formData.append(key, value)
    })
    return requestForm('/arsip-dokumen', formData)
  },

  updateArsipDokumen: (id, data) =>
    request(`/arsip-dokumen/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteArsipDokumen: (id) => request(`/arsip-dokumen/${id}`, { method: 'DELETE' }),

  exportGuruXlsx: async () => {
    const res = await fetch(`${BASE_URL}/guru/export`, {
      headers: { Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ...authHeaders() },
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message || `Request gagal (${res.status})`)
    }

    return res.blob()
  },

  // Prestasi & Pelanggaran
  listPrestasi: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/prestasi${query ? `?${query}` : ''}`)
  },
  createPrestasi: (data) => request('/prestasi', { method: 'POST', body: JSON.stringify(data) }),
  updatePrestasi: (id, data) => request(`/prestasi/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePrestasi: (id) => request(`/prestasi/${id}`, { method: 'DELETE' }),

  listPelanggaran: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/pelanggaran${query ? `?${query}` : ''}`)
  },
  createPelanggaran: (data) => request('/pelanggaran', { method: 'POST', body: JSON.stringify(data) }),
  updatePelanggaran: (id, data) => request(`/pelanggaran/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePelanggaran: (id) => request(`/pelanggaran/${id}`, { method: 'DELETE' }),

  // Bimbingan Konseling
  listKonseling: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/konseling${query ? `?${query}` : ''}`)
  },
  createKonseling: (data) => request('/konseling', { method: 'POST', body: JSON.stringify(data) }),
  updateKonseling: (id, data) => request(`/konseling/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteKonseling: (id) => request(`/konseling/${id}`, { method: 'DELETE' }),

  listKasus: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/kasus${query ? `?${query}` : ''}`)
  },
  createKasus: (data) => request('/kasus', { method: 'POST', body: JSON.stringify(data) }),
  updateKasus: (id, data) => request(`/kasus/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteKasus: (id) => request(`/kasus/${id}`, { method: 'DELETE' }),
  addTindakanKasus: (kasusId, data) =>
    request(`/kasus/${kasusId}/tindakan`, { method: 'POST', body: JSON.stringify(data) }),
  deleteTindakanKasus: (kasusId, tindakanId) =>
    request(`/kasus/${kasusId}/tindakan/${tindakanId}`, { method: 'DELETE' }),

  listPemanggilan: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/pemanggilan${query ? `?${query}` : ''}`)
  },
  createPemanggilan: (data) => request('/pemanggilan', { method: 'POST', body: JSON.stringify(data) }),
  updatePemanggilan: (id, data) => request(`/pemanggilan/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePemanggilan: (id) => request(`/pemanggilan/${id}`, { method: 'DELETE' }),

  getBkPerluPendampingan: () => request('/bk/perlu-pendampingan'),
  getBkRekapKasus: () => request('/bk/rekap-kasus'),
  getBkStatistik: () => request('/bk/statistik'),
  getBkLaporan: () => request('/bk/laporan'),

  // Kepala Sekolah — data pemantauan (read-only)
  getPrincipalDashboard: () => request('/principal/dashboard'),
  getPrincipalAkademik: () => request('/principal/akademik'),
  getPrincipalKesiswaan: () => request('/principal/kesiswaan'),
  getPrincipalKehadiran: () => request('/principal/kehadiran'),
  getPrincipalKepegawaian: () => request('/principal/kepegawaian'),
  getPrincipalSarpras: () => request('/principal/sarpras'),
  getPrincipalKeuangan: () => request('/principal/keuangan'),

  // Tagihan & Pembayaran (Keuangan/SPP)
  listTagihan: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/tagihan${query ? `?${query}` : ''}`)
  },
  createTagihan: (data) => request('/tagihan', { method: 'POST', body: JSON.stringify(data) }),
  updateTagihan: (id, data) => request(`/tagihan/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTagihan: (id) => request(`/tagihan/${id}`, { method: 'DELETE' }),
  listPembayaran: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/pembayaran${query ? `?${query}` : ''}`)
  },
  createPembayaran: (tagihanId, data) =>
    request(`/tagihan/${tagihanId}/pembayaran`, { method: 'POST', body: JSON.stringify(data) }),
  deletePembayaran: (tagihanId, pembayaranId) =>
    request(`/tagihan/${tagihanId}/pembayaran/${pembayaranId}`, { method: 'DELETE' }),

  // Anggaran Sekolah / RKAS
  listAnggaranPos: () => request('/anggaran-pos'),
  createAnggaranPos: (data) => request('/anggaran-pos', { method: 'POST', body: JSON.stringify(data) }),
  updateAnggaranPos: (id, data) => request(`/anggaran-pos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAnggaranPos: (id) => request(`/anggaran-pos/${id}`, { method: 'DELETE' }),
  listSumberDana: () => request('/sumber-dana'),
  createSumberDana: (data) => request('/sumber-dana', { method: 'POST', body: JSON.stringify(data) }),
  updateSumberDana: (id, data) => request(`/sumber-dana/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSumberDana: (id) => request(`/sumber-dana/${id}`, { method: 'DELETE' }),
  listPengajuanAnggaran: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/pengajuan-anggaran${query ? `?${query}` : ''}`)
  },
  createPengajuanAnggaran: (data) =>
    request('/pengajuan-anggaran', { method: 'POST', body: JSON.stringify(data) }),
  approvePengajuanAnggaran: (id, data = {}) =>
    request(`/pengajuan-anggaran/${id}/approve`, { method: 'POST', body: JSON.stringify(data) }),
  rejectPengajuanAnggaran: (id, data) =>
    request(`/pengajuan-anggaran/${id}/reject`, { method: 'POST', body: JSON.stringify(data) }),
  createRealisasiAnggaran: (pengajuanId, data) =>
    request(`/pengajuan-anggaran/${pengajuanId}/realisasi`, { method: 'POST', body: JSON.stringify(data) }),
  getRealisasiAnggaran: () => request('/realisasi-anggaran'),

  // Laporan Keuangan (Bendahara)
  getLaporanPenerimaan: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/laporan-keuangan/penerimaan${query ? `?${query}` : ''}`)
  },
  getLaporanPengeluaran: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/laporan-keuangan/pengeluaran${query ? `?${query}` : ''}`)
  },
  getLaporanTunggakan: () => request('/laporan-keuangan/tunggakan'),
  getLaporanAnggaran: () => request('/laporan-keuangan/anggaran'),
  getLaporanKeuanganRingkasan: () => request('/laporan-keuangan/ringkasan'),

  // Kepegawaian — pengajuan & persetujuan
  listPengajuanKepegawaian: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/pengajuan-kepegawaian${query ? `?${query}` : ''}`)
  },
  createPengajuanKepegawaian: (data) =>
    request('/pengajuan-kepegawaian', { method: 'POST', body: JSON.stringify(data) }),
  approvePengajuanKepegawaian: (id, data = {}) =>
    request(`/pengajuan-kepegawaian/${id}/approve`, { method: 'POST', body: JSON.stringify(data) }),
  rejectPengajuanKepegawaian: (id, data) =>
    request(`/pengajuan-kepegawaian/${id}/reject`, { method: 'POST', body: JSON.stringify(data) }),

  // E-Rapor — pengajuan & pengesahan
  listRaporPengesahan: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/rapor-pengesahan${query ? `?${query}` : ''}`)
  },
  ajukanRapor: (data) => request('/rapor-pengesahan', { method: 'POST', body: JSON.stringify(data) }),
  sahkanRapor: (id, data = {}) =>
    request(`/rapor-pengesahan/${id}/sahkan`, { method: 'POST', body: JSON.stringify(data) }),
  tolakRapor: (id, data) =>
    request(`/rapor-pengesahan/${id}/tolak`, { method: 'POST', body: JSON.stringify(data) }),
  downloadRapor: (siswaId, semester, tahunAjaran) =>
    downloadFile(
      `/siswa/${siswaId}/rapor?semester=${encodeURIComponent(semester)}&tahun_ajaran=${encodeURIComponent(tahunAjaran)}`,
      `rapor-${siswaId}-${semester}-${tahunAjaran}.pdf`
    ),
}
