<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PpdbDokumen extends Model
{
    protected $table = 'ppdb_dokumen';

    protected $fillable = [
        'ppdb_pendaftar_id', 'ppdb_persyaratan_id', 'nama', 'nama_asli', 'path', 'mime', 'ukuran',
        'status', 'catatan', 'diperiksa_oleh', 'tanggal_periksa', 'diunggah_oleh',
    ];

    protected function casts(): array
    {
        return ['tanggal_periksa' => 'datetime'];
    }

    public function pendaftar(): BelongsTo
    {
        return $this->belongsTo(PpdbPendaftar::class, 'ppdb_pendaftar_id');
    }
}
