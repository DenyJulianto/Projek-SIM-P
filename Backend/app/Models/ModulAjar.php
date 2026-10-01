<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ModulAjar extends Model
{
    /** Alur status: guru menyimpan draf lalu mengajukan; peninjau menyetujui atau meminta revisi. */
    public const DRAFT = 'draft';

    public const DIAJUKAN = 'diajukan';

    public const REVISI = 'revisi';

    public const DISETUJUI = 'disetujui';

    protected $table = 'modul_ajar';

    protected $fillable = [
        'guru_id', 'kurikulum', 'judul', 'mata_pelajaran', 'mata_pelajaran_id', 'kelas', 'kelas_id',
        'status', 'data', 'diajukan_at', 'ditinjau_oleh', 'ditinjau_at', 'catatan_review',
    ];

    protected function casts(): array
    {
        return [
            'data' => 'array',
            'diajukan_at' => 'datetime',
            'ditinjau_at' => 'datetime',
        ];
    }

    /** Guru hanya boleh mengubah isi selama masih draf atau diminta revisi. */
    public function bisaDiubahGuru(): bool
    {
        return in_array($this->status, [self::DRAFT, self::REVISI], true);
    }

    public function guru(): BelongsTo
    {
        return $this->belongsTo(Guru::class);
    }

    public function peninjau(): BelongsTo
    {
        return $this->belongsTo(User::class, 'ditinjau_oleh');
    }

    public function lampiran(): HasMany
    {
        return $this->hasMany(ModulAjarLampiran::class)->orderBy('id');
    }
}
