<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Mail\UndanganStafMail;
use App\Models\Kelas;
use App\Models\Sekolah;
use App\Models\Siswa;
use App\Models\User;
use App\Support\UndanganStaf;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Testing\TestResponse;
use PragmaRX\Google2FA\Google2FA;
use RuntimeException;
use Tests\Feature\Support\BuatKelasDariAntrean;
use Tests\TestCase;

/**
 * Isolasi antar sekolah. Tiap sekolah punya database sendiri (Stancl
 * Tenancy), jadi yang diuji adalah: akun, token, data, file, antrean,
 * penguncian login, challenge 2FA, dan link undangan dari satu sekolah
 * tidak pernah berlaku atau terlihat di sekolah lain.
 *
 * Dua sekolah sungguhan dibuat sekali per kelas uji (migrasi penuh), di atas
 * database central khusus uji (file), lalu dihapus di akhir.
 */
class IsolasiSekolahTest extends TestCase
{
    private const A = 'isolasi-a';

    private const B = 'isolasi-b';

    private const PASS_A = 'SekolahA!2026x';

    private const PASS_B = 'SekolahB!2026y';

    private static bool $siap = false;

    public function createApplication()
    {
        self::pakaiCentralUji();

        return parent::createApplication();
    }

    protected function setUp(): void
    {
        parent::setUp();

        config(['sim.keamanan.wajib_2fa_admin' => false]);

        if (! self::$siap) {
            $this->siapkanSekolah();
            self::$siap = true;
        }
    }

    public static function tearDownAfterClass(): void
    {
        if (self::$siap) {
            self::pakaiCentralUji();
            $app = require __DIR__.'/../../bootstrap/app.php';
            $app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
            self::hapusSekolahUji();
            self::$siap = false;
            // Windows tidak bisa menghapus file SQLite yang masih terbuka.
            foreach (array_keys(\Illuminate\Support\Facades\DB::getConnections()) as $nama) {
                \Illuminate\Support\Facades\DB::disconnect($nama);
            }
            gc_collect_cycles();
        }

        @unlink(self::fileCentralUji());
        foreach (['DB_DATABASE' => ':memory:'] as $k => $v) {
            putenv("{$k}={$v}");
            $_ENV[$k] = $_SERVER[$k] = $v;
        }

        parent::tearDownAfterClass();
    }

    public function test_akun_yang_hanya_ada_di_sekolah_a_tidak_bisa_login_di_sekolah_b(): void
    {
        $this->api(self::A, 'POST', '/login', ['login' => 'hanya-a@uji.test', 'password' => self::PASS_A])->assertOk();
        $this->api(self::B, 'POST', '/login', ['login' => 'hanya-a@uji.test', 'password' => self::PASS_A])->assertStatus(422);
    }

    public function test_email_sama_di_dua_sekolah_adalah_akun_yang_terpisah(): void
    {
        $this->api(self::B, 'POST', '/login', ['login' => 'sama@uji.test', 'password' => self::PASS_A])->assertStatus(422);
        $this->api(self::A, 'POST', '/login', ['login' => 'sama@uji.test', 'password' => self::PASS_B])->assertStatus(422);

        $this->api(self::A, 'GET', '/me', token: $this->token(self::A, 'sama@uji.test', self::PASS_A))
            ->assertOk()->assertJsonPath('name', 'Sama di Sekolah A');
        $this->api(self::B, 'GET', '/me', token: $this->token(self::B, 'sama@uji.test', self::PASS_B))
            ->assertOk()->assertJsonPath('name', 'Sama di Sekolah B');
    }

    public function test_token_sekolah_a_ditolak_di_sekolah_b_walau_id_tokennya_sama(): void
    {
        $tokenA = $this->token(self::A, 'sama@uji.test', self::PASS_A);
        $idTokenA = (int) explode('|', $tokenA)[0];

        // Pastikan sekolah B punya token dengan id yang sama persis.
        $this->diSekolah(self::B, function () use ($idTokenA) {
            $user = User::where('email', 'sama@uji.test')->first();
            while ((int) $user->tokens()->max('id') < $idTokenA) {
                $user->createToken('pengisi');
            }
        });

        $this->api(self::B, 'GET', '/me', token: $tokenA)->assertUnauthorized();
        $this->api(self::A, 'GET', '/me', token: $tokenA)->assertOk();
    }

    public function test_data_sekolah_a_tidak_terlihat_dari_sekolah_b(): void
    {
        $tokenA = $this->token(self::A, 'admin@uji.test', self::PASS_A);
        $tokenB = $this->token(self::B, 'admin@uji.test', self::PASS_B);

        $this->api(self::A, 'GET', '/siswa?per_page=100', token: $tokenA)->assertOk()->assertSee('Siswa Rahasia A');
        $this->api(self::B, 'GET', '/siswa?per_page=100', token: $tokenB)->assertOk()->assertDontSee('Siswa Rahasia A');

        $idSiswaA = $this->diSekolah(self::A, fn () => Siswa::where('nama', 'Siswa Rahasia A')->value('id'));
        $this->api(self::B, 'GET', "/siswa/{$idSiswaA}", token: $tokenB)->assertDontSee('Siswa Rahasia A');

        $this->assertSame(0, $this->diSekolah(self::B, fn () => Siswa::where('nama', 'Siswa Rahasia A')->count()));
    }

    public function test_penguncian_login_di_sekolah_a_tidak_mengunci_akun_di_sekolah_b(): void
    {
        for ($i = 0; $i < config('sim.keamanan.login_maks_gagal'); $i++) {
            $this->api(self::A, 'POST', '/login', ['login' => 'sama@uji.test', 'password' => 'salah']);
        }

        $this->api(self::A, 'POST', '/login', ['login' => 'sama@uji.test', 'password' => self::PASS_A])->assertStatus(429);
        $this->api(self::B, 'POST', '/login', ['login' => 'sama@uji.test', 'password' => self::PASS_B])->assertOk();
    }

    public function test_challenge_2fa_sekolah_a_tidak_berlaku_di_sekolah_b(): void
    {
        $secret = (new Google2FA())->generateSecretKey();
        $this->diSekolah(self::A, fn () => User::where('email', 'admin@uji.test')->first()
            ->forceFill(['two_factor_secret' => $secret, 'two_factor_confirmed_at' => now()])->save());

        try {
            $challenge = $this->api(self::A, 'POST', '/login', ['login' => 'admin@uji.test', 'password' => self::PASS_A])
                ->assertOk()->assertJsonPath('requires_2fa', true)->json('challenge');
            $kode = (new Google2FA())->getCurrentOtp($secret);

            $this->api(self::B, 'POST', '/2fa/verify', ['challenge' => $challenge, 'code' => $kode])->assertStatus(422);
            $this->api(self::A, 'POST', '/2fa/verify', ['challenge' => $challenge, 'code' => $kode])->assertOk();
        } finally {
            $this->diSekolah(self::A, fn () => User::where('email', 'admin@uji.test')->first()
                ->forceFill(['two_factor_secret' => null, 'two_factor_confirmed_at' => null])->save());
        }
    }

    public function test_link_undangan_sekolah_a_tidak_berlaku_di_sekolah_b(): void
    {
        Mail::fake();

        $idUndangan = $this->diSekolah(self::A, function () {
            $user = User::create(['name' => 'Staf Diundang', 'email' => 'diundang@uji.test', 'password' => 'x'.uniqid()]);
            UndanganStaf::kirim($user);

            return $user->id;
        });

        // Sekolah B punya akun dengan id yang sama, supaya penolakan bukan sekadar "user tidak ada".
        $this->diSekolah(self::B, function () use ($idUndangan) {
            while ((int) User::max('id') < $idUndangan) {
                User::create(['name' => 'Pengisi', 'email' => uniqid('pengisi').'@uji.test', 'password' => 'x'.uniqid()]);
            }
        });

        $url = null;
        Mail::assertSent(UndanganStafMail::class, function (UndanganStafMail $mail) use (&$url) {
            $url = $mail->url;

            return true;
        });
        $query = preg_replace('/^.*\?u=\d+&/', '', $url);

        $this->api(self::B, 'GET', "/undangan/{$idUndangan}?{$query}")->assertStatus(422);
        $this->api(self::A, 'GET', "/undangan/{$idUndangan}?{$query}")->assertOk()->assertJsonPath('email', 'diundang@uji.test');
    }

    public function test_file_tersimpan_terpisah_per_sekolah(): void
    {
        $pathA = $this->diSekolah(self::A, function () {
            Storage::disk('local')->put('isolasi/rahasia.txt', 'milik sekolah A');

            return Storage::disk('local')->path('isolasi/rahasia.txt');
        });

        $this->diSekolah(self::B, function () use ($pathA) {
            $this->assertFalse(Storage::disk('local')->exists('isolasi/rahasia.txt'));
            $this->assertNotSame($pathA, Storage::disk('local')->path('isolasi/rahasia.txt'));
        });
    }

    public function test_job_antrean_berjalan_di_database_sekolah_pengirimnya(): void
    {
        config(['queue.default' => 'database']);

        // Blok fungsi (bukan arrow fn): PendingDispatch baru benar-benar
        // dikirim saat dihancurkan, jadi harus terjadi di dalam konteks sekolah.
        $this->diSekolah(self::A, function () {
            BuatKelasDariAntrean::dispatch()->onConnection('database');
        });

        Artisan::call('queue:work', ['connection' => 'database', '--once' => true, '--stop-when-empty' => true]);
        tenancy()->end();

        $this->assertSame(1, $this->diSekolah(self::A, fn () => Kelas::where('nama_kelas', 'Kelas Dari Antrean')->count()));
        $this->assertSame(0, $this->diSekolah(self::B, fn () => Kelas::where('nama_kelas', 'Kelas Dari Antrean')->count()));
    }

    public function test_token_sekolah_tidak_berlaku_di_domain_central_dan_sebaliknya(): void
    {
        $tokenA = $this->token(self::A, 'sama@uji.test', self::PASS_A);

        // Route sekolah tidak dilayani di domain central.
        $this->api('central', 'GET', '/me', token: $tokenA)->assertNotFound();
        // Route central (Super Admin) memakai database central: token sekolah tidak dikenal.
        $this->api(self::A, 'GET', '/api/me', token: $tokenA)->assertUnauthorized();
    }

    /**
     * Kode yang berjalan di konteks sekolah tidak boleh memilih koneksi
     * database sendiri atau memakai cache bersama — keduanya bisa membaca
     * data sekolah lain. Kode central (Super Admin) memang lintas sekolah.
     */
    public function test_kode_sekolah_tidak_memakai_koneksi_atau_cache_bersama(): void
    {
        $polaTerlarang = '/DB::connection\(|protected \$connection|CentralConnection|Cache::|\bcache\(/';
        $normal = fn (string $p) => str_replace('\\', '/', $p);
        $dikecualikan = [$normal(app_path('Http/Controllers/Api/Central')).'/'];

        $pelanggaran = [];
        foreach (File::allFiles(app_path()) as $file) {
            $path = $file->getPathname();
            if (collect($dikecualikan)->contains(fn ($d) => str_starts_with($normal($path), $d))) {
                continue;
            }
            foreach (preg_split('/\R/', $file->getContents()) as $no => $baris) {
                if (preg_match($polaTerlarang, $baris)) {
                    $pelanggaran[] = str_replace(base_path().DIRECTORY_SEPARATOR, '', $path).':'.($no + 1).'  '.trim($baris);
                }
            }
        }

        $this->assertSame([], $pelanggaran, "Kode sekolah memakai koneksi/cache bersama:\n".implode("\n", $pelanggaran));
    }

    private function api(string $sekolah, string $method, string $uri, array $data = [], ?string $token = null): TestResponse
    {
        tenancy()->end();
        $this->app['auth']->forgetGuards();

        $host = $sekolah === 'central' ? 'localhost' : "{$sekolah}.test";
        $headers = ['Accept' => 'application/json'] + ($token ? ['Authorization' => "Bearer {$token}"] : []);

        $response = $this->json($method, "http://{$host}{$uri}", $data, $headers);
        tenancy()->end();

        return $response;
    }

    private function token(string $sekolah, string $login, string $password): string
    {
        return $this->api($sekolah, 'POST', '/login', ['login' => $login, 'password' => $password])
            ->assertOk()->json('token');
    }

    private function diSekolah(string $id, callable $fn): mixed
    {
        tenancy()->end();
        $hasil = Sekolah::findOrFail($id)->run($fn);
        tenancy()->end();

        return $hasil;
    }

    private function siapkanSekolah(): void
    {
        $db = config('database.connections.'.config('database.default').'.database');
        if (realpath(dirname($db)) !== realpath(dirname(self::fileCentralUji())) || basename($db) !== basename(self::fileCentralUji())) {
            throw new RuntimeException("Uji isolasi dibatalkan: database central bukan file uji ({$db}).");
        }

        self::hapusSekolahUji();
        Artisan::call('migrate:fresh', ['--force' => true]);

        foreach ([self::A => self::PASS_A, self::B => self::PASS_B] as $id => $pass) {
            $sekolah = Sekolah::create(['id' => $id, 'nama_sekolah' => "Sekolah Uji {$id}", 'status' => 'active']);
            $sekolah->domains()->create(['domain' => "{$id}.test"]);

            $sekolah->run(function () use ($id, $pass) {
                $huruf = $id === self::A ? 'A' : 'B';
                foreach ([
                    ['admin@uji.test', "Admin {$huruf}", 'Admin Sekolah'],
                    ['sama@uji.test', "Sama di Sekolah {$huruf}", 'Tata Usaha'],
                ] as [$email, $nama, $peran]) {
                    $u = User::create(['name' => $nama, 'email' => $email, 'password' => $pass]);
                    $u->forceFill(['email_verified_at' => now(), 'is_active' => true])->save();
                    $u->assignRole($peran);
                }

                if ($id === self::A) {
                    $u = User::create(['name' => 'Hanya A', 'email' => 'hanya-a@uji.test', 'password' => $pass]);
                    $u->forceFill(['email_verified_at' => now(), 'is_active' => true])->save();
                    Siswa::create(['nis' => 'RA1', 'nisn' => '7700000001', 'nama' => 'Siswa Rahasia A', 'jenis_kelamin' => 'P', 'status' => 'aktif']);
                }
            });
        }

        tenancy()->end();
    }

    private static function hapusSekolahUji(): void
    {
        tenancy()->end();
        foreach ([self::A, self::B] as $id) {
            try {
                Sekolah::find($id)?->delete();
            } catch (\Throwable) {
                // tabel central belum ada (run pertama) — cukup bersihkan file
            }
            @unlink(database_path("tenant{$id}"));
            File::deleteDirectory(storage_path("tenant{$id}"));
            File::deleteDirectory(base_path("storage/tenant{$id}"));
        }
    }

    private static function fileCentralUji(): string
    {
        return __DIR__.'/../../storage/framework/testing/isolasi-central.sqlite';
    }

    private static function pakaiCentralUji(): void
    {
        $file = self::fileCentralUji();
        if (! is_dir(dirname($file))) {
            mkdir(dirname($file), 0777, true);
        }
        if (! file_exists($file)) {
            touch($file);
        }

        foreach (['DB_DATABASE' => $file, 'DB_QUEUE_CONNECTION' => 'sqlite'] as $k => $v) {
            putenv("{$k}={$v}");
            $_ENV[$k] = $_SERVER[$k] = $v;
        }
    }
}
