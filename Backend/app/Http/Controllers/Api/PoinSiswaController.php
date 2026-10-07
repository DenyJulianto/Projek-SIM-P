<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CatatanPoin;
use App\Models\Siswa;
use App\Notifications\CatatanPoinNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;

/**
 * Menu "Poin Siswa" untuk Kesiswaan: daftar sisa poin kedisiplinan setiap
 * siswa (mulai 100) dan CRUD buku poin per siswa — pengurangan karena
 * pelanggaran & penambahan karena apresiasi, dengan rentang poin per
 * kategori (CatatanPoin::KATEGORI). Siswa & orang tua melihat buku poin
 * yang sama (baca-saja) di menu Poin mereka.
 */
class PoinSiswaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'kelas_id' => ['nullable', 'integer'],
            'urut' => ['nullable', 'in:nama,poin'],
        ]);

        $siswa = Siswa::query()
            ->with('kelas:id,nama_kelas')
            ->withCount('catatanPoin')
            ->where('status', 'aktif')
            ->when($request->filled('search'), fn ($q) => $q->where(fn ($w) => $w
                ->where('nama', 'like', '%'.$request->string('search').'%')
                ->orWhere('nis', 'like', '%'.$request->string('search').'%')
                ->orWhere('nisn', 'like', '%'.$request->string('search').'%')))
            ->when($request->filled('kelas_id'), fn ($q) => $q->where('kelas_id', $request->integer('kelas_id')))
            ->when($request->input('urut') === 'poin', fn ($q) => $q->orderBy('poin_disiplin'), fn ($q) => $q->orderBy('nama'))
            ->paginate($request->integer('per_page', 15), ['id', 'nama', 'nis', 'nisn', 'kelas_id', 'poin_disiplin']);

        return response()->json($siswa->toArray() + ['poin_awal' => Siswa::POIN_AWAL]);
    }

    public function show(Siswa $siswa): JsonResponse
    {
        return response()->json($this->ringkasan($siswa) + [
            'kategori' => CatatanPoin::KATEGORI,
            'pelanggaran' => $siswa->pelanggaran()
                ->withExists(['catatanPoin as poin_dipotong', 'pengajuanPoin as poin_diajukan' => fn ($q) => $q->where('status', 'menunggu')])
                ->orderByDesc('tanggal')->get(['id', 'jenis', 'tingkat', 'tanggal', 'poin']),
            'prestasi' => $siswa->prestasi()->orderByDesc('tanggal')->get(['id', 'judul', 'tingkat', 'tanggal']),
        ]);
    }

    public function store(Request $request, Siswa $siswa): JsonResponse
    {
        $data = $this->validasi($request, $siswa);

        $catatan = DB::transaction(function () use ($siswa, $data, $request) {
            $catatan = $siswa->catatanPoin()->create($data + ['dicatat_oleh' => $request->user()?->id]);
            $siswa->hitungUlangPoin();

            return $catatan;
        });

        $arah = $catatan->perubahan() < 0 ? 'Mengurangi' : 'Menambah';
        activity()->causedBy($request->user())->log("{$arah} {$catatan->poin} poin kedisiplinan \"{$siswa->nama}\".");
        $this->beriTahu($siswa, $catatan);

        return response()->json($this->ringkasan($siswa->fresh()), 201);
    }

    public function update(Request $request, CatatanPoin $catatan): JsonResponse
    {
        $siswa = $catatan->siswa;
        $data = $this->validasi($request, $siswa, $catatan);

        DB::transaction(function () use ($catatan, $siswa, $data) {
            $catatan->update($data);
            $siswa->hitungUlangPoin();
        });

        activity()->causedBy($request->user())->log("Memperbarui catatan poin kedisiplinan \"{$siswa->nama}\".");

        return response()->json($this->ringkasan($siswa->fresh()));
    }

    public function destroy(Request $request, CatatanPoin $catatan): JsonResponse
    {
        $siswa = $catatan->siswa;

        DB::transaction(function () use ($catatan, $siswa, $request) {
            // Catatan dari pengajuan BK yang dihapus membatalkan pengajuannya,
            // supaya statusnya tidak lagi "disetujui" dan BK bisa mengajukan ulang.
            if ($pengajuan = $catatan->pengajuan) {
                $keterangan = 'Dibatalkan '.now()->locale('id')->translatedFormat('j F Y').': catatan poinnya dihapus oleh '.$request->user()->name.'.';
                $pengajuan->update([
                    'status' => 'dibatalkan',
                    'catatan_kesiswaan' => implode("\n", array_filter([$pengajuan->catatan_kesiswaan, $keterangan])),
                ]);
            }
            $catatan->delete();
            $siswa->hitungUlangPoin();
        });

        activity()->causedBy($request->user())->log("Menghapus catatan poin kedisiplinan \"{$siswa->nama}\".");

        return response()->json($this->ringkasan($siswa->fresh()));
    }

    private function validasi(Request $request, Siswa $siswa, ?CatatanPoin $lama = null): array
    {
        $data = $request->validate([
            'kategori' => ['required', 'in:'.implode(',', array_keys(CatatanPoin::KATEGORI))],
            'poin' => ['required', 'integer', 'min:1'],
            'keterangan' => ['nullable', 'string', 'max:255'],
            'tanggal' => ['required', 'date', 'before_or_equal:today'],
            'pelanggaran_id' => ['nullable', 'integer'],
            'prestasi_id' => ['nullable', 'integer'],
        ], [
            'tanggal.before_or_equal' => 'Tanggal tidak boleh di masa depan.',
        ]);

        // Catatan dari pengajuan BK boleh tetap memakai poin hasil keputusan
        // BK & Kesiswaan walau di luar rentang kategori.
        $dariBk = $lama?->pengajuan_id !== null;
        $info = CatatanPoin::KATEGORI[$data['kategori']];
        if (! $dariBk && ($data['poin'] < $info['min'] || $data['poin'] > $info['max'])) {
            $rentang = $info['min'] === $info['max'] ? "{$info['min']}" : "{$info['min']}–{$info['max']}";
            throw ValidationException::withMessages(['poin' => "Poin untuk {$info['label']} harus {$rentang}."]);
        }

        // Pelanggaran hanya untuk kategori pengurangan, prestasi hanya untuk
        // kategori prestasi; keduanya harus milik siswa ini.
        $pelanggaran = $prestasi = null;
        if (! empty($data['pelanggaran_id'])) {
            abort_if($info['arah'] > 0, 422, 'Pelanggaran hanya bisa dikaitkan ke kategori pelanggaran.');
            $pelanggaran = $siswa->pelanggaran()->find($data['pelanggaran_id']);
            abort_unless($pelanggaran, 422, 'Pelanggaran yang dipilih bukan milik siswa ini.');
            // Satu pelanggaran hanya memotong poin sekali (lihat Pelanggaran::alasanSudahDipotong).
            if ($alasan = $pelanggaran->alasanSudahDipotong($lama?->id, $lama?->pengajuan_id)) {
                throw ValidationException::withMessages(['pelanggaran_id' => $alasan]);
            }
        }
        if (! empty($data['prestasi_id'])) {
            abort_if($data['kategori'] !== 'prestasi', 422, 'Data prestasi hanya bisa dikaitkan ke kategori prestasi.');
            $prestasi = $siswa->prestasi()->find($data['prestasi_id']);
            abort_unless($prestasi, 422, 'Prestasi yang dipilih bukan milik siswa ini.');
        }

        $otomatis = $pelanggaran ? "Pelanggaran: {$pelanggaran->jenis}" : ($prestasi ? "Prestasi: {$prestasi->judul}" : '');
        $data['keterangan'] = trim((string) ($data['keterangan'] ?? '')) ?: $otomatis;
        abort_if($data['keterangan'] === '', 422, 'Isi keterangan atau pilih data pelanggaran/prestasi terkait.');
        $data['pelanggaran_id'] = $pelanggaran?->id;
        $data['prestasi_id'] = $prestasi?->id;

        return $data;
    }

    private function ringkasan(Siswa $siswa): array
    {
        $siswa->loadMissing('kelas:id,nama_kelas');

        return ['siswa' => $siswa->only(['id', 'nama', 'nis', 'nisn']) + ['kelas' => $siswa->kelas?->nama_kelas]]
            + $siswa->ringkasanPoin();
    }

    private function beriTahu(Siswa $siswa, CatatanPoin $catatan): void
    {
        $siswa->loadMissing(['user', 'walis']);
        $penerima = collect([$siswa->user])->merge($siswa->walis)->filter();

        if ($penerima->isNotEmpty()) {
            Notification::send($penerima, new CatatanPoinNotification($catatan, $siswa->poin_disiplin));
        }
    }
}
