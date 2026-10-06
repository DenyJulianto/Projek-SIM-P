<?php

declare(strict_types=1);

namespace App\Models\Concerns;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;

/**
 * Menyalin nomor induk (NIP guru / NISN siswa) ke users.username akun yang
 * tertaut, supaya bisa dipakai untuk login. Model pemakai mendefinisikan
 * konstanta KOLOM_USERNAME berisi nama kolom nomor induknya.
 */
trait SinkronUsernameLogin
{
    public static function bootSinkronUsernameLogin(): void
    {
        static::saved(function (Model $model) {
            $kolom = static::KOLOM_USERNAME;

            if (! $model->wasChanged([$kolom, 'user_id']) && ! $model->wasRecentlyCreated) {
                return;
            }

            if (! $model->getConnection()->getSchemaBuilder()->hasColumn('users', 'username')) {
                return;
            }

            $lamaUserId = $model->getOriginal('user_id');
            $lamaNomor = trim((string) $model->getOriginal($kolom));
            $baruNomor = trim((string) $model->{$kolom});

            // Akun lama yang dilepas dari profil ini kehilangan username-nya.
            if ($model->wasChanged('user_id') && $lamaUserId && $lamaNomor !== '') {
                User::whereKey($lamaUserId)->where('username', $lamaNomor)->update(['username' => null]);
            }

            if (! $model->user_id) {
                return;
            }

            $username = $baruNomor === '' ? null : $baruNomor;

            if ($username !== null && User::where('username', $username)->whereKeyNot($model->user_id)->exists()) {
                Log::warning('Username login tidak disetel karena sudah dipakai akun lain.', [
                    'model' => static::class,
                    'id' => $model->getKey(),
                    'username' => $username,
                ]);

                return;
            }

            User::whereKey($model->user_id)->update(['username' => $username]);
        });
    }
}
