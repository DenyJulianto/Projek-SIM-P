<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventaris;
use App\Models\PemeliharaanAlat;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LabPemeliharaanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $in = $request->validate([
            'inventaris_id' => ['nullable', 'integer'],
            'jenis_pemeliharaan' => ['nullable', 'string'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $pemeliharaan = PemeliharaanAlat::with(['inventaris:id,nama_barang,kode_barang,laboratorium_id', 'inventaris.laboratorium:id,nama', 'dibuatOleh:id,name'])
            ->when(! empty($in['inventaris_id']), fn ($q) => $q->where('inventaris_id', $in['inventaris_id']))
            ->when(! empty($in['jenis_pemeliharaan']), fn ($q) => $q->where('jenis_pemeliharaan', $in['jenis_pemeliharaan']))
            ->orderByDesc('tanggal')
            ->paginate($in['per_page'] ?? 15);

        return response()->json($pemeliharaan);
    }

    private function legacyKondisi(string $kondisiLab): string
    {
        return match ($kondisiLab) {
            'baik' => 'baik',
            'rusak_ringan', 'dalam_perbaikan' => 'rusak_ringan',
            default => 'rusak_berat',
        };
    }

    public function store(Request $request): JsonResponse
    {
        $in = $request->validate([
            'inventaris_id' => ['required', 'integer', 'exists:inventaris,id'],
            'jenis_pemeliharaan' => ['required', 'in:rutin,perbaikan,kalibrasi,pembersihan,penggantian_komponen'],
            'tanggal' => ['required', 'date'],
            'teknisi' => ['nullable', 'string', 'max:255'],
            'kondisi_sebelum' => ['nullable', 'in:baik,rusak_ringan,rusak_berat,dalam_perbaikan,hilang,tidak_layak'],
            'tindakan' => ['nullable', 'string'],
            'kondisi_setelah' => ['nullable', 'in:baik,rusak_ringan,rusak_berat,dalam_perbaikan,hilang,tidak_layak'],
            'biaya' => ['nullable', 'numeric', 'min:0'],
            'catatan' => ['nullable', 'string'],
            'tanggal_berikutnya' => ['nullable', 'date'],
        ]);

        $alat = Inventaris::findOrFail($in['inventaris_id']);
        $in['kondisi_sebelum'] = $in['kondisi_sebelum'] ?? ($alat->kondisi_lab ?: $alat->kondisi);

        $pemeliharaan = PemeliharaanAlat::create([...$in, 'dibuat_oleh' => $request->user()->id]);

        if (! empty($in['kondisi_setelah'])) {
            $alat->update(['kondisi_lab' => $in['kondisi_setelah'], 'kondisi' => $this->legacyKondisi($in['kondisi_setelah'])]);
        }

        return response()->json($pemeliharaan->load('inventaris'), 201);
    }

    public function show(PemeliharaanAlat $pemeliharaanAlat): JsonResponse
    {
        return response()->json($pemeliharaanAlat->load(['inventaris.laboratorium', 'dibuatOleh:id,name']));
    }

    public function update(Request $request, PemeliharaanAlat $pemeliharaanAlat): JsonResponse
    {
        $data = $request->validate([
            'jenis_pemeliharaan' => ['sometimes', 'in:rutin,perbaikan,kalibrasi,pembersihan,penggantian_komponen'],
            'tanggal' => ['sometimes', 'date'],
            'teknisi' => ['nullable', 'string', 'max:255'],
            'tindakan' => ['nullable', 'string'],
            'kondisi_setelah' => ['nullable', 'in:baik,rusak_ringan,rusak_berat,dalam_perbaikan,hilang,tidak_layak'],
            'biaya' => ['nullable', 'numeric', 'min:0'],
            'catatan' => ['nullable', 'string'],
            'tanggal_berikutnya' => ['nullable', 'date'],
        ]);

        $pemeliharaanAlat->update($data);

        if (! empty($data['kondisi_setelah'])) {
            $pemeliharaanAlat->inventaris->update(['kondisi_lab' => $data['kondisi_setelah'], 'kondisi' => $this->legacyKondisi($data['kondisi_setelah'])]);
        }

        return response()->json($pemeliharaanAlat);
    }

    public function destroy(PemeliharaanAlat $pemeliharaanAlat): JsonResponse
    {
        $pemeliharaanAlat->delete();

        return response()->json(['message' => 'Riwayat pemeliharaan dihapus.']);
    }
}
