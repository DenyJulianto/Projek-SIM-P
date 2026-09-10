<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AvatarController extends Controller
{
    /**
     * Sajikan file avatar dari disk 'public' tenant. Tidak lewat symlink
     * `public/storage` bawaan Laravel karena tiap tenant punya direktori
     * storage sendiri (lihat FilesystemTenancyBootstrapper).
     */
    public function show(string $path): StreamedResponse|Response
    {
        if (! Storage::disk('public')->exists($path)) {
            abort(404);
        }

        return Storage::disk('public')->response($path);
    }
}
