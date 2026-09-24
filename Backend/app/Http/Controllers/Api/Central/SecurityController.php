<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Central;

use App\Http\Controllers\Controller;
use App\Models\Central\SecuritySettings;
use App\Models\Central\SyncLog;
use App\Models\Sekolah;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Spatie\Activitylog\Models\Activity;

/**
 * Pengaturan Keamanan platform: kontrol data pribadi (PII) & kebijakan
 * retensi/penghapusan data. Lihat App\Support\PiiMasker untuk bagaimana
 * mask_pii_enabled dipakai di ekspor/API Integrasi.
 *
 * Retensi sengaja dibatasi ke data LOG (activity_log per sekolah + central
 * sync_logs), BUKAN data inti sekolah/guru/siswa — menghapus otomatis data
 * murid/pegawai yang sebenarnya adalah keputusan yang jauh lebih sensitif
 * dan berisiko, di luar cakupan aman untuk fitur "hapus otomatis". Log
 * audit lama justru yang paling wajar dibersihkan berkala menurut prinsip
 * minimalisasi data UU PDP, tanpa risiko kehilangan data akademik.
 */
class SecurityController extends Controller
{
    private const PII_FIELD_REGISTRY = [
        ['field' => 'NIP / NUPTK', 'kategori' => 'Identitas Pegawai', 'lokasi' => 'Data Guru (nasional & per sekolah)'],
        ['field' => 'NIS / NISN', 'kategori' => 'Identitas Siswa', 'lokasi' => 'Data Siswa (nasional & per sekolah)'],
        ['field' => 'No. Telepon', 'kategori' => 'Kontak', 'lokasi' => 'Data Guru, Data Sekolah'],
        ['field' => 'Email', 'kategori' => 'Kontak', 'lokasi' => 'Data Sekolah, Akun Pengguna'],
        ['field' => 'Alamat', 'kategori' => 'Kontak', 'lokasi' => 'Data Sekolah, Profil Siswa (per sekolah)'],
        ['field' => 'Tanggal Lahir', 'kategori' => 'Identitas Siswa', 'lokasi' => 'Data Siswa (per sekolah)'],
    ];

    public function show(): JsonResponse
    {
        $settings = SecuritySettings::current();

        return response()->json([
            'mask_pii_enabled' => $settings->mask_pii_enabled,
            'log_retention_days' => $settings->log_retention_days,
            'last_retention_purge_at' => $settings->last_retention_purge_at,
            'pii_field_registry' => self::PII_FIELD_REGISTRY,
        ]);
    }

    public function updatePii(Request $request): JsonResponse
    {
        $data = $request->validate([
            'mask_pii_enabled' => ['required', 'boolean'],
        ]);

        $settings = SecuritySettings::current();
        $settings->update($data);

        return response()->json($settings);
    }

    public function updateRetention(Request $request): JsonResponse
    {
        $data = $request->validate([
            'log_retention_days' => ['required', 'integer', 'min:30', 'max:3650'],
        ]);

        $settings = SecuritySettings::current();
        $settings->update($data);

        return response()->json($settings);
    }

    /**
     * Hitung berapa banyak baris log yang akan terhapus kalau kebijakan
     * saat ini dijalankan — read-only, dipakai untuk pratinjau sebelum
     * Super Admin menekan "Hapus Sekarang".
     */
    public function retentionPreview(): JsonResponse
    {
        $cutoff = $this->cutoffDate();

        $activityCount = 0;
        foreach (Sekolah::all() as $sekolah) {
            $activityCount += $sekolah->run(fn () => Activity::where('created_at', '<', $cutoff)->count());
        }

        $syncLogCount = SyncLog::where('created_at', '<', $cutoff)->count();

        return response()->json([
            'cutoff_date' => $cutoff->toDateString(),
            'jumlah_log_aktivitas' => $activityCount,
            'jumlah_log_sinkronisasi' => $syncLogCount,
        ]);
    }

    /**
     * Jalankan penghapusan secara manual — SENGAJA tidak otomatis lewat
     * scheduler, supaya Super Admin selalu meninjau pratinjau di atas dulu
     * sebelum data benar-benar terhapus permanen.
     */
    public function retentionPurge(): JsonResponse
    {
        $cutoff = $this->cutoffDate();

        $activityDeleted = 0;
        foreach (Sekolah::all() as $sekolah) {
            $activityDeleted += $sekolah->run(fn () => Activity::where('created_at', '<', $cutoff)->delete());
        }

        $syncLogDeleted = SyncLog::where('created_at', '<', $cutoff)->delete();

        $settings = SecuritySettings::current();
        $settings->update(['last_retention_purge_at' => now()]);

        return response()->json([
            'message' => 'Penghapusan data sesuai kebijakan retensi berhasil dijalankan.',
            'jumlah_log_aktivitas_dihapus' => $activityDeleted,
            'jumlah_log_sinkronisasi_dihapus' => $syncLogDeleted,
        ]);
    }

    private function cutoffDate(): Carbon
    {
        return now()->subDays(SecuritySettings::current()->log_retention_days);
    }
}
