<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Konten landing platform (domain pusat) yang dikelola Super Admin lewat menu
 * "Kelola Landing Page": pengaturan kontak/legal/sosmed (satu baris), slide
 * hero, dan testimoni. Slide awal diisi dengan tiga slide yang sebelumnya
 * tertulis di kode supaya tampilan landing tidak berubah setelah migrasi.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('landing_pengaturan', function (Blueprint $table) {
            $table->id();
            $table->string('whatsapp', 20)->nullable();
            $table->string('nama_legal')->nullable();
            $table->string('info_legal')->nullable();
            $table->text('alamat')->nullable();
            $table->string('email')->nullable();
            $table->string('telepon', 30)->nullable();
            $table->string('kebijakan_privasi_url', 500)->nullable();
            $table->string('sosmed_x', 500)->nullable();
            $table->string('sosmed_instagram', 500)->nullable();
            $table->string('sosmed_facebook', 500)->nullable();
            $table->string('sosmed_youtube', 500)->nullable();
            $table->timestamps();
        });

        Schema::create('landing_slide', function (Blueprint $table) {
            $table->id();
            $table->string('judul_putih', 60);
            $table->string('judul_emas', 60)->nullable();
            $table->string('judul_lanjutan', 80)->nullable();
            $table->text('teks');
            $table->string('gambar')->nullable();
            $table->unsignedInteger('urutan')->default(0);
            $table->boolean('aktif')->default(true);
            $table->timestamps();
        });

        Schema::create('landing_testimoni', function (Blueprint $table) {
            $table->id();
            $table->text('kutipan');
            $table->string('nama', 100);
            $table->string('jabatan', 100)->nullable();
            $table->string('sekolah', 150)->nullable();
            $table->unsignedInteger('urutan')->default(0);
            $table->boolean('aktif')->default(true);
            $table->timestamps();
        });

        $sekarang = now();
        DB::table('landing_slide')->insert([
            [
                'judul_putih' => 'Kelola Semua', 'judul_emas' => 'Sekolah', 'judul_lanjutan' => 'Dalam Satu Platform',
                'teks' => 'SIM Pendidikan membantu Administrator mengelola data, pengguna, dan seluruh aspek manajemen pendidikan secara terpusat.',
                'urutan' => 1, 'aktif' => true, 'created_at' => $sekarang, 'updated_at' => $sekarang,
            ],
            [
                'judul_putih' => 'Data', 'judul_emas' => 'Aman', 'judul_lanjutan' => '& Terpisah per Sekolah',
                'teks' => 'Setiap sekolah memiliki database sendiri, dicadangkan berkala, dan setiap aksi tercatat di audit log.',
                'urutan' => 2, 'aktif' => true, 'created_at' => $sekarang, 'updated_at' => $sekarang,
            ],
            [
                'judul_putih' => 'Satu Akses', 'judul_emas' => 'Untuk', 'judul_lanjutan' => 'Semua Peran',
                'teks' => 'Admin, kepala sekolah, guru, siswa, dan orang tua bekerja di sistem yang sama sesuai hak aksesnya.',
                'urutan' => 3, 'aktif' => true, 'created_at' => $sekarang, 'updated_at' => $sekarang,
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('landing_testimoni');
        Schema::dropIfExists('landing_slide');
        Schema::dropIfExists('landing_pengaturan');
    }
};
