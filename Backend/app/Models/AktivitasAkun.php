<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Jejak aktivitas akun Super Admin (database central): login, login gagal,
 * logout, perubahan profil, dan pergantian password.
 */
class AktivitasAkun extends Model
{
    public const UPDATED_AT = null;

    protected $table = 'aktivitas_akun';

    protected $fillable = ['user_id', 'aksi', 'keterangan', 'ip_address', 'user_agent'];

    /**
     * Catat aktivitas untuk akun Super Admin di domain central. Dipanggil
     * juga dari alur login yang dipakai akun sekolah, jadi diam-diam
     * dilewati di domain sekolah atau untuk akun selain Super Admin.
     */
    public static function catat(?User $user, string $aksi, ?string $keterangan, Request $request): void
    {
        if (! $user || ! $user->is_super_admin || tenant() || ! Schema::hasTable('aktivitas_akun')) {
            return;
        }

        static::create([
            'user_id' => $user->id,
            'aksi' => $aksi,
            'keterangan' => $keterangan,
            'ip_address' => $request->ip(),
            'user_agent' => Str::limit((string) $request->userAgent(), 490, ''),
        ]);
    }
}
