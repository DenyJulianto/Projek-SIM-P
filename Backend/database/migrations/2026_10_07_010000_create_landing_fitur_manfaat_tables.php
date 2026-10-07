<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Bagian "Fitur Unggulan" dan "Manfaat untuk Setiap Pengguna" di landing
 * platform, dikelola Super Admin lewat Kelola Landing Page. Diisi dengan isi
 * yang sebelumnya tertulis di kode supaya tampilan landing tidak berubah.
 *
 * - landing_fitur.ilustrasi: gambar bawaan kartu (foto|pengguna|tabel|grafik),
 *   dipakai bila tidak ada gambar unggahan.
 * - landing_manfaat.gambar_bawaan: tangkapan layar bawaan aplikasi
 *   (guru|siswa|orangtua|admin), dipakai bila tidak ada gambar unggahan.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('landing_fitur', function (Blueprint $table) {
            $table->id();
            $table->string('judul', 80);
            $table->string('deskripsi', 300);
            $table->string('label', 30)->nullable();
            $table->json('meta')->nullable();
            $table->string('ilustrasi', 20)->default('foto');
            $table->string('gambar')->nullable();
            $table->unsignedInteger('urutan')->default(0);
            $table->boolean('aktif')->default(true);
            $table->timestamps();
        });

        Schema::create('landing_manfaat', function (Blueprint $table) {
            $table->id();
            $table->string('peran', 40);
            $table->string('judul', 100);
            $table->string('teks', 400);
            $table->json('poin')->nullable();
            $table->string('gambar_bawaan', 20)->nullable();
            $table->string('gambar')->nullable();
            $table->unsignedInteger('urutan')->default(0);
            $table->boolean('aktif')->default(true);
            $table->timestamps();
        });

        $t = now();
        $fitur = [
            ['Manajemen Sekolah', 'Daftarkan sekolah negeri & swasta, kelola profil, modul, dan status tiap sekolah dari satu tempat.', 'Inti', ['Multi-sekolah', 'Negeri & swasta'], 'foto'],
            ['Pengguna & Hak Akses', 'Atur akun, peran, dan hak akses seluruh pengguna sekolah secara fleksibel dan aman.', 'Keamanan', ['Peran & izin', 'Semua pengguna'], 'pengguna'],
            ['Data & Backup', 'Data tiap sekolah tersimpan terpisah, dicadangkan berkala, dan siap dipulihkan kapan saja.', 'Data', ['Database per sekolah', 'Backup otomatis'], 'tabel'],
            ['Monitoring & Laporan', 'Pantau perkembangan seluruh sekolah dan telusuri setiap aksi lewat audit log yang lengkap.', 'Laporan', ['Laporan', 'Audit log'], 'grafik'],
        ];
        DB::table('landing_fitur')->insert(array_map(fn ($f, $i) => [
            'judul' => $f[0], 'deskripsi' => $f[1], 'label' => $f[2], 'meta' => json_encode($f[3]), 'ilustrasi' => $f[4],
            'urutan' => $i + 1, 'aktif' => true, 'created_at' => $t, 'updated_at' => $t,
        ], $fitur, array_keys($fitur)));

        $manfaat = [
            ['Guru', 'Absensi Digital untuk Guru', 'Catat kehadiran siswa per kelas dalam beberapa klik, lalu kelola nilai, tugas, dan ujian online dari satu dasbor.',
                ['Status hadir, izin, sakit, dan alfa', 'Input nilai, tugas & ujian online', 'Perangkat ajar dan jadwal mengajar'], 'guru'],
            ['Siswa', 'Ujian & Rapor Online untuk Siswa', 'Siswa mengerjakan ujian dalam mode aman, langsung melihat hasilnya, dan mengunduh e-rapor dalam format PDF.',
                ['Ujian online dengan mode aman', 'Hasil & nilai ujian langsung terlihat', 'E-rapor, jadwal, materi, dan tugas'], 'siswa'],
            ['Orang Tua', 'Pantau Nilai & Kehadiran Anak', 'Orang tua memantau perkembangan anak: nilai, kehadiran, tagihan, dan pengumuman sekolah dalam satu tempat.',
                ['Ringkasan nilai & tren perkembangan', 'Kehadiran mingguan anak', 'Tagihan, saldo, dan notifikasi sekolah'], 'orangtua'],
            ['Admin Sekolah', 'Kendali Penuh untuk Admin Sekolah', 'Admin mengelola pengguna, menyetujui pendaftaran, memantau aktivitas sistem, dan menjaga data tetap aman.',
                ['Kelola pengguna & konfirmasi pendaftaran', 'Data siswa, guru, dan kelas', 'Backup data & audit log'], 'admin'],
        ];
        DB::table('landing_manfaat')->insert(array_map(fn ($m, $i) => [
            'peran' => $m[0], 'judul' => $m[1], 'teks' => $m[2], 'poin' => json_encode($m[3]), 'gambar_bawaan' => $m[4],
            'urutan' => $i + 1, 'aktif' => true, 'created_at' => $t, 'updated_at' => $t,
        ], $manfaat, array_keys($manfaat)));
    }

    public function down(): void
    {
        Schema::dropIfExists('landing_manfaat');
        Schema::dropIfExists('landing_fitur');
    }
};
