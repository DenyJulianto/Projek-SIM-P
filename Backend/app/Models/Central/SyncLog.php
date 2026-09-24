<?php

declare(strict_types=1);

namespace App\Models\Central;

use App\Models\Sekolah;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Riwayat sinkronisasi data guru/siswa sekolah ke direktori nasional
 * (central). Satu baris = satu kali proses sinkronisasi dijalankan (manual
 * oleh Admin Sekolah lewat menu Sinkronisasi Data, atau dipaksa Super Admin
 * lewat menu Log Sinkronisasi) — bukan log per-baris data yang berubah,
 * supaya tidak kebanjiran entri dari sinkronisasi otomatis tiap kali satu
 * guru/siswa disimpan (itu ditangani GuruObserver/SiswaObserver secara diam-diam).
 */
class SyncLog extends Model
{
    protected $table = 'sync_logs';

    protected $fillable = [
        'sekolah_id',
        'triggered_by_name',
        'triggered_by_email',
        'triggered_by_role',
        'jumlah_guru',
        'jumlah_siswa',
        'status',
        'pesan_error',
    ];

    public function getConnectionName(): ?string
    {
        return config('tenancy.database.central_connection');
    }

    public function sekolah(): BelongsTo
    {
        return $this->belongsTo(Sekolah::class, 'sekolah_id');
    }
}
