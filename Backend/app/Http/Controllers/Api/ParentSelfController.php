<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JadwalPelajaran;
use App\Models\Prestasi;
use App\Models\Siswa;
use App\Models\Tagihan;
use App\Services\PembayaranOnlineService;
use App\Services\QrisService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Endpoint self-service untuk orang tua/wali. Setiap method yang menerima
 * parameter {siswa} SELALU memverifikasi lewat authorizeAnak() bahwa siswa
 * tersebut benar-benar anak dari user yang sedang login (lewat pivot
 * wali_siswa) sebelum mengembalikan data apa pun — orang tua tidak bisa
 * melihat data siswa lain hanya dengan mengganti ID di URL.
 */
class ParentSelfController extends Controller
{
    public function __construct(private readonly PembayaranOnlineService $pembayaranOnline)
    {
    }

    private function authorizeAnak(Request $request, Siswa $siswa): void
    {
        $isAnak = $siswa->walis()->where('user_id', $request->user()->id)->exists();

        abort_unless($isAnak, 403, 'Siswa ini bukan anak yang tertaut ke akun Anda.');
    }

    public function index(Request $request): JsonResponse
    {
        $anak = $request->user()->anak()->with('kelas.waliKelas:id,nama,no_telepon')->get();

        return response()->json($anak);
    }

    public function jadwal(Request $request, Siswa $siswa): JsonResponse
    {
        $this->authorizeAnak($request, $siswa);

        $jadwal = JadwalPelajaran::where('kelas_id', $siswa->kelas_id)
            ->with(['mataPelajaran:id,nama_mapel', 'guru:id,nama'])
            ->orderBy('hari')
            ->orderBy('jam_mulai')
            ->get();

        return response()->json($jadwal);
    }

    public function nilai(Request $request, Siswa $siswa): JsonResponse
    {
        $this->authorizeAnak($request, $siswa);

        $nilai = $siswa->nilai()
            ->with(['mataPelajaran:id,nama_mapel', 'guru:id,nama'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json($nilai);
    }

    public function absensi(Request $request, Siswa $siswa): JsonResponse
    {
        $this->authorizeAnak($request, $siswa);

        $absensi = $siswa->absensi()
            ->orderByDesc('tanggal')
            ->paginate($request->integer('per_page', 30));

        return response()->json($absensi);
    }

    public function tagihan(Request $request, Siswa $siswa): JsonResponse
    {
        $this->authorizeAnak($request, $siswa);

        $tagihan = Tagihan::where('siswa_id', $siswa->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($tagihan);
    }

    public function riwayatPembayaran(Request $request, Siswa $siswa): JsonResponse
    {
        $this->authorizeAnak($request, $siswa);

        $riwayat = Tagihan::where('siswa_id', $siswa->id)
            ->with('pembayaran')
            ->get()
            ->flatMap(fn (Tagihan $tagihan) => $tagihan->pembayaran->map(fn ($p) => [
                'id' => $p->id,
                'tagihan_id' => $tagihan->id,
                'tagihan_judul' => $tagihan->judul,
                'jumlah' => $p->jumlah,
                'tanggal_bayar' => $p->tanggal_bayar,
                'metode' => $p->metode,
            ]))
            ->sortByDesc('tanggal_bayar')
            ->values();

        return response()->json($riwayat);
    }

    public function prestasi(Request $request, Siswa $siswa): JsonResponse
    {
        $this->authorizeAnak($request, $siswa);

        $prestasi = Prestasi::where('siswa_id', $siswa->id)
            ->orderByDesc('tanggal')
            ->get();

        return response()->json($prestasi);
    }

    public function waliKelas(Request $request, Siswa $siswa): JsonResponse
    {
        $this->authorizeAnak($request, $siswa);

        $siswa->loadMissing('kelas.waliKelas');

        return response()->json($siswa->kelas?->waliKelas);
    }

    /**
     * Nomor Virtual Account anak untuk transfer tagihan sekolah — dihitung
     * deterministik dari prefix yang diatur Bendahara, bukan disimpan
     * terpisah, supaya selalu sinkron dengan pengaturan terbaru.
     */
    public function virtualAccount(Request $request, Siswa $siswa): JsonResponse
    {
        $this->authorizeAnak($request, $siswa);

        $config = $this->pembayaranOnline->config();
        $nomorVa = $this->pembayaranOnline->nomorVa($siswa, $config['va_prefix'] ?? null);

        return response()->json([
            'nomor_va' => $nomorVa,
            'bank_nama' => $config['bank_nama'] ?? null,
        ]);
    }

    /**
     * QRIS dinamis untuk membayar satu tagihan anak — nominal sudah
     * tertanam supaya orang tua tidak perlu mengetik manual saat memindai.
     */
    public function qris(Request $request, Siswa $siswa, Tagihan $tagihan): JsonResponse
    {
        $this->authorizeAnak($request, $siswa);
        abort_unless($tagihan->siswa_id === $siswa->id, 403, 'Tagihan ini bukan milik anak yang tertaut ke akun Anda.');

        $config = $this->pembayaranOnline->config();
        abort_if(empty($config['qris_statis']), 422, 'Sekolah belum mengaktifkan pembayaran via QRIS.');

        if ($tagihan->status === 'lunas') {
            throw ValidationException::withMessages([
                'tagihan_id' => ['Tagihan ini sudah lunas.'],
            ]);
        }

        $sisa = (float) $tagihan->jumlah - (float) $tagihan->pembayaran()->sum('jumlah');

        return response()->json([
            'tagihan_id' => $tagihan->id,
            'judul' => $tagihan->judul,
            'jumlah' => $sisa,
            'payload' => QrisService::withAmount($config['qris_statis'], (int) round($sisa)),
            'merchant_nama' => $config['merchant_nama'] ?? null,
            'merchant_kota' => $config['merchant_kota'] ?? null,
        ]);
    }
}
