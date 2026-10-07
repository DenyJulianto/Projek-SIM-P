<?php

declare(strict_types=1);

namespace App\Models\Central;

use Illuminate\Database\Eloquent\Model;

/**
 * Satu baris pengaturan landing platform: WhatsApp tim sales, info
 * legal/kontak perusahaan, dan tautan media sosial. Isian kosong tidak
 * ditampilkan di landing. Selalu diakses lewat current().
 */
class LandingPengaturan extends Model
{
    protected $table = 'landing_pengaturan';

    public const KOLOM = [
        'whatsapp',
        'nama_legal',
        'info_legal',
        'alamat',
        'email',
        'telepon',
        'kebijakan_privasi_url',
        'sosmed_x',
        'sosmed_instagram',
        'sosmed_facebook',
        'sosmed_youtube',
    ];

    protected $fillable = self::KOLOM;

    public function getConnectionName(): ?string
    {
        return config('tenancy.database.central_connection');
    }

    public static function current(): self
    {
        return static::query()->firstOrCreate([]);
    }

    /** Hanya kolom konten, null diganti '' supaya frontend cukup cek truthy. */
    public function konten(): array
    {
        return collect(self::KOLOM)->mapWithKeys(fn ($k) => [$k => (string) ($this->{$k} ?? '')])->all();
    }
}
