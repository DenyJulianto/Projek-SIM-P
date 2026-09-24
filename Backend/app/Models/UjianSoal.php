<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UjianSoal extends Model
{
    protected $table = 'ujian_soal';

    public const TIPE_PILIHAN_GANDA = 'pilihan_ganda';

    public const TIPE_ESSAY = 'essay';

    protected $fillable = ['ujian_id', 'tipe', 'bobot', 'pertanyaan', 'pilihan_a', 'pilihan_b', 'pilihan_c', 'pilihan_d', 'jawaban_benar', 'urutan'];

    public function ujian(): BelongsTo
    {
        return $this->belongsTo(Ujian::class);
    }
}
