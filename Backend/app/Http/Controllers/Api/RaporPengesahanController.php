<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rapor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Lapisan status pengesahan rapor. Konten rapor (nilai + absensi) tetap
 * dihitung on-the-fly oleh RaporController — controller ini hanya
 * melacak status draf/diajukan/disahkan/ditolak per siswa per periode.
 */
class RaporPengesahanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $rapor = Rapor::query()
            ->with(['siswa:id,nama,nis,kelas_id', 'diajukanOleh:id,name', 'disahkanOleh:id,name'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->orderByDesc('created_at')
            ->get();

        return response()->json($rapor);
    }

    public function ajukan(Request $request): JsonResponse
    {
        $data = $request->validate([
            'siswa_id' => ['required', 'exists:siswa,id'],
            'semester' => ['required', 'string', 'max:10'],
            'tahun_ajaran' => ['required', 'string', 'max:20'],
            'catatan_wali_kelas' => ['nullable', 'string'],
        ]);

        $rapor = Rapor::firstOrNew([
            'siswa_id' => $data['siswa_id'],
            'semester' => $data['semester'],
            'tahun_ajaran' => $data['tahun_ajaran'],
        ]);

        $rapor->fill([
            'status' => 'diajukan',
            'diajukan_oleh' => $request->user()->id,
            'disahkan_oleh' => null,
            'catatan' => null,
            'tanggal_keputusan' => null,
        ]);

        if (array_key_exists('catatan_wali_kelas', $data)) {
            $rapor->catatan_wali_kelas = $data['catatan_wali_kelas'];
        }

        $rapor->save();

        activity()
            ->causedBy($request->user())
            ->log("Mengajukan rapor siswa \"{$rapor->siswa?->nama}\" untuk pengesahan.");

        return response()->json($rapor->load(['siswa:id,nama,nis,kelas_id', 'diajukanOleh:id,name']), 201);
    }

    /**
     * Catatan wali kelas adalah komentar/observasi wali kelas untuk rapor
     * siswa binaannya — terpisah dari `catatan` (yang diisi Kepala Sekolah
     * saat mengesahkan/menolak) sehingga bisa diedit kapan saja tanpa
     * mengubah status pengajuan rapor.
     */
    public function updateCatatanWaliKelas(Request $request, Rapor $rapor): JsonResponse
    {
        $data = $request->validate(['catatan_wali_kelas' => ['nullable', 'string']]);

        $rapor->update($data);

        return response()->json($rapor->load(['siswa:id,nama,nis,kelas_id']));
    }

    /**
     * Menghapus pengajuan rapor. Karena Kepala Sekolah membaca tabel yang sama,
     * data ikut hilang dari daftar pengesahan mereka. Rapor yang sudah disahkan
     * tidak boleh dihapus karena sudah menjadi dokumen resmi.
     */
    public function destroy(Request $request, Rapor $rapor): JsonResponse
    {
        $user = $request->user();

        if (! $user->can('kurikulum.manage')) {
            $waliId = $rapor->siswa?->kelas?->wali_kelas_id;
            abort_unless($waliId !== null && $waliId === $user->guru?->id, 403, 'Rapor ini bukan milik kelas binaan Anda.');
        }

        if ($rapor->status === 'disahkan') {
            throw ValidationException::withMessages([
                'status' => ['Rapor yang sudah disahkan tidak dapat dihapus.'],
            ]);
        }

        $nama = $rapor->siswa?->nama;
        $rapor->delete();

        activity()
            ->causedBy($user)
            ->log("Menghapus pengajuan rapor siswa \"{$nama}\" ({$rapor->semester} {$rapor->tahun_ajaran}).");

        return response()->json(['message' => 'Rapor dihapus.']);
    }

    public function sahkan(Request $request, Rapor $rapor): JsonResponse
    {
        $this->assertPending($rapor);

        $data = $request->validate(['catatan' => ['nullable', 'string']]);

        $rapor->update([
            'status' => 'disahkan',
            'disahkan_oleh' => $request->user()->id,
            'catatan' => $data['catatan'] ?? null,
            'tanggal_keputusan' => now(),
        ]);

        activity()
            ->causedBy($request->user())
            ->log("Mengesahkan rapor siswa \"{$rapor->siswa?->nama}\" ({$rapor->semester} {$rapor->tahun_ajaran}).");

        return response()->json($rapor->load(['siswa:id,nama,nis,kelas_id', 'diajukanOleh:id,name', 'disahkanOleh:id,name']));
    }

    public function tolak(Request $request, Rapor $rapor): JsonResponse
    {
        $this->assertPending($rapor);

        $data = $request->validate(['catatan' => ['required', 'string']]);

        $rapor->update([
            'status' => 'ditolak',
            'disahkan_oleh' => $request->user()->id,
            'catatan' => $data['catatan'],
            'tanggal_keputusan' => now(),
        ]);

        activity()
            ->causedBy($request->user())
            ->log("Menolak pengesahan rapor siswa \"{$rapor->siswa?->nama}\" ({$rapor->semester} {$rapor->tahun_ajaran}).");

        return response()->json($rapor->load(['siswa:id,nama,nis,kelas_id', 'diajukanOleh:id,name', 'disahkanOleh:id,name']));
    }

    private function assertPending(Rapor $rapor): void
    {
        if ($rapor->status !== 'diajukan') {
            throw ValidationException::withMessages([
                'status' => ['Rapor ini sudah diputuskan sebelumnya.'],
            ]);
        }
    }
}
