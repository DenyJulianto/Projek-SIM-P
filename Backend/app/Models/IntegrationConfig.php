<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IntegrationConfig extends Model
{
    protected $table = 'integration_configs';

    protected $fillable = ['key', 'name', 'description', 'config', 'enabled'];

    protected function casts(): array
    {
        return [
            'config' => 'encrypted:array',
            'enabled' => 'boolean',
        ];
    }
}
