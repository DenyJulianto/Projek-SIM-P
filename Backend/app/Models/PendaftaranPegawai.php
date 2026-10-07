<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PendaftaranPegawai extends Model
{
    public const PENDIDIK = 'Pendidik';

    public const TENDIK = 'Tenaga Kependidikan';

    /** Jenis pegawai => label di form. */
    public const JENIS = [
        self::PENDIDIK => 'Pendidik (Guru)',
        self::TENDIK => 'Tenaga Kependidikan (Tendik/Staf)',
    ];

    /** Status kepegawaian per jenis sekolah => keterangan. */
    public const STATUS_KEPEGAWAIAN = [
        'negeri' => [
            'PNS' => 'Pegawai Negeri Sipil',
            'PPPK' => 'Pegawai Pemerintah dengan Perjanjian Kerja',
            'Honorer / GTT & PTT' => 'Guru/Pegawai Tidak Tetap',
        ],
        'swasta' => [
            'GTY & PTY' => 'Guru/Pegawai Tetap Yayasan',
            'GTTY / Kontrak' => 'Guru Tidak Tetap Yayasan',
            'ASN DPK' => 'PNS/PPPK yang diperbantukan oleh pemerintah',
        ],
    ];

    /** Status yang wajib mengisi NIP (ASN DPK juga PNS/PPPK). */
    public const WAJIB_NIP = ['PNS', 'PPPK', 'ASN DPK'];

    public const KELOMPOK_MANAJERIAL = 'Jabatan Manajerial';

    public const KELOMPOK_PENDIDIK = 'Jabatan Pendidik';

    public const KELOMPOK_TENDIK = 'Jabatan Tenaga Kependidikan';

    /** Jabatan per jenis sekolah, dikelompokkan untuk dropdown. */
    public const JABATAN = [
        'negeri' => [
            self::KELOMPOK_MANAJERIAL => [
                'Kepala Sekolah',
                'Wakil Kepala Sekolah Bidang Kurikulum',
                'Wakil Kepala Sekolah Bidang Kesiswaan',
                'Wakil Kepala Sekolah Bidang Sarpras',
                'Wakil Kepala Sekolah Bidang Humas',
            ],
            self::KELOMPOK_PENDIDIK => [
                'Guru Kelas (TK/SD)',
                'Guru Mata Pelajaran (SMP/SMA/SMK)',
                'Guru Bimbingan Konseling (BK)',
            ],
            self::KELOMPOK_TENDIK => [
                'Kepala Tata Usaha (TU)',
                'Staf Administrasi & Keuangan',
                'Pustakawan',
                'Laboran',
                'Penjaga Sekolah / Kebersihan',
            ],
        ],
        'swasta' => [
            self::KELOMPOK_MANAJERIAL => [
                'Pembina / Pengurus Yayasan',
                'Kepala Sekolah',
                'Wakil Kepala Sekolah',
            ],
            self::KELOMPOK_PENDIDIK => [
                'Guru Kelas',
                'Guru Mata Pelajaran',
                'Guru Ekstrakurikuler',
                'Guru Pendamping Khusus',
            ],
            self::KELOMPOK_TENDIK => [
                'Kepala Tata Usaha (TU)',
                'Staf Administrasi & Bendahara Yayasan',
                'Pustakawan',
                'Laboran',
                'Tim Layanan Umum (Keamanan, Kebersihan, Driver)',
            ],
        ],
    ];

    /** Kelompok jabatan yang boleh dipilih tiap jenis pegawai. */
    public const KELOMPOK_PER_JENIS = [
        self::PENDIDIK => [self::KELOMPOK_MANAJERIAL, self::KELOMPOK_PENDIDIK],
        self::TENDIK => [self::KELOMPOK_TENDIK],
    ];

    /**
     * Jenis sekolah dari data sekolah ('negeri' / 'swasta', diisi Super Admin
     * saat mendaftarkan sekolah), atau null bila belum diisi — pendaftaran
     * pegawai lalu belum bisa dilakukan karena pilihannya bergantung pada ini.
     */
    public static function jenisSekolah(): ?string
    {
        $status = mb_strtolower((string) (tenant('status_sekolah') ?? ''));

        return in_array($status, ['negeri', 'swasta'], true) ? $status : null;
    }

    /** @return array<string, string> status => keterangan (kosong bila jenis sekolah belum diisi) */
    public static function statusUntuk(?string $jenisSekolah): array
    {
        return $jenisSekolah ? self::STATUS_KEPEGAWAIAN[$jenisSekolah] : [];
    }

    /** @return array<int, string> */
    public static function daftarStatus(?string $jenisSekolah): array
    {
        return array_keys(self::statusUntuk($jenisSekolah));
    }

    /**
     * Jabatan untuk satu jenis pegawai di sekolah negeri/swasta, dikelompokkan.
     * Kosong bila jenis sekolah belum diisi.
     *
     * @return array<string, array<int, string>>
     */
    public static function jabatanUntuk(?string $jenisSekolah, string $jenisPegawai): array
    {
        if (! $jenisSekolah) {
            return [];
        }

        $hasil = [];
        foreach (self::KELOMPOK_PER_JENIS[$jenisPegawai] ?? [] as $kelompok) {
            $hasil[$kelompok] = self::JABATAN[$jenisSekolah][$kelompok];
        }

        return $hasil;
    }

    /** @return array<int, string> */
    public static function daftarJabatan(?string $jenisSekolah, string $jenisPegawai): array
    {
        $kelompok = self::jabatanUntuk($jenisSekolah, $jenisPegawai);

        return $kelompok ? array_merge(...array_values($kelompok)) : [];
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
