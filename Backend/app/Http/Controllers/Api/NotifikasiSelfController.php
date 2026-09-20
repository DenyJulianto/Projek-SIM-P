<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Notifikasi dalam aplikasi milik pengguna yang sedang login. */
class NotifikasiSelfController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'belum_dibaca' => $user->unreadNotifications()->count(),
            'data' => $user->notifications()->latest()->limit(20)->get()->map(fn ($n) => [
                'id' => $n->id,
                'judul' => $n->data['judul'] ?? '',
                'pesan' => $n->data['pesan'] ?? '',
                'dibaca' => $n->read_at !== null,
                'created_at' => $n->created_at,
            ]),
        ]);
    }

    public function baca(Request $request, string $id): JsonResponse
    {
        $request->user()->notifications()->whereKey($id)->firstOrFail()->markAsRead();

        return response()->json(['message' => 'Ditandai sudah dibaca.']);
    }

    public function bacaSemua(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json(['message' => 'Semua notifikasi ditandai sudah dibaca.']);
    }
}
