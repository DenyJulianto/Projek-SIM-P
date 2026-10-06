<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\PendaftaranDitolakMail;
use App\Models\Guru;
use App\Models\MataPelajaran;
use App\Models\PendaftaranPegawai;
use App\Models\User;
use App\Notifications\PendaftaranPegawaiBaruNotification;
use App\Support\KirimEmail;
use App\Support\Recaptcha;
use App\Support\UndanganStaf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

/**
 * Pendaftaran mandiri pendidik & tenaga kependidikan. Pendaftar tidak
 * langsung mendapat akun: admin meninjau dulu, dan bila disetujui akun
 * dibuat lalu pendaftar menerima undangan untuk membuat password sendiri.
 */
class PendaftaranPegawaiController extends Controller
{
    private const PESAN_TERKIRIM = 'Pendaftaran berhasil. Akun Anda akan aktif setelah disetujui oleh admin sekolah. '
        .'Informasi login akan dikirim ke email Anda.';

    public function opsi(): JsonResponse
    {
        return response()->json([
            'jenis_pegawai' => PendaftaranPegawai::JENIS,
            'status_kepegawaian' => PendaftaranPegawai::STATUS_KEPEGAWAIAN,
            'wajib_nip' => PendaftaranPegawai::WAJIB_NIP,
            'mata_pelajaran' => MataPelajaran::orderBy('nama_mapel')->pluck('nama_mapel')->unique()->values(),
            'jabatan' => collect(PendaftaranPegawai::JABATAN)
                ->map(fn ($daftar, $kelompok) => ['kelompok' => $kelompok, 'jabatan' => $daftar])
                ->values(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $kunciIp = 'daftar-pegawai:'.tenant('id').':'.$request->ip();
        if (RateLimiter::tooManyAttempts($kunciIp, 5)) {
            abort(429, 'Terlalu banyak pendaftaran dari jaringan ini. Silakan coba lagi dalam 1 jam.');
        }

        $data = $request->validate([
            'nama_lengkap' => ['required', 'string', 'max:255'],
            'jenis_pegawai' => ['required', Rule::in(PendaftaranPegawai::JENIS)],
            'status_kepegawaian' => ['required', Rule::in(PendaftaranPegawai::STATUS_KEPEGAWAIAN)],
            'nip' => [Rule::requiredIf(in_array($request->input('status_kepegawaian'), PendaftaranPegawai::WAJIB_NIP, true)), 'nullable', 'digits:18'],
            'nuptk' => ['nullable', 'digits:16'],
            'nik' => ['nullable', 'digits:16'],
            'email' => ['required', 'email:rfc', 'max:255'],
            'no_hp' => ['required', 'regex:/^[0-9]{9,15}$/'],
            'jabatan' => ['nullable', 'string', Rule::in(PendaftaranPegawai::daftarJabatan())],
            'mata_pelajaran' => ['nullable', 'string', 'max:255'],
            'pernyataan' => ['accepted'],
            'recaptcha_token' => ['nullable', 'string'],
        ], [
            'nip.required' => 'NIP wajib diisi untuk pegawai berstatus PNS/PPPK.',
            'nip.digits' => 'NIP harus 18 digit angka.',
            'nuptk.digits' => 'NUPTK harus 16 digit angka.',
            'nik.digits' => 'NIK harus 16 digit angka.',
            'no_hp.regex' => 'Nomor HP/WhatsApp hanya berisi angka (9–15 digit).',
            'pernyataan.accepted' => 'Centang pernyataan bahwa data yang Anda isi benar.',
            'jabatan.in' => 'Pilih jabatan yang diajukan dari daftar yang tersedia.',
        ]);

        if ($data['status_kepegawaian'] !== 'PNS' && empty($data['nuptk']) && empty($data['nik'])) {
            throw ValidationException::withMessages([
                'nuptk' => ['Isi salah satu: NUPTK atau NIK (wajib untuk pegawai non-PNS).'],
            ]);
        }

        if (! Recaptcha::lolos($request->string('recaptcha_token')->toString())) {
            throw ValidationException::withMessages([
                'recaptcha_token' => ['Verifikasi keamanan gagal. Silakan muat ulang halaman dan coba lagi.'],
            ]);
        }

        RateLimiter::hit($kunciIp, 3600);

        $email = mb_strtolower(trim($data['email']));
        $nikHash = empty($data['nik']) ? null : PendaftaranPegawai::hashNik($data['nik']);

        // Pendaftaran yang masih ditinjau tidak dibuatkan lagi, tapi balasannya
        // tetap sama supaya form ini tidak bisa dipakai menebak data orang lain.
        // Email yang sudah punya akun tetap dicatat: admin yang memutuskan di
        // menu Konfirmasi Pengguna (lihat setujui()).
        $ganda = PendaftaranPegawai::where('status', 'menunggu')
            ->where(fn ($q) => $q->where('email', $email)->when($nikHash, fn ($q) => $q->orWhere('nik_hash', $nikHash)))
            ->exists();

        if ($ganda) {
            activity('pendaftaran-pegawai')->withProperties(['email' => $email, 'ip' => $request->ip()])
                ->log('Pendaftaran pegawai ganda diabaikan.');

            return response()->json(['message' => self::PESAN_TERKIRIM], 201);
        }

        $pendaftaran = PendaftaranPegawai::create([
            ...$data,
            'email' => $email,
            'nik_hash' => $nikHash,
            'mata_pelajaran' => $data['jenis_pegawai'] === 'Guru' ? ($data['mata_pelajaran'] ?? null) : null,
            'ip_address' => $request->ip(),
        ]);

        activity('pendaftaran-pegawai')->performedOn($pendaftaran)->withProperties(['ip' => $request->ip()])
            ->log("Pendaftaran pegawai baru dari \"{$pendaftaran->nama_lengkap}\".");

        try {
            User::permission('pengguna.manage')->get()->each->notify(new PendaftaranPegawaiBaruNotification($pendaftaran));
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json(['message' => self::PESAN_TERKIRIM], 201);
    }

    public function index(Request $request): JsonResponse
    {
        $status = $request->input('status', 'menunggu');

        $halaman = PendaftaranPegawai::where('status', $status)
            ->with('pemroses:id,name')
            ->latest()
            ->paginate(20);

        // Tandai pendaftaran yang emailnya sudah dipakai akun, supaya admin
        // tahu sebelum menyetujui: akun tanpa peran (sisa pendaftaran lama)
        // akan dipakai ulang, akun yang sudah punya peran tidak bisa.
        if ($status === 'menunggu') {
            $akun = User::with('roles:id,name')
                ->whereIn('email', $halaman->getCollection()->pluck('email'))
                ->get(['id', 'name', 'email'])
                ->keyBy('email');

            $halaman->getCollection()->each(function (PendaftaranPegawai $p) use ($akun) {
                $u = $akun->get($p->email);
                $p->setAttribute('akun_terdaftar', $u ? [
                    'name' => $u->name,
                    'punya_peran' => $u->roles->isNotEmpty(),
                ] : null);
            });
        }

        return response()->json([
            'menunggu' => PendaftaranPegawai::where('status', 'menunggu')->count(),
            'data' => $halaman,
        ]);
    }

    public function setujui(Request $request, PendaftaranPegawai $pendaftaran): JsonResponse
    {
        $data = $request->validate([
            'roles' => ['required', 'array', 'min:1'],
            'roles.*' => ['string', Rule::in($this->peranStaf())],
            'jenis_kelamin' => ['required', 'in:L,P'],
        ], [
            'roles.required' => 'Pilih minimal satu peran.',
        ]);

        $this->pastikanMenunggu($pendaftaran);

        // Akun tanpa peran (mis. sisa pendaftaran publik lama) dipakai ulang;
        // akun yang sudah punya peran milik orang yang sudah aktif di sekolah.
        $akunLama = User::where('email', $pendaftaran->email)->first();
        if ($akunLama?->roles()->exists()) {
            throw ValidationException::withMessages(['email' => ['Email ini sudah dipakai akun aktif lain. Tolak pendaftaran ini atau hubungi pendaftar.']]);
        }

        $guruSama = $pendaftaran->nip ? Guru::where('nip', $pendaftaran->nip)->first() : null;
        if ($guruSama?->user_id) {
            throw ValidationException::withMessages(['nip' => ['NIP ini sudah tertaut ke akun lain.']]);
        }

        try {
            $user = DB::transaction(function () use ($request, $pendaftaran, $data, $guruSama, $akunLama) {
                // Password lama akun yang dipakai ulang diganti acak dan sesinya
                // dicabut: akun baru bisa dipakai setelah pendaftar menerima undangan.
                $user = $akunLama ?? new User;
                $user->fill([
                    'name' => $pendaftaran->nama_lengkap,
                    'email' => $pendaftaran->email,
                    'password' => Str::random(40),
                ]);
                $user->forceFill([
                    'is_active' => true,
                    'must_change_password' => false,
                    'phone' => $pendaftaran->no_hp,
                    'jenis_kelamin' => $data['jenis_kelamin'],
                ])->save();
                $user->tokens()->delete();
                $user->syncRoles($data['roles']);

                $profil = [
                    'user_id' => $user->id,
                    'nama' => $pendaftaran->nama_lengkap,
                    'nip' => $pendaftaran->nip,
                    'nuptk' => $pendaftaran->nuptk,
                    'jabatan' => $pendaftaran->jabatan,
                    'mata_pelajaran' => $pendaftaran->mata_pelajaran,
                    'status_kepegawaian' => $pendaftaran->status_kepegawaian,
                    'no_telepon' => $pendaftaran->no_hp,
                    'jenis_kelamin' => $data['jenis_kelamin'],
                ];
                $guruSama ??= Guru::where('user_id', $user->id)->first();
                $guruSama ? $guruSama->update(array_filter($profil, fn ($v) => $v !== null)) : Guru::create($profil);

                $pendaftaran->update([
                    'status' => 'disetujui',
                    'user_id' => $user->id,
                    'diproses_oleh' => $request->user()->id,
                    'diproses_at' => now(),
                ]);

                return $user;
            });
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            report($e);
            abort(503, 'Akun tidak dapat dibuat saat ini. Silakan coba lagi.');
        }

        // Undangan dikirim setelah transaksi selesai: SMTP yang lambat tidak
        // menahan database, dan bila gagal akunnya tetap ada untuk dikirimi ulang.
        try {
            $terkirim = UndanganStaf::kirim($user);
        } catch (\Throwable $e) {
            report($e);
            $terkirim = false;
        }

        activity()->causedBy($request->user())->performedOn($user)->useLog('pengguna')
            ->log("Menyetujui pendaftaran pegawai \"{$user->name}\" dan mengirim undangan aktivasi.");

        return response()->json(['message' => $terkirim
            ? "Pendaftaran disetujui. Undangan aktivasi sudah dikirim ke {$user->email}."
            : "Pendaftaran disetujui, tetapi email undangan ke {$user->email} gagal dikirim saat ini. "
                .'Kirim ulang lewat menu Kelola Pengguna > "Kirim ulang undangan".',
        ]);
    }

    public function tolak(Request $request, PendaftaranPegawai $pendaftaran): JsonResponse
    {
        $data = $request->validate(['alasan' => ['required', 'string', 'max:500']]);

        $this->pastikanMenunggu($pendaftaran);

        $pendaftaran->update([
            'status' => 'ditolak',
            'alasan_penolakan' => $data['alasan'],
            'diproses_oleh' => $request->user()->id,
            'diproses_at' => now(),
        ]);

        $namaSekolah = tenant('nama_sekolah') ?: 'SIM Pendidikan';
        KirimEmail::segera($pendaftaran->email, new PendaftaranDitolakMail($namaSekolah, $pendaftaran->nama_lengkap, $data['alasan']));

        activity()->causedBy($request->user())->performedOn($pendaftaran)->useLog('pengguna')
            ->log("Menolak pendaftaran pegawai \"{$pendaftaran->nama_lengkap}\".");

        return response()->json(['message' => 'Pendaftaran ditolak dan pendaftar diberi tahu lewat email.']);
    }

    private function pastikanMenunggu(PendaftaranPegawai $pendaftaran): void
    {
        if ($pendaftaran->status !== 'menunggu') {
            throw ValidationException::withMessages(['status' => ['Pendaftaran ini sudah diproses.']]);
        }
    }

    /** @return array<int, string> */
    private function peranStaf(): array
    {
        return Role::whereNotIn('name', ImportStafController::PERAN_BUKAN_STAF)->pluck('name')->all();
    }
}
