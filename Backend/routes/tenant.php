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
use App\Http\Controllers\Api\CapaianPembelajaranController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\GuruController;
use App\Http\Controllers\Api\GuruPenggantiController;
use App\Http\Controllers\Api\GuruSelfController;
use App\Http\Controllers\Api\StaffProfileController;
use App\Http\Controllers\Api\MonitoringNilaiController;
use App\Http\Controllers\Api\NotifikasiSelfController;
use App\Http\Controllers\Api\PenerbitanRaporController;
use App\Http\Controllers\Api\PenguncianNilaiController;
use App\Http\Controllers\Api\VerifikasiNilaiController;
use App\Http\Controllers\Api\PerubahanJadwalController;
use App\Http\Controllers\Api\IntegrationController;
use App\Http\Controllers\Api\InventarisController;
use App\Http\Controllers\Api\JadwalPelajaranController;
use App\Http\Controllers\Api\JamBelajarController;
use App\Http\Controllers\Api\KalenderAkademikController;
use App\Http\Controllers\Api\EkskulAnggotaController;
use App\Http\Controllers\Api\EkskulController;
use App\Http\Controllers\Api\EkskulKegiatanController;
use App\Http\Controllers\Api\EkskulLaporanController;
use App\Http\Controllers\Api\EkskulPenilaianController;
use App\Http\Controllers\Api\LaporanAkademikController;
use App\Http\Controllers\Api\LaporanKesiswaanController;
use App\Http\Controllers\Api\MutasiSiswaController;
use App\Http\Controllers\Api\PembinaanTindakLanjutController;
use App\Http\Controllers\Api\RekapPembinaanController;
use App\Http\Controllers\Api\WakasekController;
use App\Http\Controllers\Api\WakasekLaporanController;
use App\Http\Controllers\Api\PpdbPemantauController;
use App\Http\Controllers\Api\PpdbPendaftarController;
use App\Http\Controllers\Api\PpdbPenerimaanController;
use App\Http\Controllers\Api\PpdbPengumumanController;
use App\Http\Controllers\Api\PpdbPeriodeController;
use App\Http\Controllers\Api\PpdbSeleksiController;
use App\Http\Controllers\Api\KasusController;
use App\Http\Controllers\Api\KegiatanController;
use App\Http\Controllers\Api\KelasController;
use App\Http\Controllers\Api\HariEfektifController;
use App\Http\Controllers\Api\PembagianMapelController;
use App\Http\Controllers\Api\RombelController;
use App\Http\Controllers\Api\KkmKktpController;
use App\Http\Controllers\Api\KompetensiIndikatorController;
use App\Http\Controllers\Api\KonfirmasiPembayaranController;
use App\Http\Controllers\Api\KonselingController;
use App\Http\Controllers\Api\KurikulumDashboardController;
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
use App\Http\Controllers\Api\ProgramSemesterController;
use App\Http\Controllers\Api\ProgramTahunanController;
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
use App\Http\Controllers\Api\TujuanPembelajaranController;
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
    Route::get('sertifikat-staf-file/{path}', [StaffProfileController::class, 'showSertifikatFile'])->where('path', '.*');
    Route::get('surat-file/{path}', [SuratController::class, 'showFile'])->where('path', '.*');
    Route::get('arsip-file/{path}', [ArsipDokumenController::class, 'showFile'])->where('path', '.*');
    Route::get('materi-file/{path}', [MateriController::class, 'showFile'])->where('path', '.*');
    Route::get('tugas-file/{path}', [TugasController::class, 'showFile'])->where('path', '.*');
    Route::get('tugas-jawaban-file/{path}', [TugasController::class, 'showJawabanFile'])->where('path', '.*');
    Route::get('prestasi-bukti-file/{path}', [PrestasiController::class, 'showBuktiFile'])->where('path', '.*');
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

        Route::get('/me/profil-staf', [StaffProfileController::class, 'profil']);
        Route::put('/me/profil-staf', [StaffProfileController::class, 'update']);
        Route::post('/me/profil-staf/sertifikat', [StaffProfileController::class, 'storeSertifikat']);
        Route::delete('/me/profil-staf/sertifikat/{sertifikat}', [StaffProfileController::class, 'destroySertifikat']);

        Route::get('/me/siswa', [StudentSelfController::class, 'profil']);
        Route::get('/me/siswa/jadwal', [StudentSelfController::class, 'jadwal']);
        Route::get('/me/siswa/nilai', [StudentSelfController::class, 'nilai']);
        Route::get('/me/siswa/absensi', [StudentSelfController::class, 'absensi']);
        Route::post('/me/siswa/absensi/ajukan', [StudentSelfController::class, 'ajukanAbsensi']);
        Route::put('/me/siswa/absensi/{absensi}/keterangan', [StudentSelfController::class, 'updateKeteranganAbsensi']);
        Route::get('/me/siswa/tagihan', [StudentSelfController::class, 'tagihan']);
        Route::get('/me/siswa/saldo', [StudentSelfController::class, 'saldo']);
        Route::get('/me/siswa/prestasi', [StudentSelfController::class, 'prestasi']);
        Route::post('/me/siswa/prestasi', [StudentSelfController::class, 'submitPrestasi']);
        Route::delete('/me/siswa/prestasi/{prestasi}', [StudentSelfController::class, 'destroyPrestasi']);
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

        Route::get('/me/anak/{siswa}/saldo', [ParentSelfController::class, 'saldo']);
        Route::post('/me/anak/{siswa}/saldo/isi', [ParentSelfController::class, 'isiSaldo']);
        Route::get('/me/anak/{siswa}/tugas', [ParentSelfController::class, 'tugas']);

        Route::get('/me/notifikasi', [NotifikasiSelfController::class, 'index']);
        Route::post('/me/notifikasi/baca-semua', [NotifikasiSelfController::class, 'bacaSemua']);
        Route::post('/me/notifikasi/{id}/baca', [NotifikasiSelfController::class, 'baca']);

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

        Route::get('kurikulum/dashboard', [KurikulumDashboardController::class, 'summary'])
            ->middleware('permission:kurikulum.manage');
        Route::get('kurikulum/tahun-ajaran', [KurikulumDashboardController::class, 'tahunAjaran'])
            ->middleware('permission:kurikulum.manage');

        Route::middleware('permission:kurikulum.manage')->group(function () {
            Route::get('kelas/opsi', [KelasController::class, 'opsi']);
            Route::post('kelas/{kela}/status', [KelasController::class, 'updateStatus']);
            Route::post('kelas/{kela}/duplikasi', [KelasController::class, 'duplikasi']);
            Route::apiResource('kelas', KelasController::class);

            Route::get('rombel/siswa-tersedia', [RombelController::class, 'siswaTersedia']);
            Route::get('rombel/import-template', [RombelController::class, 'importTemplate']);
            Route::get('rombel/{kela}/export', [RombelController::class, 'export']);
            Route::post('rombel/{kela}/import', [RombelController::class, 'import']);
            Route::post('rombel/{kela}/siswa', [RombelController::class, 'tambah']);
            Route::post('rombel/{kela}/keluarkan', [RombelController::class, 'keluarkan']);
            Route::post('rombel/{kela}/pindah', [RombelController::class, 'pindah']);

            Route::prefix('laporan-akademik')->group(function () {
                Route::get('opsi', [LaporanAkademikController::class, 'opsi']);
                Route::get('riwayat', [LaporanAkademikController::class, 'riwayat']);
                Route::get('riwayat/{riwayat}/unduh', [LaporanAkademikController::class, 'unduh'])->whereNumber('riwayat');
                Route::get('{jenis}', [LaporanAkademikController::class, 'tampil']);
                Route::get('{jenis}/export', [LaporanAkademikController::class, 'export']);
                Route::post('{jenis}/cetak', [LaporanAkademikController::class, 'catatCetak']);
            });

            Route::prefix('kalender-akademik')->group(function () {
                Route::get('opsi', [KalenderAkademikController::class, 'opsi']);
                Route::get('pengaturan', [KalenderAkademikController::class, 'pengaturan']);
                Route::put('pengaturan', [KalenderAkademikController::class, 'updatePengaturan']);
                Route::get('entri', [KalenderAkademikController::class, 'entri']);
                Route::get('pengingat', [KalenderAkademikController::class, 'pengingat']);
                Route::get('riwayat', [KalenderAkademikController::class, 'riwayat']);
                Route::get('export', [KalenderAkademikController::class, 'export']);
                Route::get('pdf', [KalenderAkademikController::class, 'pdf']);
                Route::post('duplikasi', [KalenderAkademikController::class, 'duplikasi']);
                Route::post('kegiatan', [KalenderAkademikController::class, 'store']);
                Route::get('kegiatan/{kegiatan}', [KalenderAkademikController::class, 'show']);
                Route::put('kegiatan/{kegiatan}', [KalenderAkademikController::class, 'update']);
                Route::delete('kegiatan/{kegiatan}', [KalenderAkademikController::class, 'destroy']);
                Route::post('kegiatan/{kegiatan}/lampiran', [KalenderAkademikController::class, 'unggahLampiran']);
                Route::get('lampiran/{lampiran}/unduh', [KalenderAkademikController::class, 'unduhLampiran']);
                Route::delete('lampiran/{lampiran}', [KalenderAkademikController::class, 'hapusLampiran']);
            });

            Route::prefix('penerbitan-rapor')->group(function () {
                Route::get('opsi', [PenerbitanRaporController::class, 'opsi']);
                Route::get('preview', [PenerbitanRaporController::class, 'preview']);
                Route::get('pdf', [PenerbitanRaporController::class, 'pdf']);
                Route::get('pdf-kelas', [PenerbitanRaporController::class, 'pdfKelas']);
                Route::get('cetak-kelas', [PenerbitanRaporController::class, 'cetakKelas']);
                Route::get('riwayat', [PenerbitanRaporController::class, 'riwayat']);
                Route::post('generate', [PenerbitanRaporController::class, 'generate'])->middleware('permission:rapor.publish');
                Route::post('ajukan', [PenerbitanRaporController::class, 'ajukan'])->middleware('permission:rapor.publish');
                Route::post('pengesahan', [PenerbitanRaporController::class, 'pengesahan'])->middleware('permission:rapor.approve');
                Route::post('terbitkan', [PenerbitanRaporController::class, 'terbitkan'])->middleware('permission:rapor.publish');
                Route::post('cabut', [PenerbitanRaporController::class, 'cabut'])->middleware('permission:rapor.publish');
                Route::get('/', [PenerbitanRaporController::class, 'index']);
            });

            Route::prefix('verifikasi-nilai')->group(function () {
                Route::get('periksa', [VerifikasiNilaiController::class, 'periksa']);
                Route::get('riwayat', [VerifikasiNilaiController::class, 'riwayat']);
                Route::get('export', [VerifikasiNilaiController::class, 'export']);
                Route::post('keputusan', [VerifikasiNilaiController::class, 'keputusan'])->middleware('permission:nilai.verify');
                Route::get('/', [VerifikasiNilaiController::class, 'index']);
            });

            Route::prefix('penguncian-nilai')->group(function () {
                Route::get('cek', [PenguncianNilaiController::class, 'cek']);
                Route::get('riwayat', [PenguncianNilaiController::class, 'riwayat']);
                Route::post('kunci', [PenguncianNilaiController::class, 'kunci'])->middleware('permission:nilai.lock');
                Route::post('kunci-massal', [PenguncianNilaiController::class, 'kunciMassal'])->middleware('permission:nilai.lock');
                Route::post('buka-kunci', [PenguncianNilaiController::class, 'bukaKunci'])->middleware('permission:nilai.lock');
                Route::get('/', [PenguncianNilaiController::class, 'index']);
            });

            Route::prefix('monitoring-nilai')->group(function () {
                Route::get('opsi', [MonitoringNilaiController::class, 'opsi']);
                Route::get('detail', [MonitoringNilaiController::class, 'detail']);
                Route::get('export', [MonitoringNilaiController::class, 'export']);
                Route::get('/', [MonitoringNilaiController::class, 'index']);
            });

            Route::prefix('perubahan-jadwal')->group(function () {
                Route::get('opsi', [PerubahanJadwalController::class, 'opsi']);
                Route::get('jadwal', [PerubahanJadwalController::class, 'jadwal']);
                Route::get('cek-bentrok', [PerubahanJadwalController::class, 'cekBentrok']);
                Route::get('riwayat', [PerubahanJadwalController::class, 'riwayat']);
                Route::get('export', [PerubahanJadwalController::class, 'export']);
                Route::get('/', [PerubahanJadwalController::class, 'index']);
                Route::post('/', [PerubahanJadwalController::class, 'store']);
                Route::get('{perubahanJadwal}', [PerubahanJadwalController::class, 'show']);
                Route::put('{perubahanJadwal}', [PerubahanJadwalController::class, 'update']);
                Route::post('{perubahanJadwal}/keputusan', [PerubahanJadwalController::class, 'keputusan']);
                Route::post('{perubahanJadwal}/batalkan', [PerubahanJadwalController::class, 'batalkan']);
                Route::post('{perubahanJadwal}/terapkan', [PerubahanJadwalController::class, 'terapkan']);
            });

            Route::prefix('guru-pengganti')->group(function () {
                Route::get('opsi', [GuruPenggantiController::class, 'opsi']);
                Route::get('jadwal-guru', [GuruPenggantiController::class, 'jadwalGuru']);
                Route::get('ketersediaan', [GuruPenggantiController::class, 'ketersediaan']);
                Route::get('riwayat', [GuruPenggantiController::class, 'riwayat']);
                Route::get('export', [GuruPenggantiController::class, 'export']);
                Route::get('/', [GuruPenggantiController::class, 'index']);
                Route::post('/', [GuruPenggantiController::class, 'store']);
                Route::get('{guruPengganti}', [GuruPenggantiController::class, 'show']);
                Route::put('{guruPengganti}', [GuruPenggantiController::class, 'update']);
                Route::post('{guruPengganti}/keputusan', [GuruPenggantiController::class, 'keputusan']);
                Route::post('{guruPengganti}/batalkan', [GuruPenggantiController::class, 'batalkan']);
            });

            Route::prefix('hari-efektif')->group(function () {
                Route::get('opsi', [HariEfektifController::class, 'opsi']);
                Route::get('export', [HariEfektifController::class, 'export']);
                Route::get('import-template', [HariEfektifController::class, 'importTemplate']);
                Route::get('riwayat', [HariEfektifController::class, 'riwayat']);
                Route::post('import', [HariEfektifController::class, 'import']);
                Route::post('periode', [HariEfektifController::class, 'simpanPeriode']);
                Route::post('generate', [HariEfektifController::class, 'generate']);
                Route::post('tandai', [HariEfektifController::class, 'tandai']);
                Route::post('status', [HariEfektifController::class, 'updateStatus']);
                Route::get('/', [HariEfektifController::class, 'show']);
                Route::post('/', [HariEfektifController::class, 'store']);
                Route::put('{hariEfektif}', [HariEfektifController::class, 'update']);
                Route::delete('{hariEfektif}', [HariEfektifController::class, 'destroy']);
            });

            Route::prefix('pembagian-mapel')->group(function () {
                Route::get('opsi', [PembagianMapelController::class, 'opsi']);
                Route::get('beban', [PembagianMapelController::class, 'beban']);
                Route::get('monitoring', [PembagianMapelController::class, 'monitoring']);
                Route::get('riwayat', [PembagianMapelController::class, 'riwayat']);
                Route::post('duplikasi', [PembagianMapelController::class, 'duplikasi']);
                Route::post('status', [PembagianMapelController::class, 'updateStatus']);
                Route::get('/', [PembagianMapelController::class, 'index']);
                Route::post('/', [PembagianMapelController::class, 'store']);
                Route::get('{pembagianMapel}', [PembagianMapelController::class, 'show']);
                Route::put('{pembagianMapel}', [PembagianMapelController::class, 'update']);
                Route::delete('{pembagianMapel}', [PembagianMapelController::class, 'destroy']);
            });
        });

        Route::middleware('permission:kurikulum.manage')->group(function () {
            Route::get('mata-pelajaran/export', [MataPelajaranController::class, 'export']);
            Route::get('mata-pelajaran/import-template', [MataPelajaranController::class, 'importTemplate']);
            Route::post('mata-pelajaran/import', [MataPelajaranController::class, 'import']);
            Route::post('mata-pelajaran/{mataPelajaran}/aktifkan', [MataPelajaranController::class, 'aktifkan']);
            Route::post('mata-pelajaran/{mataPelajaran}/nonaktifkan', [MataPelajaranController::class, 'nonaktifkan']);
            Route::apiResource('mata-pelajaran', MataPelajaranController::class);
        });

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

        Route::middleware('permission:kurikulum.manage')->prefix('capaian-pembelajaran')->group(function () {
            Route::get('export', [CapaianPembelajaranController::class, 'export']);
            Route::get('import-template', [CapaianPembelajaranController::class, 'importTemplate']);
            Route::post('import', [CapaianPembelajaranController::class, 'import']);
            Route::get('/', [CapaianPembelajaranController::class, 'index']);
            Route::post('/', [CapaianPembelajaranController::class, 'store']);
            Route::get('{capaianPembelajaran}', [CapaianPembelajaranController::class, 'show']);
            Route::put('{capaianPembelajaran}', [CapaianPembelajaranController::class, 'update']);
            Route::delete('{capaianPembelajaran}', [CapaianPembelajaranController::class, 'destroy']);
            Route::post('{capaianPembelajaran}/duplikasi', [CapaianPembelajaranController::class, 'duplikasi']);
        });

        Route::middleware('permission:kurikulum.manage')->prefix('tujuan-pembelajaran')->group(function () {
            Route::get('export', [TujuanPembelajaranController::class, 'export']);
            Route::get('import-template', [TujuanPembelajaranController::class, 'importTemplate']);
            Route::post('import', [TujuanPembelajaranController::class, 'import']);
            Route::get('/', [TujuanPembelajaranController::class, 'index']);
            Route::post('/', [TujuanPembelajaranController::class, 'store']);
            Route::get('{tujuanPembelajaran}', [TujuanPembelajaranController::class, 'show']);
            Route::put('{tujuanPembelajaran}', [TujuanPembelajaranController::class, 'update']);
            Route::delete('{tujuanPembelajaran}', [TujuanPembelajaranController::class, 'destroy']);
            Route::post('{tujuanPembelajaran}/progres', [TujuanPembelajaranController::class, 'updateProgres']);
            Route::post('{tujuanPembelajaran}/duplikasi', [TujuanPembelajaranController::class, 'duplikasi']);

            // Indikator kompetensi/ketercapaian digabung di sini (bukan menu
            // "Kompetensi" terpisah) karena hanya masuk akal dalam konteks TP induknya.
            Route::get('{tujuanPembelajaran}/indikator', [KompetensiIndikatorController::class, 'index']);
            Route::post('{tujuanPembelajaran}/indikator', [KompetensiIndikatorController::class, 'store']);
            Route::post('{tujuanPembelajaran}/indikator/reorder', [KompetensiIndikatorController::class, 'reorder']);
            Route::put('indikator/{indikator}', [KompetensiIndikatorController::class, 'update']);
            Route::delete('indikator/{indikator}', [KompetensiIndikatorController::class, 'destroy']);
        });

        Route::middleware('permission:kurikulum.manage')->prefix('program-tahunan')->group(function () {
            Route::get('opsi', [ProgramTahunanController::class, 'opsi']);
            Route::get('{programTahunan}/export', [ProgramTahunanController::class, 'export']);
            Route::post('{programTahunan}/status-dokumen', [ProgramTahunanController::class, 'updateStatusDokumen']);
            Route::get('/', [ProgramTahunanController::class, 'index']);
            Route::post('/', [ProgramTahunanController::class, 'store']);
            Route::get('{programTahunan}', [ProgramTahunanController::class, 'show']);
            Route::put('{programTahunan}', [ProgramTahunanController::class, 'update']);
            Route::delete('{programTahunan}', [ProgramTahunanController::class, 'destroy']);
        });

        Route::middleware('permission:kurikulum.manage')->prefix('program-semester')->group(function () {
            Route::get('opsi', [ProgramSemesterController::class, 'opsi']);
            Route::get('{programSemester}/export', [ProgramSemesterController::class, 'export']);
            Route::post('{programSemester}/status-dokumen', [ProgramSemesterController::class, 'updateStatusDokumen']);
            Route::get('/', [ProgramSemesterController::class, 'index']);
            Route::post('/', [ProgramSemesterController::class, 'store']);
            Route::get('{programSemester}', [ProgramSemesterController::class, 'show']);
            Route::put('{programSemester}', [ProgramSemesterController::class, 'update']);
            Route::delete('{programSemester}', [ProgramSemesterController::class, 'destroy']);
        });

        Route::middleware('permission:kurikulum.manage')->prefix('kkm-kktp')->group(function () {
            Route::get('opsi-tautan', [KkmKktpController::class, 'opsiTautan']);
            Route::get('/', [KkmKktpController::class, 'index']);
            Route::post('/', [KkmKktpController::class, 'store']);
            Route::get('{kkmKktp}', [KkmKktpController::class, 'show']);
            Route::put('{kkmKktp}', [KkmKktpController::class, 'update']);
            Route::delete('{kkmKktp}', [KkmKktpController::class, 'destroy']);
            Route::post('{kkmKktp}/status', [KkmKktpController::class, 'updateStatus']);
        });

        Route::middleware('permission:ekstrakurikuler.manage')->group(function () {
            Route::prefix('ekskul')->group(function () {
                Route::get('opsi', [EkskulController::class, 'opsi']);
                Route::post('duplikasi', [EkskulController::class, 'duplikasi']);
                Route::get('/', [EkskulController::class, 'index']);
                Route::post('/', [EkskulController::class, 'store']);
                Route::get('{ekskul}', [EkskulController::class, 'show'])->whereNumber('ekskul');
                Route::put('{ekskul}', [EkskulController::class, 'update'])->whereNumber('ekskul');
                Route::delete('{ekskul}', [EkskulController::class, 'destroy'])->whereNumber('ekskul');
                Route::post('{ekskul}/status', [EkskulController::class, 'status'])->whereNumber('ekskul');
                Route::get('{ekskul}/logo', [EkskulController::class, 'logo'])->whereNumber('ekskul');
                Route::post('{ekskul}/logo', [EkskulController::class, 'unggahLogo'])->whereNumber('ekskul');
                Route::delete('{ekskul}/logo', [EkskulController::class, 'hapusLogo'])->whereNumber('ekskul');
            });

            Route::prefix('ekskul-anggota')->group(function () {
                Route::get('siswa-tersedia', [EkskulAnggotaController::class, 'siswaTersedia']);
                Route::get('riwayat', [EkskulAnggotaController::class, 'riwayat']);
                Route::get('export', [EkskulAnggotaController::class, 'export']);
                Route::get('template', [EkskulAnggotaController::class, 'template']);
                Route::post('import', [EkskulAnggotaController::class, 'import']);
                Route::get('/', [EkskulAnggotaController::class, 'index']);
                Route::post('/', [EkskulAnggotaController::class, 'store']);
                Route::post('{anggota}/pindah', [EkskulAnggotaController::class, 'pindah'])->whereNumber('anggota');
                Route::post('{anggota}/keluar', [EkskulAnggotaController::class, 'keluar'])->whereNumber('anggota');
            });

            Route::prefix('ekskul-kegiatan')->group(function () {
                Route::post('cek-bentrok', [EkskulKegiatanController::class, 'cekBentrok']);
                Route::post('rutin', [EkskulKegiatanController::class, 'rutin']);
                Route::get('/', [EkskulKegiatanController::class, 'index']);
                Route::post('/', [EkskulKegiatanController::class, 'store']);
                Route::get('{kegiatan}', [EkskulKegiatanController::class, 'show'])->whereNumber('kegiatan');
                Route::put('{kegiatan}', [EkskulKegiatanController::class, 'update'])->whereNumber('kegiatan');
                Route::delete('{kegiatan}', [EkskulKegiatanController::class, 'destroy'])->whereNumber('kegiatan');
                Route::post('{kegiatan}/batalkan', [EkskulKegiatanController::class, 'batalkan'])->whereNumber('kegiatan');
                Route::get('{kegiatan}/presensi', [EkskulKegiatanController::class, 'presensi'])->whereNumber('kegiatan');
                Route::post('{kegiatan}/presensi', [EkskulKegiatanController::class, 'simpanPresensi'])->whereNumber('kegiatan');
            });

            Route::prefix('ekskul-presensi')->group(function () {
                Route::get('rekap', [EkskulKegiatanController::class, 'rekap']);
                Route::get('export', [EkskulKegiatanController::class, 'exportRekap']);
                Route::get('riwayat', [EkskulKegiatanController::class, 'riwayatPresensi']);
            });

            Route::prefix('ekskul-penilaian')->group(function () {
                Route::get('/', [EkskulPenilaianController::class, 'index']);
                Route::post('simpan', [EkskulPenilaianController::class, 'simpan']);
                Route::post('validasi', [EkskulPenilaianController::class, 'validasi']);
                Route::post('kunci', [EkskulPenilaianController::class, 'kunci']);
                Route::post('buka-kunci', [EkskulPenilaianController::class, 'bukaKunci']);
                Route::get('riwayat', [EkskulPenilaianController::class, 'riwayat']);
                Route::get('export', [EkskulPenilaianController::class, 'export']);
            });

            Route::prefix('ekskul-laporan')->group(function () {
                Route::get('{jenis}', [EkskulLaporanController::class, 'tampil']);
                Route::get('{jenis}/export', [EkskulLaporanController::class, 'export']);
            });
        });

        Route::middleware('permission:laporan-kesiswaan.manage')->prefix('laporan-kesiswaan')->group(function () {
            Route::get('opsi', [LaporanKesiswaanController::class, 'opsi']);
            Route::get('dashboard', [LaporanKesiswaanController::class, 'dashboard']);
            Route::get('pengaturan', [LaporanKesiswaanController::class, 'pengaturan']);
            Route::put('pengaturan', [LaporanKesiswaanController::class, 'simpanPengaturan']);
            Route::get('arsip', [LaporanKesiswaanController::class, 'arsip']);
            Route::get('arsip/{arsip}', [LaporanKesiswaanController::class, 'bukaArsip'])->whereNumber('arsip');
            Route::get('arsip/{arsip}/unduh', [LaporanKesiswaanController::class, 'unduhArsip'])->whereNumber('arsip');
            Route::delete('arsip/{arsip}', [LaporanKesiswaanController::class, 'hapusArsip'])->whereNumber('arsip');
            Route::get('mutasi/cari-siswa', [MutasiSiswaController::class, 'cariSiswa']);
            Route::get('mutasi/riwayat', [MutasiSiswaController::class, 'riwayat']);
            Route::post('mutasi', [MutasiSiswaController::class, 'store']);
            Route::put('mutasi/{mutasi}', [MutasiSiswaController::class, 'update'])->whereNumber('mutasi');
            Route::post('mutasi/{mutasi}/batalkan', [MutasiSiswaController::class, 'batalkan'])->whereNumber('mutasi');
            Route::get('mutasi/{mutasi}/surat', [MutasiSiswaController::class, 'surat'])->whereNumber('mutasi');
            Route::get('laporan/{jenis}', [LaporanKesiswaanController::class, 'tampil']);
            Route::get('laporan/{jenis}/export', [LaporanKesiswaanController::class, 'export']);
            Route::post('laporan/{jenis}/cetak', [LaporanKesiswaanController::class, 'cetak']);
        });

        // Rekap Pembinaan: data sensitif, dibatasi per peran. Wali kelas hanya melihat siswa kelas binaannya (dicek di controller).
        Route::middleware('permission:rekap-pembinaan.view|rekap-pembinaan.view-kelas|rekap-pembinaan.manage')->prefix('rekap-pembinaan')->group(function () {
            Route::get('opsi', [RekapPembinaanController::class, 'opsi']);
            Route::get('siswa', [RekapPembinaanController::class, 'daftarSiswa']);
            Route::get('siswa/{siswa}', [RekapPembinaanController::class, 'profil'])->whereNumber('siswa');
            Route::get('siswa/{siswa}/laporan', [RekapPembinaanController::class, 'laporan'])->whereNumber('siswa');
            Route::get('siswa/{siswa}/laporan/export', [RekapPembinaanController::class, 'export'])->whereNumber('siswa');
            Route::post('siswa/{siswa}/laporan/cetak', [RekapPembinaanController::class, 'catatCetak'])->whereNumber('siswa');
            Route::get('pelanggaran/{pelanggaran}/riwayat', [RekapPembinaanController::class, 'riwayatPelanggaran'])->whereNumber('pelanggaran');
            Route::get('tindak-lanjut/{tindakLanjut}/riwayat', [PembinaanTindakLanjutController::class, 'riwayat'])->whereNumber('tindakLanjut');

            Route::middleware('permission:rekap-pembinaan.manage')->group(function () {
                Route::post('tindak-lanjut', [PembinaanTindakLanjutController::class, 'store']);
                Route::put('tindak-lanjut/{tindakLanjut}', [PembinaanTindakLanjutController::class, 'update'])->whereNumber('tindakLanjut');
                Route::put('pelanggaran/{pelanggaran}/status', [PembinaanTindakLanjutController::class, 'ubahStatusPelanggaran'])->whereNumber('pelanggaran');
            });
        });

        // Dashboard Wakil Kepala Sekolah: ringkasan, guru & tendik, kehadiran, persetujuan, dan laporan. Baca saja; keputusan
        // persetujuan diambil lewat endpoint asli tiap modul (perubahan jadwal / guru pengganti).
        Route::prefix('wakasek')->group(function () {
            Route::middleware('permission:laporan.dashboard')->group(function () {
                Route::get('dashboard', [WakasekController::class, 'dashboard']);
                Route::get('rekap-kehadiran', [WakasekController::class, 'rekapKehadiran']);
                Route::get('laporan/sekolah', fn (\Illuminate\Http\Request $r) => app(WakasekLaporanController::class)->tampil($r, 'sekolah'));
                Route::get('laporan/sekolah/export', fn (\Illuminate\Http\Request $r) => app(WakasekLaporanController::class)->export($r, 'sekolah'));
                Route::post('laporan/sekolah/cetak', fn (\Illuminate\Http\Request $r) => app(WakasekLaporanController::class)->catatCetak($r, 'sekolah'));
            });
            Route::middleware('permission:monitoring-guru.laporan')->group(function () {
                Route::get('guru-tendik', [WakasekController::class, 'guruTendik']);
                Route::get('aktivitas-guru', [WakasekController::class, 'aktivitasGuru']);
                Route::get('laporan/guru-tendik', fn (\Illuminate\Http\Request $r) => app(WakasekLaporanController::class)->tampil($r, 'guru-tendik'));
                Route::get('laporan/guru-tendik/export', fn (\Illuminate\Http\Request $r) => app(WakasekLaporanController::class)->export($r, 'guru-tendik'));
                Route::post('laporan/guru-tendik/cetak', fn (\Illuminate\Http\Request $r) => app(WakasekLaporanController::class)->catatCetak($r, 'guru-tendik'));
            });
            Route::middleware('permission:persetujuan.approval')->group(function () {
                Route::get('persetujuan', [WakasekController::class, 'persetujuan']);
            });
        });

        Route::middleware('permission:ppdb.manage')->prefix('ppdb')->group(function () {
            Route::get('opsi', [PpdbPeriodeController::class, 'opsi']);
            Route::get('dashboard', [PpdbPeriodeController::class, 'dashboard']);
            Route::get('notifikasi', [PpdbPemantauController::class, 'notifikasi']);
            Route::get('audit', [PpdbPemantauController::class, 'audit']);
            Route::get('periode', [PpdbPeriodeController::class, 'index']);
            Route::post('periode', [PpdbPeriodeController::class, 'store']);
            Route::get('periode/{periode}', [PpdbPeriodeController::class, 'show']);
            Route::put('periode/{periode}', [PpdbPeriodeController::class, 'update']);
            Route::delete('periode/{periode}', [PpdbPeriodeController::class, 'destroy']);
            Route::post('periode/{periode}/status', [PpdbPeriodeController::class, 'status']);
            Route::post('periode/{periode}/jalur', [PpdbPeriodeController::class, 'storeJalur']);
            Route::put('jalur/{jalur}', [PpdbPeriodeController::class, 'updateJalur']);
            Route::delete('jalur/{jalur}', [PpdbPeriodeController::class, 'destroyJalur']);
            Route::post('periode/{periode}/persyaratan', [PpdbPeriodeController::class, 'storePersyaratan']);
            Route::put('persyaratan/{persyaratan}', [PpdbPeriodeController::class, 'updatePersyaratan']);
            Route::delete('persyaratan/{persyaratan}', [PpdbPeriodeController::class, 'destroyPersyaratan']);

            Route::get('pendaftar', [PpdbPendaftarController::class, 'index']);
            Route::post('pendaftar', [PpdbPendaftarController::class, 'store']);
            Route::get('pendaftar/asal-sekolah', [PpdbPendaftarController::class, 'asalSekolah']);
            Route::get('pendaftar/{pendaftar}', [PpdbPendaftarController::class, 'show']);
            Route::put('pendaftar/{pendaftar}', [PpdbPendaftarController::class, 'update']);
            Route::post('pendaftar/{pendaftar}/batalkan', [PpdbPendaftarController::class, 'batalkan']);
            Route::post('pendaftar/{pendaftar}/pulihkan', [PpdbPendaftarController::class, 'pulihkan']);
            Route::post('pendaftar/{pendaftar}/dokumen', [PpdbPendaftarController::class, 'unggahDokumen']);
            Route::post('pendaftar/{pendaftar}/verifikasi', [PpdbPendaftarController::class, 'verifikasi']);
            Route::get('pendaftar/{pendaftar}/bukti', [PpdbPendaftarController::class, 'bukti']);
            Route::get('dokumen/{dokumen}/berkas', [PpdbPendaftarController::class, 'berkasDokumen']);
            Route::post('dokumen/{dokumen}/periksa', [PpdbPendaftarController::class, 'periksaDokumen']);
            Route::delete('dokumen/{dokumen}', [PpdbPendaftarController::class, 'hapusDokumen']);

            Route::get('seleksi', [PpdbSeleksiController::class, 'index']);
            Route::get('seleksi/riwayat', [PpdbSeleksiController::class, 'riwayat']);
            Route::post('seleksi/proses', [PpdbSeleksiController::class, 'proses']);
            Route::put('seleksi/{pendaftar}/nilai', [PpdbSeleksiController::class, 'nilai']);
            Route::post('seleksi/{pendaftar}/tandai', [PpdbSeleksiController::class, 'tandai']);

            Route::get('pengumuman', [PpdbPengumumanController::class, 'index']);
            Route::post('pengumuman/terbitkan', [PpdbPengumumanController::class, 'terbitkan']);
            Route::post('pengumuman/batalkan', [PpdbPengumumanController::class, 'batalkan']);
            Route::get('pengumuman/pdf', [PpdbPengumumanController::class, 'pdf']);
            Route::get('pengumuman/{pendaftar}/surat', [PpdbPengumumanController::class, 'surat']);
            Route::post('pengumuman/{pendaftar}/notifikasi', [PpdbPengumumanController::class, 'notifikasi']);

            Route::get('daftar-ulang', [PpdbPenerimaanController::class, 'daftarUlang']);
            Route::get('daftar-ulang/riwayat', [PpdbPenerimaanController::class, 'riwayatDaftarUlang']);
            Route::post('daftar-ulang/{pendaftar}/konfirmasi', [PpdbPenerimaanController::class, 'konfirmasiDaftarUlang']);
            Route::post('daftar-ulang/{pendaftar}/batal', [PpdbPenerimaanController::class, 'batalDaftarUlang']);
            Route::post('daftar-ulang/{pendaftar}/buka-kembali', [PpdbPenerimaanController::class, 'bukaKembaliDaftarUlang']);
            Route::post('daftar-ulang/{pendaftar}/pengingat', [PpdbPenerimaanController::class, 'pengingat']);

            Route::get('penerimaan', [PpdbPenerimaanController::class, 'penerimaan']);
            Route::get('penerimaan/riwayat', [PpdbPenerimaanController::class, 'riwayatPenerimaan']);
            Route::post('penerimaan/terima', [PpdbPenerimaanController::class, 'terima']);
            Route::post('penerimaan/batal', [PpdbPenerimaanController::class, 'batalTerima']);
            Route::post('penerimaan/import', [PpdbPenerimaanController::class, 'import']);
        });

        Route::get('guru/export', [GuruController::class, 'export'])
            ->middleware('permission:pegawai.manage');

        // Daftar & detail guru juga dibaca pemantau kehadiran guru (mis. Wakil Kepala Sekolah); perubahan tetap khusus pegawai.manage.
        Route::apiResource('guru', GuruController::class)
            ->only(['index', 'show'])
            ->middleware('permission:pegawai.manage|monitoring-guru.absensi-guru');

        Route::apiResource('guru', GuruController::class)
            ->except(['index', 'show'])
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
                Route::post('tagihan/{tagihan}/batalkan', [TagihanController::class, 'batalkan']);
                Route::get('tagihan-ringkasan', [TagihanController::class, 'ringkasan']);
            });
            Route::middleware('permission:pembayaran.manage')->group(function () {
                Route::get('pembayaran', [PembayaranController::class, 'index']);
                Route::get('pembayaran/{pembayaran}/kuitansi', [PembayaranController::class, 'kuitansi'])->whereNumber('pembayaran');
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
