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

// Link keluar dari landing sekolah menuju landing/portal Super Admin. Cukup
// ganti hostname halaman ke salah satu domain central (port frontend tetap
// sama) — karena SPA ini satu build yang sama, cabang Platform vs Sekolah
// ditentukan murni dari domain yang dibuka, bukan dari build yang berbeda.
export const SUPER_ADMIN_URL = `${window.location.protocol}//${CENTRAL_DOMAINS[1]}${
  window.location.port ? `:${window.location.port}` : ''
}`

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

  // Akses & Hak Sekolah (Super Admin)
  updateSekolahStatus: (sekolahId, status) =>
    request(`/api/sekolah/${sekolahId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  getSekolahAdmins: (sekolahId) => request(`/api/sekolah/${sekolahId}/admins`),

  createSekolahAdmin: (sekolahId, data) =>
    request(`/api/sekolah/${sekolahId}/admins`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteSekolahAdmin: (sekolahId, userId) =>
    request(`/api/sekolah/${sekolahId}/admins/${userId}`, { method: 'DELETE' }),

  getSekolahRoles: (sekolahId) => request(`/api/sekolah/${sekolahId}/roles`),

  updateSekolahRolePermissions: (sekolahId, roleId, permissions) =>
    request(`/api/sekolah/${sekolahId}/roles/${roleId}`, {
      method: 'PATCH',
      body: JSON.stringify({ permissions }),
    }),

  getPermissionsCatalog: () => request('/api/permissions-catalog'),

  // Sinkronisasi Data (Super Admin, lintas sekolah)
  getSyncLogNasional: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/api/sinkronisasi/log${query ? `?${query}` : ''}`)
  },

  getSyncConflicts: () => request('/api/sinkronisasi/konflik'),

  forceSyncSekolah: (sekolahId) =>
    request(`/api/sekolah/${sekolahId}/sinkronisasi`, { method: 'POST' }),

  // Audit & Monitoring (Super Admin, lintas sekolah)
  getAuditLogNasional: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/api/audit/log${query ? `?${query}` : ''}`)
  },

  getAuditNotifikasi: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/api/audit/notifikasi${query ? `?${query}` : ''}`)
  },

  getLaporanWilayah: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/api/audit/laporan-wilayah${query ? `?${query}` : ''}`)
  },

  exportLaporanWilayah: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return downloadFile(`/api/audit/laporan-wilayah/export${query ? `?${query}` : ''}`, 'laporan-aktivitas.xlsx')
  },

  // Statistik & Analitik (Super Admin, nasional)
  getStatistikRingkasan: () => request('/api/statistik/ringkasan'),

  getStatistikWilayah: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/api/statistik/wilayah${query ? `?${query}` : ''}`)
  },

  getStatistikJenjang: () => request('/api/statistik/jenjang'),

  getPetaSebaran: () => request('/api/statistik/peta'),

  // Sistem & Konfigurasi (Super Admin, nasional)
  getModuleCatalog: () => request('/api/modules/catalog'),
  getSekolahModules: (sekolahId) => request(`/api/sekolah/${sekolahId}/modules`),
  updateSekolahModules: (sekolahId, modules) =>
    request(`/api/sekolah/${sekolahId}/modules`, {
      method: 'PATCH',
      body: JSON.stringify({ modules }),
    }),

  getSystemInfo: () => request('/api/system-info'),
  listNationalBackups: () => request('/api/backup-nasional'),
  createNationalBackup: () => request('/api/backup-nasional', { method: 'POST' }),
  deleteNationalBackup: (name) => request(`/api/backup-nasional/${name}`, { method: 'DELETE' }),
  restoreNationalBackup: (name) => request(`/api/backup-nasional/${name}/restore`, { method: 'POST' }),
  downloadNationalBackup: (name) => downloadFile(`/api/backup-nasional/${name}/download`, name),

  listIntegrationTokens: () => request('/api/integrasi-token'),
  createIntegrationToken: (data) =>
    request('/api/integrasi-token', { method: 'POST', body: JSON.stringify(data) }),
  deleteIntegrationToken: (id) => request(`/api/integrasi-token/${id}`, { method: 'DELETE' }),

  // Pengguna & Role (Super Admin, nasional)
  getAdminSekolahNasional: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/api/admin-sekolah${query ? `?${query}` : ''}`)
  },

  resetAdminSekolahPassword: (sekolahId, userId) =>
    request(`/api/sekolah/${sekolahId}/admins/${userId}/reset-password`, { method: 'POST' }),

  toggleAdminSekolahActive: (sekolahId, userId, isActive) =>
    request(`/api/sekolah/${sekolahId}/admins/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    }),

  getRolesKatalog: () => request('/api/roles-katalog'),

  // Keamanan (Super Admin, nasional)
  getSecuritySettings: () => request('/api/security/settings'),
  updatePiiMasking: (enabled) =>
    request('/api/security/pii', { method: 'PATCH', body: JSON.stringify({ mask_pii_enabled: enabled }) }),
  updateRetentionPolicy: (days) =>
    request('/api/security/retention', { method: 'PATCH', body: JSON.stringify({ log_retention_days: days }) }),
  getRetentionPreview: () => request('/api/security/retention/preview'),
  purgeRetention: () => request('/api/security/retention/purge', { method: 'POST' }),

  verifyTwoFactor: (challenge, code) =>
    request('/api/2fa/verify', { method: 'POST', body: JSON.stringify({ challenge, code }) }),
  getTwoFactorStatus: () => request('/api/2fa/status'),
  setupTwoFactor: () => request('/api/2fa/setup', { method: 'POST' }),
  confirmTwoFactor: (code) => request('/api/2fa/confirm', { method: 'POST', body: JSON.stringify({ code }) }),
  disableTwoFactor: (password) =>
    request('/api/2fa/disable', { method: 'POST', body: JSON.stringify({ password }) }),
  regenerateRecoveryCodes: (password) =>
    request('/api/2fa/recovery-codes/regenerate', { method: 'POST', body: JSON.stringify({ password }) }),

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

  tarikDataSekarang: () => request('/sinkronisasi', { method: 'POST' }),
  getSyncLogSekolah: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/sinkronisasi${query ? `?${query}` : ''}`)
  },

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

  listTahunAjaranKurikulum: () => request('/kurikulum/tahun-ajaran'),
  getKurikulumDashboard: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/kurikulum/dashboard${query ? `?${query}` : ''}`)
  },

  listMataPelajaran: (params = {}) => {
    const query = new URLSearchParams({ per_page: 100, ...params }).toString()
    return request(`/mata-pelajaran?${query}`)
  },

  getMataPelajaran: (id) => request(`/mata-pelajaran/${id}`),

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
  aktifkanMataPelajaran: (id) => request(`/mata-pelajaran/${id}/aktifkan`, { method: 'POST' }),
  nonaktifkanMataPelajaran: (id) => request(`/mata-pelajaran/${id}/nonaktifkan`, { method: 'POST' }),
  exportMataPelajaran: () => downloadFile('/mata-pelajaran/export', 'mata-pelajaran.xlsx'),
  downloadMataPelajaranTemplate: () =>
    downloadFile('/mata-pelajaran/import-template', 'template-import-mata-pelajaran.xlsx'),
  importMataPelajaran: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return requestForm('/mata-pelajaran/import', formData)
  },

  // Struktur Kurikulum
  listStrukturKurikulum: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/struktur-kurikulum${query ? `?${query}` : ''}`)
  },
  getStrukturKurikulum: (id) => request(`/struktur-kurikulum/${id}`),
  createStrukturKurikulum: (data) => request('/struktur-kurikulum', { method: 'POST', body: JSON.stringify(data) }),
  updateStrukturKurikulum: (id, data) => request(`/struktur-kurikulum/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStrukturKurikulum: (id) => request(`/struktur-kurikulum/${id}`, { method: 'DELETE' }),
  aktifkanStrukturKurikulum: (id) => request(`/struktur-kurikulum/${id}/aktifkan`, { method: 'POST' }),
  nonaktifkanStrukturKurikulum: (id) => request(`/struktur-kurikulum/${id}/nonaktifkan`, { method: 'POST' }),
  duplikasiStrukturKurikulum: (id, tahunAjaranId) =>
    request(`/struktur-kurikulum/${id}/duplikasi`, { method: 'POST', body: JSON.stringify({ tahun_ajaran_id: tahunAjaranId }) }),
  exportStrukturKurikulum: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return downloadFile(`/struktur-kurikulum/export${query ? `?${query}` : ''}`, 'struktur-kurikulum.xlsx')
  },
  downloadStrukturKurikulumTemplate: () =>
    downloadFile('/struktur-kurikulum/import-template', 'template-import-struktur-kurikulum.xlsx'),
  importStrukturKurikulum: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return requestForm('/struktur-kurikulum/import', formData)
  },

  // Capaian Pembelajaran
  listCapaianPembelajaran: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/capaian-pembelajaran${query ? `?${query}` : ''}`)
  },
  getCapaianPembelajaran: (id) => request(`/capaian-pembelajaran/${id}`),
  createCapaianPembelajaran: (data) => request('/capaian-pembelajaran', { method: 'POST', body: JSON.stringify(data) }),
  updateCapaianPembelajaran: (id, data) => request(`/capaian-pembelajaran/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCapaianPembelajaran: (id) => request(`/capaian-pembelajaran/${id}`, { method: 'DELETE' }),
  duplikasiCapaianPembelajaran: (id, tahunAjaranId) =>
    request(`/capaian-pembelajaran/${id}/duplikasi`, { method: 'POST', body: JSON.stringify({ tahun_ajaran_id: tahunAjaranId }) }),
  exportCapaianPembelajaran: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return downloadFile(`/capaian-pembelajaran/export${query ? `?${query}` : ''}`, 'capaian-pembelajaran.xlsx')
  },
  downloadCapaianPembelajaranTemplate: () =>
    downloadFile('/capaian-pembelajaran/import-template', 'template-import-capaian-pembelajaran.xlsx'),
  importCapaianPembelajaran: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return requestForm('/capaian-pembelajaran/import', formData)
  },

  // Tujuan Pembelajaran
  listTujuanPembelajaran: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/tujuan-pembelajaran${query ? `?${query}` : ''}`)
  },
  getTujuanPembelajaran: (id) => request(`/tujuan-pembelajaran/${id}`),
  createTujuanPembelajaran: (data) => request('/tujuan-pembelajaran', { method: 'POST', body: JSON.stringify(data) }),
  updateTujuanPembelajaran: (id, data) => request(`/tujuan-pembelajaran/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTujuanPembelajaran: (id) => request(`/tujuan-pembelajaran/${id}`, { method: 'DELETE' }),
  updateProgresTujuanPembelajaran: (id, progres) =>
    request(`/tujuan-pembelajaran/${id}/progres`, { method: 'POST', body: JSON.stringify({ progres }) }),
  duplikasiTujuanPembelajaran: (id, data) =>
    request(`/tujuan-pembelajaran/${id}/duplikasi`, { method: 'POST', body: JSON.stringify(data) }),
  exportTujuanPembelajaran: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return downloadFile(`/tujuan-pembelajaran/export${query ? `?${query}` : ''}`, 'tujuan-pembelajaran.xlsx')
  },
  downloadTujuanPembelajaranTemplate: () =>
    downloadFile('/tujuan-pembelajaran/import-template', 'template-import-tujuan-pembelajaran.xlsx'),
  importTujuanPembelajaran: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return requestForm('/tujuan-pembelajaran/import', formData)
  },

  // Indikator kompetensi/ketercapaian — digabung di bawah satu TP, bukan menu tersendiri
  listIndikatorTp: (tpId) => request(`/tujuan-pembelajaran/${tpId}/indikator`),
  createIndikatorTp: (tpId, data) =>
    request(`/tujuan-pembelajaran/${tpId}/indikator`, { method: 'POST', body: JSON.stringify(data) }),
  updateIndikatorTp: (id, data) =>
    request(`/tujuan-pembelajaran/indikator/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteIndikatorTp: (id) => request(`/tujuan-pembelajaran/indikator/${id}`, { method: 'DELETE' }),
  reorderIndikatorTp: (tpId, urutan) =>
    request(`/tujuan-pembelajaran/${tpId}/indikator/reorder`, { method: 'POST', body: JSON.stringify({ urutan }) }),

  // Program Tahunan
  listProgramTahunan: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/program-tahunan${query ? `?${query}` : ''}`)
  },
  getProgramTahunan: (id) => request(`/program-tahunan/${id}`),
  createProgramTahunan: (data) => request('/program-tahunan', { method: 'POST', body: JSON.stringify(data) }),
  updateProgramTahunan: (id, data) => request(`/program-tahunan/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProgramTahunan: (id) => request(`/program-tahunan/${id}`, { method: 'DELETE' }),
  updateStatusDokumenProgramTahunan: (id, data) =>
    request(`/program-tahunan/${id}/status-dokumen`, { method: 'POST', body: JSON.stringify(data) }),
  exportProgramTahunan: (id) => downloadFile(`/program-tahunan/${id}/export`, 'program-tahunan.xlsx'),
  getOpsiProgramTahunan: (params = {}) => request(`/program-tahunan/opsi?${new URLSearchParams(params).toString()}`),

  // Program Semester
  listProgramSemester: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/program-semester${query ? `?${query}` : ''}`)
  },
  getProgramSemester: (id) => request(`/program-semester/${id}`),
  createProgramSemester: (data) => request('/program-semester', { method: 'POST', body: JSON.stringify(data) }),
  updateProgramSemester: (id, data) => request(`/program-semester/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProgramSemester: (id) => request(`/program-semester/${id}`, { method: 'DELETE' }),
  updateStatusDokumenProgramSemester: (id, status) =>
    request(`/program-semester/${id}/status-dokumen`, { method: 'POST', body: JSON.stringify({ status_dokumen: status }) }),
  exportProgramSemester: (id) => downloadFile(`/program-semester/${id}/export`, 'program-semester.xlsx'),
  getOpsiProgramSemester: (params = {}) => request(`/program-semester/opsi?${new URLSearchParams(params).toString()}`),

  // KKM / KKTP
  listKkmKktp: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/kkm-kktp${query ? `?${query}` : ''}`)
  },
  getKkmKktp: (id) => request(`/kkm-kktp/${id}`),
  createKkmKktp: (data) => request('/kkm-kktp', { method: 'POST', body: JSON.stringify(data) }),
  updateKkmKktp: (id, data) => request(`/kkm-kktp/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteKkmKktp: (id) => request(`/kkm-kktp/${id}`, { method: 'DELETE' }),
  updateStatusKkmKktp: (id, status) => request(`/kkm-kktp/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }),
  getOpsiTautanKkmKktp: (params) => request(`/kkm-kktp/opsi-tautan?${new URLSearchParams(params).toString()}`),

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
  getMySiswaAbsensi: (params = {}) => {
    const query = new URLSearchParams({ per_page: 500, ...params }).toString()
    return request(`/me/siswa/absensi?${query}`)
  },
  ajukanAbsensiSaya: (data) =>
    request('/me/siswa/absensi/ajukan', { method: 'POST', body: JSON.stringify(data) }),
  updateKeteranganAbsensiSaya: (absensiId, keterangan) =>
    request(`/me/siswa/absensi/${absensiId}/keterangan`, { method: 'PUT', body: JSON.stringify({ keterangan }) }),
  getMySiswaTagihan: () => request('/me/siswa/tagihan'),
  getMySiswaPrestasi: () => request('/me/siswa/prestasi'),
  submitPrestasiSaya: ({ judul, tingkat, tanggal, keterangan, file }) => {
    const formData = new FormData()
    formData.append('judul', judul)
    formData.append('tingkat', tingkat)
    formData.append('tanggal', tanggal)
    if (keterangan) formData.append('keterangan', keterangan)
    if (file) formData.append('file', file)
    return requestForm('/me/siswa/prestasi', formData)
  },
  deletePrestasiSaya: (prestasiId) => request(`/me/siswa/prestasi/${prestasiId}`, { method: 'DELETE' }),

  getMySiswaMateri: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/me/siswa/materi${query ? `?${query}` : ''}`)
  },
  getMySiswaTugas: () => request('/me/siswa/tugas'),
  submitMySiswaTugas: (tugasId, { jawaban_text, file } = {}) => {
    const formData = new FormData()
    if (jawaban_text) formData.append('jawaban_text', jawaban_text)
    if (file) formData.append('file', file)
    return requestForm(`/me/siswa/tugas/${tugasId}/jawaban`, formData)
  },
  getMySiswaUjianList: () => request('/me/siswa/ujian'),
  mulaiMySiswaUjian: (ujianId) => request(`/me/siswa/ujian/${ujianId}/mulai`, { method: 'POST' }),
  jawabMySiswaUjian: (ujianId, data) =>
    request(`/me/siswa/ujian/${ujianId}/jawab`, { method: 'POST', body: JSON.stringify(data) }),
  selesaiMySiswaUjian: (ujianId) => request(`/me/siswa/ujian/${ujianId}/selesai`, { method: 'POST' }),
  getMySiswaUjianHasil: (ujianId) => request(`/me/siswa/ujian/${ujianId}/hasil`),

  getMyAnak: () => request('/me/anak'),
  getAnakJadwal: (siswaId) => request(`/me/anak/${siswaId}/jadwal`),
  getAnakNilai: (siswaId) => request(`/me/anak/${siswaId}/nilai`),
  getAnakAbsensi: (siswaId) => request(`/me/anak/${siswaId}/absensi`),
  getAnakTagihan: (siswaId) => request(`/me/anak/${siswaId}/tagihan`),
  getAnakRiwayatPembayaran: (siswaId) => request(`/me/anak/${siswaId}/riwayat-pembayaran`),
  getAnakPrestasi: (siswaId) => request(`/me/anak/${siswaId}/prestasi`),
  getAnakWaliKelas: (siswaId) => request(`/me/anak/${siswaId}/wali-kelas`),
  getAnakVirtualAccount: (siswaId) => request(`/me/anak/${siswaId}/virtual-account`),
  getAnakQris: (siswaId, tagihanId) => request(`/me/anak/${siswaId}/tagihan/${tagihanId}/qris`),
  getAnakSaldo: (siswaId) => request(`/me/anak/${siswaId}/saldo`),
  isiSaldoAnak: (siswaId, data) =>
    request(`/me/anak/${siswaId}/saldo/isi`, { method: 'POST', body: JSON.stringify(data) }),
  getAnakTugas: (siswaId) => request(`/me/anak/${siswaId}/tugas`),

  // Konfirmasi pembayaran manual (orang tua unggah bukti transfer)
  getMyKonfirmasiPembayaran: () => request('/me/konfirmasi-pembayaran'),
  createKonfirmasiPembayaran: ({ tagihan_id, jumlah, tanggal_transfer, metode, catatan, bukti }) => {
    const formData = new FormData()
    formData.append('tagihan_id', tagihan_id)
    formData.append('jumlah', jumlah)
    formData.append('tanggal_transfer', tanggal_transfer)
    if (metode) formData.append('metode', metode)
    if (catatan) formData.append('catatan', catatan)
    formData.append('bukti', bukti)
    return requestForm('/me/konfirmasi-pembayaran', formData)
  },
  listKonfirmasiPembayaran: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/konfirmasi-pembayaran${query ? `?${query}` : ''}`)
  },
  verifikasiKonfirmasiPembayaran: (id) =>
    request(`/konfirmasi-pembayaran/${id}/verifikasi`, { method: 'POST' }),
  tolakKonfirmasiPembayaran: (id, data) =>
    request(`/konfirmasi-pembayaran/${id}/tolak`, { method: 'POST', body: JSON.stringify(data) }),
  buktiPembayaranUrl: (buktiPath) => `${BASE_URL}/bukti-pembayaran-file/${buktiPath.replace('bukti-pembayaran/', '')}`,

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
  listModulAjar: () => request('/me/guru/modul-ajar'),
  createModulAjar: (data) => request('/me/guru/modul-ajar', { method: 'POST', body: JSON.stringify(data) }),
  updateModulAjar: (id, data) => request(`/me/guru/modul-ajar/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteModulAjar: (id) => request(`/me/guru/modul-ajar/${id}`, { method: 'DELETE' }),
  uploadMyGuruSertifikat: (files) => {
    const formData = new FormData()
    files.forEach((f) => formData.append('files[]', f))
    return requestForm('/me/guru/sertifikat', formData)
  },
  deleteMyGuruSertifikat: (id) => request(`/me/guru/sertifikat/${id}`, { method: 'DELETE' }),
  updateMyGuruProfilProfesional: (data) => request('/me/guru/profil-profesional', { method: 'PUT', body: JSON.stringify(data) }),
  updateMyGuruTugasTambahan: (tugasTambahan) =>
    request('/me/guru/tugas-tambahan', { method: 'PUT', body: JSON.stringify({ tugas_tambahan: tugasTambahan }) }),
  getMyGuruJadwal: () => request('/me/guru/jadwal'),
  getMyGuruKelas: () => request('/me/guru/kelas'),
  getMyGuruMataPelajaran: () => request('/me/guru/mata-pelajaran'),
  getMyGuruRekapNilai: () => request('/me/guru/rekap-nilai'),

  getMyKelasBinaan: () => request('/me/wali-kelas'),
  getKelasBinaanSiswa: (kelasId) => request(`/me/wali-kelas/${kelasId}/siswa`),
  createKelasBinaanSiswa: (kelasId, data) =>
    request(`/me/wali-kelas/${kelasId}/siswa`, { method: 'POST', body: JSON.stringify(data) }),
  updateKelasBinaanSiswa: (kelasId, siswaId, data) =>
    request(`/me/wali-kelas/${kelasId}/siswa/${siswaId}`, { method: 'PUT', body: JSON.stringify(data) }),
  keluarkanKelasBinaanSiswa: (kelasId, siswaId, data) =>
    request(`/me/wali-kelas/${kelasId}/siswa/${siswaId}`, { method: 'DELETE', body: JSON.stringify(data) }),
  getKelasBinaanStruktur: (kelasId) => request(`/me/wali-kelas/${kelasId}/struktur`),
  createKelasBinaanStruktur: (kelasId, data) =>
    request(`/me/wali-kelas/${kelasId}/struktur`, { method: 'POST', body: JSON.stringify(data) }),
  deleteKelasBinaanStruktur: (kelasId, strukturId) =>
    request(`/me/wali-kelas/${kelasId}/struktur/${strukturId}`, { method: 'DELETE' }),
  getKelasBinaanRekap: (kelasId) => request(`/me/wali-kelas/${kelasId}/rekap`),
  getKelasBinaanRekapNilai: (kelasId) => request(`/me/wali-kelas/${kelasId}/rekap-nilai`),
  getKelasBinaanPerkembangan: (kelasId) => request(`/me/wali-kelas/${kelasId}/perkembangan-akademik`),
  getKelasBinaanStatusNilai: (kelasId) => request(`/me/wali-kelas/${kelasId}/status-nilai`),
  getKelasBinaanKonsultasiBk: (kelasId) => request(`/me/wali-kelas/${kelasId}/konsultasi-bk`),
  getKelasBinaanPengumuman: (kelasId) => request(`/me/wali-kelas/${kelasId}/pengumuman`),
  createPengumumanKelas: (kelasId, data) =>
    request(`/me/wali-kelas/${kelasId}/pengumuman`, { method: 'POST', body: JSON.stringify(data) }),
  updatePengumumanKelas: (kelasId, pengumumanId, data) =>
    request(`/me/wali-kelas/${kelasId}/pengumuman/${pengumumanId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePengumumanKelas: (kelasId, pengumumanId) =>
    request(`/me/wali-kelas/${kelasId}/pengumuman/${pengumumanId}`, { method: 'DELETE' }),
  getKelasBinaanKomunikasiOrtu: (kelasId) => request(`/me/wali-kelas/${kelasId}/komunikasi-ortu`),
  updateKontakWali: (kelasId, siswaId, data) =>
    request(`/me/wali-kelas/${kelasId}/komunikasi-ortu/${siswaId}`, { method: 'PUT', body: JSON.stringify(data) }),
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
  getKelas: (id) => request(`/kelas/${id}`),
  getOpsiKelas: () => request('/kelas/opsi'),
  updateStatusKelas: (id, status) =>
    request(`/kelas/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }),
  duplikasiKelas: (id, data) =>
    request(`/kelas/${id}/duplikasi`, { method: 'POST', body: JSON.stringify(data) }),

  // Rombongan Belajar (keanggotaan siswa pada kelas)
  listSiswaTersediaRombel: (search = '') => request(`/rombel/siswa-tersedia?search=${encodeURIComponent(search)}`),
  tambahSiswaRombel: (id, siswaIds) =>
    request(`/rombel/${id}/siswa`, { method: 'POST', body: JSON.stringify({ siswa_ids: siswaIds }) }),
  keluarkanSiswaRombel: (id, siswaIds) =>
    request(`/rombel/${id}/keluarkan`, { method: 'POST', body: JSON.stringify({ siswa_ids: siswaIds }) }),
  pindahSiswaRombel: (id, siswaIds, tujuanKelasId) =>
    request(`/rombel/${id}/pindah`, {
      method: 'POST',
      body: JSON.stringify({ siswa_ids: siswaIds, tujuan_kelas_id: tujuanKelasId }),
    }),
  exportSiswaRombel: (id, nama = 'rombel') => downloadFile(`/rombel/${id}/export`, `siswa-${nama}.xlsx`),
  downloadTemplateSiswaRombel: () => downloadFile('/rombel/import-template', 'template-import-siswa-rombel.xlsx'),
  importSiswaRombel: (id, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return requestForm(`/rombel/${id}/import`, formData)
  },

  // Pembagian Mata Pelajaran
  listPembagianMapel: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/pembagian-mapel${query ? `?${query}` : ''}`)
  },
  getOpsiPembagianMapel: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/pembagian-mapel/opsi${query ? `?${query}` : ''}`)
  },
  createPembagianMapel: (data) => request('/pembagian-mapel', { method: 'POST', body: JSON.stringify(data) }),
  updatePembagianMapel: (id, data) => request(`/pembagian-mapel/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePembagianMapel: (id) => request(`/pembagian-mapel/${id}`, { method: 'DELETE' }),
  updateStatusPembagianMapel: (ids, status) =>
    request('/pembagian-mapel/status', { method: 'POST', body: JSON.stringify({ ids, status }) }),
  duplikasiPembagianMapel: (data) => request('/pembagian-mapel/duplikasi', { method: 'POST', body: JSON.stringify(data) }),
  getBebanPembagianMapel: (params) => request(`/pembagian-mapel/beban?${new URLSearchParams(params).toString()}`),
  getMonitoringPembagianMapel: (params) => request(`/pembagian-mapel/monitoring?${new URLSearchParams(params).toString()}`),
  getRiwayatPembagianMapel: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/pembagian-mapel/riwayat${query ? `?${query}` : ''}`)
  },

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
  getPrincipalInsights: () => request('/principal/insights'),

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
  getPenerimaanHarian: () => request('/laporan-keuangan/penerimaan-harian'),
  getPenerimaanPerJenis: () => request('/laporan-keuangan/penerimaan-per-jenis'),

  // Pembayaran Online (Virtual Account & QRIS tanpa payment gateway pihak ketiga)
  getPembayaranOnlinePengaturan: () => request('/pembayaran-online/pengaturan'),
  updatePembayaranOnlinePengaturan: (data) =>
    request('/pembayaran-online/pengaturan', { method: 'PUT', body: JSON.stringify(data) }),
  listVirtualAccount: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/pembayaran-online/virtual-account${query ? `?${query}` : ''}`)
  },
  getQrisTagihan: (tagihanId) => request(`/pembayaran-online/tagihan/${tagihanId}/qris`),
  listMutasiBank: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/pembayaran-online/mutasi${query ? `?${query}` : ''}`)
  },
  createMutasiBank: (data) => request('/pembayaran-online/mutasi', { method: 'POST', body: JSON.stringify(data) }),
  cocokkanMutasiBank: (id, tagihanId) =>
    request(`/pembayaran-online/mutasi/${id}/cocokkan`, { method: 'POST', body: JSON.stringify({ tagihan_id: tagihanId }) }),
  abaikanMutasiBank: (id) => request(`/pembayaran-online/mutasi/${id}/abaikan`, { method: 'POST' }),
  deleteMutasiBank: (id) => request(`/pembayaran-online/mutasi/${id}`, { method: 'DELETE' }),

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
  deleteRapor: (id) => request(`/rapor-pengesahan/${id}`, { method: 'DELETE' }),
  sahkanRapor: (id, data = {}) =>
    request(`/rapor-pengesahan/${id}/sahkan`, { method: 'POST', body: JSON.stringify(data) }),
  tolakRapor: (id, data) =>
    request(`/rapor-pengesahan/${id}/tolak`, { method: 'POST', body: JSON.stringify(data) }),
  downloadRapor: (siswaId, semester, tahunAjaran) =>
    downloadFile(
      `/siswa/${siswaId}/rapor?semester=${encodeURIComponent(semester)}&tahun_ajaran=${encodeURIComponent(tahunAjaran)}`,
      `rapor-${siswaId}-${semester}-${tahunAjaran}.pdf`
    ),

  // Pembelajaran (Materi / Tugas / Ujian) — sisi guru mata pelajaran
  listMateri: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/materi${query ? `?${query}` : ''}`)
  },
  createMateri: (data) => {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') formData.append(key, value)
    })
    return requestForm('/materi', formData)
  },
  updateMateri: (id, data) =>
    request(`/materi/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMateri: (id) => request(`/materi/${id}`, { method: 'DELETE' }),

  listTugas: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/tugas${query ? `?${query}` : ''}`)
  },
  createTugas: (data) => {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') formData.append(key, value)
    })
    return requestForm('/tugas', formData)
  },
  updateTugas: (id, data) =>
    request(`/tugas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTugas: (id) => request(`/tugas/${id}`, { method: 'DELETE' }),
  listTugasJawaban: (tugasId) => request(`/tugas/${tugasId}/jawaban`),
  nilaiTugasJawaban: (id, data) =>
    request(`/tugas-jawaban/${id}/nilai`, { method: 'POST', body: JSON.stringify(data) }),

  listUjian: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/ujian${query ? `?${query}` : ''}`)
  },
  getUjian: (id) => request(`/ujian/${id}`),
  createUjian: (data) => request('/ujian', { method: 'POST', body: JSON.stringify(data) }),
  updateUjian: (id, data) => request(`/ujian/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUjian: (id) => request(`/ujian/${id}`, { method: 'DELETE' }),
  listUjianSoal: (ujianId) => request(`/ujian/${ujianId}/soal`),
  createUjianSoal: (ujianId, data) =>
    request(`/ujian/${ujianId}/soal`, { method: 'POST', body: JSON.stringify(data) }),
  updateUjianSoal: (soalId, data) =>
    request(`/ujian-soal/${soalId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUjianSoal: (soalId) => request(`/ujian-soal/${soalId}`, { method: 'DELETE' }),
  listUjianAttempts: (ujianId) => request(`/ujian/${ujianId}/attempts`),
}
