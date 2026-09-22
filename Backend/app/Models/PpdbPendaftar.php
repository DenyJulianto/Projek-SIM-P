<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PpdbPendaftar extends Model
{
    protected $table = 'ppdb_pendaftar';

    /** Data isian pendaftar (yang boleh diubah lewat form). Kolom status diatur oleh alur tahapan. */
    public const FORM = [
        'ppdb_jalur_id', 'nik', 'nisn', 'nama_lengkap', 'nama_panggilan', 'jenis_kelamin', 'tempat_lahir', 'tanggal_lahir',
        'agama', 'alamat', 'no_hp', 'email', 'nama_ayah', 'nama_ibu', 'nama_wali', 'nik_orang_tua', 'pekerjaan_orang_tua',
        'penghasilan_orang_tua', 'telepon_orang_tua', 'sekolah_asal', 'npsn_sekolah_asal', 'tahun_lulus', 'nomor_ijazah', 'pilihan_program',
    ];

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'hasil_verifikasi' => 'array',
            'nilai_seleksi' => 'array',
            'checklist_daftar_ulang' => 'array',
            'skor' => 'float',
            'tanggal_verifikasi' => 'datetime',
            'tanggal_seleksi' => 'datetime',
            'pemberitahuan_hasil_at' => 'datetime',
            'tanggal_daftar_ulang' => 'datetime',
            'tanggal_diterima' => 'datetime',
            'tanggal_import' => 'datetime',
        ];
    }

    public function periode(): BelongsTo
    {
        return $this->belongsTo(PpdbPeriode::class, 'ppdb_periode_id');
    }

    public function jalur(): BelongsTo
    {
        return $this->belongsTo(PpdbJalur::class, 'ppdb_jalur_id');
    }

    public function dokumen(): HasMany
    {
        return $this->hasMany(PpdbDokumen::class, 'ppdb_pendaftar_id')->orderBy('id');
    }

    public function kelas(): BelongsTo
    {
        return $this->belongsTo(Kelas::class);
    }
}
