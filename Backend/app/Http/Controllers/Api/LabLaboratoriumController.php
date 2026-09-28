<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Laboratorium;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity;

class LabLaboratoriumController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $in = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:aktif,nonaktif'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $lab = Laboratorium::withCount('peralatan')
            ->with('penanggungJawab:id,nama')
            ->when(! empty($in['search']), fn ($q) => $q->where('nama', 'like', "%{$in['search']}%"))
            ->when(! empty($in['status']), fn ($q) => $q->where('status', $in['status']))
            ->orderBy('nama')
            ->paginate($in['per_page'] ?? 15);

        return response()->json($lab);
    }

    public function opsi(): JsonResponse
    {
        return response()->json([
            'laboratorium' => Laboratorium::where('status', 'aktif')->orderBy('nama')->get(['id', 'nama']),
        ]);
    }

    private function rules(): array
    {
        return [
            'nama' => ['required', 'string', 'max:255'],
            'kategori' => ['nullable', 'string', 'max:100'],
            'penanggung_jawab_guru_id' => ['nullable', 'integer', 'exists:guru,id'],
            'kapasitas' => ['nullable', 'integer', 'min:0'],
            'deskripsi' => ['nullable', 'string'],
            'status' => ['nullable', 'in:aktif,nonaktif'],
            'foto' => ['nullable', 'image', 'max:2048'],
        ];
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());
        if ($request->hasFile('foto')) {
            $data['foto_path'] = $request->file('foto')->store('laboratorium/foto', 'public');
        }
        unset($data['foto']);

        $lab = Laboratorium::create([...$data, 'dibuat_oleh' => $request->user()->id]);

        activity()->performedOn($lab)->causedBy($request->user())->log("Menambahkan laboratorium \"{$lab->nama}\".");

        return response()->json($lab, 201);
    }

    public function show(Laboratorium $laboratorium): JsonResponse
    {
        return response()->json($laboratorium->load('penanggungJawab:id,nama'));
    }

    public function update(Request $request, Laboratorium $laboratorium): JsonResponse
    {
        $rules = $this->rules();
        $rules['nama'] = ['sometimes', 'string', 'max:255'];
        $data = $request->validate($rules);

        if ($request->hasFile('foto')) {
            $data['foto_path'] = $request->file('foto')->store('laboratorium/foto', 'public');
        }
        unset($data['foto']);

        $laboratorium->update($data);

        activity()->performedOn($laboratorium)->causedBy($request->user())->log("Memperbarui data laboratorium \"{$laboratorium->nama}\".");

        return response()->json($laboratorium);
    }

    public function destroy(Request $request, Laboratorium $laboratorium): JsonResponse
    {
        $laboratorium->update(['status' => 'nonaktif']);

        activity()->performedOn($laboratorium)->causedBy($request->user())->log("Menonaktifkan laboratorium \"{$laboratorium->nama}\".");

        return response()->json(['message' => 'Laboratorium dinonaktifkan.']);
    }

    public function riwayat(Laboratorium $laboratorium): JsonResponse
    {
        $riwayat = Activity::where('subject_type', Laboratorium::class)
            ->where('subject_id', $laboratorium->id)
            ->with('causer:id,name')
            ->latest('id')
            ->limit(50)
            ->get()
            ->map(fn (Activity $a) => ['waktu' => $a->created_at, 'pengguna' => $a->causer?->name ?? 'Sistem', 'keterangan' => $a->description]);

        return response()->json($riwayat);
    }
}
