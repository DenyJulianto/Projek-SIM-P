<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ModulAjar;
use App\Models\ModulAjarLampiran;
use App\Support\DokumenModulAjar;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

/**
 * Peninjauan perangkat ajar guru. Hanya Kepala Sekolah dan Waka
 * Kurikulum yang boleh menyetujui atau meminta revisi — guru tidak bisa
 * mengubah status perangkat ajarnya sendiri.
 */
class ReviewPerangkatAjarController extends Controller
{
    public const PERAN_PENINJAU = ['Kepala Sekolah', 'Kurikulum'];

    private function pastikanPeninjau(Request $request): void
    {
        abort_unless($request->user()->hasAnyRole(self::PERAN_PENINJAU), 403, 'Hanya Kepala Sekolah atau Waka Kurikulum yang dapat meninjau perangkat ajar.');
    }

    public function index(Request $request): JsonResponse
    {
        $this->pastikanPeninjau($request);
        $status = $request->query('status', ModulAjar::DIAJUKAN);

        $items = ModulAjar::whereIn('status', [ModulAjar::DIAJUKAN, ModulAjar::REVISI, ModulAjar::DISETUJUI])
            ->when($status !== 'semua', fn ($q) => $q->where('status', $status))
            ->with(['guru:id,nama,gelar,nip', 'lampiran', 'peninjau:id,name'])
            ->orderByRaw('diajukan_at is null, diajukan_at desc')
            ->get();

        $jumlah = ModulAjar::selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');

        return response()->json(['data' => $items, 'jumlah' => $jumlah]);
    }

    public function setujui(Request $request, ModulAjar $modul): JsonResponse
    {
        $this->pastikanPeninjau($request);
        abort_unless($modul->status === ModulAjar::DIAJUKAN, 422, 'Hanya perangkat ajar yang sedang diajukan yang bisa disetujui.');

        $catatan = $request->validate(['catatan' => ['nullable', 'string', 'max:2000']])['catatan'] ?? null;
        $modul->update([
            'status' => ModulAjar::DISETUJUI,
            'ditinjau_oleh' => $request->user()->id,
            'ditinjau_at' => now(),
            'catatan_review' => $catatan,
        ]);

        return response()->json($modul->fresh(['guru:id,nama,gelar,nip', 'lampiran', 'peninjau:id,name']));
    }

    public function revisi(Request $request, ModulAjar $modul): JsonResponse
    {
        $this->pastikanPeninjau($request);
        abort_unless($modul->status === ModulAjar::DIAJUKAN, 422, 'Hanya perangkat ajar yang sedang diajukan yang bisa dikembalikan untuk revisi.');

        $catatan = $request->validate(
            ['catatan' => ['required', 'string', 'max:2000']],
            ['catatan.required' => 'Tuliskan catatan revisi untuk guru.'],
        )['catatan'];
        $modul->update([
            'status' => ModulAjar::REVISI,
            'ditinjau_oleh' => $request->user()->id,
            'ditinjau_at' => now(),
            'catatan_review' => $catatan,
        ]);

        return response()->json($modul->fresh(['guru:id,nama,gelar,nip', 'lampiran', 'peninjau:id,name']));
    }

    public function unduh(Request $request, ModulAjar $modul, string $format): Response
    {
        $this->pastikanPeninjau($request);
        abort_if($modul->status === ModulAjar::DRAFT, 404);

        return (new DokumenModulAjar($modul->load(['guru', 'lampiran', 'peninjau'])))->respons($format);
    }

    public function unduhLampiran(Request $request, ModulAjar $modul, ModulAjarLampiran $lampiran): Response
    {
        $this->pastikanPeninjau($request);
        abort_if($modul->status === ModulAjar::DRAFT, 404);
        abort_unless($lampiran->modul_ajar_id === $modul->id, 404);

        return Storage::disk('local')->download($lampiran->path, $lampiran->nama_file);
    }
}
