<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kegiatan;
use App\Models\Pengumuman;
use App\Settings\ProfilSekolahSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfilPublikController extends Controller
{
    /**
     * Data landing page publik: identitas sekolah (dari central) + konten
     * yang bisa diedit Humas (visi, misi, sambutan, sosial media).
     */
    public function profil(ProfilSekolahSettings $settings): JsonResponse
    {
        $sekolah = tenant();

        return response()->json([
            'nama_sekolah' => $sekolah->nama_sekolah,
            'npsn' => $sekolah->npsn,
            'jenjang' => $sekolah->jenjang,
            'alamat' => $sekolah->alamat,
            'kecamatan' => $sekolah->kecamatan,
            'kelurahan' => $sekolah->kelurahan,
            'kabupaten_kota' => $sekolah->kabupaten_kota,
            'provinsi' => $sekolah->provinsi,
            'latitude' => $sekolah->latitude,
            'longitude' => $sekolah->longitude,
            'telepon' => $sekolah->telepon,
            'email' => $sekolah->email,
            'logo' => $sekolah->logo,
            'visi' => $settings->visi,
            'misi' => $settings->misi,
            'sambutan_kepala_sekolah' => $settings->sambutan_kepala_sekolah,
            'hero_image' => $settings->hero_image,
            'auth_background' => $settings->auth_background,
            'sosial_media' => [
                'facebook' => $settings->facebook,
                'instagram' => $settings->instagram,
                'youtube' => $settings->youtube,
            ],
        ]);
    }

    public function updateProfil(Request $request, ProfilSekolahSettings $settings): JsonResponse
    {
        $data = $request->validate([
            'nama_sekolah' => ['sometimes', 'string', 'max:255'],
            'jenjang' => ['nullable', 'string', 'max:20'],
            'alamat' => ['nullable', 'string'],
            'kecamatan' => ['nullable', 'string', 'max:255'],
            'kelurahan' => ['nullable', 'string', 'max:255'],
            'kabupaten_kota' => ['nullable', 'string', 'max:255'],
            'provinsi' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'telepon' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'logo' => ['nullable', 'string'],
            'visi' => ['nullable', 'string'],
            'misi' => ['nullable', 'string'],
            'sambutan_kepala_sekolah' => ['nullable', 'string'],
            'hero_image' => ['nullable', 'string'],
            'auth_background' => ['nullable', 'string'],
            'facebook' => ['nullable', 'string', 'max:255'],
            'instagram' => ['nullable', 'string', 'max:255'],
            'youtube' => ['nullable', 'string', 'max:255'],
        ]);

        $sekolahFields = array_intersect_key(
            $data,
            array_flip([
                'nama_sekolah', 'jenjang', 'alamat', 'kecamatan', 'kelurahan',
                'kabupaten_kota', 'provinsi', 'latitude', 'longitude', 'telepon', 'email', 'logo',
            ])
        );

        if ($sekolahFields !== []) {
            tenant()->update($sekolahFields);
        }

        $settingsFields = array_diff_key($data, $sekolahFields);
        $settings->fill($settingsFields)->save();

        return $this->profil($settings);
    }

    public function pengumuman(Request $request): JsonResponse
    {
        $pengumuman = Pengumuman::query()
            ->where('status', 'published')
            ->orderByDesc('tanggal_publish')
            ->paginate($request->integer('per_page', 10));

        return response()->json($pengumuman);
    }

    public function kegiatan(Request $request): JsonResponse
    {
        $kegiatan = Kegiatan::query()
            ->where('status', 'published')
            ->orderByDesc('tanggal_mulai')
            ->paginate($request->integer('per_page', 10));

        return response()->json($kegiatan);
    }
}
