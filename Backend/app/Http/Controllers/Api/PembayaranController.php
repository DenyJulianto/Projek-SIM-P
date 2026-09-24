<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\LaporanKesiswaanPengaturan;
use App\Http\Controllers\Controller;
use App\Models\Pembayaran;
use App\Models\Tagihan;
use App\Support\Terbilang;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class PembayaranController extends Controller
{
    use LaporanKesiswaanPengaturan;

    private const METODE_LABEL = [
        'tunai' => 'Tunai',
        'transfer' => 'Transfer Bank',
        'qris' => 'QRIS',
        'virtual_account' => 'Virtual Account',
        'lainnya' => 'Lainnya',
    ];

    public function kuitansi(Request $request, Pembayaran $pembayaran): Response
    {
        $pembayaran->load(['tagihan.siswa.kelas:id,nama_kelas', 'tagihan.pembayaran:id,tagihan_id,jumlah']);
        $tagihan = $pembayaran->tagihan;
        $sekolah = tenant();
        $totalTerbayar = (float) $tagihan->pembayaran->sum('jumlah');
        $nomor = sprintf('KWT/%s/%05d', $pembayaran->tanggal_bayar->format('Y'), $pembayaran->id);

        return Pdf::loadView('pembayaran.kuitansi', [
            'pembayaran' => $pembayaran,
            'tagihan' => $tagihan,
            'siswa' => $tagihan->siswa,
            'sekolah' => $sekolah,
            'logo' => $this->logoDataUri($sekolah->logo),
            'alamat' => collect([$sekolah->alamat, $sekolah->kelurahan, $sekolah->kecamatan, $sekolah->kabupaten_kota, $sekolah->provinsi])->filter()->implode(', '),
            'kontak' => collect([$sekolah->telepon ? 'Telp. '.$sekolah->telepon : null, $sekolah->email])->filter()->implode(' · '),
            'kota' => $sekolah->kabupaten_kota,
            'nomor' => $nomor,
            'terbilang' => Terbilang::rupiah($pembayaran->jumlah),
            'metode' => self::METODE_LABEL[$pembayaran->metode] ?? ($pembayaran->metode ?: '-'),
            'totalTerbayar' => $totalTerbayar,
            'sisa' => max((float) $tagihan->jumlah - $totalTerbayar, 0),
            'tanggal' => $this->tanggalIndonesia($pembayaran->tanggal_bayar->toDateString()),
            'penandatangan' => $request->user()->name,
            'rp' => fn ($v) => 'Rp '.number_format((float) $v, 0, ',', '.'),
        ])->setPaper('a5', 'landscape')->download('kuitansi-'.str_replace('/', '-', $nomor).'.pdf');
    }

    public function index(Request $request): JsonResponse
    {
        $pembayaran = Pembayaran::query()
            ->with(['tagihan.siswa:id,nama,nis,nisn,kelas_id', 'tagihan.siswa.kelas:id,nama_kelas', 'tagihan.pembayaran:id,tagihan_id,jumlah', 'konfirmasi:id,pembayaran_id,bukti_path,status,tanggal_verifikasi'])
            ->when($request->filled('dari_tanggal'), fn ($q) => $q->where('tanggal_bayar', '>=', $request->string('dari_tanggal')))
            ->when($request->filled('sampai_tanggal'), fn ($q) => $q->where('tanggal_bayar', '<=', $request->string('sampai_tanggal')))
            ->orderByDesc('tanggal_bayar')
            ->paginate($request->integer('per_page', 15));

        return response()->json($pembayaran);
    }

    public function store(Request $request, Tagihan $tagihan): JsonResponse
    {
        abort_if($tagihan->status === 'dibatalkan', 422, 'Tagihan ini sudah dibatalkan.');

        $data = $request->validate([
            'jumlah' => ['required', 'numeric', 'min:0.01'],
            'tanggal_bayar' => ['required', 'date'],
            'metode' => ['nullable', 'string', 'max:50'],
            'catatan' => ['nullable', 'string'],
        ]);

        $pembayaran = Pembayaran::create([
            ...$data,
            'tagihan_id' => $tagihan->id,
            'dicatat_oleh' => $request->user()->id,
        ]);

        $totalDibayar = $tagihan->pembayaran()->sum('jumlah');
        if ($totalDibayar >= $tagihan->jumlah) {
            $tagihan->update(['status' => 'lunas']);
        }

        activity()
            ->causedBy($request->user())
            ->log("Mencatat pembayaran untuk tagihan \"{$tagihan->judul}\".");

        return response()->json($pembayaran->load('tagihan'), 201);
    }

    public function destroy(Request $request, Tagihan $tagihan, Pembayaran $pembayaran): JsonResponse
    {
        $pembayaran->delete();

        $totalDibayar = $tagihan->pembayaran()->sum('jumlah');
        $tagihan->update(['status' => $totalDibayar >= $tagihan->jumlah ? 'lunas' : 'belum_lunas']);

        activity()
            ->causedBy($request->user())
            ->log("Menghapus pembayaran untuk tagihan \"{$tagihan->judul}\".");

        return response()->json(['message' => 'Pembayaran berhasil dihapus.']);
    }
}
