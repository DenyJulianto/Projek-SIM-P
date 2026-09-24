<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserSertifikat extends Model
{
    protected $table = 'user_sertifikat';

    protected $fillable = ['user_id', 'nama_file', 'path'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
