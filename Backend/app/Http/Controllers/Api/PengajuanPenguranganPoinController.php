<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CatatanPoin;
use App\Models\Pelanggaran;
use App\Models\PengajuanPenguranganPoin;
use App\Notifications\PenguranganPoinDisetujuiNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;

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

        $pelanggaran = Pelanggaran::find($data['pelanggaran_id']);
        abort_if($pelanggaran->siswa_id !== (int) $data['siswa_id'], 422, 'Pelanggaran yang dipilih bukan milik siswa ini.');

        // Satu pelanggaran hanya memotong poin sekali, termasuk bila Kesiswaan
        // sudah memotongnya langsung di menu Poin Siswa.
        if ($alasan = $pelanggaran->alasanSudahDipotong()) {
            throw ValidationException::withMessages(['pelanggaran_id' => $alasan]);
        }

        // Poin mengikuti pedoman tata tertib sesuai tingkat pelanggaran.
        $pedoman = CatatanPoin::KATEGORI[$pelanggaran->tingkat] ?? null;
        if ($pedoman && ($data['poin_diajukan'] < $pedoman['min'] || $data['poin_diajukan'] > $pedoman['max'])) {
            throw ValidationException::withMessages([
                'poin_diajukan' => "Poin untuk {$pedoman['label']} harus ".($pedoman['min'] === $pedoman['max'] ? $pedoman['min'] : "{$pedoman['min']}–{$pedoman['max']}").'.',
            ]);
        }

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
        // Kesiswaan mungkin sudah memotong langsung setelah BK mengajukan.
        if ($alasan = $pengajuan->pelanggaran?->alasanSudahDipotong(null, $pengajuan->id)) {
            abort(422, $alasan.' Tolak pengajuan ini.');
        }

        $data = $request->validate([
            'catatan_kesiswaan' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($pengajuan, $request, $data) {
            // Dicatat di buku poin (sama seperti pengurangan langsung dari menu
            // Poin Siswa) dengan kategori sesuai tingkat pelanggarannya, lalu
            // sisa poin dihitung ulang.
            $siswa = $pengajuan->siswa()->lockForUpdate()->first();
            $pengajuan->loadMissing('pelanggaran:id,jenis,tingkat');
            $siswa->catatanPoin()->create([
                'kategori' => array_key_exists($pengajuan->pelanggaran->tingkat, Pelanggaran::TINGKAT)
                    ? $pengajuan->pelanggaran->tingkat
                    : 'sedang',
                'pelanggaran_id' => $pengajuan->pelanggaran_id,
                'pengajuan_id' => $pengajuan->id,
                'poin' => $pengajuan->poin_diajukan,
                'keterangan' => "Pelanggaran: {$pengajuan->pelanggaran->jenis} (pengajuan BK)",
                'tanggal' => now()->toDateString(),
                'dicatat_oleh' => $request->user()->id,
            ]);
            $siswa->hitungUlangPoin();

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
