<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notifikasi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Notifikasi milik user yang sedang login. Hanya butuh auth:sanctum —
 * setiap query dibatasi ke user_id milik sendiri.
 */
class NotifikasiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        return response()->json([
            'belum_dibaca' => Notifikasi::where('user_id', $userId)->whereNull('dibaca_at')->count(),
            'data' => Notifikasi::where('user_id', $userId)->latest('updated_at')->limit(100)->get(),
        ]);
    }

    public function baca(Request $request, Notifikasi $notifikasi): JsonResponse
    {
        abort_unless($notifikasi->user_id === $request->user()->id, 404);

        $notifikasi->update(['dibaca_at' => $notifikasi->dibaca_at ?? now()]);

        return response()->json($notifikasi);
    }

    public function bacaSemua(Request $request): JsonResponse
    {
        Notifikasi::where('user_id', $request->user()->id)->whereNull('dibaca_at')->update(['dibaca_at' => now()]);

        return response()->json(['message' => 'Semua notifikasi ditandai sudah dibaca.']);
    }
}
