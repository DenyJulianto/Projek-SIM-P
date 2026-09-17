<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KonfirmasiPembayaran;
use App\Models\Pembayaran;
use App\Models\Tagihan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

/**
 * Alur konfirmasi pembayaran manual: orang tua mengunggah bukti transfer
 * untuk sebuah tagihan, lalu Bendahara/Tata Usaha (permission
 * pembayaran.manage) memverifikasi atau menolaknya. Saat diverifikasi,
 * sistem mencatat Pembayaran sungguhan terhadap tagihan tersebut (memakai
 * logika yang sama seperti PembayaranController) — bukan sekadar menandai
 * "lunas" tanpa jejak transaksi.
 */
class KonfirmasiPembayaranController extends Controller
{
    /**
     * Orang tua mengajukan konfirmasi pembayaran untuk tagihan anaknya.
     * Kepemilikan tagihan diverifikasi lewat relasi siswa->walis, sama
     * seperti ParentSelfController — tidak bisa mengajukan untuk tagihan
     * siswa lain hanya dengan mengganti tagihan_id.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'tagihan_id' => ['required', 'exists:tagihan,id'],
            'jumlah' => ['required', 'numeric', 'min:0.01'],
            'tanggal_transfer' => ['required', 'date'],
            'metode' => ['nullable', 'string', 'max:50'],
            'catatan' => ['nullable', 'string'],
            'bukti' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ]);

        $tagihan = Tagihan::findOrFail($data['tagihan_id']);

        $isAnak = $tagihan->siswa()->first()?->walis()->where('user_id', $request->user()->id)->exists();
        abort_unless($isAnak, 403, 'Tagihan ini bukan milik anak yang tertaut ke akun Anda.');

        if ($tagihan->status === 'lunas') {
            throw ValidationException::withMessages([
                'tagihan_id' => ['Tagihan ini sudah lunas.'],
            ]);
        }

        $buktiPath = $request->file('bukti')->store('bukti-pembayaran', 'public');

        $konfirmasi = KonfirmasiPembayaran::create([
            'tagihan_id' => $tagihan->id,
            'diajukan_oleh' => $request->user()->id,
            'jumlah' => $data['jumlah'],
            'tanggal_transfer' => $data['tanggal_transfer'],
            'metode' => $data['metode'] ?? null,
            'bukti_path' => $buktiPath,
            'catatan' => $data['catatan'] ?? null,
        ]);

        activity()
            ->causedBy($request->user())
            ->log("Mengajukan konfirmasi pembayaran untuk tagihan \"{$tagihan->judul}\".");

        return response()->json($konfirmasi->load('tagihan:id,judul,jumlah,siswa_id'), 201);
    }

    /**
     * Daftar konfirmasi yang diajukan sendiri oleh orang tua yang login.
     */
    public function mine(Request $request): JsonResponse
    {
        $konfirmasi = KonfirmasiPembayaran::where('diajukan_oleh', $request->user()->id)
            ->with('tagihan:id,judul,jumlah,siswa_id')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($konfirmasi);
    }

    /**
     * Daftar semua konfirmasi untuk ditinjau Bendahara/Tata Usaha.
     */
    public function index(Request $request): JsonResponse
    {
        $konfirmasi = KonfirmasiPembayaran::query()
            ->with(['tagihan.siswa:id,nama,kelas_id', 'diajukanOleh:id,name'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->orderByDesc('created_at')
            ->get();

        return response()->json($konfirmasi);
    }

    public function verifikasi(Request $request, KonfirmasiPembayaran $konfirmasi): JsonResponse
    {
        $this->assertPending($konfirmasi);

        $tagihan = $konfirmasi->tagihan;

        $pembayaran = Pembayaran::create([
            'tagihan_id' => $tagihan->id,
            'jumlah' => $konfirmasi->jumlah,
            'tanggal_bayar' => $konfirmasi->tanggal_transfer,
            'metode' => $konfirmasi->metode ?? 'transfer',
            'catatan' => 'Dikonfirmasi dari pengajuan orang tua (konfirmasi #' . $konfirmasi->id . ').',
            'dicatat_oleh' => $request->user()->id,
        ]);

        $totalDibayar = $tagihan->pembayaran()->sum('jumlah');
        if ($totalDibayar >= $tagihan->jumlah) {
            $tagihan->update(['status' => 'lunas']);
        }

        $konfirmasi->update([
            'status' => 'diverifikasi',
            'diverifikasi_oleh' => $request->user()->id,
            'tanggal_verifikasi' => now(),
            'pembayaran_id' => $pembayaran->id,
        ]);

        activity()
            ->causedBy($request->user())
            ->log("Memverifikasi konfirmasi pembayaran untuk tagihan \"{$tagihan->judul}\".");

        return response()->json($konfirmasi->load(['tagihan.siswa:id,nama,kelas_id', 'diajukanOleh:id,name', 'pembayaran']));
    }

    public function tolak(Request $request, KonfirmasiPembayaran $konfirmasi): JsonResponse
    {
        $this->assertPending($konfirmasi);

        $data = $request->validate([
            'catatan_verifikasi' => ['required', 'string'],
        ]);

        $konfirmasi->update([
            'status' => 'ditolak',
            'diverifikasi_oleh' => $request->user()->id,
            'catatan_verifikasi' => $data['catatan_verifikasi'],
            'tanggal_verifikasi' => now(),
        ]);

        activity()
            ->causedBy($request->user())
            ->log("Menolak konfirmasi pembayaran untuk tagihan \"{$konfirmasi->tagihan?->judul}\".");

        return response()->json($konfirmasi->load(['tagihan.siswa:id,nama,kelas_id', 'diajukanOleh:id,name']));
    }

    /**
     * Sajikan file bukti transfer. Disk 'public' tenant, disk-relative path
     * acak dari Storage::store() (bukan nama file asli) sebagai lapisan
     * proteksi tambahan, konsisten dengan pola showFile Avatar/Surat/Arsip
     * di aplikasi ini.
     */
    public function bukti(string $path)
    {
        $fullPath = 'bukti-pembayaran/' . $path;

        if (! Storage::disk('public')->exists($fullPath)) {
            abort(404);
        }

        return Storage::disk('public')->response($fullPath);
    }

    private function assertPending(KonfirmasiPembayaran $konfirmasi): void
    {
        if ($konfirmasi->status !== 'menunggu') {
            throw ValidationException::withMessages([
                'status' => ['Konfirmasi ini sudah diputuskan sebelumnya.'],
            ]);
        }
    }
}
