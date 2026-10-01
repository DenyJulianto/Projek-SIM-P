/**
 * Rute halaman dasbor Super Admin. Setiap menu punya URL sendiri supaya
 * halaman tetap sama saat di-refresh, tombol Back browser berfungsi, dan
 * halaman bisa di-bookmark. Beranda tetap di /dashboard (tujuan setelah
 * login untuk semua peran).
 *
 * `superAdmin: true` = hanya akun Super Admin yang boleh membuka rute ini;
 * peran lain dialihkan ke /dashboard (lihat Dashboard.jsx).
 */
export const RUTE_SUPER_ADMIN = [
  { key: 'beranda', path: '/dashboard' },
  { key: 'profil', path: '/profil' },

  { key: 'sekolah', path: '/data-master/sekolah' },
  { key: 'guru', path: '/data-master/guru' },
  { key: 'siswa', path: '/data-master/siswa' },

  { key: 'manajemen-sekolah', path: '/akses-sekolah/manajemen-sekolah' },
  { key: 'admin-sekolah', path: '/akses-sekolah/admin-sekolah' },
  { key: 'hak-akses', path: '/akses-sekolah/hak-akses' },

  { key: 'tarik-data', path: '/sinkronisasi/tarik-data' },
  { key: 'log-sinkronisasi', path: '/sinkronisasi/log' },
  { key: 'konflik-data', path: '/sinkronisasi/konflik-data' },

  { key: 'log-aktivitas', path: '/audit/log-aktivitas' },
  { key: 'notifikasi', path: '/audit/notifikasi' },
  { key: 'laporan', path: '/audit/laporan' },

  { key: 'statistik-nasional', path: '/statistik/nasional' },
  { key: 'peta-sebaran', path: '/statistik/peta-sebaran' },

  { key: 'pengaturan-modul', path: '/sistem/pengaturan-modul' },
  { key: 'backup-restore', path: '/sistem/backup-restore' },
  { key: 'integrasi-sistem', path: '/sistem/integrasi' },

  { key: 'kelola-pengguna', path: '/pengguna/kelola-pengguna' },
  { key: 'manajemen-role', path: '/pengguna/manajemen-role' },

  { key: 'pengaturan-keamanan', path: '/keamanan/pengaturan' },
].map((r) => ({ superAdmin: true, ...r }))

const PATH_KE_KEY = new Map(RUTE_SUPER_ADMIN.map((r) => [r.path, r.key]))
const KEY_KE_PATH = new Map(RUTE_SUPER_ADMIN.map((r) => [r.key, r.path]))

/** URL halaman untuk sebuah kunci menu (fallback ke Beranda). */
export function pathSuperAdmin(key) {
  return KEY_KE_PATH.get(key) || '/dashboard'
}

/** Kunci menu dari URL, atau null kalau URL bukan halaman Super Admin. */
export function viewDariPath(pathname) {
  const bersih = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  return PATH_KE_KEY.get(bersih) ?? null
}
