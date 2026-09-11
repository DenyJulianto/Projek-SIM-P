const BASE_URL = import.meta.env.VITE_API_BASE_URL

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
    request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (name, email, password, passwordConfirmation) =>
    request('/register', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      }),
    }),

  logout: () => request('/logout', { method: 'POST' }),
  me: () => request('/me'),

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
  createPembayaran: (tagihanId, data) =>
    request(`/tagihan/${tagihanId}/pembayaran`, { method: 'POST', body: JSON.stringify(data) }),

  // Anggaran Sekolah / RKAS
  listAnggaranPos: () => request('/anggaran-pos'),
  createAnggaranPos: (data) => request('/anggaran-pos', { method: 'POST', body: JSON.stringify(data) }),
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
