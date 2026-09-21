<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PpdbPeriode extends Model
{
    protected $table = 'ppdb_periode';

    protected $fillable = [
        'tahun_ajaran_id', 'nama', 'jenjang', 'tanggal_mulai', 'tanggal_selesai', 'kuota', 'jumlah_rombel', 'kapasitas_rombel',
        'jadwal_seleksi', 'jadwal_pengumuman', 'daftar_ulang_mulai', 'daftar_ulang_selesai', 'status',
        'pengumuman_terbit_at', 'pengumuman_terbit_oleh', 'catatan', 'dibuat_oleh',
    ];

    protected function casts(): array
    {
        return ['pengumuman_terbit_at' => 'datetime'];
    }

    public function tahunAjaran(): BelongsTo
    {
        return $this->belongsTo(TahunAjaran::class);
    }

    public function jalur(): HasMany
    {
        return $this->hasMany(PpdbJalur::class)->orderBy('urutan')->orderBy('id');
    }

    public function persyaratan(): HasMany
    {
        return $this->hasMany(PpdbPersyaratan::class)->orderBy('urutan')->orderBy('id');
    }

    public function pendaftar(): HasMany
    {
        return $this->hasMany(PpdbPendaftar::class);
    }
}
