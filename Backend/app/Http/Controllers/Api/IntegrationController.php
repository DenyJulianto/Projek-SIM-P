<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\IntegrationConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class IntegrationController extends Controller
{
    /**
     * Field per key yang dianggap rahasia — tidak dikirim balik ke
     * frontend, hanya ditandai sudah diisi atau belum lewat `*_is_set`.
     */
    private const SECRET_FIELDS = [
        'smtp_email' => ['password'],
        'whatsapp_notifikasi' => ['api_key'],
        'payment_gateway' => ['api_key'],
    ];

    public function index(): JsonResponse
    {
        $configs = IntegrationConfig::orderBy('name')->get();

        return response()->json($configs->map(fn (IntegrationConfig $c) => $this->present($c)));
    }

    public function update(Request $request, string $key): JsonResponse
    {
        $integration = IntegrationConfig::where('key', $key)->firstOrFail();

        $data = $request->validate([
            'config' => ['array'],
            'enabled' => ['boolean'],
        ]);

        $config = $integration->config ?? [];
        $secretFields = self::SECRET_FIELDS[$key] ?? [];

        foreach ($data['config'] ?? [] as $field => $value) {
            if (in_array($field, $secretFields, true) && $value === '') {
                continue; // kosong = tidak diubah, pertahankan nilai lama
            }
            $config[$field] = $value;
        }

        $integration->config = $config;
        if (array_key_exists('enabled', $data)) {
            $integration->enabled = $data['enabled'];
        }
        $integration->save();

        activity()
            ->causedBy($request->user())
            ->useLog('integrasi')
            ->log("Memperbarui pengaturan integrasi \"{$integration->name}\".");

        return response()->json($this->present($integration->fresh()));
    }

    /**
     * Kirim email percobaan lewat konfigurasi SMTP yang tersimpan, untuk
     * memverifikasi kredensial benar-benar bisa mengirim (bukan cuma
     * tersimpan). Mengembalikan pesan sukses/gagal apa adanya dari SMTP.
     */
    public function testEmail(Request $request): JsonResponse
    {
        $data = $request->validate([
            'to' => ['required', 'email'],
        ]);

        $integration = IntegrationConfig::where('key', 'smtp_email')->firstOrFail();
        $config = $integration->config ?? [];

        foreach (['host', 'port', 'username', 'password', 'from_address'] as $field) {
            if (empty($config[$field])) {
                throw ValidationException::withMessages([
                    'config' => ["Lengkapi pengaturan SMTP ({$field}) sebelum mengirim email uji."],
                ]);
            }
        }

        config([
            'mail.mailers.smtp.host' => $config['host'],
            'mail.mailers.smtp.port' => $config['port'],
            'mail.mailers.smtp.username' => $config['username'],
            'mail.mailers.smtp.password' => $config['password'],
            'mail.mailers.smtp.encryption' => $config['encryption'] ?? 'tls',
            'mail.from.address' => $config['from_address'],
            'mail.from.name' => $config['from_name'] ?? config('app.name'),
        ]);

        try {
            Mail::mailer('smtp')->raw(
                'Ini adalah email uji coba dari SIM Pendidikan untuk memverifikasi konfigurasi SMTP.',
                fn ($message) => $message->to($data['to'])->subject('Uji Coba Integrasi Email')
            );
        } catch (\Throwable $e) {
            throw ValidationException::withMessages([
                'config' => ['Gagal mengirim email: '.$e->getMessage()],
            ]);
        }

        activity()
            ->causedBy($request->user())
            ->useLog('integrasi')
            ->log("Mengirim email uji integrasi SMTP ke \"{$data['to']}\".");

        return response()->json(['message' => 'Email uji berhasil dikirim.']);
    }

    private function present(IntegrationConfig $integration): array
    {
        $config = $integration->config ?? [];
        $secretFields = self::SECRET_FIELDS[$integration->key] ?? [];
        $setFlags = [];

        foreach ($secretFields as $field) {
            $setFlags["{$field}_is_set"] = ! empty($config[$field]);
            unset($config[$field]);
        }

        return [
            'key' => $integration->key,
            'name' => $integration->name,
            'description' => $integration->description,
            'enabled' => $integration->enabled,
            'config' => $config,
            ...$setFlags,
            'status' => $this->computeStatus($integration),
        ];
    }

    private function computeStatus(IntegrationConfig $integration): string
    {
        if (! $integration->enabled) {
            return 'nonaktif';
        }

        $config = $integration->config ?? [];
        $required = match ($integration->key) {
            'smtp_email' => ['host', 'port', 'username', 'password', 'from_address'],
            'whatsapp_notifikasi' => ['api_key', 'sender_number'],
            'payment_gateway' => ['merchant_id', 'api_key'],
            default => [],
        };

        foreach ($required as $field) {
            if (empty($config[$field])) {
                return 'belum-lengkap';
            }
        }

        return 'terkonfigurasi';
    }
}
