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
}
