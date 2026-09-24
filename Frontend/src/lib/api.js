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

  getMyStaffProfil: () => request('/me/profil-staf'),
  updateMyStaffProfil: (data) => request('/me/profil-staf', { method: 'PUT', body: JSON.stringify(data) }),
  uploadMyStaffSertifikat: (files) => {
    const formData = new FormData()
    files.forEach((f) => formData.append('files[]', f))
    return requestForm('/me/profil-staf/sertifikat', formData)
  },
  deleteMyStaffSertifikat: (id) => request(`/me/profil-staf/sertifikat/${id}`, { method: 'DELETE' }),

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
  getMySiswaSaldo: () => request('/me/siswa/saldo'),
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

  // Guru Pengganti
  getOpsiGuruPengganti: () => request('/guru-pengganti/opsi'),
  listGuruPengganti: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/guru-pengganti${query ? `?${query}` : ''}`)
  },
  getGuruPengganti: (id) => request(`/guru-pengganti/${id}`),
  getJadwalGuruPengganti: (params) => request(`/guru-pengganti/jadwal-guru?${new URLSearchParams(params).toString()}`),
  getKetersediaanGuru: (params) => request(`/guru-pengganti/ketersediaan?${new URLSearchParams(params).toString()}`),
  createGuruPengganti: (data) => request('/guru-pengganti', { method: 'POST', body: JSON.stringify(data) }),
  updateGuruPengganti: (id, data) => request(`/guru-pengganti/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  keputusanGuruPengganti: (id, data) =>
    request(`/guru-pengganti/${id}/keputusan`, { method: 'POST', body: JSON.stringify(data) }),
  batalkanGuruPengganti: (id, data = {}) =>
    request(`/guru-pengganti/${id}/batalkan`, { method: 'POST', body: JSON.stringify(data) }),
  getRiwayatGuruPengganti: () => request('/guru-pengganti/riwayat'),
  exportGuruPengganti: (params = {}) =>
    downloadFile(`/guru-pengganti/export?${new URLSearchParams(params).toString()}`, 'guru-pengganti.xlsx'),

  // Perubahan Jadwal
  getOpsiPerubahanJadwal: () => request('/perubahan-jadwal/opsi'),
  listJadwalPerubahan: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/perubahan-jadwal/jadwal${query ? `?${query}` : ''}`)
  },
  listPerubahanJadwal: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/perubahan-jadwal${query ? `?${query}` : ''}`)
  },
  getPerubahanJadwal: (id) => request(`/perubahan-jadwal/${id}`),
  cekBentrokPerubahanJadwal: (params) => request(`/perubahan-jadwal/cek-bentrok?${new URLSearchParams(params).toString()}`),
  createPerubahanJadwal: (data) => request('/perubahan-jadwal', { method: 'POST', body: JSON.stringify(data) }),
  updatePerubahanJadwal: (id, data) => request(`/perubahan-jadwal/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  keputusanPerubahanJadwal: (id, data) =>
    request(`/perubahan-jadwal/${id}/keputusan`, { method: 'POST', body: JSON.stringify(data) }),
  batalkanPerubahanJadwal: (id, data = {}) =>
    request(`/perubahan-jadwal/${id}/batalkan`, { method: 'POST', body: JSON.stringify(data) }),
  terapkanPerubahanJadwal: (id) => request(`/perubahan-jadwal/${id}/terapkan`, { method: 'POST' }),
  getRiwayatPerubahanJadwal: () => request('/perubahan-jadwal/riwayat'),
  exportPerubahanJadwal: (params = {}) =>
    downloadFile(`/perubahan-jadwal/export?${new URLSearchParams(params).toString()}`, 'perubahan-jadwal.xlsx'),

  // Kalender Akademik
  getOpsiKalender: () => request('/kalender-akademik/opsi'),
  getPengaturanKalender: (tahunAjaranId) => request(`/kalender-akademik/pengaturan?tahun_ajaran_id=${tahunAjaranId}`),
  updatePengaturanKalender: (data) => request('/kalender-akademik/pengaturan', { method: 'PUT', body: JSON.stringify(data) }),
  getEntriKalender: (params) => request(`/kalender-akademik/entri?${new URLSearchParams(params).toString()}`),
  getPengingatKalender: () => request('/kalender-akademik/pengingat'),
  getKegiatanKalender: (id) => request(`/kalender-akademik/kegiatan/${id}`),
  createKegiatanKalender: (data) => request('/kalender-akademik/kegiatan', { method: 'POST', body: JSON.stringify(data) }),
  updateKegiatanKalender: (id, data) => request(`/kalender-akademik/kegiatan/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteKegiatanKalender: (id) => request(`/kalender-akademik/kegiatan/${id}`, { method: 'DELETE' }),
  unggahLampiranKalender: (kegiatanId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return requestForm(`/kalender-akademik/kegiatan/${kegiatanId}/lampiran`, formData)
  },
  hapusLampiranKalender: (id) => request(`/kalender-akademik/lampiran/${id}`, { method: 'DELETE' }),
  unduhLampiranKalender: (id, nama) => downloadFile(`/kalender-akademik/lampiran/${id}/unduh`, nama),
  duplikasiKalender: (data) => request('/kalender-akademik/duplikasi', { method: 'POST', body: JSON.stringify(data) }),
  getRiwayatKalender: (tahunAjaranId) => request(`/kalender-akademik/riwayat?tahun_ajaran_id=${tahunAjaranId}`),
  exportKalender: (tahunAjaranId) => downloadFile(`/kalender-akademik/export?tahun_ajaran_id=${tahunAjaranId}`, 'kalender-akademik.xlsx'),
  pdfKalender: (tahunAjaranId) => downloadFile(`/kalender-akademik/pdf?tahun_ajaran_id=${tahunAjaranId}`, 'kalender-akademik.pdf'),

  // Laporan Kesiswaan
  lkOpsi: () => request('/laporan-kesiswaan/opsi'),
  lkDashboard: (params) => request(`/laporan-kesiswaan/dashboard?${new URLSearchParams(params).toString()}`),
  lkLaporan: (jenis, params) => request(`/laporan-kesiswaan/laporan/${jenis}?${new URLSearchParams(params).toString()}`),
  lkExport: (jenis, params, format) =>
    downloadFile(`/laporan-kesiswaan/laporan/${jenis}/export?${new URLSearchParams({ ...params, format }).toString()}`, `laporan-kesiswaan-${jenis}.${format}`),
  lkCatatCetak: (jenis, params) => request(`/laporan-kesiswaan/laporan/${jenis}/cetak?${new URLSearchParams(params).toString()}`, { method: 'POST' }),
  lkArsip: (params) => request(`/laporan-kesiswaan/arsip?${new URLSearchParams(params).toString()}`),
  lkBukaArsip: (id) => request(`/laporan-kesiswaan/arsip/${id}`),
  lkUnduhArsip: (id, format) => downloadFile(`/laporan-kesiswaan/arsip/${id}/unduh?format=${format}`, `arsip-laporan-${id}.${format}`),
  lkHapusArsip: (id) => request(`/laporan-kesiswaan/arsip/${id}`, { method: 'DELETE' }),
  lkPengaturan: () => request('/laporan-kesiswaan/pengaturan'),
  lkSimpanPengaturan: (data) => request('/laporan-kesiswaan/pengaturan', { method: 'PUT', body: JSON.stringify(data) }),
  lkCariSiswa: (search) => request(`/laporan-kesiswaan/mutasi/cari-siswa?search=${encodeURIComponent(search)}`),
  lkCatatMutasi: (data) => request('/laporan-kesiswaan/mutasi', { method: 'POST', body: JSON.stringify(data) }),
  lkBatalMutasi: (id, data) => request(`/laporan-kesiswaan/mutasi/${id}/batalkan`, { method: 'POST', body: JSON.stringify(data) }),
  lkRiwayatMutasi: (siswaId) => request(`/laporan-kesiswaan/mutasi/riwayat?siswa_id=${siswaId}`),
  lkSuratMutasi: (id, nama) => downloadFile(`/laporan-kesiswaan/mutasi/${id}/surat`, nama),

  // Rekap Pembinaan
  rpOpsi: () => request('/rekap-pembinaan/opsi'),
  rpSiswa: (params) => request(`/rekap-pembinaan/siswa?${new URLSearchParams(params).toString()}`),
  rpProfil: (id, params) => request(`/rekap-pembinaan/siswa/${id}?${new URLSearchParams(params).toString()}`),
  rpRiwayatPelanggaran: (id) => request(`/rekap-pembinaan/pelanggaran/${id}/riwayat`),
  rpStatusPelanggaran: (id, data) => request(`/rekap-pembinaan/pelanggaran/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
  rpRiwayatTl: (id) => request(`/rekap-pembinaan/tindak-lanjut/${id}/riwayat`),
  rpSimpanTl: (id, data) => request(id ? `/rekap-pembinaan/tindak-lanjut/${id}` : '/rekap-pembinaan/tindak-lanjut', { method: id ? 'PUT' : 'POST', body: JSON.stringify(data) }),
  rpLaporan: (siswaId, params) => request(`/rekap-pembinaan/siswa/${siswaId}/laporan?${new URLSearchParams(params).toString()}`),
  rpExport: (siswaId, params, format) =>
    downloadFile(`/rekap-pembinaan/siswa/${siswaId}/laporan/export?${new URLSearchParams({ ...params, format }).toString()}`, `rekap-pembinaan.${format}`),
  rpCatatCetak: (siswaId, params) => request(`/rekap-pembinaan/siswa/${siswaId}/laporan/cetak?${new URLSearchParams(params).toString()}`, { method: 'POST' }),

  // Wakil Kepala Sekolah
  wakDashboard: () => request('/wakasek/dashboard'),
  wakGuruTendik: (params = {}) => request(`/wakasek/guru-tendik?${new URLSearchParams(params).toString()}`),
  wakAktivitasGuru: (params = {}) => request(`/wakasek/aktivitas-guru?${new URLSearchParams(params).toString()}`),
  wakRekapKehadiran: (params = {}) => request(`/wakasek/rekap-kehadiran?${new URLSearchParams(params).toString()}`),
  wakPersetujuan: (params = {}) => request(`/wakasek/persetujuan?${new URLSearchParams(params).toString()}`),
  wakLaporan: (jenis, params = {}) => request(`/wakasek/laporan/${jenis}?${new URLSearchParams(params).toString()}`),
  wakExport: (jenis, params, format) =>
    downloadFile(`/wakasek/laporan/${jenis}/export?${new URLSearchParams({ ...params, format }).toString()}`, `laporan-${jenis}.${format}`),
  wakCatatCetak: (jenis, params = {}) => request(`/wakasek/laporan/${jenis}/cetak?${new URLSearchParams(params).toString()}`, { method: 'POST' }),

  // Ekstrakurikuler
  ekskulOpsi: () => request('/ekskul/opsi'),
  ekskulList: (params) => request(`/ekskul?${new URLSearchParams(params).toString()}`),
  ekskulGet: (id) => request(`/ekskul/${id}`),
  ekskulCreate: (data) => request('/ekskul', { method: 'POST', body: JSON.stringify(data) }),
  ekskulUpdate: (id, data) => request(`/ekskul/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  ekskulDelete: (id) => request(`/ekskul/${id}`, { method: 'DELETE' }),
  ekskulStatus: (id, status) => request(`/ekskul/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }),
  ekskulDuplikasi: (data) => request('/ekskul/duplikasi', { method: 'POST', body: JSON.stringify(data) }),
  ekskulUnggahLogo: (id, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return requestForm(`/ekskul/${id}/logo`, formData)
  },
  ekskulHapusLogo: (id) => request(`/ekskul/${id}/logo`, { method: 'DELETE' }),
  ekskulBlobLogo: async (id) => {
    const res = await fetch(`${BASE_URL}/ekskul/${id}/logo`, { headers: { ...authHeaders() } })
    if (!res.ok) throw new Error('Logo tidak dapat dimuat')
    return URL.createObjectURL(await res.blob())
  },
  ekskulAnggota: (params) => request(`/ekskul-anggota?${new URLSearchParams(params).toString()}`),
  ekskulSiswaTersedia: (params) => request(`/ekskul-anggota/siswa-tersedia?${new URLSearchParams(params).toString()}`),
  ekskulTambahAnggota: (data) => request('/ekskul-anggota', { method: 'POST', body: JSON.stringify(data) }),
  ekskulPindahAnggota: (id, data) => request(`/ekskul-anggota/${id}/pindah`, { method: 'POST', body: JSON.stringify(data) }),
  ekskulKeluarAnggota: (id, data) => request(`/ekskul-anggota/${id}/keluar`, { method: 'POST', body: JSON.stringify(data) }),
  ekskulRiwayatAnggota: (params) => request(`/ekskul-anggota/riwayat?${new URLSearchParams(params).toString()}`),
  ekskulExportAnggota: (params) => downloadFile(`/ekskul-anggota/export?${new URLSearchParams(params).toString()}`, 'peserta-ekstrakurikuler.xlsx'),
  ekskulTemplateAnggota: () => downloadFile('/ekskul-anggota/template', 'template-import-peserta-ekskul.xlsx'),
  ekskulImportAnggota: (ekskulId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('ekskul_id', ekskulId)
    return requestForm('/ekskul-anggota/import', formData)
  },
  ekskulKegiatanList: (params) => request(`/ekskul-kegiatan?${new URLSearchParams(params).toString()}`),
  ekskulKegiatanGet: (id) => request(`/ekskul-kegiatan/${id}`),
  ekskulKegiatanCreate: (data) => request('/ekskul-kegiatan', { method: 'POST', body: JSON.stringify(data) }),
  ekskulKegiatanUpdate: (id, data) => request(`/ekskul-kegiatan/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  ekskulKegiatanDelete: (id) => request(`/ekskul-kegiatan/${id}`, { method: 'DELETE' }),
  ekskulKegiatanBatal: (id, alasan) => request(`/ekskul-kegiatan/${id}/batalkan`, { method: 'POST', body: JSON.stringify({ alasan }) }),
  ekskulCekBentrok: (data) => request('/ekskul-kegiatan/cek-bentrok', { method: 'POST', body: JSON.stringify(data) }),
  ekskulJadwalRutin: (data) => request('/ekskul-kegiatan/rutin', { method: 'POST', body: JSON.stringify(data) }),
  ekskulPresensi: (kegiatanId) => request(`/ekskul-kegiatan/${kegiatanId}/presensi`),
  ekskulSimpanPresensi: (kegiatanId, data) => request(`/ekskul-kegiatan/${kegiatanId}/presensi`, { method: 'POST', body: JSON.stringify(data) }),
  ekskulRekapKehadiran: (params) => request(`/ekskul-presensi/rekap?${new URLSearchParams(params).toString()}`),
  ekskulExportKehadiran: (params) => downloadFile(`/ekskul-presensi/export?${new URLSearchParams(params).toString()}`, 'rekap-kehadiran-ekskul.xlsx'),
  ekskulRiwayatPresensi: (params) => request(`/ekskul-presensi/riwayat?${new URLSearchParams(params).toString()}`),
  ekskulPenilaian: (params) => request(`/ekskul-penilaian?${new URLSearchParams(params).toString()}`),
  ekskulSimpanPenilaian: (data) => request('/ekskul-penilaian/simpan', { method: 'POST', body: JSON.stringify(data) }),
  ekskulValidasiPenilaian: (data) => request('/ekskul-penilaian/validasi', { method: 'POST', body: JSON.stringify(data) }),
  ekskulKunciPenilaian: (data) => request('/ekskul-penilaian/kunci', { method: 'POST', body: JSON.stringify(data) }),
  ekskulBukaKunciPenilaian: (data) => request('/ekskul-penilaian/buka-kunci', { method: 'POST', body: JSON.stringify(data) }),
  ekskulRiwayatPenilaian: (params) => request(`/ekskul-penilaian/riwayat?${new URLSearchParams(params).toString()}`),
  ekskulExportPenilaian: (ekskulId, nama) => downloadFile(`/ekskul-penilaian/export?ekskul_id=${ekskulId}`, `penilaian-${nama}.xlsx`),
  ekskulLaporan: (jenis, params) => request(`/ekskul-laporan/${jenis}?${new URLSearchParams(params).toString()}`),
  ekskulExportLaporan: (jenis, params, format) => downloadFile(`/ekskul-laporan/${jenis}/export?${new URLSearchParams({ ...params, format }).toString()}`, `ekskul-${jenis}.${format}`),

  // PPDB
  ppdbOpsi: () => request('/ppdb/opsi'),
  ppdbListPeriode: () => request('/ppdb/periode'),
  ppdbGetPeriode: (id) => request(`/ppdb/periode/${id}`),
  ppdbCreatePeriode: (data) => request('/ppdb/periode', { method: 'POST', body: JSON.stringify(data) }),
  ppdbUpdatePeriode: (id, data) => request(`/ppdb/periode/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  ppdbDeletePeriode: (id) => request(`/ppdb/periode/${id}`, { method: 'DELETE' }),
  ppdbStatusPeriode: (id, status) => request(`/ppdb/periode/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }),
  ppdbCreateJalur: (periodeId, data) => request(`/ppdb/periode/${periodeId}/jalur`, { method: 'POST', body: JSON.stringify(data) }),
  ppdbUpdateJalur: (id, data) => request(`/ppdb/jalur/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  ppdbDeleteJalur: (id) => request(`/ppdb/jalur/${id}`, { method: 'DELETE' }),
  ppdbCreatePersyaratan: (periodeId, data) => request(`/ppdb/periode/${periodeId}/persyaratan`, { method: 'POST', body: JSON.stringify(data) }),
  ppdbUpdatePersyaratan: (id, data) => request(`/ppdb/persyaratan/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  ppdbDeletePersyaratan: (id) => request(`/ppdb/persyaratan/${id}`, { method: 'DELETE' }),
  ppdbDashboard: (periodeId) => request(`/ppdb/dashboard?periode_id=${periodeId}`),
  ppdbListPendaftar: (params) => request(`/ppdb/pendaftar?${new URLSearchParams(params).toString()}`),
  ppdbAsalSekolah: (periodeId) => request(`/ppdb/pendaftar/asal-sekolah?periode_id=${periodeId}`),
  ppdbGetPendaftar: (id) => request(`/ppdb/pendaftar/${id}`),
  ppdbCreatePendaftar: (data) => request('/ppdb/pendaftar', { method: 'POST', body: JSON.stringify(data) }),
  ppdbUpdatePendaftar: (id, data) => request(`/ppdb/pendaftar/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  ppdbBatalkanPendaftar: (id, alasan) => request(`/ppdb/pendaftar/${id}/batalkan`, { method: 'POST', body: JSON.stringify({ alasan }) }),
  ppdbPulihkanPendaftar: (id) => request(`/ppdb/pendaftar/${id}/pulihkan`, { method: 'POST' }),
  ppdbUnggahDokumen: (pendaftarId, file, persyaratanId, nama) => {
    const formData = new FormData()
    formData.append('file', file)
    if (persyaratanId) formData.append('ppdb_persyaratan_id', persyaratanId)
    if (nama) formData.append('nama', nama)
    return requestForm(`/ppdb/pendaftar/${pendaftarId}/dokumen`, formData)
  },
  ppdbHapusDokumen: (id) => request(`/ppdb/dokumen/${id}`, { method: 'DELETE' }),
  ppdbPeriksaDokumen: (id, data) => request(`/ppdb/dokumen/${id}/periksa`, { method: 'POST', body: JSON.stringify(data) }),
  ppdbUnduhDokumen: (id, nama) => downloadFile(`/ppdb/dokumen/${id}/berkas?unduh=1`, nama),
  // Berkas dokumen dilayani lewat rute terautentikasi, jadi preview memakai blob URL.
  ppdbBlobDokumen: async (id) => {
    const res = await fetch(`${BASE_URL}/ppdb/dokumen/${id}/berkas`, { headers: { ...authHeaders() } })
    if (!res.ok) throw new Error(`Dokumen tidak dapat dibuka (${res.status})`)
    const blob = await res.blob()
    return { url: URL.createObjectURL(blob), tipe: blob.type }
  },
  ppdbVerifikasi: (id, data) => request(`/ppdb/pendaftar/${id}/verifikasi`, { method: 'POST', body: JSON.stringify(data) }),
  ppdbBukti: (id, nama) => downloadFile(`/ppdb/pendaftar/${id}/bukti`, nama),
  ppdbSeleksi: (params) => request(`/ppdb/seleksi?${new URLSearchParams(params).toString()}`),
  ppdbSeleksiNilai: (id, nilai) => request(`/ppdb/seleksi/${id}/nilai`, { method: 'PUT', body: JSON.stringify({ nilai }) }),
  ppdbSeleksiProses: (data) => request('/ppdb/seleksi/proses', { method: 'POST', body: JSON.stringify(data) }),
  ppdbSeleksiTandai: (id, data) => request(`/ppdb/seleksi/${id}/tandai`, { method: 'POST', body: JSON.stringify(data) }),
  ppdbSeleksiRiwayat: (periodeId) => request(`/ppdb/seleksi/riwayat?periode_id=${periodeId}`),
  ppdbPengumuman: (params) => request(`/ppdb/pengumuman?${new URLSearchParams(params).toString()}`),
  ppdbTerbitkanPengumuman: (data) => request('/ppdb/pengumuman/terbitkan', { method: 'POST', body: JSON.stringify(data) }),
  ppdbBatalkanPengumuman: (data) => request('/ppdb/pengumuman/batalkan', { method: 'POST', body: JSON.stringify(data) }),
  ppdbPdfHasil: (params) => downloadFile(`/ppdb/pengumuman/pdf?${new URLSearchParams(params).toString()}`, 'hasil-seleksi-ppdb.pdf'),
  ppdbSuratHasil: (id, nama) => downloadFile(`/ppdb/pengumuman/${id}/surat`, nama),
  ppdbNotifikasiHasil: (id) => request(`/ppdb/pengumuman/${id}/notifikasi`, { method: 'POST' }),
  ppdbDaftarUlang: (params) => request(`/ppdb/daftar-ulang?${new URLSearchParams(params).toString()}`),
  ppdbKonfirmasiDaftarUlang: (id, data) => request(`/ppdb/daftar-ulang/${id}/konfirmasi`, { method: 'POST', body: JSON.stringify(data) }),
  ppdbBatalDaftarUlang: (id, catatan) => request(`/ppdb/daftar-ulang/${id}/batal`, { method: 'POST', body: JSON.stringify({ catatan }) }),
  ppdbBukaKembaliDaftarUlang: (id) => request(`/ppdb/daftar-ulang/${id}/buka-kembali`, { method: 'POST' }),
  ppdbPengingatDaftarUlang: (id) => request(`/ppdb/daftar-ulang/${id}/pengingat`, { method: 'POST' }),
  ppdbRiwayatDaftarUlang: (periodeId) => request(`/ppdb/daftar-ulang/riwayat?periode_id=${periodeId}`),
  ppdbPenerimaan: (params) => request(`/ppdb/penerimaan?${new URLSearchParams(params).toString()}`),
  ppdbTerima: (data) => request('/ppdb/penerimaan/terima', { method: 'POST', body: JSON.stringify(data) }),
  ppdbBatalTerima: (data) => request('/ppdb/penerimaan/batal', { method: 'POST', body: JSON.stringify(data) }),
  ppdbImport: (data) => request('/ppdb/penerimaan/import', { method: 'POST', body: JSON.stringify(data) }),
  ppdbRiwayatPenerimaan: (periodeId) => request(`/ppdb/penerimaan/riwayat?periode_id=${periodeId}`),
  ppdbNotifikasi: (periodeId) => request(`/ppdb/notifikasi?periode_id=${periodeId}`),
  ppdbAudit: (params) => request(`/ppdb/audit?${new URLSearchParams(params).toString()}`),

  // Laporan Akademik
  getOpsiLaporan: () => request('/laporan-akademik/opsi'),
  getLaporan: (jenis, params) => request(`/laporan-akademik/${jenis}?${new URLSearchParams(params).toString()}`),
  exportLaporan: (jenis, params, format) =>
    downloadFile(`/laporan-akademik/${jenis}/export?${new URLSearchParams({ ...params, format }).toString()}`, `laporan-${jenis}.${format}`),
  catatCetakLaporan: (jenis, params) => request(`/laporan-akademik/${jenis}/cetak?${new URLSearchParams(params).toString()}`, { method: 'POST' }),
  getRiwayatLaporan: (params) => request(`/laporan-akademik/riwayat?${new URLSearchParams(params).toString()}`),
  unduhRiwayatLaporan: (id, nama) => downloadFile(`/laporan-akademik/riwayat/${id}/unduh`, nama),

  // Penerbitan Rapor
  getOpsiPenerbitanRapor: () => request('/penerbitan-rapor/opsi'),
  getPenerbitanRapor: (params) => request(`/penerbitan-rapor?${new URLSearchParams(params).toString()}`),
  previewPenerbitanRapor: (params) => request(`/penerbitan-rapor/preview?${new URLSearchParams(params).toString()}`),
  generatePenerbitanRapor: (data) => request('/penerbitan-rapor/generate', { method: 'POST', body: JSON.stringify(data) }),
  ajukanPenerbitanRapor: (data) => request('/penerbitan-rapor/ajukan', { method: 'POST', body: JSON.stringify(data) }),
  pengesahanPenerbitanRapor: (data) => request('/penerbitan-rapor/pengesahan', { method: 'POST', body: JSON.stringify(data) }),
  terbitkanRapor: (data) => request('/penerbitan-rapor/terbitkan', { method: 'POST', body: JSON.stringify(data) }),
  cabutRapor: (data) => request('/penerbitan-rapor/cabut', { method: 'POST', body: JSON.stringify(data) }),
  getCetakKelasRapor: (params) => request(`/penerbitan-rapor/cetak-kelas?${new URLSearchParams(params).toString()}`),
  getRiwayatPenerbitanRapor: (params) => request(`/penerbitan-rapor/riwayat?${new URLSearchParams(params).toString()}`),
  downloadRaporSiswa: (params, nama = 'rapor') =>
    downloadFile(`/penerbitan-rapor/pdf?${new URLSearchParams(params).toString()}`, `${nama}.pdf`),
  downloadRaporKelas: (params, nama = 'rapor-kelas') =>
    downloadFile(`/penerbitan-rapor/pdf-kelas?${new URLSearchParams(params).toString()}`, `${nama}.pdf`),

  // Verifikasi Nilai
  getVerifikasiNilai: (params) => request(`/verifikasi-nilai?${new URLSearchParams(params).toString()}`),
  periksaVerifikasiNilai: (params) => request(`/verifikasi-nilai/periksa?${new URLSearchParams(params).toString()}`),
  keputusanVerifikasiNilai: (data) => request('/verifikasi-nilai/keputusan', { method: 'POST', body: JSON.stringify(data) }),
  getRiwayatVerifikasiNilai: (params = {}) => request(`/verifikasi-nilai/riwayat?${new URLSearchParams(params).toString()}`),
  exportVerifikasiNilai: (params) =>
    downloadFile(`/verifikasi-nilai/export?${new URLSearchParams(params).toString()}`, 'verifikasi-nilai.xlsx'),

  // Penguncian Nilai
  getPenguncianNilai: (params) => request(`/penguncian-nilai?${new URLSearchParams(params).toString()}`),
  cekPenguncianNilai: (params) => request(`/penguncian-nilai/cek?${new URLSearchParams(params).toString()}`),
  kunciNilai: (data) => request('/penguncian-nilai/kunci', { method: 'POST', body: JSON.stringify(data) }),
  kunciNilaiMassal: (data) => request('/penguncian-nilai/kunci-massal', { method: 'POST', body: JSON.stringify(data) }),
  bukaKunciNilai: (data) => request('/penguncian-nilai/buka-kunci', { method: 'POST', body: JSON.stringify(data) }),
  getRiwayatPenguncianNilai: (params = {}) => request(`/penguncian-nilai/riwayat?${new URLSearchParams(params).toString()}`),

  // Monitoring Nilai
  getOpsiMonitoringNilai: () => request('/monitoring-nilai/opsi'),
  getMonitoringNilai: (params) => request(`/monitoring-nilai?${new URLSearchParams(params).toString()}`),
  getDetailMonitoringNilai: (params) => request(`/monitoring-nilai/detail?${new URLSearchParams(params).toString()}`),
  exportMonitoringNilai: (params) =>
    downloadFile(`/monitoring-nilai/export?${new URLSearchParams(params).toString()}`, 'monitoring-nilai.xlsx'),

  // Notifikasi pengguna
  getMyNotifikasi: () => request('/me/notifikasi'),
  bacaNotifikasi: (id) => request(`/me/notifikasi/${id}/baca`, { method: 'POST' }),
  bacaSemuaNotifikasi: () => request('/me/notifikasi/baca-semua', { method: 'POST' }),

  // Hari Efektif
  getOpsiHariEfektif: () => request('/hari-efektif/opsi'),
  getHariEfektif: (params) => request(`/hari-efektif?${new URLSearchParams(params).toString()}`),
  simpanPeriodeHariEfektif: (data) => request('/hari-efektif/periode', { method: 'POST', body: JSON.stringify(data) }),
  generateHariEfektif: (data) => request('/hari-efektif/generate', { method: 'POST', body: JSON.stringify(data) }),
  createHariEfektif: (data) => request('/hari-efektif', { method: 'POST', body: JSON.stringify(data) }),
  updateHariEfektif: (id, data) => request(`/hari-efektif/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteHariEfektif: (id) => request(`/hari-efektif/${id}`, { method: 'DELETE' }),
  tandaiHariEfektif: (data) => request('/hari-efektif/tandai', { method: 'POST', body: JSON.stringify(data) }),
  updateStatusHariEfektif: (data) => request('/hari-efektif/status', { method: 'POST', body: JSON.stringify(data) }),
  getRiwayatHariEfektif: (params) => request(`/hari-efektif/riwayat?${new URLSearchParams(params).toString()}`),
  exportHariEfektif: (params) =>
    downloadFile(`/hari-efektif/export?${new URLSearchParams(params).toString()}`, 'hari-efektif.xlsx'),
  downloadTemplateHariEfektif: () => downloadFile('/hari-efektif/import-template', 'template-import-hari-efektif.xlsx'),
  importHariEfektif: (params, file) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('tahun_ajaran_id', params.tahun_ajaran_id)
    formData.append('semester', params.semester)
    return requestForm('/hari-efektif/import', formData)
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
  getTagihanRingkasan: () => request('/tagihan-ringkasan'),
  batalkanTagihan: (id, alasan) =>
    request(`/tagihan/${id}/batalkan`, { method: 'POST', body: JSON.stringify({ alasan }) }),
  listPembayaran: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/pembayaran${query ? `?${query}` : ''}`)
  },
  downloadKuitansi: (id, nomor) =>
    downloadFile(`/pembayaran/${id}/kuitansi`, `kuitansi-${nomor.replaceAll('/', '-')}.pdf`),
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
  getMyStaffProfil: () => request('/me/profil-staf'),
  updateMyStaffProfil: (data) => request('/me/profil-staf', { method: 'PUT', body: JSON.stringify(data) }),
  uploadMyStaffSertifikat: (files) => {
    const formData = new FormData()
    files.forEach((f) => formData.append('files[]', f))
    return requestForm('/me/profil-staf/sertifikat', formData)
  },
  deleteMyStaffSertifikat: (id) => request(`/me/profil-staf/sertifikat/${id}`, { method: 'DELETE' }),
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
  getUjianAttemptDetail: (ujianId, attemptId) => request(`/ujian/${ujianId}/attempts/${attemptId}`),
  nilaiUjianEssay: (jawabanId, data) =>
    request(`/ujian-jawaban/${jawabanId}/nilai`, { method: 'POST', body: JSON.stringify(data) }),
}
