<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Rapor extends Model
{
    protected $table = 'rapor';

    protected $fillable = [
        'siswa_id', 'semester', 'tahun_ajaran', 'status',
        'diajukan_oleh', 'disahkan_oleh', 'catatan', 'tanggal_keputusan',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_keputusan' => 'datetime',
        ];
    }

    public function siswa(): BelongsTo
    {
        return $this->belongsTo(Siswa::class);
    }

    public function diajukanOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'diajukan_oleh');
    }

    public function disahkanOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'disahkan_oleh');
    }
}
