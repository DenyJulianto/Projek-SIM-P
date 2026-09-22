<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Integrasi;

use App\Http\Controllers\Controller;
use App\Models\Central\GuruDirectory;
use App\Models\Central\SecuritySettings;
use App\Models\Central\SiswaDirectory;
use App\Models\Sekolah;
use App\Support\PiiMasker;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\QueryBuilder;

/**
 * API baca-saja untuk sistem pihak lain (lewat token — lihat
 * AuthenticateIntegrationToken), dokumentasinya ditampilkan di menu
 * Integrasi Sistem Super Admin. Bentuk datanya sama dengan direktori
 * nasional internal, cuma jalur otentikasinya beda (token, bukan sesi
 * login Super Admin).
 */
class DirectoryApiController extends Controller
{
    public function sekolah(Request $request): JsonResponse
    {
        $sekolah = QueryBuilder::for(Sekolah::class)
            ->allowedFilters('nama_sekolah', 'npsn', 'jenjang', 'provinsi', 'kabupaten_kota')
            ->select(['id', 'nama_sekolah', 'npsn', 'jenjang', 'alamat', 'kecamatan', 'kelurahan', 'kabupaten_kota', 'provinsi', 'telepon', 'email', 'status'])
            ->paginate($request->integer('per_page', 50));

        if (SecuritySettings::current()->mask_pii_enabled) {
            $sekolah->getCollection()->each(function (Sekolah $s) {
                $s->setAttribute('telepon', PiiMasker::phone($s->telepon));
                $s->setAttribute('email', PiiMasker::email($s->email));
            });
        }

        return response()->json($sekolah);
    }

    public function guru(Request $request): JsonResponse
    {
        $guru = QueryBuilder::for(GuruDirectory::class)
            ->allowedFilters('nama', 'jabatan', 'status', 'sekolah_id')
            ->with('sekolah:id,nama_sekolah,npsn')
            ->paginate($request->integer('per_page', 50));

        if (SecuritySettings::current()->mask_pii_enabled) {
            $guru->getCollection()->each(function (GuruDirectory $g) {
                $g->setAttribute('nip', PiiMasker::id($g->nip));
                $g->setAttribute('nuptk', PiiMasker::id($g->nuptk));
                $g->setAttribute('no_telepon', PiiMasker::phone($g->no_telepon));
            });
        }

        return response()->json($guru);
    }

    public function siswa(Request $request): JsonResponse
    {
        $siswa = QueryBuilder::for(SiswaDirectory::class)
            ->allowedFilters('nama', 'nis', 'status', 'sekolah_id')
            ->with('sekolah:id,nama_sekolah,npsn')
            ->paginate($request->integer('per_page', 50));

        if (SecuritySettings::current()->mask_pii_enabled) {
            $siswa->getCollection()->each(fn (SiswaDirectory $s) => $s->setAttribute('nis', PiiMasker::id($s->nis)));
        }

        return response()->json($siswa);
    }
}
