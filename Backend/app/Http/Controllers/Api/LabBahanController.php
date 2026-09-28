<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BahanLab;
use App\Models\Laboratorium;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LabBahanController extends Controller
{
    public function opsi(): JsonResponse
    {
        return response()->json([
            'jenis_kategori' => BahanLab::whereNotNull('jenis_kategori')->distinct()->orderBy('jenis_kategori')->pluck('jenis_kategori'),
            'laboratorium' => Laboratorium::where('status', 'aktif')->orderBy('nama')->get(['id', 'nama']),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $in = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'laboratorium_id' => ['nullable', 'integer'],
            'status' => ['nullable', 'in:aktif,nonaktif'],
            'hampir_habis' => ['nullable', 'boolean'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $bahan = BahanLab::with('laboratorium:id,nama')
            ->when(! empty($in['search']), fn ($q) => $q->where(fn ($w) => $w->where('nama_bahan', 'like', "%{$in['search']}%")->orWhere('kode_bahan', 'like', "%{$in['search']}%")))
            ->when(! empty($in['laboratorium_id']), fn ($q) => $q->where('laboratorium_id', $in['laboratorium_id']))
            ->when(! empty($in['status']), fn ($q) => $q->where('status', $in['status']))
            ->when($request->boolean('hampir_habis'), fn ($q) => $q->whereColumn('jumlah_stok', '<=', 'stok_minimum'))
            ->orderBy('nama_bahan')
            ->paginate($in['per_page'] ?? 15);

        return response()->json($bahan);
    }

    public function store(Request $request): JsonResponse
    {
        $in = $request->validate([
            'kode_bahan' => ['required', 'string', 'max:30', 'unique:bahan_lab,kode_bahan'],
            'nama_bahan' => ['required', 'string', 'max:255'],
            'jenis_kategori' => ['nullable', 'string', 'max:100'],
            'satuan' => ['nullable', 'string', 'max:30'],
            'jumlah_stok' => ['nullable', 'numeric', 'min:0'],
            'stok_minimum' => ['nullable', 'numeric', 'min:0'],
            'laboratorium_id' => ['nullable', 'integer', 'exists:laboratorium,id'],
            'lokasi_penyimpanan' => ['nullable', 'string', 'max:255'],
            'tanggal_masuk' => ['nullable', 'date'],
            'tanggal_kedaluwarsa' => ['nullable', 'date'],
        ]);

        $bahan = DB::transaction(function () use ($in, $request) {
            $bahan = BahanLab::create([...$in, 'dibuat_oleh' => $request->user()->id]);
            if ($bahan->jumlah_stok > 0) {
                $bahan->mutasi()->create([
                    'jenis' => 'masuk',
                    'jumlah' => $bahan->jumlah_stok,
                    'stok_setelah' => $bahan->jumlah_stok,
                    'keterangan' => 'Stok awal.',
                    'user_id' => $request->user()->id,
                    'tanggal' => $in['tanggal_masuk'] ?? now()->toDateString(),
                ]);
            }

            return $bahan;
        });

        return response()->json($bahan, 201);
    }

    public function show(BahanLab $bahan): JsonResponse
    {
        return response()->json(['bahan' => $bahan->load('laboratorium'), 'kartu_stok' => $bahan->mutasi()->with('user:id,name')->limit(50)->get()]);
    }

    public function update(Request $request, BahanLab $bahan): JsonResponse
    {
        $data = $request->validate([
            'nama_bahan' => ['sometimes', 'string', 'max:255'],
            'jenis_kategori' => ['nullable', 'string', 'max:100'],
            'satuan' => ['nullable', 'string', 'max:30'],
            'stok_minimum' => ['nullable', 'numeric', 'min:0'],
            'laboratorium_id' => ['nullable', 'integer', 'exists:laboratorium,id'],
            'lokasi_penyimpanan' => ['nullable', 'string', 'max:255'],
            'tanggal_kedaluwarsa' => ['nullable', 'date'],
            'status' => ['nullable', 'in:aktif,nonaktif'],
        ]);

        $bahan->update($data);

        return response()->json($bahan);
    }

    private function mutasi(Request $request, BahanLab $bahan, string $jenis, float $jumlahPerubahan): JsonResponse
    {
        $in = $request->validate(['jumlah' => ['required', 'numeric', 'min:0.01'], 'keterangan' => ['nullable', 'string'], 'tanggal' => ['nullable', 'date']]);

        $bahan = DB::transaction(function () use ($bahan, $jenis, $jumlahPerubahan, $in, $request) {
            $perubahan = $jumlahPerubahan * $in['jumlah'];
            abort_if($bahan->jumlah_stok + $perubahan < 0, 422, 'Stok tidak mencukupi.');
            $bahan->increment('jumlah_stok', $perubahan);
            $bahan->refresh();
            $bahan->mutasi()->create([
                'jenis' => $jenis,
                'jumlah' => $in['jumlah'],
                'stok_setelah' => $bahan->jumlah_stok,
                'keterangan' => $in['keterangan'] ?? null,
                'user_id' => $request->user()->id,
                'tanggal' => $in['tanggal'] ?? now()->toDateString(),
            ]);

            return $bahan;
        });

        return response()->json($bahan);
    }

    public function stokMasuk(Request $request, BahanLab $bahan): JsonResponse
    {
        return $this->mutasi($request, $bahan, 'masuk', 1);
    }

    public function stokKeluar(Request $request, BahanLab $bahan): JsonResponse
    {
        return $this->mutasi($request, $bahan, 'keluar', -1);
    }

    public function penyesuaian(Request $request, BahanLab $bahan): JsonResponse
    {
        $in = $request->validate(['jumlah_baru' => ['required', 'numeric', 'min:0'], 'keterangan' => ['nullable', 'string']]);

        $bahan = DB::transaction(function () use ($bahan, $in, $request) {
            $selisih = $in['jumlah_baru'] - $bahan->jumlah_stok;
            $bahan->update(['jumlah_stok' => $in['jumlah_baru']]);
            $bahan->mutasi()->create([
                'jenis' => 'penyesuaian',
                'jumlah' => abs($selisih),
                'stok_setelah' => $in['jumlah_baru'],
                'keterangan' => $in['keterangan'] ?? ('Penyesuaian stok ('.($selisih >= 0 ? '+' : '').$selisih.').'),
                'user_id' => $request->user()->id,
                'tanggal' => now()->toDateString(),
            ]);

            return $bahan;
        });

        return response()->json($bahan);
    }
}
