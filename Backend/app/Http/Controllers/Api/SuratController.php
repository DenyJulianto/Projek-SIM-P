<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Surat;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SuratController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $surat = QueryBuilder::for(Surat::class)
            ->allowedFilters(AllowedFilter::exact('jenis'), AllowedFilter::exact('status'), 'perihal')
            ->allowedSorts('tanggal_agenda', 'created_at')
            ->orderByDesc('tanggal_agenda')
            ->paginate($request->integer('per_page', 15));

        return response()->json($surat);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'jenis' => ['required', 'in:masuk,keluar'],
            'nomor_surat' => ['nullable', 'string', 'max:100'],
            'perihal' => ['required', 'string', 'max:255'],
            'pengirim' => ['nullable', 'string', 'max:255'],
            'tujuan' => ['nullable', 'string', 'max:255'],
            'tanggal_surat' => ['required', 'date'],
            'tanggal_agenda' => ['required', 'date'],
            'keterangan' => ['nullable', 'string'],
            'status' => ['nullable', 'in:baru,diproses,selesai'],
            'file' => ['nullable', 'file', 'max:5120'],
        ]);

        if ($request->hasFile('file')) {
            $data['file'] = $request->file('file')->store('surat', 'public');
        }

        $data['user_id'] = $request->user()->id;

        $surat = Surat::create($data);

        return response()->json($surat->load('user:id,name'), 201);
    }

    public function show(Surat $surat): JsonResponse
    {
        return response()->json($surat->load('user:id,name'));
    }

    public function update(Request $request, Surat $surat): JsonResponse
    {
        $data = $request->validate([
            'jenis' => ['sometimes', 'in:masuk,keluar'],
            'nomor_surat' => ['nullable', 'string', 'max:100'],
            'perihal' => ['sometimes', 'string', 'max:255'],
            'pengirim' => ['nullable', 'string', 'max:255'],
            'tujuan' => ['nullable', 'string', 'max:255'],
            'tanggal_surat' => ['sometimes', 'date'],
            'tanggal_agenda' => ['sometimes', 'date'],
            'keterangan' => ['nullable', 'string'],
            'status' => ['nullable', 'in:baru,diproses,selesai'],
        ]);

        $surat->update($data);

        return response()->json($surat);
    }

    public function destroy(Surat $surat): JsonResponse
    {
        if ($surat->file) {
            Storage::disk('public')->delete($surat->file);
        }

        $surat->delete();

        return response()->json(['message' => 'Surat berhasil dihapus.']);
    }

    public function showFile(string $path): StreamedResponse|Response
    {
        $path = 'surat/' . $path;

        if (! Storage::disk('public')->exists($path)) {
            abort(404);
        }

        return Storage::disk('public')->response($path);
    }
}
