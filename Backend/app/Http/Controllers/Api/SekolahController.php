<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sekolah;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\QueryBuilder;

class SekolahController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $sekolah = QueryBuilder::for(Sekolah::class)
            ->allowedFilters('nama_sekolah', 'npsn', 'jenjang', 'status')
            ->allowedSorts('nama_sekolah', 'created_at')
            ->with('domains')
            ->paginate($request->integer('per_page', 15));

        return response()->json($sekolah);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id' => ['required', 'string', 'alpha_dash', 'unique:tenants,id'],
            'nama_sekolah' => ['required', 'string', 'max:255'],
            'npsn' => ['nullable', 'string', 'max:20', 'unique:tenants,npsn'],
            'jenjang' => ['nullable', 'string', 'max:20'],
            'alamat' => ['nullable', 'string'],
            'telepon' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'status' => ['nullable', 'in:active,inactive'],
            'domain' => ['required', 'string', 'max:255'],
        ]);

        $sekolah = Sekolah::create([
            'id' => $data['id'],
            'nama_sekolah' => $data['nama_sekolah'],
            'npsn' => $data['npsn'] ?? null,
            'jenjang' => $data['jenjang'] ?? null,
            'alamat' => $data['alamat'] ?? null,
            'telepon' => $data['telepon'] ?? null,
            'email' => $data['email'] ?? null,
            'status' => $data['status'] ?? 'active',
        ]);

        $sekolah->domains()->create(['domain' => $data['domain']]);

        return response()->json($sekolah->load('domains'), 201);
    }

    public function show(Sekolah $sekolah): JsonResponse
    {
        return response()->json($sekolah->load('domains'));
    }

    public function update(Request $request, Sekolah $sekolah): JsonResponse
    {
        $data = $request->validate([
            'nama_sekolah' => ['sometimes', 'string', 'max:255'],
            'npsn' => ['nullable', 'string', 'max:20', 'unique:tenants,npsn,' . $sekolah->id],
            'jenjang' => ['nullable', 'string', 'max:20'],
            'alamat' => ['nullable', 'string'],
            'telepon' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'status' => ['sometimes', 'in:active,inactive'],
        ]);

        $sekolah->update($data);

        return response()->json($sekolah->load('domains'));
    }

    public function destroy(Sekolah $sekolah): JsonResponse
    {
        $sekolah->delete();

        return response()->json(['message' => 'Sekolah berhasil dihapus.']);
    }
}
