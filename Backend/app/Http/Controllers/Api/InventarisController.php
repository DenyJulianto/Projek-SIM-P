<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventaris;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class InventarisController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $inventaris = QueryBuilder::for(Inventaris::class)
            ->allowedFilters(
                'nama_barang',
                'kategori',
                AllowedFilter::exact('kondisi'),
                AllowedFilter::exact('status'),
            )
            ->allowedSorts('nama_barang', 'kategori', 'created_at')
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15));

        return response()->json($inventaris);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'kode_barang' => ['nullable', 'string', 'max:30', 'unique:inventaris,kode_barang'],
            'nama_barang' => ['required', 'string', 'max:255'],
            'kategori' => ['required', 'string', 'max:100'],
            'jumlah' => ['required', 'integer', 'min:1'],
            'kondisi' => ['required', 'in:baik,rusak_ringan,rusak_berat'],
            'lokasi' => ['nullable', 'string', 'max:255'],
            'tanggal_perolehan' => ['nullable', 'date'],
            'keterangan' => ['nullable', 'string'],
        ]);

        $inventaris = Inventaris::create($data);

        $inventaris->riwayat()->create([
            'user_id' => $request->user()->id,
            'jenis' => 'pengadaan',
            'tanggal' => $data['tanggal_perolehan'] ?? now()->toDateString(),
            'keterangan' => 'Pengadaan awal saat barang didata.',
        ]);

        return response()->json($inventaris->load('riwayat'), 201);
    }

    public function show(Inventaris $inventari): JsonResponse
    {
        return response()->json($inventari->load('riwayat.user:id,name'));
    }

    public function update(Request $request, Inventaris $inventari): JsonResponse
    {
        $data = $request->validate([
            'kode_barang' => ['nullable', 'string', 'max:30', 'unique:inventaris,kode_barang,' . $inventari->id],
            'nama_barang' => ['sometimes', 'string', 'max:255'],
            'kategori' => ['sometimes', 'string', 'max:100'],
            'jumlah' => ['sometimes', 'integer', 'min:1'],
            'kondisi' => ['sometimes', 'in:baik,rusak_ringan,rusak_berat'],
            'lokasi' => ['nullable', 'string', 'max:255'],
            'tanggal_perolehan' => ['nullable', 'date'],
            'keterangan' => ['nullable', 'string'],
            'status' => ['sometimes', 'in:aktif,nonaktif'],
        ]);

        $inventari->update($data);

        return response()->json($inventari);
    }

    public function destroy(Inventaris $inventari): JsonResponse
    {
        $inventari->delete();

        return response()->json(['message' => 'Barang inventaris berhasil dihapus.']);
    }

    public function storeRiwayat(Request $request, Inventaris $inventari): JsonResponse
    {
        $data = $request->validate([
            'jenis' => ['required', 'in:pengadaan,pemeliharaan,perbaikan'],
            'tanggal' => ['required', 'date'],
            'keterangan' => ['nullable', 'string'],
            'biaya' => ['nullable', 'numeric', 'min:0'],
        ]);

        $riwayat = $inventari->riwayat()->create([
            ...$data,
            'user_id' => $request->user()->id,
        ]);

        if ($request->filled('kondisi_baru')) {
            $inventari->update(['kondisi' => $request->validate([
                'kondisi_baru' => ['in:baik,rusak_ringan,rusak_berat'],
            ])['kondisi_baru']]);
        }

        return response()->json($riwayat->load('user:id,name'), 201);
    }
}
