<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\PendaftaranDitolakMail;
use App\Mail\PendaftaranSiswaDisetujuiMail;
use App\Models\Kelas;
use App\Models\PendaftaranSiswa;
use App\Models\Siswa;
use App\Models\User;
use App\Notifications\PendaftaranSiswaBaruNotification;
use App\Support\AkunSiswa;
use App\Support\KirimEmail;
use App\Support\Recaptcha;
use App\Support\UndanganStaf;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Pendaftaran mandiri siswa. Pendaftar belum menjadi siswa: admin meninjau
 * dulu, lalu saat menyetujui sekaligus menempatkannya di kelas. Persetujuan
 * membuat data siswa, akun siswa (username NISN), dan akun orang tua/wali
 * (username ortu.NISN) dengan password sementara yang ditampilkan ke admin.
 */
class PendaftaranSiswaController extends Controller
{
    private const PESAN_TERKIRIM = 'Pendaftaran berhasil. Akun Anda akan aktif setelah disetujui oleh admin sekolah. '
        .'Informasi login akan dikirim ke email Anda.';

    public function store(Request $request): JsonResponse
    {
        $kunciIp = 'daftar-siswa:'.tenant('id').':'.$request->ip();
        if (RateLimiter::tooManyAttempts($kunciIp, 5)) {
            abort(429, 'Terlalu banyak pendaftaran dari jaringan ini. Silakan coba lagi dalam 1 jam.');
        }

        $data = $request->validate([
            'nama_lengkap' => ['required', 'string', 'max:255'],
            'nisn' => ['required', 'digits:10'],
            'nis' => ['required', 'regex:/^[0-9]{1,20}$/'],
            'tanggal_lahir' => ['required', 'date', 'before:today', 'after:1980-01-01'],
            'jenis_kelamin' => ['required', 'in:L,P'],
            'email' => ['required', 'email:rfc', 'max:255'],
            'no_hp' => ['required', 'regex:/^[0-9]{9,15}$/'],
            'nama_wali' => ['required', 'string', 'max:255'],
            'no_hp_wali' => ['required', 'regex:/^[0-9]{9,15}$/'],
            'pernyataan' => ['accepted'],
            'recaptcha_token' => ['nullable', 'string'],
        ], [
            'nama_lengkap.required' => 'Nama lengkap wajib diisi.',
            'nisn.required' => 'NISN wajib diisi.',
            'nisn.digits' => 'NISN harus 10 digit angka.',
            'nis.required' => 'NIS wajib diisi.',
            'nis.regex' => 'NIS hanya berisi angka.',
            'tanggal_lahir.required' => 'Tanggal lahir wajib diisi.',
            'tanggal_lahir.before' => 'Tanggal lahir tidak valid.',
            'tanggal_lahir.after' => 'Tanggal lahir tidak valid.',
            'jenis_kelamin.required' => 'Pilih jenis kelamin.',
            'jenis_kelamin.in' => 'Pilih jenis kelamin.',
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'no_hp.required' => 'Nomor HP siswa wajib diisi.',
            'no_hp.regex' => 'Nomor HP hanya berisi angka (9–15 digit).',
            'nama_wali.required' => 'Nama orang tua/wali wajib diisi.',
            'no_hp_wali.required' => 'Nomor HP orang tua/wali wajib diisi.',
            'no_hp_wali.regex' => 'Nomor HP orang tua/wali hanya berisi angka (9–15 digit).',
            'pernyataan.accepted' => 'Centang pernyataan bahwa data yang Anda isi benar.',
        ]);

        if (! Recaptcha::lolos($request->string('recaptcha_token')->toString())) {
            throw ValidationException::withMessages([
                'recaptcha_token' => ['Verifikasi keamanan gagal. Silakan muat ulang halaman dan coba lagi.'],
            ]);
        }

        RateLimiter::hit($kunciIp, 3600);

        // Pendaftaran dengan NISN yang masih ditinjau tidak dibuat lagi, tapi
        // balasannya sama supaya form ini tidak bisa dipakai menebak data orang.
        // NISN yang sudah terdaftar sebagai siswa tetap dicatat; admin yang menilai.
        if (PendaftaranSiswa::where('status', 'menunggu')->where('nisn', $data['nisn'])->exists()) {
            activity('pendaftaran-siswa')->withProperties(['nisn' => $data['nisn'], 'ip' => $request->ip()])
                ->log('Pendaftaran siswa ganda diabaikan.');

            return response()->json(['message' => self::PESAN_TERKIRIM], 201);
        }

        unset($data['pernyataan'], $data['recaptcha_token']);
        $pendaftaran = PendaftaranSiswa::create([
            ...$data,
            'email' => mb_strtolower(trim($data['email'])),
            'ip_address' => $request->ip(),
        ]);

        activity('pendaftaran-siswa')->performedOn($pendaftaran)->withProperties(['ip' => $request->ip()])
            ->log("Pendaftaran siswa baru dari \"{$pendaftaran->nama_lengkap}\".");

        try {
            User::permission('pengguna.manage')->get()->each->notify(new PendaftaranSiswaBaruNotification($pendaftaran));
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json(['message' => self::PESAN_TERKIRIM], 201);
    }

    public function index(Request $request): JsonResponse
    {
        $status = $request->input('status', 'menunggu');

        $halaman = PendaftaranSiswa::where('status', $status)
            ->with(['pemroses:id,name', 'kelas:id,nama_kelas'])
            ->latest()
            ->paginate(20);

        // Tandai NISN/NIS yang sudah dipakai siswa lain, supaya admin tahu
        // sebelum menyetujui (persetujuan akan ditolak bila bentrok).
        if ($status === 'menunggu') {
            $nisn = Siswa::whereIn('nisn', $halaman->getCollection()->pluck('nisn'))->pluck('nama', 'nisn');
            $nis = Siswa::whereIn('nis', $halaman->getCollection()->pluck('nis')->filter())->pluck('nama', 'nis');

            $halaman->getCollection()->each(function (PendaftaranSiswa $p) use ($nisn, $nis) {
                $p->setAttribute('nisn_dipakai', $nisn->get($p->nisn));
                $p->setAttribute('nis_dipakai', $p->nis ? $nis->get($p->nis) : null);
            });
        }

        return response()->json([
            'menunggu' => PendaftaranSiswa::where('status', 'menunggu')->count(),
            'data' => $halaman,
        ]);
    }

    public function setujui(Request $request, PendaftaranSiswa $pendaftaran): JsonResponse
    {
        $data = $request->validate([
            'kelas_id' => ['required', Rule::exists('kelas', 'id')->where('status', 'aktif')],
            'nis' => ['nullable', 'regex:/^[0-9]{1,20}$/'],
            'buat_akun_ortu' => ['boolean'],
        ], [
            'kelas_id.required' => 'Pilih kelas untuk siswa ini.',
            'kelas_id.exists' => 'Kelas tidak ditemukan atau tidak aktif.',
            'nis.regex' => 'NIS hanya berisi angka.',
        ]);

        $this->pastikanMenunggu($pendaftaran);

        $nisn = $pendaftaran->nisn;
        // NIS wajib di data siswa; bila pendaftar & admin sama-sama tidak mengisi, pakai NISN.
        $nis = ($data['nis'] ?? null) ?: ($pendaftaran->nis ?: $nisn);
        $buatAkunOrtu = $data['buat_akun_ortu'] ?? true;

        if (Siswa::where('nisn', $nisn)->exists()) {
            throw ValidationException::withMessages(['nisn' => ["NISN {$nisn} sudah terdaftar sebagai siswa. Tolak pendaftaran ini atau periksa data siswa."]]);
        }
        if (Siswa::where('nis', $nis)->exists()) {
            throw ValidationException::withMessages(['nis' => ["NIS {$nis} sudah dipakai siswa lain. Isi NIS yang berbeda."]]);
        }

        $kelas = Kelas::findOrFail($data['kelas_id']);

        try {
            [$siswa, $kredensial] = DB::transaction(function () use ($request, $pendaftaran, $kelas, $nisn, $nis, $buatAkunOrtu) {
                $siswa = Siswa::create([
                    'kelas_id' => $kelas->id,
                    'tahun_masuk' => now()->year,
                    'nis' => $nis,
                    'nisn' => $nisn,
                    'nama' => $pendaftaran->nama_lengkap,
                    'jenis_kelamin' => $pendaftaran->jenis_kelamin,
                    'tanggal_lahir' => $pendaftaran->tanggal_lahir,
                    'nama_wali' => $pendaftaran->nama_wali,
                    'telepon_wali' => $pendaftaran->no_hp_wali,
                    'status' => 'aktif',
                ]);

                // Email pendaftar dipakai sebagai email akun bila belum dipakai akun lain.
                $emailAkun = $pendaftaran->email && ! User::where('email', $pendaftaran->email)->exists()
                    ? $pendaftaran->email
                    : "{$nisn}@siswa.invalid";

                $kredensial = [];
                $password = AkunSiswa::passwordAcak();
                $akunSiswa = AkunSiswa::buatAkun($pendaftaran->nama_lengkap, $nisn, $emailAkun, $password, 'Siswa');
                $akunSiswa->forceFill(['phone' => $pendaftaran->no_hp])->save();
                $siswa->update(['user_id' => $akunSiswa->id]);
                $kredensial[] = ['jenis' => 'Siswa', 'nama' => $akunSiswa->name, 'username' => $nisn, 'password' => $password];

                if ($buatAkunOrtu) {
                    $password = AkunSiswa::passwordAcak();
                    $username = "ortu.{$nisn}";
                    $akunOrtu = AkunSiswa::buatAkun($pendaftaran->nama_wali, $username, "{$username}@ortu.invalid", $password, 'Orang Tua');
                    $akunOrtu->forceFill(['phone' => $pendaftaran->no_hp_wali])->save();
                    $siswa->walis()->attach($akunOrtu->id, ['hubungan' => 'wali']);
                    $kredensial[] = ['jenis' => 'Orang Tua/Wali', 'nama' => $akunOrtu->name, 'username' => $username, 'password' => $password];
                }

                $pendaftaran->update([
                    'status' => 'disetujui',
                    'kelas_id' => $kelas->id,
                    'siswa_id' => $siswa->id,
                    'nis' => $nis,
                    'diproses_oleh' => $request->user()->id,
                    'diproses_at' => now(),
                ]);

                return [$siswa, $kredensial];
            });
        } catch (QueryException $e) {
            report($e);
            abort(503, 'Data siswa tidak dapat dibuat saat ini. Silakan coba lagi.');
        } catch (\RuntimeException $e) {
            // Username/email akun sudah dipakai (dari AkunSiswa::buatAkun).
            throw ValidationException::withMessages(['nisn' => ['Akun tidak dapat dibuat: '.$e->getMessage().'.']]);
        } catch (\Throwable $e) {
            report($e);
            abort(503, 'Data siswa tidak dapat dibuat saat ini. Silakan coba lagi.');
        }

        $emailTerkirim = null;
        if ($pendaftaran->email) {
            $namaSekolah = tenant('nama_sekolah') ?: 'SIM Pendidikan';
            $emailTerkirim = KirimEmail::segera($pendaftaran->email, new PendaftaranSiswaDisetujuiMail(
                $namaSekolah,
                $siswa->nama,
                $kelas->nama_kelas,
                UndanganStaf::frontendBase().'/login',
                $kredensial[0]['username'],
                $kredensial[0]['password'],
            ));
        }

        activity()->causedBy($request->user())->performedOn($siswa)->useLog('pengguna')
            ->log("Menyetujui pendaftaran siswa \"{$siswa->nama}\" ke kelas {$kelas->nama_kelas}.");

        return response()->json([
            'message' => "Pendaftaran disetujui. {$siswa->nama} ditempatkan di kelas {$kelas->nama_kelas}.",
            'kelas' => $kelas->nama_kelas,
            'kredensial' => $kredensial,
            'email' => $pendaftaran->email,
            'email_terkirim' => $emailTerkirim,
        ]);
    }

    public function tolak(Request $request, PendaftaranSiswa $pendaftaran): JsonResponse
    {
        $data = $request->validate(['alasan' => ['required', 'string', 'max:500']]);

        $this->pastikanMenunggu($pendaftaran);

        $pendaftaran->update([
            'status' => 'ditolak',
            'alasan_penolakan' => $data['alasan'],
            'diproses_oleh' => $request->user()->id,
            'diproses_at' => now(),
        ]);

        if ($pendaftaran->email) {
            $namaSekolah = tenant('nama_sekolah') ?: 'SIM Pendidikan';
            KirimEmail::segera($pendaftaran->email, new PendaftaranDitolakMail($namaSekolah, $pendaftaran->nama_lengkap, $data['alasan'], 'siswa'));
        }

        activity()->causedBy($request->user())->performedOn($pendaftaran)->useLog('pengguna')
            ->log("Menolak pendaftaran siswa \"{$pendaftaran->nama_lengkap}\".");

        return response()->json([
            'message' => $pendaftaran->email
                ? 'Pendaftaran ditolak dan pendaftar diberi tahu lewat email.'
                : 'Pendaftaran ditolak. Pendaftar tidak mengisi email; beri tahu lewat nomor HP orang tua/wali.',
        ]);
    }

    private function pastikanMenunggu(PendaftaranSiswa $pendaftaran): void
    {
        if ($pendaftaran->status !== 'menunggu') {
            throw ValidationException::withMessages(['status' => ['Pendaftaran ini sudah diproses.']]);
        }
    }
}
