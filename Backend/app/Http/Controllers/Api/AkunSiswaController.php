<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\GenerateAkunSiswa;
use App\Models\AkunSiswaBatch;
use App\Models\Siswa;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

/** Pembuatan akun siswa & orang tua secara massal dari data siswa. */
class AkunSiswaController extends Controller
{
    public function index(): JsonResponse
    {
        $belumPunyaAkun = Siswa::where('status', 'aktif')->whereNull('user_id')->count();
        $tanpaNisn = Siswa::where('status', 'aktif')->whereNull('user_id')
            ->where(fn ($q) => $q->whereNull('nisn')->orWhere('nisn', ''))->count();

        return response()->json([
            'ringkasan' => [
                'siswa_belum_punya_akun' => $belumPunyaAkun,
                'siswa_tanpa_nisn' => $tanpaNisn,
                'siswa_tanpa_akun_ortu' => Siswa::where('status', 'aktif')->doesntHave('walis')->count(),
            ],
            'batch' => AkunSiswaBatch::with(['pembuat:id,name', 'kelas:id,nama_kelas'])->latest()->limit(10)->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'kelas_id' => ['nullable', 'exists:kelas,id'],
            'sertakan_ortu' => ['boolean'],
        ]);

        if (AkunSiswaBatch::whereIn('status', ['antri', 'proses'])->exists()) {
            throw ValidationException::withMessages([
                'kelas_id' => ['Masih ada proses pembuatan akun yang berjalan. Tunggu sampai selesai.'],
            ]);
        }

        $batch = AkunSiswaBatch::create([
            'dibuat_oleh' => $request->user()->id,
            'kelas_id' => $data['kelas_id'] ?? null,
            'sertakan_ortu' => $data['sertakan_ortu'] ?? true,
        ]);

        try {
            GenerateAkunSiswa::dispatch($batch->id);
        } catch (\Throwable $e) {
            report($e);
            $batch->update(['status' => 'gagal', 'pesan' => 'Antrean tidak tersedia.']);
            abort(503, 'Proses tidak dapat dimulai saat ini. Silakan coba lagi beberapa saat lagi.');
        }

        activity()->causedBy($request->user())->performedOn($batch)->useLog('pengguna')
            ->log('Memulai pembuatan akun siswa & orang tua massal.');

        return response()->json($batch->fresh(), 201);
    }

    public function show(AkunSiswaBatch $batch): JsonResponse
    {
        return response()->json($batch->load(['pembuat:id,name', 'kelas:id,nama_kelas']));
    }

    public function unduh(Request $request, AkunSiswaBatch $batch): Response
    {
        abort_unless($batch->file_kredensial && Storage::disk('local')->exists($batch->file_kredensial), 404, 'Daftar kredensial tidak tersedia.');

        $csv = Crypt::decryptString(Storage::disk('local')->get($batch->file_kredensial));

        activity()->causedBy($request->user())->performedOn($batch)->useLog('pengguna')
            ->log('Mengunduh daftar kredensial akun siswa & orang tua.');

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"kredensial-akun-siswa-{$batch->id}.csv\"",
            'Cache-Control' => 'no-store',
        ]);
    }

    /** Hapus file kredensial setelah dibagikan, supaya tidak tersimpan selamanya. */
    public function hapusKredensial(Request $request, AkunSiswaBatch $batch): JsonResponse
    {
        if ($batch->file_kredensial) {
            Storage::disk('local')->delete($batch->file_kredensial);
            $batch->update(['file_kredensial' => null]);
        }

        activity()->causedBy($request->user())->performedOn($batch)->useLog('pengguna')
            ->log('Menghapus daftar kredensial akun siswa & orang tua.');

        return response()->json(['message' => 'Daftar kredensial dihapus.']);
    }
}
