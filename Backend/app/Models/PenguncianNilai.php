<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PenguncianNilai extends Model
{
    protected $table = 'penguncian_nilai';

    protected $fillable = [
        'tahun_ajaran_id', 'semester', 'kelas_id', 'mata_pelajaran_id', 'status',
        'persen_saat_kunci', 'jumlah_nilai_saat_kunci', 'catatan_kunci',
        'dikunci_oleh', 'tanggal_kunci', 'dibuka_oleh', 'tanggal_buka', 'catatan_buka',
    ];

    public function tahunAjaran(): BelongsTo
    {
        return $this->belongsTo(TahunAjaran::class);
    }

    public function kelas(): BelongsTo
    {
        return $this->belongsTo(Kelas::class);
    }

    public function mataPelajaran(): BelongsTo
    {
        return $this->belongsTo(MataPelajaran::class);
    }

    public function pengunci(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dikunci_oleh');
    }

    public function pembuka(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dibuka_oleh');
    }

    /**
     * Penguncian aktif yang mencakup sebuah nilai: rombel siswa saat ini,
     * mata pelajaran, tahun ajaran (dicocokkan lewat nama), dan semester.
     */
    public static function yangMengunci(int $siswaId, int $mapelId, string $tahunAjaran, string $semester): ?self
    {
        $kelasId = Siswa::whereKey($siswaId)->value('kelas_id');
        $taId = TahunAjaran::where('nama', $tahunAjaran)->value('id');
        if (! $kelasId || ! $taId) {
            return null;
        }

        return self::where('status', 'terkunci')
            ->where('tahun_ajaran_id', $taId)
            ->where('semester', mb_strtolower($semester))
            ->where('kelas_id', $kelasId)
            ->where('mata_pelajaran_id', $mapelId)
            ->first();
    }

    /** Tolak (423) bila nilai berada pada penguncian yang aktif. */
    public static function pastikanBolehUbah(int $siswaId, int $mapelId, string $tahunAjaran, string $semester): void
    {
        if (self::yangMengunci($siswaId, $mapelId, $tahunAjaran, $semester)) {
            abort(423, 'Nilai untuk rombel, mata pelajaran, dan semester ini sudah dikunci. Hubungi Kurikulum untuk membuka kunci sebelum mengubah nilai.');
        }
    }
}
