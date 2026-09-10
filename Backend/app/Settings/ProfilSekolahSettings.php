<?php

declare(strict_types=1);

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class ProfilSekolahSettings extends Settings
{
    public ?string $sambutan_kepala_sekolah;

    public ?string $visi;

    public ?string $misi;

    public ?string $hero_image;

    public ?string $auth_background;

    public ?string $facebook;

    public ?string $instagram;

    public ?string $youtube;

    public static function group(): string
    {
        return 'profil_sekolah';
    }
}
