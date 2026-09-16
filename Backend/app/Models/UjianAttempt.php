<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UjianAttempt extends Model
{
    protected $table = 'ujian_attempt';

    protected $fillable = ['ujian_id', 'siswa_id', 'started_at', 'finished_at', 'nilai'];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
        ];
    }

    public function ujian(): BelongsTo
    {
        return $this->belongsTo(Ujian::class);
    }

    public function siswa(): BelongsTo
    {
        return $this->belongsTo(Siswa::class);
    }

    public function jawaban(): HasMany
    {
        return $this->hasMany(UjianJawaban::class, 'ujian_attempt_id');
    }
}
