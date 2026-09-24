<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserSertifikat;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Profil profesional untuk staf non-guru (mis. Bendahara). Bentuknya sama
 * dengan profil guru (GuruSelfController) — pendidikan, keahlian, kutipan,
 * bio, sertifikat, dst — tetapi disimpan di tabel users/user_sertifikat
 * sehingga staf ini tidak perlu punya baris di tabel guru (yang akan ikut
 * muncul di daftar guru dan tersinkron ke direktori guru nasional).
 */
class StaffProfileController extends Controller
{
    public function profil(Request $request): JsonResponse
    {
        return response()->json($this->present($request->user()));
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nama' => ['required', 'string', 'max:255'],
            'jabatan' => ['nullable', 'string', 'max:100'],
            'gelar' => ['nullable', 'string', 'max:100'],
            'pendidikan_terakhir' => ['nullable', 'string', 'max:100'],
            'keahlian' => ['nullable', 'string', 'max:255'],
            'kutipan' => ['nullable', 'string', 'max:255'],
            'bio' => ['nullable', 'string', 'max:1000'],
            'media_sosial' => ['nullable', 'url', 'max:255'],
        ]);

        $user = $request->user();

        // Hanya field yang dikirim yang diubah — tab Kompetensi mengirim
        // sebagian field saja dan tidak boleh mengosongkan sisanya.
        $user->name = $data['nama'];
        foreach (['jabatan', 'gelar', 'pendidikan_terakhir', 'keahlian', 'kutipan', 'bio', 'media_sosial'] as $field) {
            if (array_key_exists($field, $data)) {
                $user->{$field} = $data[$field];
            }
        }
        $user->save();

        return response()->json($this->present($user));
    }

    public function storeSertifikat(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'files' => ['required', 'array', 'min:1', 'max:10'],
            'files.*' => ['file', 'mimes:pdf', 'max:20480'],
        ]);

        abort_if(
            $user->sertifikat()->count() + count($request->file('files')) > 20,
            422,
            'Maksimal 20 file sertifikat.'
        );

        foreach ($request->file('files') as $file) {
            $user->sertifikat()->create([
                'nama_file' => $file->getClientOriginalName(),
                'path' => $file->store('sertifikat-staf', 'public'),
            ]);
        }

        return response()->json($user->sertifikat()->latest('id')->get(), 201);
    }

    public function destroySertifikat(Request $request, UserSertifikat $sertifikat): JsonResponse
    {
        abort_unless($sertifikat->user_id === $request->user()->id, 403);

        Storage::disk('public')->delete($sertifikat->path);
        $sertifikat->delete();

        return response()->json(['message' => 'Sertifikat dihapus.']);
    }

    public function showSertifikatFile(string $path): StreamedResponse
    {
        $path = 'sertifikat-staf/' . $path;

        abort_unless(Storage::disk('public')->exists($path), 404);

        return Storage::disk('public')->response($path);
    }

    /**
     * Bentuk respons disamakan dengan profil guru supaya komponen frontend
     * yang sama bisa dipakai (nama, gelar, jabatan, ..., sertifikat[]).
     */
    private function present(User $user): array
    {
        return [
            'nama' => $user->name,
            'jabatan' => $user->jabatan,
            'gelar' => $user->gelar,
            'pendidikan_terakhir' => $user->pendidikan_terakhir,
            'keahlian' => $user->keahlian,
            'kutipan' => $user->kutipan,
            'bio' => $user->bio,
            'media_sosial' => $user->media_sosial,
            'sertifikat' => $user->sertifikat()->latest('id')->get(),
        ];
    }
}
