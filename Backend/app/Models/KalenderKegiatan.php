<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KalenderKegiatan extends Model
{
    protected $table = 'kalender_kegiatan';

    protected $fillable = [
        'tahun_ajaran_id', 'judul', 'kategori', 'tanggal_mulai', 'tanggal_selesai', 'waktu_mulai', 'waktu_selesai',
        'penanggung_jawab_guru_id', 'penanggung_jawab', 'lokasi', 'peserta', 'keterangan', 'status',
        'pengingat_hari', 'pengingat_dikirim_at', 'disalin_dari_id', 'dibuat_oleh',
    ];

    public function tahunAjaran(): BelongsTo
    {
        return $this->belongsTo(TahunAjaran::class);
    }

    public function penanggungJawabGuru(): BelongsTo
    {
        return $this->belongsTo(Guru::class, 'penanggung_jawab_guru_id');
    }

    public function lampiran(): HasMany
    {
        return $this->hasMany(KalenderLampiran::class, 'kegiatan_id');
    }
}
