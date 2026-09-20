<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\ModulAjar;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ModulAjarController extends Controller
{
    private function guruFor(Request $request): Guru
    {
        $guru = $request->user()->guru;

        abort_unless($guru, 403, 'Akun ini tidak tertaut ke profil guru.');

        return $guru;
    }

    private function rules(): array
    {
        return [
            'kurikulum' => ['required', 'in:merdeka,k13'],
            'judul' => ['required', 'string', 'max:255'],
            'mata_pelajaran' => ['nullable', 'string', 'max:255'],
            'kelas' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'in:draft,final'],
            'data' => ['required', 'array'],
            'data.*' => ['nullable'],
        ];
    }

    private function ownedOrFail(Request $request, ModulAjar $modul): ModulAjar
    {
        abort_unless($modul->guru_id === $this->guruFor($request)->id, 403);

        return $modul;
    }

    public function index(Request $request): JsonResponse
    {
        $guru = $this->guruFor($request);

        return response()->json(
            ModulAjar::where('guru_id', $guru->id)->orderByDesc('updated_at')->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $guru = $this->guruFor($request);
        $data = $request->validate($this->rules());

        return response()->json($guru->modulAjar()->create($data), 201);
    }

    public function update(Request $request, ModulAjar $modul): JsonResponse
    {
        $this->ownedOrFail($request, $modul);
        $data = $request->validate($this->rules());
        unset($data['kurikulum']);

        $modul->update($data);

        return response()->json($modul);
    }

    public function destroy(Request $request, ModulAjar $modul): JsonResponse
    {
        $this->ownedOrFail($request, $modul)->delete();

        return response()->json(['message' => 'Modul ajar dihapus.']);
    }
}
