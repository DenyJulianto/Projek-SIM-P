<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PendaftaranPegawai extends Model
{
    public const JENIS = ['Guru', 'Tenaga Kependidikan'];

    public const STATUS_KEPEGAWAIAN = ['PNS', 'PPPK', 'GTY-PTY', 'Honorer'];

    /** Status yang wajib mengisi NIP. */
    public const WAJIB_NIP = ['PNS', 'PPPK'];

    /** Jabatan/tugas yang bisa diajukan, dikelompokkan untuk dropdown. */
    public const JABATAN = [
        'Pimpinan Sekolah' => [
            'Kepala Sekolah',
            'Wakasek Kurikulum',
            'Wakasek Kesiswaan',
        ],
        'Pendidik dan Penunjang Akademik' => [
            'Guru',
            'Guru Bimbingan Konseling (BK)',
            'Wali Kelas',
        ],
        'Tenaga Kependidikan (Tendik)' => [
            'Kepala Tata Usaha (TU)',
            'Staf Administrasi / Pelaksana',
        ],
    ];

    /** @return array<int, string> */
    public static function daftarJabatan(): array
    {
        return array_merge(...array_values(self::JABATAN));
    }

    protected $table = 'pendaftaran_pegawai';

    protected $fillable = [
        'nama_lengkap', 'jenis_pegawai', 'status_kepegawaian', 'nip', 'nuptk', 'nik', 'nik_hash',
        'email', 'no_hp', 'jabatan', 'mata_pelajaran', 'catatan', 'status', 'alasan_penolakan',
        'diproses_oleh', 'diproses_at', 'user_id', 'ip_address',
    ];

    protected $hidden = ['nik_hash'];

    protected function casts(): array
    {
        return [
            'nik' => 'encrypted',
            'diproses_at' => 'datetime',
        ];
    }

    public static function hashNik(string $nik): string
    {
        return hash_hmac('sha256', $nik, (string) config('app.key'));
    }

    public function pemroses(): BelongsTo
    {
        return $this->belongsTo(User::class, 'diproses_oleh');
    }
}
