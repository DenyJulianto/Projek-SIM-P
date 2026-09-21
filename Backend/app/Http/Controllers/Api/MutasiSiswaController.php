<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\LaporanKesiswaanPengaturan;
use App\Http\Controllers\Controller;
use App\Models\MutasiSiswa;
use App\Models\PpdbPendaftar;
use App\Models\Siswa;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;
use Spatie\Activitylog\Models\Activity;
use Symfony\Component\HttpFoundation\Response;

/**
 * Register mutasi siswa (masuk pindahan, keluar, pindah sekolah). Siswa masuk lewat PPDB dan pindah
 * rombel tidak diinput di sini — keduanya sudah tersimpan di modul PPDB dan Rombel, dibaca langsung oleh laporan.
 */
class MutasiSiswaController extends Controller
{
    use LaporanKesiswaanPengaturan;

    private const JENIS = ['masuk' => 'Siswa Masuk (Pindahan)', 'keluar' => 'Siswa Keluar', 'pindah_sekolah' => 'Pindah Sekolah'];

    private const ROMAWI = [1 => 'I', 2 => 'II', 3 => 'III', 4 => 'IV', 5 => 'V', 6 => 'VI', 7 => 'VII', 8 => 'VIII', 9 => 'IX', 10 => 'X', 11 => 'XI', 12 => 'XII'];

    public function cariSiswa(Request $request): JsonResponse
    {
        $in = $request->validate(['search' => ['required', 'string', 'min:2', 'max:100']]);

        return response()->json(
            Siswa::with('kelas:id,nama_kelas,tingkat')->where(fn ($q) => $q->where('nama', 'like', '%'.$in['search'].'%')->orWhere('nis', 'like', '%'.$in['search'].'%')->orWhere('nisn', 'like', '%'.$in['search'].'%'))
                ->orderBy('nama')->limit(20)->get(['id', 'nama', 'nis', 'nisn', 'kelas_id', 'status'])
                ->map(fn (Siswa $s) => ['id' => $s->id, 'nama' => $s->nama, 'nis' => $s->nis, 'nisn' => $s->nisn, 'status' => $s->status, 'kelas' => $s->kelas?->nama_kelas])
        );
    }

    public function store(Request $request): JsonResponse
    {
        $d = $this->validasi($request);
        $siswa = Siswa::findOrFail($d['siswa_id']);

        if (MutasiSiswa::where('siswa_id', $siswa->id)->where('jenis', $d['jenis'])->whereDate('tanggal', $d['tanggal'])->where('status', 'tercatat')->exists()) {
            throw ValidationException::withMessages(['siswa_id' => 'Mutasi yang sama untuk siswa dan tanggal ini sudah tercatat.']);
        }
        if ($d['jenis'] === 'masuk' && PpdbPendaftar::where('siswa_id', $siswa->id)->exists()) {
            throw ValidationException::withMessages(['siswa_id' => 'Siswa ini masuk melalui PPDB dan sudah otomatis tercatat di laporan mutasi. Tidak perlu dicatat ulang.']);
        }
        $terapkan = (bool) $request->boolean('terapkan_status');
        if ($terapkan) {
            if ($d['jenis'] === 'masuk') {
                throw ValidationException::withMessages(['terapkan_status' => 'Penerapan status hanya untuk mutasi keluar atau pindah sekolah.']);
            }
            if ($siswa->status !== 'aktif') {
                throw ValidationException::withMessages(['terapkan_status' => "Siswa berstatus {$siswa->status}; status hanya dapat diubah dari aktif."]);
            }
        }

        $m = MutasiSiswa::create($d + [
            'kelas_id' => $siswa->kelas_id, 'status' => 'tercatat', 'status_siswa_diterapkan' => $terapkan, 'dibuat_oleh' => $request->user()?->id,
            'nomor_surat' => $d['jenis'] === 'masuk' ? null : $this->nomorSurat($d['tanggal']),
        ]);
        if ($terapkan) {
            $baru = $d['jenis'] === 'keluar' ? 'keluar' : 'pindah';
            $siswa->update(['status' => $baru]);
        }
        $this->log($request, $m, 'created', "Mencatat mutasi {$siswa->nama}: ".self::JENIS[$d['jenis']].'.', ['sebelum' => null, 'sesudah' => $this->ringkas($m) + ($terapkan ? ['status_siswa' => $siswa->status] : [])]);

        return response()->json($this->present($m), 201);
    }

    public function update(Request $request, MutasiSiswa $mutasi): JsonResponse
    {
        if ($mutasi->status === 'dibatalkan') {
            throw ValidationException::withMessages(['mutasi' => 'Mutasi yang dibatalkan tidak dapat diubah.']);
        }
        $d = $this->validasi($request, $mutasi);
        $lama = $this->ringkas($mutasi);
        $mutasi->update(collect($d)->except(['siswa_id', 'jenis'])->all());
        $baru = $this->ringkas($mutasi->fresh());
        $berubah = array_filter($baru, fn ($v, $k) => ($lama[$k] ?? null) != $v, ARRAY_FILTER_USE_BOTH);
        if ($berubah) {
            $this->log($request, $mutasi, 'updated', 'Mengubah catatan mutasi.', ['sebelum' => array_intersect_key($lama, $berubah), 'sesudah' => $berubah]);
        }

        return response()->json($this->present($mutasi->fresh()));
    }

    public function batalkan(Request $request, MutasiSiswa $mutasi): JsonResponse
    {
        $in = $request->validate(['alasan' => ['required', 'string', 'min:3', 'max:255'], 'pulihkan_status' => ['nullable', 'boolean']]);
        if ($mutasi->status === 'dibatalkan') {
            throw ValidationException::withMessages(['mutasi' => 'Mutasi ini sudah dibatalkan.']);
        }
        $mutasi->update(['status' => 'dibatalkan', 'alasan_batal' => $in['alasan']]);
        $sesudah = ['status' => 'dibatalkan'];
        $siswa = Siswa::find($mutasi->siswa_id);
        if (! empty($in['pulihkan_status']) && $mutasi->status_siswa_diterapkan && $siswa && in_array($siswa->status, ['keluar', 'pindah'], true)) {
            $siswa->update(['status' => 'aktif']);
            $sesudah['status_siswa'] = 'aktif';
        }
        $this->log($request, $mutasi, 'dibatalkan', 'Membatalkan catatan mutasi'.($siswa ? " {$siswa->nama}" : '').'.', ['sebelum' => ['status' => 'tercatat'], 'sesudah' => $sesudah, 'alasan' => $in['alasan']]);

        return response()->json($this->present($mutasi->fresh()));
    }

    public function riwayat(Request $request): JsonResponse
    {
        $in = $request->validate(['siswa_id' => ['required', 'integer']]);
        $ids = MutasiSiswa::where('siswa_id', $in['siswa_id'])->pluck('id');

        return response()->json([
            'mutasi' => MutasiSiswa::where('siswa_id', $in['siswa_id'])->orderByDesc('tanggal')->get()->map(fn (MutasiSiswa $m) => $this->present($m)),
            'log' => Activity::where('log_name', self::LOG_LAPORAN)->where('subject_type', MutasiSiswa::class)->whereIn('subject_id', $ids)->with('causer:id,name')
                ->orderByDesc('created_at')->orderByDesc('id')->limit(100)->get()
                ->map(fn (Activity $a) => ['id' => $a->id, 'event' => $a->event, 'description' => $a->description, 'causer' => $a->causer?->name, 'properties' => $a->properties, 'created_at' => $a->created_at]),
        ]);
    }

    /** Surat keterangan mutasi (keluar / pindah sekolah / penerimaan pindahan). */
    public function surat(MutasiSiswa $mutasi): Response
    {
        $siswa = Siswa::with('kelas:id,nama_kelas,tingkat')->findOrFail($mutasi->siswa_id);
        $p = $this->blokPengaturan(now()->toDateString(), true, true);

        return Pdf::loadView('laporan.surat_mutasi', [
            'm' => $mutasi, 'jenis' => self::JENIS[$mutasi->jenis], 'siswa' => $siswa, 'pengaturan' => $p, 'logo' => $this->logoDataUri($p['kop']['logo']),
            'tanggalMutasi' => $this->tanggalIndonesia((string) $mutasi->tanggal), 'tanggalSurat' => $this->tanggalIndonesia($p['tanggal_laporan']),
            'ttl' => trim(($siswa->tempat_lahir ?: '-').', '.($siswa->tanggal_lahir ? $this->tanggalIndonesia((string) $siswa->tanggal_lahir) : '-'), ', '),
        ])->setPaper('a4', 'portrait')->download('surat-mutasi-'.preg_replace('/[^A-Za-z0-9]+/', '-', $siswa->nama).'.pdf');
    }

    // ------------------------------------------------------------- pembantu

    private function validasi(Request $request, ?MutasiSiswa $ada = null): array
    {
        $d = $request->validate([
            'siswa_id' => [$ada ? 'nullable' : 'required', 'integer', 'exists:siswa,id'],
            'jenis' => [$ada ? 'nullable' : 'required', 'in:masuk,keluar,pindah_sekolah'],
            'tanggal' => ['required', 'date'],
            'asal_sekolah' => ['nullable', 'string', 'max:255'],
            'tujuan_sekolah' => ['nullable', 'string', 'max:255'],
            'alasan' => ['nullable', 'string', 'max:255'],
            'keterangan' => ['nullable', 'string', 'max:2000'],
        ]);
        $jenis = $d['jenis'] ?? $ada?->jenis;
        $salah = [];
        if ($jenis === 'masuk' && blank($d['asal_sekolah'] ?? null)) {
            $salah['asal_sekolah'] = 'Asal sekolah wajib diisi untuk siswa pindahan masuk.';
        }
        if ($jenis === 'pindah_sekolah' && blank($d['tujuan_sekolah'] ?? null)) {
            $salah['tujuan_sekolah'] = 'Sekolah tujuan wajib diisi.';
        }
        if ($jenis === 'keluar' && blank($d['alasan'] ?? null)) {
            $salah['alasan'] = 'Alasan keluar wajib diisi.';
        }
        if ($salah) {
            throw ValidationException::withMessages($salah);
        }

        return collect($d)->map(fn ($v) => is_string($v) && trim($v) === '' ? null : $v)->filter(fn ($v, $k) => ! ($ada && in_array($k, ['siswa_id', 'jenis'], true) && $v === null))->all();
    }

    private function nomorSurat(string $tanggal): string
    {
        $t = Carbon::parse($tanggal);
        $urut = MutasiSiswa::whereNotNull('nomor_surat')->whereYear('tanggal', $t->year)->count() + 1;
        do {
            $nomor = sprintf('%03d/MUT/%s/%d', $urut++, self::ROMAWI[$t->month], $t->year);
        } while (MutasiSiswa::where('nomor_surat', $nomor)->exists());

        return $nomor;
    }

    private function ringkas(MutasiSiswa $m): array
    {
        return ['tanggal' => substr((string) $m->tanggal, 0, 10), 'asal_sekolah' => $m->asal_sekolah, 'tujuan_sekolah' => $m->tujuan_sekolah, 'alasan' => $m->alasan, 'keterangan' => $m->keterangan, 'status' => $m->status];
    }

    private function present(MutasiSiswa $m): array
    {
        return $this->ringkas($m) + ['id' => $m->id, 'siswa_id' => $m->siswa_id, 'jenis' => $m->jenis, 'jenis_label' => self::JENIS[$m->jenis], 'nomor_surat' => $m->nomor_surat, 'alasan_batal' => $m->alasan_batal, 'status_siswa_diterapkan' => $m->status_siswa_diterapkan];
    }

    private function log(Request $request, MutasiSiswa $m, string $event, string $deskripsi, array $properties): void
    {
        activity(self::LOG_LAPORAN)->performedOn($m)->causedBy($request->user())->event($event)->withProperties($properties + ['ip' => $request->ip()])->log($deskripsi);
    }
}
