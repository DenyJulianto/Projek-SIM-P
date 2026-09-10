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
            'telepon' => $sekolah->telepon,
            'email' => $sekolah->email,
            'logo' => $sekolah->logo,
            'visi' => $settings->visi,
            'misi' => $settings->misi,
            'sambutan_kepala_sekolah' => $settings->sambutan_kepala_sekolah,
            'hero_image' => $settings->hero_image,
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
            'visi' => ['nullable', 'string'],
            'misi' => ['nullable', 'string'],
            'sambutan_kepala_sekolah' => ['nullable', 'string'],
            'hero_image' => ['nullable', 'string'],
            'facebook' => ['nullable', 'string', 'max:255'],
            'instagram' => ['nullable', 'string', 'max:255'],
            'youtube' => ['nullable', 'string', 'max:255'],
        ]);

        $settings->fill($data)->save();

        return response()->json($settings);
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
