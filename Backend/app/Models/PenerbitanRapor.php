<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PenerbitanRapor extends Model
{
    protected $table = 'penerbitan_rapor';

    protected $fillable = [
        'siswa_id', 'tahun_ajaran_id', 'semester', 'kelas_id', 'status', 'nomor_rapor', 'tanggal_terbit',
        'konten', 'tanggal_generate', 'digenerate_oleh', 'diterbitkan_oleh', 'tanggal_dicabut', 'dicabut_oleh', 'alasan_cabut',
    ];

    protected function casts(): array
    {
        return ['konten' => 'array'];
    }

    public function siswa(): BelongsTo
    {
        return $this->belongsTo(Siswa::class);
    }

    public function kelas(): BelongsTo
    {
        return $this->belongsTo(Kelas::class);
    }

    public function tahunAjaran(): BelongsTo
    {
        return $this->belongsTo(TahunAjaran::class);
    }

    public function diterbitkanOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'diterbitkan_oleh');
    }

    /** Rapor yang sudah diterbitkan untuk siswa/periode (dicocokkan lewat nama tahun ajaran & semester). */
    public static function terbitUntuk(int $siswaId, string $tahunAjaran, string $semester): ?self
    {
        $taId = TahunAjaran::where('nama', $tahunAjaran)->value('id');

        return $taId
            ? self::where('siswa_id', $siswaId)->where('tahun_ajaran_id', $taId)->where('semester', mb_strtolower($semester))->where('status', 'diterbitkan')->first()
            : null;
    }
}
