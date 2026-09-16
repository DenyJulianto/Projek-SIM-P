<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UjianJawaban extends Model
{
    protected $table = 'ujian_jawaban';

    protected $fillable = ['ujian_attempt_id', 'ujian_soal_id', 'jawaban_dipilih', 'benar'];

    protected function casts(): array
    {
        return [
            'benar' => 'boolean',
        ];
    }

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(UjianAttempt::class, 'ujian_attempt_id');
    }

    public function soal(): BelongsTo
    {
        return $this->belongsTo(UjianSoal::class, 'ujian_soal_id');
    }
}
