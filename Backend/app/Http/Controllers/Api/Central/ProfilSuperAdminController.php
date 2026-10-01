<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Central;

use App\Http\Controllers\Controller;
use App\Models\AktivitasAkun;
use App\Models\ProfilSuperAdmin;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Halaman "Profil Saya" Super Admin. Yang bisa diubah sendiri: foto,
 * identitas pribadi, data kepegawaian, kontak, password, dan preferensi.
 * NIP & NIK hanya bisa diisi sekali (setelah itu terkunci), sedangkan
 * peran, hak akses, dan cakupan wilayah selalu baca-saja.
 */
class ProfilSuperAdminController extends Controller
{
    private const ZONA_WAKTU = ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'];

    private const LABEL_FIELD = [
        'name' => 'nama', 'email' => 'email', 'nip' => 'NIP', 'nik' => 'NIK',
        'jenis_kelamin' => 'jenis kelamin', 'tempat_lahir' => 'tempat lahir', 'tanggal_lahir' => 'tanggal lahir',
        'instansi' => 'instansi', 'unit_kerja' => 'unit kerja', 'jabatan' => 'jabatan',
        'pangkat_golongan' => 'pangkat/golongan', 'alamat_kantor' => 'alamat kantor',
        'telepon' => 'telepon', 'telepon_kantor' => 'telepon kantor', 'preferensi' => 'preferensi',
    ];

    /** Kewenangan Super Admin (sesuai menu dasbor) — baca-saja. */
    private const HAK_AKSES = [
        'Mengelola data sekolah, guru, dan siswa seluruh Indonesia',
        'Membuat, menonaktifkan, dan mengatur akun Admin Sekolah',
        'Mengatur hak akses (role & permission) di setiap sekolah',
        'Sinkronisasi data, tarik data via API, dan penanganan konflik data',
        'Melihat log aktivitas nasional, notifikasi sensitif, dan laporan wilayah',
        'Melihat statistik nasional dan peta sebaran sekolah',
        'Mengatur modul sekolah, backup & restore, serta integrasi sistem',
        'Mengelola pengguna dan katalog role',
        'Mengatur keamanan platform (data pribadi, retensi data, 2FA)',
    ];

    public function show(Request $request): JsonResponse
    {
        return response()->json($this->present($request->user()));
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        $profil = $this->profil($user);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'current_password' => ['nullable', 'string'],
            'nip' => ['nullable', 'string', 'regex:/^[0-9 ]{8,30}$/'],
            'nik' => ['nullable', 'digits:16'],
            'jenis_kelamin' => ['nullable', 'in:L,P'],
            'tempat_lahir' => ['nullable', 'string', 'max:100'],
            'tanggal_lahir' => ['nullable', 'date', 'before:today'],
            'instansi' => ['nullable', 'string', 'max:255'],
            'unit_kerja' => ['nullable', 'string', 'max:255'],
            'jabatan' => ['nullable', 'string', 'max:255'],
            'pangkat_golongan' => ['nullable', 'string', 'max:100'],
            'alamat_kantor' => ['nullable', 'string', 'max:1000'],
            'telepon' => ['nullable', 'string', 'regex:/^[0-9+\-\s()]{6,30}$/'],
            'telepon_kantor' => ['nullable', 'string', 'max:30', 'regex:/^[0-9+\-\s()]{4,}(\s*(ext|ekst)\.?\s*[0-9]{1,6})?$/i'],
            'preferensi.zona_waktu' => ['nullable', Rule::in(self::ZONA_WAKTU)],
            'preferensi.bahasa' => ['nullable', 'in:id'],
            'preferensi.notif_login_baru' => ['nullable', 'boolean'],
            'preferensi.notif_aktivitas_sensitif' => ['nullable', 'boolean'],
        ], [
            'nip.regex' => 'NIP hanya boleh berisi angka (8–30 digit).',
            'nik.digits' => 'NIK harus 16 digit angka.',
            'telepon.regex' => 'Nomor telepon tidak valid.',
            'telepon_kantor.regex' => 'Nomor telepon kantor tidak valid.',
        ]);

        // Email adalah identitas login — wajib konfirmasi password saat diganti.
        if ($data['email'] !== $user->email) {
            if (empty($data['current_password']) || ! Auth::guard('web')->validate(['email' => $user->email, 'password' => $data['current_password']])) {
                throw ValidationException::withMessages([
                    'current_password' => ['Masukkan password saat ini yang benar untuk mengganti email.'],
                ]);
            }
        }

        // NIP & NIK terkunci setelah pertama kali diisi.
        foreach (['nip', 'nik'] as $field) {
            if (! empty($profil->{$field}) && array_key_exists($field, $data) && $data[$field] !== null && $data[$field] !== $profil->{$field}) {
                throw ValidationException::withMessages([
                    $field => [strtoupper($field).' sudah terkunci dan hanya bisa diubah melalui prosedur khusus.'],
                ]);
            }
            if (! empty($profil->{$field})) {
                unset($data[$field]);
            }
        }

        $diubah = [];
        foreach (['name', 'email'] as $field) {
            if ($user->{$field} !== $data[$field]) {
                $diubah[] = self::LABEL_FIELD[$field];
                $user->{$field} = $data[$field];
            }
        }
        $user->save();

        $preferensiLama = $profil->preferensi ?? [];
        $isiProfil = collect($data)->except(['name', 'email', 'current_password', 'preferensi'])->all();
        $isiProfil['preferensi'] = array_merge($this->preferensiBawaan(), $preferensiLama, $data['preferensi'] ?? []);
        $profil->fill($isiProfil);
        foreach (array_keys($profil->getDirty()) as $field) {
            $diubah[] = self::LABEL_FIELD[$field] ?? $field;
        }
        $profil->save();

        if ($diubah) {
            AktivitasAkun::catat($user, 'ubah_profil', 'Mengubah '.implode(', ', array_unique($diubah)), $request);
        }

        return response()->json($this->present($user->fresh()));
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'regex:/[a-z]/', 'regex:/[A-Z]/', 'regex:/[0-9]/', 'confirmed', 'different:current_password'],
        ], [
            'password.min' => 'Password baru minimal 8 karakter.',
            'password.regex' => 'Password baru harus mengandung huruf besar, huruf kecil, dan angka.',
            'password.confirmed' => 'Konfirmasi password baru tidak cocok.',
            'password.different' => 'Password baru harus berbeda dari password saat ini.',
        ]);

        if (! Auth::guard('web')->validate(['email' => $user->email, 'password' => $data['current_password']])) {
            throw ValidationException::withMessages(['current_password' => ['Password saat ini salah.']]);
        }

        $user->password = $data['password'];
        $user->save();
        $this->profil($user)->forceFill(['password_diganti_at' => now()])->save();

        // Keluarkan semua sesi lain; sesi yang sedang dipakai tetap aktif.
        $tokenSekarang = $user->currentAccessToken()?->id;
        $sesiLain = $user->tokens()->when($tokenSekarang, fn ($q) => $q->where('id', '!=', $tokenSekarang))->delete();

        AktivitasAkun::catat($user, 'ganti_password', $sesiLain ? "Mengganti password, {$sesiLain} sesi lain dikeluarkan" : 'Mengganti password', $request);

        return response()->json(['message' => 'Password berhasil diganti.', 'profil' => $this->present($user->fresh())]);
    }

    public function uploadFoto(Request $request): JsonResponse
    {
        $request->validate(['foto' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048']]);

        $user = $request->user();
        $profil = $this->profil($user);
        if ($profil->foto) {
            Storage::disk('public')->delete($profil->foto);
        }
        $profil->foto = $request->file('foto')->store('super-admin/foto', 'public');
        $profil->save();

        AktivitasAkun::catat($user, 'ubah_profil', 'Mengganti foto profil', $request);

        return response()->json($this->present($user));
    }

    public function hapusFoto(Request $request): JsonResponse
    {
        $user = $request->user();
        $profil = $this->profil($user);
        if ($profil->foto) {
            Storage::disk('public')->delete($profil->foto);
            $profil->foto = null;
            $profil->save();
            AktivitasAkun::catat($user, 'ubah_profil', 'Menghapus foto profil', $request);
        }

        return response()->json($this->present($user));
    }

    /** Disajikan tanpa auth (dipakai di <img>); nama file acak dari store(). */
    public function showFoto(string $file): StreamedResponse
    {
        $path = 'super-admin/foto/'.basename($file);
        abort_unless(Storage::disk('public')->exists($path), 404);

        return Storage::disk('public')->response($path);
    }

    public function aktivitas(Request $request): JsonResponse
    {
        $aksi = $request->string('aksi')->value();

        return response()->json(
            AktivitasAkun::where('user_id', $request->user()->id)
                ->when($aksi, fn ($q) => $q->where('aksi', $aksi))
                ->latest('created_at')->latest('id')
                ->paginate(min(50, max(5, $request->integer('per_page', 10))))
        );
    }

    private function profil(User $user): ProfilSuperAdmin
    {
        return ProfilSuperAdmin::firstOrCreate(['user_id' => $user->id], ['preferensi' => $this->preferensiBawaan()]);
    }

    private function preferensiBawaan(): array
    {
        return ['bahasa' => 'id', 'zona_waktu' => 'Asia/Jakarta', 'notif_login_baru' => true, 'notif_aktivitas_sensitif' => true];
    }

    private function present(User $user): array
    {
        $profil = $this->profil($user);
        $aktivitas = AktivitasAkun::where('user_id', $user->id);
        $loginTerakhir = (clone $aktivitas)->where('aksi', 'login')->latest('created_at')->latest('id')->skip(1)->first()
            ?? (clone $aktivitas)->where('aksi', 'login')->latest('created_at')->first();

        return [
            'akun' => [
                'id' => $user->id,
                'nama' => $user->name,
                'email' => $user->email,
                'peran' => 'Super Admin',
                'status' => 'Aktif',
                'dibuat_at' => $user->created_at,
                'dibuat_oleh' => 'Sistem (akun awal platform)',
                'email_resmi' => str_ends_with(strtolower($user->email), '.go.id'),
            ],
            'profil' => array_merge($profil->only([
                'nip', 'jenis_kelamin', 'tempat_lahir', 'instansi', 'unit_kerja', 'jabatan',
                'pangkat_golongan', 'alamat_kantor', 'telepon', 'telepon_kantor',
            ]), [
                'tanggal_lahir' => $profil->tanggal_lahir?->format('Y-m-d'),
                'nik_tersamar' => $profil->nikTersamar(),
                'nip_terkunci' => ! empty($profil->nip),
                'nik_terkunci' => ! empty($profil->nik),
                'foto_url' => $profil->foto ? '/api/profil-super-admin/foto/'.basename($profil->foto) : null,
                'preferensi' => array_merge($this->preferensiBawaan(), $profil->preferensi ?? []),
            ]),
            'hak_akses' => ['cakupan' => 'Nasional (seluruh provinsi, kabupaten/kota, dan sekolah)', 'daftar' => self::HAK_AKSES],
            'keamanan' => [
                'dua_faktor_aktif' => (bool) $user->two_factor_confirmed_at,
                'dua_faktor_aktif_sejak' => $user->two_factor_confirmed_at,
                'sisa_kode_pemulihan' => count($user->two_factor_recovery_codes ?? []),
                'password_diganti_at' => $profil->password_diganti_at,
                'riwayat_password' => (clone $aktivitas)->where('aksi', 'ganti_password')->latest('created_at')->limit(5)->get(['created_at', 'ip_address', 'keterangan']),
                'sesi_aktif' => $user->tokens()->count(),
                'login_gagal_7_hari' => (clone $aktivitas)->where('aksi', 'login_gagal')->where('created_at', '>=', now()->subDays(7))->count(),
            ],
            'login_terakhir' => $loginTerakhir?->only(['created_at', 'ip_address', 'user_agent']),
        ];
    }
}
