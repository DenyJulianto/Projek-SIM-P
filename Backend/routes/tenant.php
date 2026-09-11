<?php

declare(strict_types=1);

use App\Http\Controllers\Api\AbsensiController;
use App\Http\Controllers\Api\AbsensiGuruController;
use App\Http\Controllers\Api\AnggaranPosController;
use App\Http\Controllers\Api\ArsipDokumenController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AvatarController;
use App\Http\Controllers\Api\BackupController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\GuruController;
use App\Http\Controllers\Api\IntegrationController;
use App\Http\Controllers\Api\InventarisController;
use App\Http\Controllers\Api\JadwalPelajaranController;
use App\Http\Controllers\Api\JamBelajarController;
use App\Http\Controllers\Api\KegiatanController;
use App\Http\Controllers\Api\KelasController;
use App\Http\Controllers\Api\MataPelajaranController;
use App\Http\Controllers\Api\NilaiController;
use App\Http\Controllers\Api\PelanggaranController;
use App\Http\Controllers\Api\PembayaranController;
use App\Http\Controllers\Api\PengajuanAnggaranController;
use App\Http\Controllers\Api\PengajuanKepegawaianController;
use App\Http\Controllers\Api\PengumumanController;
use App\Http\Controllers\Api\PrestasiController;
use App\Http\Controllers\Api\PrincipalController;
use App\Http\Controllers\Api\ProfilPublikController;
use App\Http\Controllers\Api\RaporController;
use App\Http\Controllers\Api\RaporPengesahanController;
use App\Http\Controllers\Api\RealisasiAnggaranController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\SemesterController;
use App\Http\Controllers\Api\SiswaController;
use App\Http\Controllers\Api\SuratController;
use App\Http\Controllers\Api\SystemSettingsController;
use App\Http\Controllers\Api\TagihanController;
use App\Http\Controllers\Api\TahunAjaranController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;
use Stancl\Tenancy\Middleware\InitializeTenancyByDomain;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;

/*
|--------------------------------------------------------------------------
| Tenant Routes
|--------------------------------------------------------------------------
|
| Endpoint di sini diakses lewat subdomain/domain masing-masing sekolah
| (mis. smkn1bandung.simpendidikan.com). Tenancy diinisialisasi otomatis
| sehingga semua query di controller hanya menyentuh database sekolah
| yang bersangkutan.
|
*/

Route::middleware([
    'api',
    InitializeTenancyByDomain::class,
    PreventAccessFromCentralDomains::class,
])->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);

    Route::get('avatar/{path}', [AvatarController::class, 'show'])->where('path', '.*');
    Route::get('surat-file/{path}', [SuratController::class, 'showFile'])->where('path', '.*');
    Route::get('arsip-file/{path}', [ArsipDokumenController::class, 'showFile'])->where('path', '.*');

    // Landing page publik sekolah — tidak butuh login.
    Route::prefix('public')->group(function () {
        Route::get('/profil', [ProfilPublikController::class, 'profil']);
        Route::get('/pengumuman', [ProfilPublikController::class, 'pengumuman']);
        Route::get('/kegiatan', [ProfilPublikController::class, 'kegiatan']);
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::put('/me', [AuthController::class, 'updateMe']);
        Route::post('/me/avatar', [AuthController::class, 'updateAvatar']);

        Route::apiResource('kelas', KelasController::class)
            ->middleware('permission:kurikulum.manage');

        Route::apiResource('mata-pelajaran', MataPelajaranController::class)
            ->middleware('permission:kurikulum.manage');

        Route::get('guru/export', [GuruController::class, 'export'])
            ->middleware('permission:pegawai.manage');

        Route::apiResource('guru', GuruController::class)
            ->middleware('permission:pegawai.manage');

        Route::apiResource('siswa', SiswaController::class)
            ->middleware('permission:siswa.manage');

        Route::apiResource('nilai', NilaiController::class)
            ->only(['index', 'show'])
            ->middleware('permission:nilai.manage|nilai.view');

        Route::apiResource('nilai', NilaiController::class)
            ->only(['store', 'update', 'destroy'])
            ->middleware('permission:nilai.manage');

        Route::apiResource('jadwal-pelajaran', JadwalPelajaranController::class)
            ->only(['index', 'show'])
            ->middleware('permission:jadwal.manage|kurikulum.jadwal-pelajaran|monitoring-guru.jadwal-mengajar');

        Route::apiResource('jadwal-pelajaran', JadwalPelajaranController::class)
            ->only(['store', 'update', 'destroy'])
            ->middleware('permission:jadwal.manage');

        Route::get('absensi/rekap', [AbsensiController::class, 'rekap'])
            ->middleware('permission:absensi-kelas.manage|absensi.view|kesiswaan.absensi');

        Route::post('absensi/bulk', [AbsensiController::class, 'bulkStore'])
            ->middleware('permission:absensi-kelas.manage');

        Route::apiResource('absensi', AbsensiController::class)
            ->only(['index', 'show'])
            ->middleware('permission:absensi-kelas.manage|absensi.view|kesiswaan.absensi');

        Route::apiResource('absensi', AbsensiController::class)
            ->only(['store', 'update', 'destroy'])
            ->middleware('permission:absensi-kelas.manage');

        Route::get('absensi-guru/rekap', [AbsensiGuruController::class, 'rekap'])
            ->middleware('permission:monitoring-guru.absensi-guru');

        Route::post('absensi-guru/bulk', [AbsensiGuruController::class, 'bulkStore'])
            ->middleware('permission:monitoring-guru.absensi-guru');

        Route::get('absensi-guru', [AbsensiGuruController::class, 'index'])
            ->middleware('permission:monitoring-guru.absensi-guru');

        Route::post('absensi-guru', [AbsensiGuruController::class, 'store'])
            ->middleware('permission:monitoring-guru.absensi-guru');

        Route::put('absensi-guru/{absensiGuru}', [AbsensiGuruController::class, 'update'])
            ->middleware('permission:monitoring-guru.absensi-guru');

        Route::delete('absensi-guru/{absensiGuru}', [AbsensiGuruController::class, 'destroy'])
            ->middleware('permission:monitoring-guru.absensi-guru');

        // Otorisasi rapor ditangani di dalam controller: staf terkait (rapor.publish,
        // rapor-kelas.manage, rapor.approve), siswa yang bersangkutan, atau wali siswanya.
        Route::get('siswa/{siswa}/rapor', [RaporController::class, 'show']);

        Route::put('/profil', [ProfilPublikController::class, 'updateProfil'])
            ->middleware('permission:humas.informasi');

        Route::apiResource('pengumuman', PengumumanController::class)
            ->middleware('permission:humas.pengumuman');

        Route::apiResource('kegiatan', KegiatanController::class)
            ->middleware('permission:humas.kegiatan');

        Route::apiResource('inventaris', InventarisController::class)
            ->middleware('permission:sarpras.inventaris');

        Route::post('inventaris/{inventari}/riwayat', [InventarisController::class, 'storeRiwayat'])
            ->middleware('permission:sarpras.inventaris');

        Route::apiResource('users', UserController::class)
            ->only(['index', 'store', 'update'])
            ->middleware('permission:pengguna.manage');

        Route::post('users/{user}/reset-password', [UserController::class, 'resetPassword'])
            ->middleware('permission:pengguna.manage');

        Route::get('users/{user}/sessions', [UserController::class, 'sessions'])
            ->middleware('permission:pengguna.manage');

        Route::delete('users/{user}/sessions/{tokenId}', [UserController::class, 'revokeSession'])
            ->middleware('permission:pengguna.manage');

        Route::get('roles', [RoleController::class, 'index'])
            ->middleware('permission:pengguna.manage');

        Route::get('permissions', [RoleController::class, 'permissions'])
            ->middleware('permission:pengguna.manage');

        Route::post('roles', [RoleController::class, 'store'])
            ->middleware('permission:pengguna.manage');

        Route::put('roles/{role}', [RoleController::class, 'update'])
            ->middleware('permission:pengguna.manage');

        Route::delete('roles/{role}', [RoleController::class, 'destroy'])
            ->middleware('permission:pengguna.manage');

        Route::get('audit-log', [AuditLogController::class, 'index'])
            ->middleware('permission:pengguna.manage');

        Route::get('dashboard-summary', [DashboardController::class, 'summary'])
            ->middleware('permission:pengguna.manage');

        Route::apiResource('surat', SuratController::class)
            ->middleware('permission:persuratan.manage');

        Route::apiResource('arsip-dokumen', ArsipDokumenController::class)
            ->middleware('permission:persuratan.manage');

        Route::middleware('permission:pengguna.manage')->group(function () {
            Route::apiResource('tahun-ajaran', TahunAjaranController::class)
                ->only(['index', 'store', 'update', 'destroy']);

            Route::apiResource('semester', SemesterController::class)
                ->only(['index', 'store', 'update', 'destroy']);

            Route::apiResource('jam-belajar', JamBelajarController::class)
                ->only(['index', 'store', 'update', 'destroy']);

            Route::get('rapor-template', [SystemSettingsController::class, 'raporTemplate']);
            Route::put('rapor-template', [SystemSettingsController::class, 'updateRaporTemplate']);

            Route::get('surat-template', [SystemSettingsController::class, 'suratTemplate']);
            Route::put('surat-template', [SystemSettingsController::class, 'updateSuratTemplate']);

            Route::get('notification-settings', [SystemSettingsController::class, 'notifications']);
            Route::put('notification-settings', [SystemSettingsController::class, 'updateNotifications']);

            Route::get('integrations', [IntegrationController::class, 'index']);
            Route::put('integrations/{key}', [IntegrationController::class, 'update']);
            Route::post('integrations/smtp-email/test', [IntegrationController::class, 'testEmail']);

            Route::get('backups', [BackupController::class, 'index']);
            Route::post('backups', [BackupController::class, 'store']);
            Route::get('backups/{name}/download', [BackupController::class, 'download']);
            Route::delete('backups/{name}', [BackupController::class, 'destroy']);
            Route::post('backups/{name}/restore', [BackupController::class, 'restore']);
            Route::get('backup-schedule', [BackupController::class, 'schedule']);
            Route::put('backup-schedule', [BackupController::class, 'updateSchedule']);
        });

        Route::apiResource('prestasi', PrestasiController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->middleware('permission:prestasi.manage|kesiswaan.prestasi');

        Route::apiResource('pelanggaran', PelanggaranController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->middleware('permission:pelanggaran.manage|kesiswaan.pelanggaran');

        Route::middleware('permission:dashboard.view-all')->prefix('principal')->group(function () {
            Route::get('dashboard', [PrincipalController::class, 'dashboard']);
            Route::get('akademik', [PrincipalController::class, 'akademik']);
            Route::get('kesiswaan', [PrincipalController::class, 'kesiswaan']);
            Route::get('kehadiran', [PrincipalController::class, 'kehadiran']);
            Route::get('kepegawaian', [PrincipalController::class, 'kepegawaian']);
            Route::get('sarpras', [PrincipalController::class, 'sarpras']);
            Route::get('keuangan', [PrincipalController::class, 'keuangan']);
        });

        // Keuangan / SPP — Bendahara kelola penuh.
        Route::middleware('permission:tagihan.manage')->group(function () {
            Route::apiResource('tagihan', TagihanController::class)
                ->only(['index', 'store', 'update', 'destroy']);
        });
        Route::middleware('permission:pembayaran.manage')->group(function () {
            Route::post('tagihan/{tagihan}/pembayaran', [PembayaranController::class, 'store']);
            Route::delete('tagihan/{tagihan}/pembayaran/{pembayaran}', [PembayaranController::class, 'destroy']);
        });

        // Anggaran Sekolah / RKAS — Bendahara kelola (anggaran.manage),
        // Kepala Sekolah baca + putuskan pengajuan (anggaran.approve).
        Route::middleware('permission:anggaran.manage|anggaran.approve')->group(function () {
            Route::get('anggaran-pos', [AnggaranPosController::class, 'index']);
            Route::get('pengajuan-anggaran', [PengajuanAnggaranController::class, 'index']);
            Route::get('realisasi-anggaran', [RealisasiAnggaranController::class, 'index']);
        });
        Route::middleware('permission:anggaran.manage')->group(function () {
            Route::post('anggaran-pos', [AnggaranPosController::class, 'store']);
            Route::put('anggaran-pos/{anggaranPos}', [AnggaranPosController::class, 'update']);
            Route::delete('anggaran-pos/{anggaranPos}', [AnggaranPosController::class, 'destroy']);
            Route::post('pengajuan-anggaran', [PengajuanAnggaranController::class, 'store']);
            Route::post('pengajuan-anggaran/{pengajuanAnggaran}/realisasi', [RealisasiAnggaranController::class, 'store']);
        });
        Route::middleware('permission:anggaran.approve')->group(function () {
            Route::post('pengajuan-anggaran/{pengajuanAnggaran}/approve', [PengajuanAnggaranController::class, 'approve']);
            Route::post('pengajuan-anggaran/{pengajuanAnggaran}/reject', [PengajuanAnggaranController::class, 'reject']);
        });

        // Kepegawaian: pengajuan (Tata Usaha / pegawai.manage) & persetujuan (Kepala Sekolah).
        Route::middleware('permission:pegawai.manage|kepegawaian.approve')->group(function () {
            Route::get('pengajuan-kepegawaian', [PengajuanKepegawaianController::class, 'index']);
        });
        Route::middleware('permission:pegawai.manage')->group(function () {
            Route::post('pengajuan-kepegawaian', [PengajuanKepegawaianController::class, 'store']);
        });
        Route::middleware('permission:kepegawaian.approve')->group(function () {
            Route::post('pengajuan-kepegawaian/{pengajuanKepegawaian}/approve', [PengajuanKepegawaianController::class, 'approve']);
            Route::post('pengajuan-kepegawaian/{pengajuanKepegawaian}/reject', [PengajuanKepegawaianController::class, 'reject']);
        });

        // E-Rapor: pengajuan (wali kelas/kurikulum) & pengesahan (Kepala Sekolah).
        Route::middleware('permission:rapor-kelas.manage|rapor.publish|kurikulum.manage|rapor.approve')->group(function () {
            Route::get('rapor-pengesahan', [RaporPengesahanController::class, 'index']);
        });
        Route::middleware('permission:rapor-kelas.manage|rapor.publish|kurikulum.manage')->group(function () {
            Route::post('rapor-pengesahan', [RaporPengesahanController::class, 'ajukan']);
        });
        Route::middleware('permission:rapor.approve')->group(function () {
            Route::post('rapor-pengesahan/{rapor}/sahkan', [RaporPengesahanController::class, 'sahkan']);
            Route::post('rapor-pengesahan/{rapor}/tolak', [RaporPengesahanController::class, 'tolak']);
        });
    });
});
