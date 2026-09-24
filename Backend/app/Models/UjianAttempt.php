<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UjianAttempt extends Model
{
    protected $table = 'ujian_attempt';

    protected $fillable = ['ujian_id', 'siswa_id', 'started_at', 'finished_at', 'nilai'];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
        ];
    }

    public function ujian(): BelongsTo
    {
        return $this->belongsTo(Ujian::class);
    }

    public function siswa(): BelongsTo
    {
        return $this->belongsTo(Siswa::class);
    }

    /**
     * Hitung ulang nilai (0-100) dari bobot soal: pilihan ganda otomatis dari
     * kunci jawaban, essay dari nilai yang diberikan guru (belum dinilai = 0).
     */
    public function hitungUlangNilai(): float
    {
        $soalList = $this->ujian->soal()->get(['id', 'tipe', 'bobot', 'jawaban_benar']);
        $jawabanList = $this->jawaban()->get()->keyBy('ujian_soal_id');

        $total = 0;
        $diperoleh = 0.0;

        foreach ($soalList as $soal) {
            $total += $soal->bobot;
            $jawaban = $jawabanList->get($soal->id);

            if (! $jawaban) {
                continue;
            }

            if ($soal->tipe === UjianSoal::TIPE_ESSAY) {
                $diperoleh += min((float) ($jawaban->nilai_essay ?? 0), $soal->bobot);
            } elseif ($jawaban->jawaban_dipilih !== null && $jawaban->jawaban_dipilih === $soal->jawaban_benar) {
                $diperoleh += $soal->bobot;
            }
        }

        return $total > 0 ? round(($diperoleh / $total) * 100, 2) : 0.0;
    }

    /** Jumlah jawaban essay yang sudah diisi siswa tetapi belum diberi nilai guru. */
    public function essayBelumDinilai(): int
    {
        $essayIds = $this->ujian->soal()->where('tipe', UjianSoal::TIPE_ESSAY)->pluck('id');

        return $this->jawaban()
            ->whereIn('ujian_soal_id', $essayIds)
            ->whereNotNull('jawaban_essay')
            ->whereNull('nilai_essay')
            ->count();
    }

    public function jawaban(): HasMany
    {
        return $this->hasMany(UjianJawaban::class, 'ujian_attempt_id');
    }
}
