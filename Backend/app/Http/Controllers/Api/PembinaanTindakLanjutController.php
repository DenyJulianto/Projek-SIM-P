<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\RekapPembinaanData;
use App\Http\Controllers\Controller;
use App\Models\PembinaanTindakLanjut;
use App\Models\Pelanggaran;
use App\Models\Siswa;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Spatie\Activitylog\Models\Activity;

/**
 * Pencatatan proses pembinaan: tindak lanjut atas pelanggaran (atau pembinaan umum), perubahan statusnya,
 * dan status pelanggaran. Setiap perubahan tercatat di audit (siapa, kapan, data sebelum dan sesudah).
 */
class PembinaanTindakLanjutController extends Controller
{
    use RekapPembinaanData;

    public function store(Request $request): JsonResponse
    {
        $d = $this->validasi($request);
        $siswa = Siswa::findOrFail($d['siswa_id']);
        $this->pastikanSiswa($request, $siswa);
        $pelanggaran = $this->pelanggaranSiswa($d, $siswa);

        $t = PembinaanTindakLanjut::create($d + ['dibuat_oleh' => $request->user()?->id]);
        $this->catat($request, $t, 'created', "Mencatat pembinaan \"{$t->jenis_tindakan}\" untuk {$siswa->nama}.", null, $this->ringkas($t));

        // Pelanggaran yang mulai dibina tidak lagi berstatus "aktif" tanpa penanganan.
        if ($pelanggaran && $pelanggaran->status === 'aktif' && $t->status !== 'dibatalkan') {
            $pelanggaran->update(['status' => 'dalam_pembinaan']);
            $this->catat($request, $pelanggaran, 'status', "Status pelanggaran \"{$pelanggaran->jenis}\" menjadi Dalam Pembinaan (pembinaan dicatat).", ['status' => 'aktif'], ['status' => 'dalam_pembinaan']);
        }

        return response()->json($this->baris($t, $request), 201);
    }

    public function update(Request $request, PembinaanTindakLanjut $tindakLanjut): JsonResponse
    {
        $this->pastikanSiswa($request, Siswa::findOrFail($tindakLanjut->siswa_id));
        $d = $this->validasi($request, $tindakLanjut);
        $this->pelanggaranSiswa($d, Siswa::findOrFail($tindakLanjut->siswa_id));
        $lama = $this->ringkas($tindakLanjut);
        $tindakLanjut->update(collect($d)->except(['siswa_id'])->all());
        $baru = $this->ringkas($tindakLanjut->fresh());
        $berubah = array_filter($baru, fn ($v, $k) => ($lama[$k] ?? null) != $v, ARRAY_FILTER_USE_BOTH);
        if ($berubah) {
            $event = array_keys($berubah) === ['status'] ? 'status' : 'updated';
            $this->catat($request, $tindakLanjut, $event, $event === 'status' ? "Mengubah status pembinaan \"{$tindakLanjut->jenis_tindakan}\" menjadi ".self::STATUS_TINDAK_LANJUT[$tindakLanjut->status].'.' : "Mengubah catatan pembinaan \"{$tindakLanjut->jenis_tindakan}\".",
                array_intersect_key($lama, $berubah), $berubah);
        }

        return response()->json($this->baris($tindakLanjut->fresh(), $request));
    }

    /** Ubah status pelanggaran (aktif → dalam pembinaan → selesai), lengkap dengan alasan bila diberikan. */
    public function ubahStatusPelanggaran(Request $request, Pelanggaran $pelanggaran): JsonResponse
    {
        $in = $request->validate(['status' => ['required', 'in:aktif,dalam_pembinaan,selesai'], 'alasan' => ['nullable', 'string', 'max:500']]);
        $siswa = Siswa::findOrFail($pelanggaran->siswa_id);
        $this->pastikanSiswa($request, $siswa);
        if ($pelanggaran->status === $in['status']) {
            throw ValidationException::withMessages(['status' => 'Pelanggaran sudah berstatus '.self::STATUS_PELANGGARAN[$in['status']].'.']);
        }
        $lama = $pelanggaran->status;
        $pelanggaran->update(['status' => $in['status']]);
        $this->catat($request, $pelanggaran, 'status', "Mengubah status pelanggaran \"{$pelanggaran->jenis}\" ({$siswa->nama}) menjadi ".self::STATUS_PELANGGARAN[$in['status']].'.', ['status' => $lama], ['status' => $in['status']], $in['alasan'] ?? null);

        return response()->json(['id' => $pelanggaran->id, 'status' => $pelanggaran->status, 'status_label' => self::STATUS_PELANGGARAN[$pelanggaran->status]]);
    }

    public function riwayat(Request $request, PembinaanTindakLanjut $tindakLanjut): JsonResponse
    {
        $this->pastikanSiswa($request, Siswa::findOrFail($tindakLanjut->siswa_id));
        $internal = $this->boleh($request, 'rekap-pembinaan.manage');

        return response()->json(Activity::where('log_name', self::LOG_PEMBINAAN)->where('subject_type', PembinaanTindakLanjut::class)->where('subject_id', $tindakLanjut->id)->with('causer:id,name')
            ->orderByDesc('created_at')->orderByDesc('id')->limit(50)->get()
            ->map(fn (Activity $a) => ['id' => $a->id, 'event' => $a->event, 'description' => $a->description, 'causer' => $a->causer?->name, 'properties' => $this->propertiLog($a->properties, $internal), 'created_at' => $a->created_at]));
    }

    // ------------------------------------------------------------- pembantu

    private function validasi(Request $request, ?PembinaanTindakLanjut $ada = null): array
    {
        $d = $request->validate([
            'siswa_id' => [$ada ? 'nullable' : 'required', 'integer', 'exists:siswa,id'],
            'pelanggaran_id' => ['nullable', 'integer', 'exists:pelanggaran,id'],
            'tanggal_pembinaan' => ['required', 'date', 'before_or_equal:today'],
            'jenis_tindakan' => ['required', 'string', 'max:100'],
            'pembina' => ['required', 'string', 'max:150'],
            'catatan' => ['nullable', 'string', 'max:3000'],
            'rekomendasi' => ['nullable', 'string', 'max:3000'],
            'tanggal_tindak_lanjut' => ['nullable', 'date', 'after_or_equal:tanggal_pembinaan'],
            'status' => ['required', 'in:direncanakan,berjalan,selesai,dibatalkan'],
            'catatan_internal' => ['nullable', 'string', 'max:3000'],
        ]);
        if ($ada) {
            $d['siswa_id'] = $ada->siswa_id;
        }

        return collect($d)->map(fn ($v) => is_string($v) && trim($v) === '' ? null : $v)->all();
    }

    /** Pelanggaran yang dikaitkan harus milik siswa yang sama. */
    private function pelanggaranSiswa(array $d, Siswa $siswa): ?Pelanggaran
    {
        if (empty($d['pelanggaran_id'])) {
            return null;
        }
        $p = Pelanggaran::find($d['pelanggaran_id']);
        if (! $p || $p->siswa_id !== $siswa->id) {
            throw ValidationException::withMessages(['pelanggaran_id' => 'Pelanggaran yang dipilih bukan milik siswa ini.']);
        }

        return $p;
    }

    private function ringkas(PembinaanTindakLanjut $t): array
    {
        return [
            'pelanggaran_id' => $t->pelanggaran_id, 'tanggal_pembinaan' => substr((string) $t->tanggal_pembinaan, 0, 10), 'jenis_tindakan' => $t->jenis_tindakan, 'pembina' => $t->pembina, 'catatan' => $t->catatan,
            'rekomendasi' => $t->rekomendasi, 'tanggal_tindak_lanjut' => $t->tanggal_tindak_lanjut ? substr((string) $t->tanggal_tindak_lanjut, 0, 10) : null, 'status' => $t->status, 'catatan_internal' => $t->catatan_internal,
        ];
    }

    private function baris(PembinaanTindakLanjut $t, Request $request): array
    {
        return $this->barisTl($t, collect([$t->dibuat_oleh => $t->pembuat?->name]), collect($t->pelanggaran_id ? [$t->pelanggaran_id => $t->pelanggaran?->jenis] : []), $this->boleh($request, 'rekap-pembinaan.manage'));
    }

    private function catat(Request $request, Model $subjek, string $event, string $deskripsi, ?array $sebelum, ?array $sesudah, ?string $alasan = null): void
    {
        activity(self::LOG_PEMBINAAN)->performedOn($subjek)->causedBy($request->user())->event($event)
            ->withProperties(['sebelum' => $sebelum, 'sesudah' => $sesudah, 'ip' => $request->ip()] + ($alasan ? ['alasan' => $alasan] : []))->log($deskripsi);
    }
}
