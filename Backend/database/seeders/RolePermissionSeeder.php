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

    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $rolePermissions = [
            'Admin Sekolah' => [
                'dashboard.view-all',
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
            ],
            'Wakil Kepala Sekolah' => $this->wakasekPermissions,
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
                'rapor.publish',
            ],
            'Kesiswaan' => [
                'siswa.manage',
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
            'Guru Mata Pelajaran' => $this->guruMapelPermissions,
            // Rekap kelas binaan (kehadiran, nilai, pelanggaran, prestasi) disajikan
            // lewat endpoint /me/wali-kelas/* yang memverifikasi kepemilikan kelas
            // di controller (kelas.wali_kelas_id), jadi tidak butuh permission
            // 'rekap-kelas.view' terpisah.
            'Wali Kelas' => [
                ...$this->guruMapelPermissions,
                'rapor-kelas.manage',
                'prestasi.manage',
                'pelanggaran.manage',
            ],
            'Guru BK' => [
                'konseling.manage',
                'kasus.manage',
                'pemanggilan-orangtua.manage',
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
