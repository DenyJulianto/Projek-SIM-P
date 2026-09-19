<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProgramSemesterItem extends Model
{
    protected $table = 'program_semester_item';

    protected $fillable = [
        'program_semester_id',
        'tujuan_pembelajaran_id',
        'indikator_id',
        'tanggal_mulai',
        'tanggal_selesai',
        'materi',
        'alokasi_jp',
        'minggu_ke',
        'bulan',
        'rencana_pembelajaran',
        'status_pelaksanaan',
        'catatan',
        'urutan',
    ];

    protected function casts(): array
    {
        return ['tanggal_mulai' => 'date:Y-m-d', 'tanggal_selesai' => 'date:Y-m-d'];
    }

    public function indikator(): BelongsTo
    {
        return $this->belongsTo(KompetensiIndikator::class, 'indikator_id');
    }

    public function programSemester(): BelongsTo
    {
        return $this->belongsTo(ProgramSemester::class);
    }

    public function tujuanPembelajaran(): BelongsTo
    {
        return $this->belongsTo(TujuanPembelajaran::class);
    }
}
