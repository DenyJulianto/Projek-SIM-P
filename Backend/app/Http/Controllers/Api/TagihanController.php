<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KonfirmasiPembayaran;
use App\Models\Pembayaran;
use App\Models\Siswa;
use App\Models\Tagihan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class TagihanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tagihan = Tagihan::query()
            ->with(['siswa:id,nama,kelas_id', 'siswa.kelas:id,nama_kelas', 'pembayaran'])
            ->when($request->filled('siswa_id'), fn ($q) => $q->where('siswa_id', $request->integer('siswa_id')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('jenis'), fn ($q) => $q->where('jenis', $request->string('jenis')))
            ->when($request->filled('kelas_id'), fn ($q) => $q->whereHas(
                'siswa',
                fn ($s) => $s->where('kelas_id', $request->integer('kelas_id'))
            ))
            ->when($request->filled('cari'), function ($q) use ($request) {
                $cari = '%'.$request->string('cari').'%';
                $q->where(fn ($w) => $w
                    ->where('judul', 'like', $cari)
                    ->orWhereHas('siswa', fn ($s) => $s->where('nama', 'like', $cari)));
            })
            ->tap(fn ($q) => $this->applySort($q, $request))
            ->paginate(min($request->integer('per_page', 15), 200));

        return response()->json($tagihan);
    }

    public function ringkasan(): JsonResponse
    {
        $belumLunas = Tagihan::where('status', 'belum_lunas');
        $sisaBelumLunas = (float) (clone $belumLunas)->sum('jumlah')
            - (float) Pembayaran::whereIn('tagihan_id', (clone $belumLunas)->select('id'))->sum('jumlah');

        $mulai = Carbon::now()->startOfMonth()->subMonths(5);
        $bulan = collect(range(0, 5))->mapWithKeys(fn ($i) => [
            $mulai->copy()->addMonths($i)->format('Y-m') => ['ditagihkan' => 0.0, 'terbayar' => 0.0],
        ]);

        Tagihan::aktif()
            ->where(fn ($q) => $q
                ->where('jatuh_tempo', '>=', $mulai)
                ->orWhere(fn ($n) => $n->whereNull('jatuh_tempo')->where('created_at', '>=', $mulai)))
            ->get(['jumlah', 'jatuh_tempo', 'created_at'])
            ->each(function (Tagihan $t) use ($bulan) {
                $key = ($t->jatuh_tempo ?? $t->created_at)->format('Y-m');
                if ($bulan->has($key)) {
                    $row = $bulan[$key];
                    $row['ditagihkan'] += (float) $t->jumlah;
                    $bulan[$key] = $row;
                }
            });

        Pembayaran::where('tanggal_bayar', '>=', $mulai)
            ->get(['jumlah', 'tanggal_bayar'])
            ->each(function (Pembayaran $p) use ($bulan) {
                $key = $p->tanggal_bayar->format('Y-m');
                if ($bulan->has($key)) {
                    $row = $bulan[$key];
                    $row['terbayar'] += (float) $p->jumlah;
                    $bulan[$key] = $row;
                }
            });

        return response()->json([
            'aktif_jumlah' => Tagihan::aktif()->count(),
            'aktif_total' => (float) Tagihan::aktif()->sum('jumlah'),
            'belum_lunas_jumlah' => (clone $belumLunas)->count(),
            'belum_lunas_sisa' => $sisaBelumLunas,
            'siswa_menunggak' => (clone $belumLunas)->distinct()->count('siswa_id'),
            'bulanan' => $bulan->map(fn ($row, $key) => ['bulan' => $key, ...$row])->values(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'jenis' => ['required', Rule::in(array_keys(Tagihan::JENIS))],
            'judul' => ['required', 'string', 'max:255'],
            'jumlah' => ['required', 'numeric', 'min:1'],
            'periode' => ['nullable', 'string', 'max:100'],
            'jatuh_tempo' => ['nullable', 'date'],
            'target' => ['required', Rule::in(['siswa', 'kelas', 'semua'])],
            'siswa_id' => ['required_if:target,siswa', 'nullable', 'exists:siswa,id'],
            'kelas_id' => ['required_if:target,kelas', 'nullable', 'exists:kelas,id'],
        ]);

        $siswaIds = match ($data['target']) {
            'siswa' => Siswa::whereKey($data['siswa_id'])->pluck('id'),
            'kelas' => Siswa::where('status', 'aktif')->where('kelas_id', $data['kelas_id'])->pluck('id'),
            'semua' => Siswa::where('status', 'aktif')->pluck('id'),
        };

        if ($siswaIds->isEmpty()) {
            throw ValidationException::withMessages([
                'target' => ['Tidak ada siswa aktif yang cocok dengan pilihan ini.'],
            ]);
        }

        $sudahAda = filled($data['periode'] ?? null)
            ? Tagihan::aktif()
                ->where('jenis', $data['jenis'])
                ->where('periode', $data['periode'])
                ->whereIn('siswa_id', $siswaIds)
                ->pluck('siswa_id')
            : collect();

        $baru = $siswaIds->diff($sudahAda)->values();

        if ($baru->isEmpty()) {
            throw ValidationException::withMessages([
                'periode' => ['Semua siswa yang dipilih sudah memiliki tagihan jenis dan periode yang sama.'],
            ]);
        }

        DB::transaction(function () use ($baru, $data) {
            foreach ($baru as $siswaId) {
                Tagihan::create([
                    'siswa_id' => $siswaId,
                    'jenis' => $data['jenis'],
                    'judul' => $data['judul'],
                    'periode' => $data['periode'] ?? null,
                    'jumlah' => $data['jumlah'],
                    'jatuh_tempo' => $data['jatuh_tempo'] ?? null,
                ]);
            }
        });

        activity()->causedBy($request->user())->log("Membuat {$baru->count()} tagihan \"{$data['judul']}\".");

        return response()->json([
            'message' => "{$baru->count()} tagihan berhasil dibuat.",
            'dibuat' => $baru->count(),
            'dilewati' => $sudahAda->count(),
        ], 201);
    }

    public function update(Request $request, Tagihan $tagihan): JsonResponse
    {
        abort_unless($tagihan->status === 'belum_lunas', 422, 'Hanya tagihan yang belum lunas yang dapat diubah.');

        $data = $request->validate([
            'jenis' => ['required', Rule::in(array_keys(Tagihan::JENIS))],
            'judul' => ['required', 'string', 'max:255'],
            'jumlah' => ['required', 'numeric', 'min:1'],
            'periode' => ['nullable', 'string', 'max:100'],
            'jatuh_tempo' => ['nullable', 'date'],
        ]);

        $totalDibayar = (float) $tagihan->pembayaran()->sum('jumlah');
        if ((float) $data['jumlah'] < $totalDibayar) {
            throw ValidationException::withMessages([
                'jumlah' => ['Nominal tidak boleh lebih kecil dari pembayaran yang sudah diterima (Rp '.number_format($totalDibayar, 0, ',', '.').').'],
            ]);
        }

        $tagihan->update([
            ...$data,
            'status' => $totalDibayar > 0 && $totalDibayar >= (float) $data['jumlah'] ? 'lunas' : 'belum_lunas',
        ]);

        activity()->causedBy($request->user())->log("Memperbarui tagihan \"{$tagihan->judul}\".");

        return response()->json($tagihan->load('siswa:id,nama,kelas_id'));
    }

    public function batalkan(Request $request, Tagihan $tagihan): JsonResponse
    {
        $data = $request->validate([
            'alasan' => ['required', 'string', 'max:500'],
        ]);

        abort_if($tagihan->status === 'dibatalkan', 422, 'Tagihan ini sudah dibatalkan.');
        abort_if(
            $tagihan->pembayaran()->exists(),
            422,
            'Tagihan sudah memiliki pembayaran, jadi tidak bisa dibatalkan. Hapus pembayarannya lebih dulu jika memang keliru.'
        );
        abort_if(
            KonfirmasiPembayaran::where('tagihan_id', $tagihan->id)->where('status', 'menunggu')->exists(),
            422,
            'Masih ada konfirmasi pembayaran yang menunggu verifikasi untuk tagihan ini.'
        );

        $tagihan->update([
            'status' => 'dibatalkan',
            'alasan_batal' => $data['alasan'],
            'dibatalkan_at' => now(),
        ]);

        activity()->causedBy($request->user())->log("Membatalkan tagihan \"{$tagihan->judul}\".");

        return response()->json($tagihan->load('siswa:id,nama,kelas_id'));
    }

    private function applySort($query, Request $request): void
    {
        $arah = $request->string('arah')->value() === 'asc' ? 'asc' : 'desc';

        match ($request->string('sort')->value()) {
            'siswa' => $query->orderBy(Siswa::select('nama')->whereColumn('siswa.id', 'tagihan.siswa_id'), $arah),
            'judul' => $query->orderBy('judul', $arah),
            'jatuh_tempo' => $query->orderBy('jatuh_tempo', $arah),
            'jumlah' => $query->orderBy('jumlah', $arah),
            'status' => $query->orderBy('status', $arah),
            default => $query->orderByDesc('created_at'),
        };

        $query->orderByDesc('id');
    }

    public function destroy(Request $request, Tagihan $tagihan): JsonResponse
    {
        $judul = $tagihan->judul;
        $tagihan->delete();

        activity()->causedBy($request->user())->log("Menghapus tagihan \"{$judul}\".");

        return response()->json(['message' => 'Tagihan berhasil dihapus.']);
    }
}
