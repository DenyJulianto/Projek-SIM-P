<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
<<<<<<< HEAD
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
=======
>>>>>>> 036bf153b2c0c589dda724a12f6959d2a5c711c1

#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
<<<<<<< HEAD
    use HasApiTokens, HasFactory, HasRoles, Notifiable;
=======
    use HasFactory, Notifiable;
>>>>>>> 036bf153b2c0c589dda724a12f6959d2a5c711c1

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
<<<<<<< HEAD
            'is_super_admin' => 'boolean',
=======
>>>>>>> 036bf153b2c0c589dda724a12f6959d2a5c711c1
        ];
    }
}
