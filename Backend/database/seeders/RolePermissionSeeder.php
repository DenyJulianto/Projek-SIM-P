<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    /**
     * Permissions for Wakil Kepala Sekolah, grouped by bidang.
     * A Wakasek gets the full set by default; sekolah dapat menyesuaikan
     * per-user lewat pencabutan/penambahan permission individual.
     */
    private array $wakasekPermissions = [
        'kurikulum.jadwal-pelajaran',
        'kurikulum.kalender-akademik',
        'kurikulum.kurikulum',
        'kesiswaan.data-siswa',
        'kesiswaan.absensi',
        'kesiswaan.pelanggaran',
        'kesiswaan.prestasi',
        'rekap-pembinaan.view',
        'sarpras.fasilitas',
        'sarpras.kondisi-barang',
        'sarpras.inventaris',
        'humas.pengumuman',
        'humas.kegiatan',
        'humas.informasi',
        'monitoring-guru.jadwal-mengajar',
        'monitoring-guru.absensi-guru',
        'monitoring-guru.laporan',
        'laporan.dashboard',
        'laporan.evaluasi',
        'persetujuan.approval',
    ];

    private array $guruMapelPermissions = [
        'absensi-kelas.manage',
        'nilai.manage',
        'sikap.manage',
        'materi.manage',
        'tugas.manage',
        'ujian.manage',
    ];

    /**
     * Peta role => daftar permission, tanpa menyentuh database. Dipakai
     * oleh run() untuk seeding per-tenant, dan oleh kode central (Super
     * Admin) yang butuh tahu katalog permission/role apa saja yang ada di
     * setiap sekolah tanpa harus membuka koneksi ke database tenant mana pun
     * (isinya identik di semua tenant karena berasal dari seeder yang sama).
     */
    public static function rolePermissionMap(): array
    {
        $seeder = new self();

        $rolePermissions = [
            'Admin Sekolah' => [
                'dashboard.view-all',
                'laporan-kesiswaan.manage',
                'laporan-kesiswaan.hapus-arsip',
                'rekap-pembinaan.view',
                'rekap-pembinaan.manage',
                'ppdb.manage',
                'ekstrakurikuler.manage',
                'kurikulum.manage',
                'pegawai.manage',
                'siswa.manage',
                'nilai.manage',
                'jadwal.manage',
                'absensi-kelas.manage',
                'humas.informasi',
                'humas.pengumuman',
                'humas.kegiatan',
                'laporan.view-all',
                'pengguna.manage',
                'sarpras.inventaris',
                'monitoring-guru.absensi-guru',
                'monitoring-guru.jadwal-mengajar',
                'persuratan.manage',
            ],
            'Kepala Sekolah' => [
                'dashboard.view-all',
                'rapor.approve',
                'anggaran.approve',
                'kepegawaian.approve',
                'laporan.view-all',
                'rekap-pembinaan.view',
            ],
            'Wakil Kepala Sekolah' => $seeder->wakasekPermissions,
            'Tata Usaha' => [
                'siswa.manage',
                'pegawai.manage',
                'kurikulum.manage',
                'persuratan.manage',
                'sarpras.inventaris',
                'absensi-kelas.manage',
                'monitoring-guru.absensi-guru',
                'humas.pengumuman',
                'laporan.view',
            ],
            'Kurikulum' => [
                'kurikulum.manage',
                'jadwal.manage',
                'nilai.lock',
                'nilai.verify',
                'rapor.publish',
            ],
            'Kesiswaan' => [
                'siswa.manage',
                'laporan-kesiswaan.manage',
                'rekap-pembinaan.view',
                'rekap-pembinaan.manage',
                'ppdb.manage',
                'kurikulum.manage',
                'absensi-kelas.manage',
                'pelanggaran.manage',
                'prestasi.manage',
                'ekstrakurikuler.manage',
                'organisasi-siswa.manage',
            ],
            'Bendahara' => [
                'tagihan.manage',
                'pembayaran.manage',
                'tunggakan.manage',
                'anggaran.manage',
                'laporan-keuangan.manage',
            ],
            'Guru Mata Pelajaran' => $seeder->guruMapelPermissions,
            // Rekap kelas binaan (kehadiran, nilai, pelanggaran, prestasi) disajikan
            // lewat endpoint /me/wali-kelas/* yang memverifikasi kepemilikan kelas
            // di controller (kelas.wali_kelas_id), jadi tidak butuh permission
            // 'rekap-kelas.view' terpisah.
            'Wali Kelas' => [
                ...$seeder->guruMapelPermissions,
                'rapor-kelas.manage',
                'prestasi.manage',
                'pelanggaran.manage',
                'rekap-pembinaan.view-kelas',
            ],
            'Guru BK' => [
                'konseling.manage',
                'kasus.manage',
                'pemanggilan-orangtua.manage',
                'rekap-pembinaan.view',
                'rekap-pembinaan.manage',
            ],
            // Catatan keamanan: JANGAN beri 'nilai.view'/'absensi.view' di sini.
            // Kedua permission itu cocok dengan gate OR-chain endpoint umum
            // (GET /nilai, GET /absensi) yang mengembalikan data SEMUA siswa
            // tanpa filter per-pemilik — siswa yang punya permission itu bisa
            // melihat nilai/absensi siswa lain. Data milik sendiri disajikan
            // lewat endpoint /me/siswa/* yang otomatis difilter di server,
            // tidak butuh permission tambahan sama sekali.
            'Siswa' => [
                'profil-siswa.view',
                'tugas.submit',
            ],
            // Data anak (jadwal, nilai, absensi, tagihan, rapor, dst.) disajikan
            // lewat endpoint /me/anak/* yang memverifikasi kepemilikan anak di
            // controller (pivot wali_siswa), jadi tidak butuh permission khusus.
            'Orang Tua' => [],
        ];

        // Super Admin selalu mendapat gabungan SEMUA permission yang ada di
        // sistem (union dari seluruh role di atas) — "kendali penuh tanpa
        // batasan" — dan otomatis ikut bertambah kalau nanti ada permission
        // baru ditambahkan ke role manapun. Pemberian/pencabutan role
        // 'Super Admin' sendiri hanya boleh dilakukan oleh sesama Super
        // Admin; itu ditegakkan di UserController & RoleController, bukan
        // lewat permission biasa.
        $rolePermissions['Super Admin'] = collect($rolePermissions)->flatten()->unique()->values()->all();

        return $rolePermissions;
    }

    /**
     * Semua nama permission unik yang dikenal sistem, dari seluruh role,
     * tanpa duplikat — dipakai untuk membangun form "atur hak akses".
     */
    public static function allPermissionNames(): array
    {
        return collect(self::rolePermissionMap())
            ->flatten()
            ->unique()
            ->sort()
            ->values()
            ->all();
    }

    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $rolePermissions = self::rolePermissionMap();

        foreach ($rolePermissions as $roleName => $permissions) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);

            $permissionModels = collect($permissions)
                ->unique()
                ->map(fn (string $permission) => Permission::firstOrCreate([
                    'name' => $permission,
                    'guard_name' => 'web',
                ]));

            $role->syncPermissions($permissionModels);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
