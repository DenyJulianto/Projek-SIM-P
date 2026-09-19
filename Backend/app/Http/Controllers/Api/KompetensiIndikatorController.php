<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KompetensiIndikator;
use App\Models\TujuanPembelajaran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Indikator kompetensi/ketercapaian, digabung di bawah Tujuan Pembelajaran
 * (bukan menu "Kompetensi" berdiri sendiri) — lihat TujuanPembelajaranController
 * untuk konteks CP -> TP. Setiap indikator dimiliki oleh satu TP.
 */
class KompetensiIndikatorController extends Controller
{
    public function index(TujuanPembelajaran $tujuanPembelajaran): JsonResponse
    {
        return response()->json($tujuanPembelajaran->indikator()->get());
    }

    public function store(Request $request, TujuanPembelajaran $tujuanPembelajaran): JsonResponse
    {
        $data = $this->validateIndikator($request);
        $data['urutan'] ??= 1 + (int) $tujuanPembelajaran->indikator()->max('urutan');

        $indikator = $tujuanPembelajaran->indikator()->create($data);

        activity()
            ->performedOn($indikator)
            ->causedBy($request->user())
            ->event('created')
            ->log("Menambahkan indikator #{$indikator->urutan} pada TP #{$tujuanPembelajaran->urutan}.");

        return response()->json($indikator, 201);
    }

    public function update(Request $request, KompetensiIndikator $indikator): JsonResponse
    {
        $data = $this->validateIndikator($request);

        $indikator->update($data);

        activity()
            ->performedOn($indikator)
            ->causedBy($request->user())
            ->event('updated')
            ->log("Memperbarui indikator #{$indikator->urutan}.");

        return response()->json($indikator);
    }

    public function destroy(Request $request, KompetensiIndikator $indikator): JsonResponse
    {
        $label = "#{$indikator->urutan}";

        activity()
            ->performedOn($indikator)
            ->causedBy($request->user())
            ->event('deleted')
            ->log("Menghapus indikator {$label}.");

        $indikator->delete();

        return response()->json(['message' => 'Indikator berhasil dihapus.']);
    }

    /**
     * Urutkan ulang seluruh indikator satu TP sekaligus — dipakai tombol
     * naik/turun di frontend supaya urutan tersimpan langsung tanpa perlu
     * form edit terpisah per baris.
     */
    public function reorder(Request $request, TujuanPembelajaran $tujuanPembelajaran): JsonResponse
    {
        $data = $request->validate([
            'urutan' => ['required', 'array', 'min:1'],
            'urutan.*' => ['required', 'integer', 'distinct'],
        ]);

        $ids = $data['urutan'];
        $milikTp = $tujuanPembelajaran->indikator()->pluck('id')->all();

        if (count(array_diff($ids, $milikTp)) > 0 || count($ids) !== count($milikTp)) {
            return response()->json(['message' => 'Daftar indikator tidak cocok dengan TP ini.'], 422);
        }

        foreach ($ids as $index => $id) {
            KompetensiIndikator::whereKey($id)->update(['urutan' => $index + 1]);
        }

        return response()->json($tujuanPembelajaran->indikator()->get());
    }

    private function validateIndikator(Request $request): array
    {
        return $request->validate([
            'urutan' => ['nullable', 'integer', 'min:1', 'max:9999'],
            'deskripsi' => ['required', 'string'],
            'kriteria_ketercapaian' => ['nullable', 'string'],
            'status_ketercapaian' => ['nullable', 'in:belum_tercapai,tercapai'],
        ]);
    }
}
