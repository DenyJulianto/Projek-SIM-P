<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notifikasi extends Model
{
    protected $table = 'notifikasi';

    protected $fillable = ['user_id', 'jenis', 'kunci', 'judul', 'pesan', 'data', 'jumlah', 'dibaca_at'];

    protected function casts(): array
    {
        return [
            'data' => 'array',
            'dibaca_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Kirim (atau perbarui) notifikasi ke satu user. Notifikasi dengan
     * `kunci` yang sama digabung menjadi satu baris yang diperbarui dan
     * ditandai belum dibaca lagi, supaya daftar notifikasi tidak banjir.
     */
    public static function kirim(?int $userId, string $jenis, string $kunci, string $judul, string $pesan, array $data = [], int $jumlah = 1): void
    {
        if (! $userId) {
            return;
        }

        static::updateOrCreate(
            ['user_id' => $userId, 'kunci' => $kunci],
            [
                'jenis' => $jenis,
                'judul' => $judul,
                'pesan' => $pesan,
                'data' => $data,
                'jumlah' => $jumlah,
                'dibaca_at' => null,
            ]
        );
    }
}
