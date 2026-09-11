<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\IntegrationConfig;
use Illuminate\Database\Seeder;

class IntegrationConfigSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            [
                'key' => 'smtp_email',
                'name' => 'Email (SMTP)',
                'description' => 'Kirim notifikasi lewat email menggunakan server SMTP Anda sendiri.',
            ],
            [
                'key' => 'whatsapp_notifikasi',
                'name' => 'Notifikasi WhatsApp',
                'description' => 'Kirim notifikasi lewat WhatsApp lewat penyedia API pihak ketiga.',
            ],
            [
                'key' => 'payment_gateway',
                'name' => 'Payment Gateway',
                'description' => 'Terima pembayaran tagihan/SPP secara online.',
            ],
        ];

        foreach ($defaults as $item) {
            IntegrationConfig::firstOrCreate(['key' => $item['key']], $item);
        }
    }
}
