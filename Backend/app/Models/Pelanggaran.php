<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pelanggaran extends Model
{
    protected $table = 'pelanggaran';

    protected $fillable = ['siswa_id', 'tingkat', 'jenis', 'kategori', 'poin', 'tanggal', 'keterangan', 'tindakan', 'status', 'catatan', 'dicatat_oleh'];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
        ];
    }

    public function siswa(): BelongsTo
    {
        return $this->belongsTo(Siswa::class);
    }
}
