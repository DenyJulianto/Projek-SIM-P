<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pelanggaran;
use App\Notifications\PelanggaranBaruNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;

class PelanggaranController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $pelanggaran = Pelanggaran::query()
            ->with('siswa:id,nama,kelas_id')
            // Penanda untuk form pengurangan poin: sudah dipotong / sedang diajukan BK.
            ->withExists(['catatanPoin as poin_dipotong', 'pengajuanPoin as poin_diajukan' => fn ($q) => $q->where('status', 'menunggu')])
            ->when($request->filled('siswa_id'), fn ($q) => $q->where('siswa_id', $request->integer('siswa_id')))
            ->orderByDesc('tanggal')
            ->paginate($request->integer('per_page', 15));

        return response()->json($pelanggaran);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'siswa_id' => ['required', 'exists:siswa,id'],
            'tingkat' => ['required', 'in:'.implode(',', array_keys(Pelanggaran::TINGKAT))],
            'jenis' => ['required', 'string', 'max:255'],
            'tanggal' => ['required', 'date'],
            'keterangan' => ['nullable', 'string'],
            'tindakan' => ['nullable', 'string'],
            'kategori' => ['nullable', 'string', 'max:60'],
            'poin' => ['nullable', 'integer', 'min:0', 'max:1000'],
            'status' => ['nullable', 'in:aktif,dalam_pembinaan,selesai'],
            'catatan' => ['nullable', 'string'],
        ]);

        $pelanggaran = Pelanggaran::create(array_filter($data, fn ($v) => $v !== null) + ['dicatat_oleh' => $request->user()?->id]);

        activity()->causedBy($request->user())->log("Mencatat pelanggaran \"{$pelanggaran->jenis}\".");

        $this->notifySiswaDanOrtu($pelanggaran, new PelanggaranBaruNotification($pelanggaran));

        return response()->json($pelanggaran->load('siswa:id,nama,kelas_id'), 201);
    }

    public function update(Request $request, Pelanggaran $pelanggaran): JsonResponse
    {
        $data = $request->validate([
            'siswa_id' => ['required', 'exists:siswa,id'],
            'tingkat' => ['required', 'in:'.implode(',', array_keys(Pelanggaran::TINGKAT))],
            'jenis' => ['required', 'string', 'max:255'],
            'tanggal' => ['required', 'date'],
            'keterangan' => ['nullable', 'string'],
            'tindakan' => ['nullable', 'string'],
            'kategori' => ['nullable', 'string', 'max:60'],
            'poin' => ['nullable', 'integer', 'min:0', 'max:1000'],
            'status' => ['nullable', 'in:aktif,dalam_pembinaan,selesai'],
            'catatan' => ['nullable', 'string'],
        ]);

        $data['status'] ??= $pelanggaran->status;
        $pelanggaran->update($data);

        activity()->causedBy($request->user())->log("Memperbarui catatan pelanggaran \"{$pelanggaran->jenis}\".");

        return response()->json($pelanggaran->load('siswa:id,nama,kelas_id'));
    }

    public function destroy(Request $request, Pelanggaran $pelanggaran): JsonResponse
    {
        $jenis = $pelanggaran->jenis;
        $pelanggaran->delete();

        activity()->causedBy($request->user())->log("Menghapus catatan pelanggaran \"{$jenis}\".");

        return response()->json(['message' => 'Catatan pelanggaran berhasil dihapus.']);
    }

    /**
     * Kirim notifikasi dalam aplikasi ke siswa yang bersangkutan (kalau
     * sudah punya akun login) dan ke semua orang tua/wali yang tertaut.
     */
    private function notifySiswaDanOrtu(Pelanggaran $pelanggaran, $notification): void
    {
        $pelanggaran->loadMissing(['siswa.user', 'siswa.walis']);

        $penerima = collect([$pelanggaran->siswa->user])
            ->merge($pelanggaran->siswa->walis)
            ->filter();

        if ($penerima->isNotEmpty()) {
            Notification::send($penerima, $notification);
        }
    }
}
