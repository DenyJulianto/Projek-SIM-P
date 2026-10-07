<?php

declare(strict_types=1);

namespace App\Models;

use App\Support\StrukturPerangkatAjar;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Collection;

class JadwalPelajaran extends Model
{
    protected $table = 'jadwal_pelajaran';

    protected $fillable = [
        'kelas_id',
        'mata_pelajaran_id',
        'guru_id',
        'hari',
        'jam_mulai',
        'jam_selesai',
    ];

    public function kelas(): BelongsTo
    {
        return $this->belongsTo(Kelas::class);
    }

    public function mataPelajaran(): BelongsTo
    {
        return $this->belongsTo(MataPelajaran::class);
    }

    public function guru(): BelongsTo
    {
        return $this->belongsTo(Guru::class);
    }

    /** Mapel yang diajar guru beserta kelasnya (dari jadwal), untuk pilihan form perangkat ajar. */
    public static function mengajarGuru(int $guruId): Collection
    {
        return static::where('guru_id', $guruId)
            ->with(['kelas:id,nama_kelas,tingkat', 'mataPelajaran:id,nama_mapel'])
            ->get()
            ->filter(fn ($j) => $j->kelas && $j->mataPelajaran)
            ->groupBy('mata_pelajaran_id')
            ->map(fn ($items) => [
                'mata_pelajaran_id' => $items->first()->mata_pelajaran_id,
                'nama_mapel' => $items->first()->mataPelajaran->nama_mapel,
                'kelas' => $items->pluck('kelas')->unique('id')->sortBy('nama_kelas')->values()->map(fn ($k) => [
                    'id' => $k->id,
                    'nama_kelas' => $k->nama_kelas,
                    'tingkat' => $k->tingkat,
                    'fase' => StrukturPerangkatAjar::faseDariTingkat($k->tingkat),
                ]),
            ])
            ->sortBy('nama_mapel')
            ->values();
    }

    public static function diajarOleh(int $guruId, ?int $kelasId, ?int $mapelId): bool
    {
        return static::where('guru_id', $guruId)->where('kelas_id', $kelasId)->where('mata_pelajaran_id', $mapelId)->exists();
    }
}
