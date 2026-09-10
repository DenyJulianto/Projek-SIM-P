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
                'persuratan.manage',
                'inventaris.manage',
                'laporan.view',
            ],
            'Kurikulum' => [
                'kurikulum.manage',
                'jadwal.manage',
                'nilai.lock',
                'rapor.publish',
            ],
            'Kesiswaan' => [
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
            'Wali Kelas' => [
                ...$this->guruMapelPermissions,
                'rapor-kelas.manage',
                'rekap-kelas.view',
            ],
            'Guru BK' => [
                'konseling.manage',
                'kasus.manage',
                'pemanggilan-orangtua.manage',
            ],
            'Siswa' => [
                'profil-siswa.view',
                'jadwal.view',
                'nilai.view',
                'absensi.view',
                'tugas.view',
                'tugas.submit',
                'tagihan.view',
            ],
            'Orang Tua' => [
                'data-anak.view',
                'komunikasi-wali-kelas.manage',
            ],
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
