<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Settings\NotificationSettings;
use App\Settings\RaporTemplateSettings;
use App\Settings\SuratTemplateSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SystemSettingsController extends Controller
{
    public function raporTemplate(): JsonResponse
    {
        return response()->json(app(RaporTemplateSettings::class)->toArray());
    }

    public function updateRaporTemplate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'header_text' => ['required', 'string', 'max:255'],
            'tampilkan_logo' => ['boolean'],
            'catatan_kaki' => ['nullable', 'string', 'max:500'],
            'nama_penandatangan' => ['nullable', 'string', 'max:255'],
            'jabatan_penandatangan' => ['nullable', 'string', 'max:255'],
        ]);

        $settings = app(RaporTemplateSettings::class);
        $settings->fill($data)->save();

        activity()->causedBy($request->user())->useLog('konfigurasi')->log('Memperbarui template rapor.');

        return response()->json($settings->toArray());
    }

    public function suratTemplate(): JsonResponse
    {
        return response()->json(app(SuratTemplateSettings::class)->toArray());
    }

    public function updateSuratTemplate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'kop_surat_text' => ['nullable', 'string', 'max:500'],
            'format_nomor_surat' => ['nullable', 'string', 'max:255'],
            'penutup_text' => ['nullable', 'string', 'max:500'],
            'nama_penandatangan' => ['nullable', 'string', 'max:255'],
            'jabatan_penandatangan' => ['nullable', 'string', 'max:255'],
        ]);

        $settings = app(SuratTemplateSettings::class);
        $settings->fill($data)->save();

        activity()->causedBy($request->user())->useLog('konfigurasi')->log('Memperbarui template surat.');

        return response()->json($settings->toArray());
    }

    public function notifications(): JsonResponse
    {
        return response()->json(app(NotificationSettings::class)->toArray());
    }

    public function updateNotifications(Request $request): JsonResponse
    {
        $data = $request->validate([
            'peringatan_akun_nonaktif' => ['boolean'],
            'peringatan_tanpa_peran' => ['boolean'],
            'peringatan_backup_belum_pernah' => ['boolean'],
        ]);

        $settings = app(NotificationSettings::class);
        $settings->fill($data)->save();

        activity()->causedBy($request->user())->useLog('konfigurasi')->log('Memperbarui pengaturan notifikasi.');

        return response()->json($settings->toArray());
    }
}
