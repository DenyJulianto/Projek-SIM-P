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
use App\Http\Controllers\Api\BkMonitoringController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\GuruController;
use App\Http\Controllers\Api\GuruSelfController;
use App\Http\Controllers\Api\IntegrationController;
use App\Http\Controllers\Api\InventarisController;
use App\Http\Controllers\Api\JadwalPelajaranController;
use App\Http\Controllers\Api\JamBelajarController;
use App\Http\Controllers\Api\KasusController;
use App\Http\Controllers\Api\KegiatanController;
use App\Http\Controllers\Api\KelasController;
use App\Http\Controllers\Api\KonfirmasiPembayaranController;
use App\Http\Controllers\Api\KonselingController;
use App\Http\Controllers\Api\LaporanKeuanganController;
use App\Http\Controllers\Api\MataPelajaranController;
use App\Http\Controllers\Api\MateriController;
use App\Http\Controllers\Api\NilaiController;
use App\Http\Controllers\Api\NilaiSikapController;
use App\Http\Controllers\Api\PelanggaranController;
use App\Http\Controllers\Api\PembayaranController;
use App\Http\Controllers\Api\PemanggilanController;
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
use App\Http\Controllers\Api\SinkronisasiController;
use App\Http\Controllers\Api\SiswaController;
use App\Http\Controllers\Api\ParentSelfController;
use App\Http\Controllers\Api\PembayaranOnlineController;
use App\Http\Controllers\Api\StrukturKurikulumController;
use App\Http\Controllers\Api\StudentSelfController;
use App\Http\Controllers\Api\SumberDanaController;
use App\Http\Controllers\Api\SuratController;
use App\Http\Controllers\Api\SystemSettingsController;
use App\Http\Controllers\Api\TagihanController;
use App\Http\Controllers\Api\TahunAjaranController;
use App\Http\Controllers\Api\TugasController;
use App\Http\Controllers\Api\UjianController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\WaliKelasSelfController;
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
    Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
    Route::post('/resend-verification-code', [AuthController::class, 'resendVerificationCode']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);

    Route::get('avatar/{path}', [AvatarController::class, 'show'])->where('path', '.*');
    Route::get('surat-file/{path}', [SuratController::class, 'showFile'])->where('path', '.*');
    Route::get('arsip-file/{path}', [ArsipDokumenController::class, 'showFile'])->where('path', '.*');
    Route::get('materi-file/{path}', [MateriController::class, 'showFile'])->where('path', '.*');
    Route::get('tugas-file/{path}', [TugasController::class, 'showFile'])->where('path', '.*');
    Route::get('tugas-jawaban-file/{path}', [TugasController::class, 'showJawabanFile'])->where('path', '.*');
    Route::get('bukti-pembayaran-file/{path}', [KonfirmasiPembayaranController::class, 'bukti'])->where('path', '.*');

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

        Route::get('/me/siswa', [StudentSelfController::class, 'profil']);
        Route::get('/me/siswa/jadwal', [StudentSelfController::class, 'jadwal']);
        Route::get('/me/siswa/nilai', [StudentSelfController::class, 'nilai']);
        Route::get('/me/siswa/absensi', [StudentSelfController::class, 'absensi']);
        Route::post('/me/siswa/absensi/ajukan', [StudentSelfController::class, 'ajukanAbsensi']);
        Route::put('/me/siswa/absensi/{absensi}/keterangan', [StudentSelfController::class, 'updateKeteranganAbsensi']);
        Route::get('/me/siswa/tagihan', [StudentSelfController::class, 'tagihan']);
        Route::get('/me/siswa/prestasi', [StudentSelfController::class, 'prestasi']);
        Route::get('/me/siswa/materi', [StudentSelfController::class, 'materi']);
        Route::get('/me/siswa/tugas', [StudentSelfController::class, 'tugas']);
        Route::post('/me/siswa/tugas/{tugas}/jawaban', [StudentSelfController::class, 'submitTugas']);
        Route::get('/me/siswa/ujian', [StudentSelfController::class, 'ujianList']);
        Route::post('/me/siswa/ujian/{ujian}/mulai', [StudentSelfController::class, 'ujianMulai']);
        Route::post('/me/siswa/ujian/{ujian}/jawab', [StudentSelfController::class, 'ujianJawab']);
        Route::post('/me/siswa/ujian/{ujian}/selesai', [StudentSelfController::class, 'ujianSelesai']);
        Route::get('/me/siswa/ujian/{ujian}/hasil', [StudentSelfController::class, 'ujianHasil']);

        Route::get('/me/anak', [ParentSelfController::class, 'index']);
        Route::get('/me/anak/{siswa}/jadwal', [ParentSelfController::class, 'jadwal']);
        Route::get('/me/anak/{siswa}/nilai', [ParentSelfController::class, 'nilai']);
        Route::get('/me/anak/{siswa}/absensi', [ParentSelfController::class, 'absensi']);
        Route::get('/me/anak/{siswa}/tagihan', [ParentSelfController::class, 'tagihan']);
        Route::get('/me/anak/{siswa}/riwayat-pembayaran', [ParentSelfController::class, 'riwayatPembayaran']);
        Route::get('/me/anak/{siswa}/prestasi', [ParentSelfController::class, 'prestasi']);
        Route::get('/me/anak/{siswa}/wali-kelas', [ParentSelfController::class, 'waliKelas']);

        Route::post('/me/konfirmasi-pembayaran', [KonfirmasiPembayaranController::class, 'store']);
        Route::get('/me/konfirmasi-pembayaran', [KonfirmasiPembayaranController::class, 'mine']);

        Route::get('/me/anak/{siswa}/virtual-account', [ParentSelfController::class, 'virtualAccount']);
        Route::get('/me/anak/{siswa}/tagihan/{tagihan}/qris', [ParentSelfController::class, 'qris']);

        Route::get('/me/guru', [GuruSelfController::class, 'profil']);
        Route::get('/me/guru/jadwal', [GuruSelfController::class, 'jadwal']);
        Route::get('/me/guru/kelas', [GuruSelfController::class, 'kelas']);
        Route::get('/me/guru/mata-pelajaran', [GuruSelfController::class, 'mataPelajaran']);
        Route::get('/me/guru/rekap-nilai', [GuruSelfController::class, 'rekapNilai']);

        Route::get('/me/wali-kelas', [WaliKelasSelfController::class, 'kelasBinaan']);
        Route::get('/me/wali-kelas/{kelas}/siswa', [WaliKelasSelfController::class, 'daftarSiswa']);
        Route::get('/me/wali-kelas/{kelas}/struktur', [WaliKelasSelfController::class, 'getStruktur']);
        Route::post('/me/wali-kelas/{kelas}/struktur', [WaliKelasSelfController::class, 'storeStruktur']);
        Route::delete('/me/wali-kelas/{kelas}/struktur/{struktur}', [WaliKelasSelfController::class, 'destroyStruktur']);
        Route::get('/me/wali-kelas/{kelas}/rekap', [WaliKelasSelfController::class, 'rekapKelas']);
        Route::get('/me/wali-kelas/{kelas}/rekap-nilai', [WaliKelasSelfController::class, 'rekapNilai']);
        Route::get('/me/wali-kelas/{kelas}/perkembangan-akademik', [WaliKelasSelfController::class, 'perkembanganAkademik']);
        Route::get('/me/wali-kelas/{kelas}/status-nilai', [WaliKelasSelfController::class, 'statusNilai']);
        Route::get('/me/wali-kelas/{kelas}/catatan-siswa', [WaliKelasSelfController::class, 'catatanSiswa']);
        Route::post('/me/wali-kelas/catatan-siswa', [WaliKelasSelfController::class, 'storeCatatanSiswa']);
        Route::put('/me/wali-kelas/catatan-siswa/{catatanSiswa}', [WaliKelasSelfController::class, 'updateCatatanSiswa']);
        Route::delete('/me/wali-kelas/catatan-siswa/{catatanSiswa}', [WaliKelasSelfController::class, 'destroyCatatanSiswa']);
        Route::get('/me/wali-kelas/{kelas}/konsultasi-bk', [WaliKelasSelfController::class, 'konsultasiBk']);
        Route::get('/me/wali-kelas/{kelas}/pengumuman', [WaliKelasSelfController::class, 'pengumumanKelas']);
        Route::post('/me/wali-kelas/{kelas}/pengumuman', [WaliKelasSelfController::class, 'storePengumumanKelas']);
        Route::delete('/me/wali-kelas/{kelas}/pengumuman/{pengumuman}', [WaliKelasSelfController::class, 'destroyPengumumanKelas']);
        Route::get('/me/wali-kelas/{kelas}/komunikasi-ortu', [WaliKelasSelfController::class, 'komunikasiOrtu']);

        Route::apiResource('kelas', KelasController::class)
            ->middleware('permission:kurikulum.manage');

        Route::apiResource('mata-pelajaran', MataPelajaranController::class)
            ->middleware('permission:kurikulum.manage');

        Route::middleware('permission:kurikulum.manage')->prefix('struktur-kurikulum')->group(function () {
            Route::get('export', [StrukturKurikulumController::class, 'export']);
            Route::get('import-template', [StrukturKurikulumController::class, 'importTemplate']);
            Route::post('import', [StrukturKurikulumController::class, 'import']);
            Route::get('/', [StrukturKurikulumController::class, 'index']);
            Route::post('/', [StrukturKurikulumController::class, 'store']);
            Route::get('{strukturKurikulum}', [StrukturKurikulumController::class, 'show']);
            Route::put('{strukturKurikulum}', [StrukturKurikulumController::class, 'update']);
            Route::delete('{strukturKurikulum}', [StrukturKurikulumController::class, 'destroy']);
            Route::post('{strukturKurikulum}/aktifkan', [StrukturKurikulumController::class, 'aktifkan']);
            Route::post('{strukturKurikulum}/nonaktifkan', [StrukturKurikulumController::class, 'nonaktifkan']);
            Route::post('{strukturKurikulum}/duplikasi', [StrukturKurikulumController::class, 'duplikasi']);
        });

        Route::get('guru/export', [GuruController::class, 'export'])
            ->middleware('permission:pegawai.manage');

        Route::apiResource('guru', GuruController::class)
            ->middleware('permission:pegawai.manage');

        Route::apiResource('siswa', SiswaController::class)
            ->only(['index', 'show'])
            ->middleware('permission:siswa.manage|konseling.manage|kasus.manage|pemanggilan-orangtua.manage|nilai.manage|sikap.manage|absensi-kelas.manage');

        Route::apiResource('siswa', SiswaController::class)
            ->only(['store', 'update', 'destroy'])
            ->middleware('permission:siswa.manage');

        Route::apiResource('nilai', NilaiController::class)
            ->only(['index', 'show'])
            ->middleware('permission:nilai.manage|nilai.view');

        Route::apiResource('nilai', NilaiController::class)
            ->only(['store', 'update', 'destroy'])
            ->middleware('permission:nilai.manage');

        Route::apiResource('nilai-sikap', NilaiSikapController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->middleware('permission:sikap.manage');

        Route::apiResource('jadwal-pelajaran', JadwalPelajaranController::class)
            ->only(['index', 'show'])
            ->middleware('permission:jadwal.manage|kurikulum.jadwal-pelajaran|monitoring-guru.jadwal-mengajar|dashboard.view-all');

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

        Route::middleware('module.enabled:sarpras')->group(function () {
            Route::apiResource('inventaris', InventarisController::class)
                ->middleware('permission:sarpras.inventaris');

            Route::post('inventaris/{inventari}/riwayat', [InventarisController::class, 'storeRiwayat'])
                ->middleware('permission:sarpras.inventaris');
        });

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

        Route::middleware('module.enabled:persuratan')->group(function () {
            Route::apiResource('surat', SuratController::class)
                ->only(['index', 'show'])
                ->middleware('permission:persuratan.manage|dashboard.view-all');

            Route::apiResource('surat', SuratController::class)
                ->only(['store', 'update', 'destroy'])
                ->middleware('permission:persuratan.manage');

            Route::apiResource('arsip-dokumen', ArsipDokumenController::class)
                ->middleware('permission:persuratan.manage');
        });

        Route::apiResource('jam-belajar', JamBelajarController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->middleware('permission:pengguna.manage|kurikulum.manage');

        // Materi, Tugas & Ujian — dikelola guru mata pelajaran/wali kelas,
        // dikonsumsi siswa lewat endpoint self-service /me/siswa/* di atas.
        Route::middleware('permission:materi.manage')->group(function () {
            Route::apiResource('materi', MateriController::class);
        });

        Route::middleware('permission:tugas.manage')->group(function () {
            Route::apiResource('tugas', TugasController::class)
                ->parameters(['tugas' => 'tugas']);
            Route::get('tugas/{tugas}/jawaban', [TugasController::class, 'jawaban']);
            Route::post('tugas-jawaban/{tugasJawaban}/nilai', [TugasController::class, 'nilai']);
        });

        Route::middleware('permission:ujian.manage')->group(function () {
            Route::apiResource('ujian', UjianController::class);
            Route::get('ujian/{ujian}/soal', [UjianController::class, 'soal']);
            Route::post('ujian/{ujian}/soal', [UjianController::class, 'storeSoal']);
            Route::put('ujian-soal/{soal}', [UjianController::class, 'updateSoal']);
            Route::delete('ujian-soal/{soal}', [UjianController::class, 'destroySoal']);
            Route::get('ujian/{ujian}/attempts', [UjianController::class, 'attempts']);
        });

        Route::middleware('permission:pengguna.manage')->group(function () {
            Route::apiResource('tahun-ajaran', TahunAjaranController::class)
                ->only(['index', 'store', 'update', 'destroy']);

            Route::apiResource('semester', SemesterController::class)
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

            Route::post('sinkronisasi', [SinkronisasiController::class, 'store']);
            Route::get('sinkronisasi', [SinkronisasiController::class, 'index']);
        });

        Route::apiResource('prestasi', PrestasiController::class)
            ->only(['index'])
            ->middleware('permission:prestasi.manage|kesiswaan.prestasi|dashboard.view-all');

        Route::apiResource('prestasi', PrestasiController::class)
            ->only(['store', 'update', 'destroy'])
            ->middleware('permission:prestasi.manage|kesiswaan.prestasi');

        Route::apiResource('pelanggaran', PelanggaranController::class)
            ->only(['index'])
            ->middleware('permission:pelanggaran.manage|kesiswaan.pelanggaran|dashboard.view-all');

        Route::apiResource('pelanggaran', PelanggaranController::class)
            ->only(['store', 'update', 'destroy'])
            ->middleware('permission:pelanggaran.manage|kesiswaan.pelanggaran');

        Route::middleware('module.enabled:bk')->group(function () {
            Route::middleware('permission:konseling.manage')->group(function () {
                Route::apiResource('konseling', KonselingController::class)
                    ->only(['index', 'store', 'update', 'destroy']);
            });

            Route::middleware('permission:kasus.manage')->group(function () {
                Route::apiResource('kasus', KasusController::class)
                    ->only(['index', 'store', 'update', 'destroy'])
                    ->parameters(['kasus' => 'kasus']);
                Route::post('kasus/{kasus}/tindakan', [KasusController::class, 'storeTindakan']);
                Route::delete('kasus/{kasus}/tindakan/{tindakan}', [KasusController::class, 'destroyTindakan']);
            });

            Route::middleware('permission:pemanggilan-orangtua.manage')->group(function () {
                Route::apiResource('pemanggilan', PemanggilanController::class)
                    ->only(['index', 'store', 'update', 'destroy']);
            });

            Route::middleware('permission:konseling.manage|kasus.manage|pemanggilan-orangtua.manage')->prefix('bk')->group(function () {
                Route::get('perlu-pendampingan', [BkMonitoringController::class, 'perluPendampingan']);
                Route::get('rekap-kasus', [BkMonitoringController::class, 'rekapKasus']);
                Route::get('statistik', [BkMonitoringController::class, 'statistik']);
                Route::get('laporan', [BkMonitoringController::class, 'laporan']);
            });
        });

        Route::middleware('permission:dashboard.view-all')->prefix('principal')->group(function () {
            Route::get('dashboard', [PrincipalController::class, 'dashboard']);
            Route::get('akademik', [PrincipalController::class, 'akademik']);
            Route::get('kesiswaan', [PrincipalController::class, 'kesiswaan']);
            Route::get('kehadiran', [PrincipalController::class, 'kehadiran']);
            Route::get('kepegawaian', [PrincipalController::class, 'kepegawaian']);
            Route::get('sarpras', [PrincipalController::class, 'sarpras']);
            Route::get('keuangan', [PrincipalController::class, 'keuangan']);
            Route::get('insights', [PrincipalController::class, 'insights']);
        });

        // Keuangan / SPP — Bendahara kelola penuh.
        Route::middleware('module.enabled:keuangan')->group(function () {
            Route::middleware('permission:tagihan.manage')->group(function () {
                Route::apiResource('tagihan', TagihanController::class)
                    ->only(['index', 'store', 'update', 'destroy']);
            });
            Route::middleware('permission:pembayaran.manage')->group(function () {
                Route::get('pembayaran', [PembayaranController::class, 'index']);
                Route::post('tagihan/{tagihan}/pembayaran', [PembayaranController::class, 'store']);
                Route::delete('tagihan/{tagihan}/pembayaran/{pembayaran}', [PembayaranController::class, 'destroy']);

                Route::get('konfirmasi-pembayaran', [KonfirmasiPembayaranController::class, 'index']);
                Route::post('konfirmasi-pembayaran/{konfirmasi}/verifikasi', [KonfirmasiPembayaranController::class, 'verifikasi']);
                Route::post('konfirmasi-pembayaran/{konfirmasi}/tolak', [KonfirmasiPembayaranController::class, 'tolak']);

                Route::prefix('pembayaran-online')->group(function () {
                    Route::get('pengaturan', [PembayaranOnlineController::class, 'pengaturan']);
                    Route::put('pengaturan', [PembayaranOnlineController::class, 'updatePengaturan']);
                    Route::get('virtual-account', [PembayaranOnlineController::class, 'virtualAccount']);
                    Route::get('tagihan/{tagihan}/qris', [PembayaranOnlineController::class, 'qrisTagihan']);
                    Route::get('mutasi', [PembayaranOnlineController::class, 'mutasiIndex']);
                    Route::post('mutasi', [PembayaranOnlineController::class, 'mutasiStore']);
                    Route::post('mutasi/{mutasi}/cocokkan', [PembayaranOnlineController::class, 'mutasiCocokkan']);
                    Route::post('mutasi/{mutasi}/abaikan', [PembayaranOnlineController::class, 'mutasiAbaikan']);
                    Route::delete('mutasi/{mutasi}', [PembayaranOnlineController::class, 'mutasiDestroy']);
                });
            });

            // Anggaran Sekolah / RKAS — Bendahara kelola (anggaran.manage),
            // Kepala Sekolah baca + putuskan pengajuan (anggaran.approve).
            Route::middleware('permission:anggaran.manage|anggaran.approve')->group(function () {
                Route::get('anggaran-pos', [AnggaranPosController::class, 'index']);
                Route::get('sumber-dana', [SumberDanaController::class, 'index']);
                Route::get('pengajuan-anggaran', [PengajuanAnggaranController::class, 'index']);
                Route::get('realisasi-anggaran', [RealisasiAnggaranController::class, 'index']);
            });
            Route::middleware('permission:anggaran.manage')->group(function () {
                Route::post('anggaran-pos', [AnggaranPosController::class, 'store']);
                Route::put('anggaran-pos/{anggaranPos}', [AnggaranPosController::class, 'update']);
                Route::delete('anggaran-pos/{anggaranPos}', [AnggaranPosController::class, 'destroy']);
                Route::post('sumber-dana', [SumberDanaController::class, 'store']);
                Route::put('sumber-dana/{sumberDana}', [SumberDanaController::class, 'update']);
                Route::delete('sumber-dana/{sumberDana}', [SumberDanaController::class, 'destroy']);
                Route::post('pengajuan-anggaran', [PengajuanAnggaranController::class, 'store']);
                Route::post('pengajuan-anggaran/{pengajuanAnggaran}/realisasi', [RealisasiAnggaranController::class, 'store']);
            });
            Route::middleware('permission:anggaran.approve')->group(function () {
                Route::post('pengajuan-anggaran/{pengajuanAnggaran}/approve', [PengajuanAnggaranController::class, 'approve']);
                Route::post('pengajuan-anggaran/{pengajuanAnggaran}/reject', [PengajuanAnggaranController::class, 'reject']);
            });

            Route::middleware('permission:laporan-keuangan.manage')->prefix('laporan-keuangan')->group(function () {
                Route::get('penerimaan', [LaporanKeuanganController::class, 'penerimaan']);
                Route::get('pengeluaran', [LaporanKeuanganController::class, 'pengeluaran']);
                Route::get('tunggakan', [LaporanKeuanganController::class, 'tunggakan']);
                Route::get('anggaran', [LaporanKeuanganController::class, 'anggaran']);
                Route::get('ringkasan', [LaporanKeuanganController::class, 'ringkasan']);
                Route::get('penerimaan-harian', [LaporanKeuanganController::class, 'penerimaanHarian']);
                Route::get('penerimaan-per-jenis', [LaporanKeuanganController::class, 'penerimaanPerJenis']);
            });
        });

        // Kepegawaian: pengajuan (Tata Usaha / pegawai.manage) & persetujuan (Kepala Sekolah).
        Route::middleware('module.enabled:kepegawaian')->group(function () {
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
        });

        // E-Rapor: pengajuan (wali kelas/kurikulum) & pengesahan (Kepala Sekolah).
        Route::middleware('permission:rapor-kelas.manage|rapor.publish|kurikulum.manage|rapor.approve')->group(function () {
            Route::get('rapor-pengesahan', [RaporPengesahanController::class, 'index']);
        });
        Route::middleware('permission:rapor-kelas.manage|rapor.publish|kurikulum.manage')->group(function () {
            Route::post('rapor-pengesahan', [RaporPengesahanController::class, 'ajukan']);
            Route::put('rapor-pengesahan/{rapor}/catatan-wali-kelas', [RaporPengesahanController::class, 'updateCatatanWaliKelas']);
        });
        Route::middleware('permission:rapor.approve')->group(function () {
            Route::post('rapor-pengesahan/{rapor}/sahkan', [RaporPengesahanController::class, 'sahkan']);
            Route::post('rapor-pengesahan/{rapor}/tolak', [RaporPengesahanController::class, 'tolak']);
        });
    });
});
