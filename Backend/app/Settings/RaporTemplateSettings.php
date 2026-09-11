<?php

declare(strict_types=1);

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class RaporTemplateSettings extends Settings
{
    public string $header_text;

    public bool $tampilkan_logo;

    public ?string $catatan_kaki;

    public ?string $nama_penandatangan;

    public ?string $jabatan_penandatangan;

    public static function group(): string
    {
        return 'rapor_template';
    }
}
