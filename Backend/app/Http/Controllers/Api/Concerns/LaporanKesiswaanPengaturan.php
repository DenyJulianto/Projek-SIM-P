<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Concerns;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/** Pengaturan tampilan laporan (kop, logo, penandatangan) yang dipakai semua laporan dan surat kesiswaan. */
trait LaporanKesiswaanPengaturan
{
    protected const LOG_LAPORAN = 'laporan-kesiswaan';

    protected function pengaturanTersimpan(): array
    {
        $nilai = DB::table('laporan_kesiswaan_pengaturan')->where('kunci', 'umum')->value('nilai');

        return $nilai ? (json_decode($nilai, true) ?: []) : [];
    }

    /** Gabungan pengaturan tersimpan dengan bawaan dari profil sekolah. */
    protected function pengaturanUmum(): array
    {
        $t = tenant();
        $tersimpan = $this->pengaturanTersimpan();
        $alamat = collect([$t->alamat, $t->kelurahan, $t->kecamatan, $t->kabupaten_kota, $t->provinsi])->filter()->implode(', ');

        return [
            'kop_nama' => $tersimpan['kop_nama'] ?? ($t->nama_sekolah ?: 'Sekolah'),
            'kop_alamat' => $tersimpan['kop_alamat'] ?? $alamat,
            'kop_kontak' => $tersimpan['kop_kontak'] ?? collect([$t->telepon ? 'Telp. '.$t->telepon : null, $t->email])->filter()->implode(' · '),
            'tampil_logo' => (bool) ($tersimpan['tampil_logo'] ?? true),
            'kota' => $tersimpan['kota'] ?? ($t->kabupaten_kota ?: ''),
            'penandatangan' => array_values($tersimpan['penandatangan'] ?? [
                ['jabatan' => 'Kepala Sekolah', 'nama' => '', 'nip' => ''],
                ['jabatan' => 'Waka Kesiswaan', 'nama' => '', 'nip' => ''],
            ]),
        ];
    }

    /** Blok pengaturan yang ikut di dalam setiap laporan (kop, logo, tanggal, penandatangan). */
    protected function blokPengaturan(?string $tanggalLaporan, bool $logo, bool $ttd): array
    {
        $p = $this->pengaturanUmum();

        return [
            'kop' => ['nama' => $p['kop_nama'], 'alamat' => $p['kop_alamat'], 'kontak' => $p['kop_kontak'], 'logo' => $logo && $p['tampil_logo'] ? (tenant()->logo ?: null) : null],
            'kota' => $p['kota'],
            'tanggal_laporan' => $tanggalLaporan ?: now()->toDateString(),
            'penandatangan' => $ttd ? $p['penandatangan'] : [],
        ];
    }

    /** Logo sebagai data URI bila berkas lokal tersedia (dompdf tidak mengambil gambar dari internet). */
    protected function logoDataUri(?string $logo): ?string
    {
        if (! $logo) {
            return null;
        }
        $kandidat = [$logo, public_path($logo), public_path(ltrim((string) parse_url($logo, PHP_URL_PATH), '/')), storage_path('app/public/'.ltrim($logo, '/'))];
        foreach ($kandidat as $path) {
            if (is_file($path) && filesize($path) < 2_000_000) {
                $mime = mime_content_type($path) ?: 'image/png';

                return 'data:'.$mime.';base64,'.base64_encode((string) file_get_contents($path));
            }
        }

        return null;
    }

    protected function tanggalIndonesia(?string $tanggal): string
    {
        return $tanggal ? Carbon::parse($tanggal)->locale('id')->translatedFormat('d F Y') : '-';
    }
}
