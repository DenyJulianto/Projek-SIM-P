<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

#[Fillable(['name', 'email', 'password'])]
#[Hidden([
    'password', 'remember_token', 'verification_code', 'verification_code_expires_at',
    'email_verification_token', 'email_verification_expires_at',
    'password_reset_code', 'password_reset_code_expires_at', 'temporary_password',
    'password_reset_token', 'password_reset_expires_at', 'invitation_token',
    'two_factor_secret', 'two_factor_recovery_codes',
])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, Notifiable;

    /**
     * Diisi App\Support\PeranAktif per request. Sengaja properti PHP biasa
     * (bukan atribut Eloquent) supaya tidak ikut tersimpan saat save().
     *
     * @var array<int, string>|null
     */
    public ?array $peranTersedia = null;

    public ?string $peranDipilih = null;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'verification_code_expires_at' => 'datetime',
            'email_verification_expires_at' => 'datetime',
            'password_reset_code_expires_at' => 'datetime',
            'password_reset_expires_at' => 'datetime',
            'invitation_expires_at' => 'datetime',
            'password' => 'hashed',
            'is_super_admin' => 'boolean',
            'is_active' => 'boolean',
            'must_change_password' => 'boolean',
            'last_login_at' => 'datetime',
            'two_factor_secret' => 'encrypted',
            'temporary_password' => 'encrypted',
            'two_factor_recovery_codes' => 'encrypted:array',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        // Password sementara hanya berlaku sampai password diganti lewat
        // jalur lain (profil, lupa password, reset oleh admin sekolah).
        static::saving(function (User $user) {
            if (! $user->isDirty('password')) {
                return;
            }

            $schema = $user->getConnection()->getSchemaBuilder();

            if (! $user->isDirty('temporary_password') && $schema->hasColumn('users', 'temporary_password')) {
                $user->temporary_password = null;
            }

            // Password yang diganti pemiliknya sendiri menghapus kewajiban
            // ganti password. Jalur admin (buat akun / reset) menyetel
            // must_change_password = true di penyimpanan yang sama.
            if (! $user->isDirty('must_change_password') && $schema->hasColumn('users', 'must_change_password')) {
                $user->must_change_password = false;
            }
        });
    }

    public function sertifikat(): HasMany
    {
        return $this->hasMany(UserSertifikat::class);
    }

    public function guru(): HasOne
    {
        return $this->hasOne(Guru::class);
    }

    public function siswa(): HasOne
    {
        return $this->hasOne(Siswa::class);
    }

    public function anak(): BelongsToMany
    {
        return $this->belongsToMany(Siswa::class, 'wali_siswa')
            ->withPivot('hubungan')
            ->withTimestamps();
    }
}
