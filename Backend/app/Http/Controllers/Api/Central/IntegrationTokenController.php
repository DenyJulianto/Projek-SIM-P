<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Central;

use App\Http\Controllers\Controller;
use App\Models\Central\IntegrationToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Kelola token untuk API Integrasi baca-saja (lihat IntegrationToken dan
 * routes/api.php grup 'integrasi/v1'). Token plaintext cuma ditampilkan
 * SEKALI saat dibuat — sesudahnya hanya hash yang tersimpan, sama seperti
 * password akun sekolah lewat SchoolAccessController::storeAdmin().
 */
class IntegrationTokenController extends Controller
{
    public const ABILITIES = ['sekolah:read', 'guru:read', 'siswa:read'];

    public function index(): JsonResponse
    {
        $tokens = IntegrationToken::orderByDesc('created_at')
            ->get(['id', 'name', 'abilities', 'created_by_name', 'last_used_at', 'created_at']);

        return response()->json($tokens);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'abilities' => ['required', 'array', 'min:1'],
            'abilities.*' => ['string', 'in:'.implode(',', self::ABILITIES)],
        ]);

        $plainToken = Str::random(40);

        $token = IntegrationToken::create([
            'name' => $data['name'],
            'token_hash' => hash('sha256', $plainToken),
            'abilities' => $data['abilities'],
            'created_by_name' => $request->user()->name,
        ]);

        return response()->json([
            'token' => $token->only(['id', 'name', 'abilities', 'created_at']),
            'plain_token' => $plainToken,
        ], 201);
    }

    public function destroy(IntegrationToken $integrationToken): JsonResponse
    {
        $integrationToken->delete();

        return response()->json(['message' => 'Token berhasil dicabut.']);
    }
}
