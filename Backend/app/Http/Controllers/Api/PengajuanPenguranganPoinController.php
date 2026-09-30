<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PengajuanPenguranganPoin;
use App\Notifications\PenguranganPoinDisetujuiNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

/**
 * Alur pengurangan poin kedisiplinan: BK mengajukan (store), Kesiswaan
 * menyetujui (setujui) atau menolak (tolak). Poin siswa HANYA berkurang
 * saat disetujui — bukan saat diajukan — supaya BK & Kesiswaan selalu
 * sepakat dulu sebelum siswa/orang tua diberi tahu.
 */
class PengajuanPenguranganPoinController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $bisaMenyetujui = $user->can('pengurangan-poin.approve');

        $pengajuan = PengajuanPenguranganPoin::query()
            ->with(['siswa:id,nama,kelas_id,poin_disiplin', 'pelanggaran:id,jenis,tingkat,tanggal', 'diajukanOleh:id,name'])
            ->when(! $bisaMenyetujui, fn ($q) => $q->where('diajukan_oleh', $user->id))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('siswa_id'), fn ($q) => $q->where('siswa_id', $request->integer('siswa_id')))
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15));

        return response()->json($pengajuan);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'siswa_id' => ['required', 'exists:siswa,id'],
            'pelanggaran_id' => ['required', 'exists:pelanggaran,id'],
            'poin_diajukan' => ['required', 'integer', 'min:1', 'max:1000'],
            'alasan' => ['required', 'string'],
        ]);

        $pengajuan = PengajuanPenguranganPoin::create($data + [
            'diajukan_oleh' => $request->user()->id,
            'status' => 'menunggu',
        ]);

        activity()->causedBy($request->user())->log("Mengajukan pengurangan {$pengajuan->poin_diajukan} poin.");

        return response()->json(
            $pengajuan->load(['siswa:id,nama,kelas_id', 'pelanggaran:id,jenis,tingkat,tanggal']),
            201
        );
    }

    public function setujui(Request $request, PengajuanPenguranganPoin $pengajuan): JsonResponse
    {
        abort_if($pengajuan->status !== 'menunggu', 422, 'Pengajuan ini sudah diputuskan.');

        $data = $request->validate([
            'catatan_kesiswaan' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($pengajuan, $request, $data) {
            $siswa = $pengajuan->siswa()->lockForUpdate()->first();
            $siswa->poin_disiplin = max(0, $siswa->poin_disiplin - $pengajuan->poin_diajukan);
            $siswa->save();

            $pengajuan->update([
                'status' => 'disetujui',
                'catatan_kesiswaan' => $data['catatan_kesiswaan'] ?? null,
                'diputuskan_oleh' => $request->user()->id,
                'diputuskan_at' => now(),
            ]);
        });

        activity()->causedBy($request->user())->log("Menyetujui pengurangan {$pengajuan->poin_diajukan} poin untuk \"{$pengajuan->siswa->nama}\".");

        $this->notifySiswaDanOrtu($pengajuan, new PenguranganPoinDisetujuiNotification($pengajuan));

        return response()->json($pengajuan->fresh(['siswa:id,nama,kelas_id,poin_disiplin', 'pelanggaran:id,jenis,tingkat,tanggal']));
    }

    public function tolak(Request $request, PengajuanPenguranganPoin $pengajuan): JsonResponse
    {
        abort_if($pengajuan->status !== 'menunggu', 422, 'Pengajuan ini sudah diputuskan.');

        $data = $request->validate([
            'catatan_kesiswaan' => ['required', 'string'],
        ]);

        $pengajuan->update([
            'status' => 'ditolak',
            'catatan_kesiswaan' => $data['catatan_kesiswaan'],
            'diputuskan_oleh' => $request->user()->id,
            'diputuskan_at' => now(),
        ]);

        activity()->causedBy($request->user())->log("Menolak pengajuan pengurangan poin untuk \"{$pengajuan->siswa->nama}\".");

        return response()->json($pengajuan->fresh(['siswa:id,nama,kelas_id', 'pelanggaran:id,jenis,tingkat,tanggal']));
    }

    private function notifySiswaDanOrtu(PengajuanPenguranganPoin $pengajuan, $notification): void
    {
        $pengajuan->loadMissing(['siswa.user', 'siswa.walis']);

        $penerima = collect([$pengajuan->siswa->user])
            ->merge($pengajuan->siswa->walis)
            ->filter();

        if ($penerima->isNotEmpty()) {
            Notification::send($penerima, $notification);
        }
    }
}
