<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AnggaranPos extends Model
{
    protected $table = 'anggaran_pos';

    protected $fillable = ['tahun_ajaran', 'bidang', 'uraian', 'jumlah_anggaran'];

    protected function casts(): array
    {
        return [
            'jumlah_anggaran' => 'decimal:2',
        ];
    }

    public function pengajuan(): HasMany
    {
        return $this->hasMany(PengajuanAnggaran::class);
    }
}
