<?php

declare(strict_types=1);

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class SuratTemplateSettings extends Settings
{
    public ?string $kop_surat_text;

    public ?string $format_nomor_surat;

    public ?string $penutup_text;

    public ?string $nama_penandatangan;

    public ?string $jabatan_penandatangan;

    public static function group(): string
    {
        return 'surat_template';
    }
}
