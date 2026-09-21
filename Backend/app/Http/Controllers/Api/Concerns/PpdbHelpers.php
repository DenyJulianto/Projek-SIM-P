<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Concerns;

use App\Models\PpdbJalur;
use App\Models\PpdbPendaftar;
use App\Models\PpdbPeriode;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

trait PpdbHelpers
{
    protected const LOG_PPDB = 'ppdb';

    protected const STATUS_PERIODE = [
        'draft' => 'Draft', 'dibuka' => 'Pendaftaran Dibuka', 'ditutup' => 'Pendaftaran Ditutup', 'seleksi' => 'Proses Seleksi',
        'pengumuman' => 'Pengumuman', 'daftar_ulang' => 'Daftar Ulang', 'selesai' => 'Selesai',
    ];

    protected const LABEL_VERIFIKASI = ['belum' => 'Belum Diverifikasi', 'diverifikasi' => 'Terverifikasi', 'perlu_perbaikan' => 'Perlu Perbaikan', 'ditolak' => 'Ditolak'];

    protected const LABEL_SELEKSI = ['belum' => 'Belum Diputuskan', 'lolos' => 'Lolos', 'tidak_lolos' => 'Tidak Lolos'];

    protected const LABEL_DAFTAR_ULANG = ['belum' => 'Belum Daftar Ulang', 'sudah' => 'Sudah Daftar Ulang', 'dibatalkan' => 'Dibatalkan'];

    protected function logPpdb(Request $request, Model $subject, string $event, string $deskripsi, array $properties = []): void
    {
        activity(self::LOG_PPDB)->performedOn($subject)->causedBy($request->user())->event($event)->withProperties($properties + ['ip' => $request->ip()])->log($deskripsi);
    }

    /** Skor 0–100 berdasarkan kriteria jalur; null bila kriteria kosong atau nilai belum lengkap. */
    protected function hitungSkor(PpdbJalur $jalur, ?array $nilai): ?float
    {
        $kriteria = $jalur->kriteria ?? [];
        if ($kriteria === [] || ! $nilai) {
            return null;
        }
        $totalBobot = 0.0;
        $jumlah = 0.0;
        foreach ($kriteria as $k) {
            $v = $nilai[$k['nama']] ?? null;
            if ($v === null || $v === '') {
                return null;
            }
            $maks = (float) ($k['maks'] ?? 100) ?: 100.0;
            $jumlah += min(max((float) $v, 0.0), $maks) / $maks * (float) $k['bobot'];
            $totalBobot += (float) $k['bobot'];
        }

        return $totalBobot > 0 ? round($jumlah / $totalBobot * 100, 2) : null;
    }

    protected function pastikanPengumumanBelumTerbit(PpdbPeriode $periode, string $aksi): void
    {
        if ($periode->pengumuman_terbit_at) {
            throw ValidationException::withMessages(['periode' => "Hasil seleksi sudah diumumkan. Batalkan publikasi pengumuman terlebih dahulu untuk {$aksi}."]);
        }
    }

    protected function labelPendaftar(PpdbPendaftar $p): string
    {
        return "{$p->nomor_pendaftaran} ({$p->nama_lengkap})";
    }
}
