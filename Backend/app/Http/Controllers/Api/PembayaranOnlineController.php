<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BankMutasi;
use App\Models\Pembayaran;
use App\Models\Siswa;
use App\Models\Tagihan;
use App\Services\PembayaranOnlineService;
use App\Services\QrisService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

/**
 * Fitur "Pembayaran Online" (Virtual Account & QRIS) tanpa payment gateway
 * pihak ketiga. Nomor Virtual Account dibuat deterministik per siswa dari
 * prefix bank yang dikonfigurasi Bendahara, dan QRIS dinamis dibuat dengan
 * menyisipkan nominal tagihan ke QRIS statis milik sekolah sendiri. Karena
 * tidak ada webhook otomatis dari bank, dana yang masuk dicocokkan lewat
 * menu Rekonsiliasi: Bendahara mencatat mutasi rekening yang benar-benar
 * masuk, sistem menyarankan tagihan yang cocok (lewat nomor VA atau
 * nominal), dan Bendahara tinggal mengonfirmasi — memakai logika pencatatan
 * pembayaran yang sama seperti PembayaranController/KonfirmasiPembayaranController.
 */
class PembayaranOnlineController extends Controller
{
    public function __construct(private readonly PembayaranOnlineService $service)
    {
    }

    public function pengaturan(): JsonResponse
    {
        return response()->json($this->service->config());
    }

    public function updatePengaturan(Request $request): JsonResponse
    {
        $data = $request->validate([
            'bank_nama' => ['required', 'string', 'max:100'],
            'va_prefix' => ['required', 'string', 'max:10', 'regex:/^[0-9]+$/'],
            'qris_statis' => ['nullable', 'string', 'min:20'],
            'merchant_nama' => ['nullable', 'string', 'max:100'],
            'merchant_kota' => ['nullable', 'string', 'max:100'],
        ]);

        $config = $this->service->saveConfig($data);

        activity()
            ->causedBy($request->user())
            ->useLog('integrasi')
            ->log('Memperbarui pengaturan Pembayaran Online (Virtual Account & QRIS).');

        return response()->json($config);
    }

    public function virtualAccount(Request $request): JsonResponse
    {
        $prefix = $this->service->config()['va_prefix'] ?? null;
        abort_if(! $prefix, 422, 'Atur prefix Virtual Account terlebih dahulu di Pengaturan.');

        $request->validate([
            'periode' => ['nullable', 'date_format:Y-m'],
            'status' => ['nullable', 'in:lunas,belum_bayar'],
        ]);

        $belumLunas = function ($q) use ($request) {
            $q->where('status', 'belum_lunas');

            if ($request->filled('periode')) {
                $awal = Carbon::createFromFormat('Y-m', $request->string('periode')->value())->startOfMonth();
                $q->whereBetween('jatuh_tempo', [$awal->toDateString(), $awal->copy()->endOfMonth()->toDateString()]);
            }
        };

        $siswa = Siswa::query()
            ->where('status', 'aktif')
            ->when($request->filled('kelas_id'), fn ($q) => $q->where('kelas_id', $request->integer('kelas_id')))
            ->when($request->filled('cari'), fn ($q) => $q->where('nama', 'like', '%'.$request->string('cari').'%'))
            ->when($request->string('status')->value() === 'belum_bayar', fn ($q) => $q->whereHas('tagihan', $belumLunas))
            ->when($request->string('status')->value() === 'lunas', fn ($q) => $q->whereDoesntHave('tagihan', $belumLunas))
            ->with('kelas:id,nama_kelas')
            ->withSum(['tagihan as tunggakan' => $belumLunas], 'jumlah')
            ->orderBy('nama')
            ->paginate($request->integer('per_page', 20));

        $siswa->getCollection()->transform(fn (Siswa $s) => [
            'id' => $s->id,
            'nama' => $s->nama,
            'nis' => $s->nis,
            'nisn' => $s->nisn,
            'kelas' => $s->kelas?->nama_kelas,
            'nomor_va' => $this->service->nomorVa($s, $prefix),
            'tunggakan' => (float) ($s->tunggakan ?? 0),
        ]);

        return response()->json($siswa);
    }

    public function qrisTagihan(Tagihan $tagihan): JsonResponse
    {
        $config = $this->service->config();
        abort_if(empty($config['qris_statis']), 422, 'Atur QRIS statis sekolah terlebih dahulu di Pengaturan.');

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

    public function mutasiIndex(Request $request): JsonResponse
    {
        $mutasi = BankMutasi::query()
            ->with(['tagihan.siswa:id,nama', 'pembayaran', 'dicatatOleh:id,name', 'dicocokkanOleh:id,name'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->orderByDesc('tanggal')
            ->orderByDesc('id')
            ->get()
            ->map(fn (BankMutasi $m) => [
                ...$m->toArray(),
                'saran_tagihan' => $m->status === 'belum_cocok' ? $this->saranTagihan($m) : [],
            ]);

        return response()->json($mutasi);
    }

    public function mutasiStore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'tanggal' => ['required', 'date'],
            'jumlah' => ['required', 'numeric', 'min:0.01'],
            'keterangan' => ['nullable', 'string', 'max:255'],
            'nomor_va' => ['nullable', 'string', 'max:30'],
            'sumber' => ['required', 'in:virtual_account,qris,lainnya'],
        ]);

        $mutasi = BankMutasi::create([
            ...$data,
            'dicatat_oleh' => $request->user()->id,
        ]);

        activity()
            ->causedBy($request->user())
            ->log('Mencatat mutasi bank masuk sebesar Rp'.number_format((float) $data['jumlah'], 0, ',', '.').'.');

        return response()->json($mutasi, 201);
    }

    public function mutasiCocokkan(Request $request, BankMutasi $mutasi): JsonResponse
    {
        $this->assertBelumDiproses($mutasi);

        $data = $request->validate([
            'tagihan_id' => ['required', 'exists:tagihan,id'],
        ]);

        $tagihan = Tagihan::findOrFail($data['tagihan_id']);

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

        $pembayaran = Pembayaran::create([
            'tagihan_id' => $tagihan->id,
            'jumlah' => $mutasi->jumlah,
            'tanggal_bayar' => $mutasi->tanggal,
            'metode' => $mutasi->sumber === 'qris' ? 'qris' : 'virtual_account',
            'catatan' => 'Dicocokkan dari mutasi bank #'.$mutasi->id.($mutasi->keterangan ? " ({$mutasi->keterangan})" : ''),
            'dicatat_oleh' => $request->user()->id,
        ]);

        $totalDibayar = $tagihan->pembayaran()->sum('jumlah');
        if ($totalDibayar >= $tagihan->jumlah) {
            $tagihan->update(['status' => 'lunas']);
        }

        $mutasi->update([
            'status' => 'cocok',
            'tagihan_id' => $tagihan->id,
            'pembayaran_id' => $pembayaran->id,
            'dicocokkan_oleh' => $request->user()->id,
            'tanggal_dicocokkan' => now(),
        ]);

        activity()
            ->causedBy($request->user())
            ->log("Mencocokkan mutasi bank ke tagihan \"{$tagihan->judul}\".");

        return response()->json($mutasi->load(['tagihan.siswa:id,nama', 'pembayaran']));
    }

    public function mutasiAbaikan(Request $request, BankMutasi $mutasi): JsonResponse
    {
        $this->assertBelumDiproses($mutasi);

        $mutasi->update([
            'status' => 'diabaikan',
            'dicocokkan_oleh' => $request->user()->id,
            'tanggal_dicocokkan' => now(),
        ]);

        return response()->json($mutasi);
    }

    public function mutasiDestroy(BankMutasi $mutasi): JsonResponse
    {
        if ($mutasi->status === 'cocok') {
            throw ValidationException::withMessages([
                'status' => ['Mutasi yang sudah cocok tidak dapat dihapus. Batalkan pembayarannya lewat menu Pembayaran jika perlu.'],
            ]);
        }

        $mutasi->delete();

        return response()->json(['message' => 'Mutasi berhasil dihapus.']);
    }

    private function assertBelumDiproses(BankMutasi $mutasi): void
    {
        if ($mutasi->status !== 'belum_cocok') {
            throw ValidationException::withMessages([
                'status' => ['Mutasi ini sudah diproses sebelumnya.'],
            ]);
        }
    }

    /**
     * Saran tagihan yang mungkin cocok dengan satu mutasi: dicocokkan lewat
     * nomor VA (dibandingkan langsung dengan VA yang dihitung ulang per
     * siswa, bukan menebak-nebak dari potongan string) jika ada, atau lewat
     * kecocokan nominal persis sebagai jatuhan kedua.
     */
    private function saranTagihan(BankMutasi $mutasi): array
    {
        $prefix = $this->service->config()['va_prefix'] ?? null;
        $tagihanBelumLunas = Tagihan::where('status', 'belum_lunas')->with('siswa:id,nama,nis')->get();

        if ($mutasi->nomor_va && $prefix) {
            $cocok = $tagihanBelumLunas->filter(
                fn (Tagihan $t) => $t->siswa && $this->service->nomorVa($t->siswa, $prefix) === trim($mutasi->nomor_va)
            );

            if ($cocok->isNotEmpty()) {
                return $cocok->map(fn (Tagihan $t) => $this->presentSaran($t))->values()->all();
            }
        }

        return $tagihanBelumLunas
            ->filter(fn (Tagihan $t) => (float) $t->jumlah === (float) $mutasi->jumlah)
            ->take(5)
            ->map(fn (Tagihan $t) => $this->presentSaran($t))
            ->values()
            ->all();
    }

    private function presentSaran(Tagihan $t): array
    {
        return [
            'id' => $t->id,
            'judul' => $t->judul,
            'jumlah' => (float) $t->jumlah,
            'siswa' => $t->siswa?->nama,
        ];
    }
}
