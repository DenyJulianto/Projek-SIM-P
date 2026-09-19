<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaldoTransaksi extends Model
{
    protected $table = 'saldo_transaksi';

    protected $fillable = ['siswa_id', 'diisi_oleh', 'jenis', 'jumlah', 'saldo_setelah', 'keterangan'];

    protected function casts(): array
    {
        return [
            'jumlah' => 'decimal:2',
            'saldo_setelah' => 'decimal:2',
        ];
    }

    public function siswa(): BelongsTo
    {
        return $this->belongsTo(Siswa::class);
    }

    public function diisiOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'diisi_oleh');
    }
}
