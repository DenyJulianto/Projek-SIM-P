<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BahanLab;
use App\Models\Inventaris;
use App\Models\JadwalLab;
use App\Models\Laboratorium;
use App\Models\PeminjamanAlat;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class LabDashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $today = Carbon::today();
        $peralatan = Inventaris::whereNotNull('laboratorium_id')->get(['id', 'kondisi', 'kondisi_lab', 'status']);
        $kondisi = fn (Inventaris $i) => $i->kondisi_lab ?: $i->kondisi;

        $kartu = [
            'total_laboratorium' => Laboratorium::where('status', 'aktif')->count(),
            'total_peralatan' => $peralatan->count(),
            'peralatan_baik' => $peralatan->filter(fn ($i) => $kondisi($i) === 'baik')->count(),
            'peralatan_rusak' => $peralatan->filter(fn ($i) => in_array($kondisi($i), ['rusak_ringan', 'rusak_berat'], true))->count(),
            'peralatan_diperbaiki' => $peralatan->filter(fn ($i) => $kondisi($i) === 'dalam_perbaikan')->count(),
            'peminjaman_aktif' => PeminjamanAlat::whereIn('status', ['disetujui', 'dipinjam', 'terlambat'])->count(),
            'jadwal_hari_ini' => JadwalLab::whereDate('tanggal', $today)->count(),
            'bahan_hampir_habis' => BahanLab::where('status', 'aktif')->whereColumn('jumlah_stok', '<=', 'stok_minimum')->count(),
        ];

        $peringatan = [];

        $perluPemeliharaan = $peralatan->filter(fn ($i) => in_array($kondisi($i), ['rusak_ringan', 'rusak_berat'], true))->count();
        if ($perluPemeliharaan > 0) {
            $peringatan[] = "{$perluPemeliharaan} alat perlu pemeliharaan";
        }

        $bahanHampirHabis = $kartu['bahan_hampir_habis'];
        if ($bahanHampirHabis > 0) {
            $peringatan[] = "{$bahanHampirHabis} bahan praktikum hampir habis";
        }

        $belumKembali = PeminjamanAlat::where('status', 'terlambat')->count();
        if ($belumKembali > 0) {
            $peringatan[] = "{$belumKembali} alat belum dikembalikan (terlambat)";
        }

        $labDipakaiHariIni = JadwalLab::whereDate('tanggal', $today)
            ->whereIn('status', ['terjadwal', 'berlangsung'])
            ->with('laboratorium:id,nama')
            ->get()
            ->pluck('laboratorium.nama')
            ->filter()
            ->unique();
        foreach ($labDipakaiHariIni as $nama) {
            $peringatan[] = "Laboratorium {$nama} digunakan hari ini";
        }

        return response()->json(['kartu' => $kartu, 'peringatan' => $peringatan]);
    }
}
