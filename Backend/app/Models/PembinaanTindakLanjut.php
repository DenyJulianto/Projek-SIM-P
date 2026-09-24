<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PembinaanTindakLanjut extends Model
{
    protected $table = 'pembinaan_tindak_lanjut';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['tanggal_pembinaan' => 'date', 'tanggal_tindak_lanjut' => 'date'];
    }

    public function siswa(): BelongsTo
    {
        return $this->belongsTo(Siswa::class);
    }

    public function pelanggaran(): BelongsTo
    {
        return $this->belongsTo(Pelanggaran::class);
    }

    public function pembuat(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dibuat_oleh');
    }
}
