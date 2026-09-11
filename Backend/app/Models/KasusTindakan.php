<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KasusTindakan extends Model
{
    protected $table = 'kasus_tindakan';

    protected $fillable = ['kasus_id', 'tanggal', 'deskripsi'];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
        ];
    }

    public function kasus(): BelongsTo
    {
        return $this->belongsTo(KasusSiswa::class, 'kasus_id');
    }
}
