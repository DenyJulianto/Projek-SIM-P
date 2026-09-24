<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JadwalPelajaran;
use App\Models\Prestasi;
use App\Models\SaldoSiswa;
use App\Models\SaldoTransaksi;
use App\Models\Siswa;
use App\Models\Tagihan;
use App\Models\Tugas;
use App\Models\TugasJawaban;
use App\Services\PembayaranOnlineService;
use App\Services\QrisService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
        $anak = $request->user()->anak()->with(['kelas.waliKelas:id,nama,no_telepon', 'user:id,avatar'])->get();

        $anak->each(function (Siswa $siswa) {
            if ($siswa->user) {
                $siswa->user->setAttribute('avatar_url', $siswa->user->avatar ? "/avatar/{$siswa->user->avatar}" : null);
            }
        });

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

        $tagihan = Tagihan::aktif()->where('siswa_id', $siswa->id)
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

        if ($tagihan->status === 'dibatalkan') {
            throw ValidationException::withMessages([
                'tagihan_id' => ['Tagihan ini sudah dibatalkan.'],
            ]);
        }

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

    /**
     * Saldo uang jajan digital anak beserta riwayat transaksi terbaru.
     * Ini terpisah dari tagihan sekolah (SPP dkk) — murni saldo pribadi
     * anak, mis. untuk kantin, sehingga tidak melalui alur verifikasi
     * Bendahara seperti konfirmasi pembayaran tagihan.
     */
    public function saldo(Request $request, Siswa $siswa): JsonResponse
    {
        $this->authorizeAnak($request, $siswa);

        return response()->json([
            'saldo' => $siswa->saldo?->saldo ?? 0,
            'riwayat' => $siswa->saldoTransaksi()->latest()->limit(20)->get(),
        ]);
    }

    /**
     * Orang tua mengisi saldo anak. Berbeda dari pembayaran tagihan,
     * saldo langsung bertambah tanpa menunggu verifikasi siapa pun —
     * ini bukan transaksi resmi ke rekening sekolah, jadi tidak perlu
     * bukti transfer atau persetujuan Bendahara.
     */
    public function isiSaldo(Request $request, Siswa $siswa): JsonResponse
    {
        $this->authorizeAnak($request, $siswa);

        $data = $request->validate([
            'jumlah' => ['required', 'numeric', 'min:10000', 'max:5000000'],
            'keterangan' => ['nullable', 'string', 'max:255'],
        ]);

        $transaksi = DB::transaction(function () use ($siswa, $data, $request) {
            $saldoSiswa = SaldoSiswa::firstOrCreate(['siswa_id' => $siswa->id], ['saldo' => 0]);
            $saldoBaru = (float) $saldoSiswa->saldo + (float) $data['jumlah'];
            $saldoSiswa->update(['saldo' => $saldoBaru]);

            return SaldoTransaksi::create([
                'siswa_id' => $siswa->id,
                'diisi_oleh' => $request->user()->id,
                'jenis' => 'masuk',
                'jumlah' => $data['jumlah'],
                'saldo_setelah' => $saldoBaru,
                'keterangan' => $data['keterangan'] ?? 'Isi saldo oleh orang tua',
            ]);
        });

        activity()
            ->causedBy($request->user())
            ->log("Mengisi saldo siswa \"{$siswa->nama}\" sebesar Rp " . number_format((float) $data['jumlah'], 0, ',', '.') . '.');

        return response()->json([
            'saldo' => $transaksi->saldo_setelah,
            'transaksi' => $transaksi,
        ], 201);
    }

    /**
     * Daftar tugas kelas anak beserta status pengumpulan & nilai anak
     * sendiri (jawaban_saya) — read-only, orang tua tidak bisa mengumpulkan
     * jawaban atas nama anaknya, hanya memantau.
     */
    public function tugas(Request $request, Siswa $siswa): JsonResponse
    {
        $this->authorizeAnak($request, $siswa);

        $tugasList = Tugas::where('kelas_id', $siswa->kelas_id)
            ->with(['mataPelajaran:id,nama_mapel', 'guru:id,nama'])
            ->orderByDesc('deadline')
            ->get();

        $jawabanMap = TugasJawaban::where('siswa_id', $siswa->id)
            ->whereIn('tugas_id', $tugasList->pluck('id'))
            ->get()
            ->keyBy('tugas_id');

        $result = $tugasList->map(function (Tugas $t) use ($jawabanMap) {
            $t->jawaban_saya = $jawabanMap->get($t->id);
            return $t;
        });

        return response()->json($result);
    }
}
