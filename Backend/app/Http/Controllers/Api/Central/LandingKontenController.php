<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Central;

use App\Http\Controllers\Controller;
use App\Models\Central\LandingFitur;
use App\Models\Central\LandingManfaat;
use App\Models\Central\LandingPengaturan;
use App\Models\Central\LandingSlide;
use App\Models\Central\LandingTestimoni;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Konten landing platform (domain pusat). publik() & gambar() terbuka untuk
 * pengunjung; sisanya untuk Super Admin (menu "Kelola Landing Page"):
 * pengaturan kontak/legal/sosmed, slide hero, fitur unggulan, manfaat per
 * peran, dan testimoni.
 */
class LandingKontenController extends Controller
{
    private const CACHE_KEY = 'platform:landing-konten';

    private const FOLDER_GAMBAR = 'platform-landing';

    /* ----------------------------- Publik ----------------------------- */

    public function publik(): JsonResponse
    {
        $data = Cache::remember(self::CACHE_KEY, now()->addMinutes(10), fn () => [
            'pengaturan' => LandingPengaturan::current()->konten(),
            'slide' => LandingSlide::where('aktif', true)->orderBy('urutan')->orderBy('id')
                ->get(['id', 'judul_putih', 'judul_emas', 'judul_lanjutan', 'teks', 'gambar'])
                ->map(fn ($s) => $s->only(['id', 'judul_putih', 'judul_emas', 'judul_lanjutan', 'teks', 'gambar_url']))
                ->all(),
            'fitur' => LandingFitur::where('aktif', true)->orderBy('urutan')->orderBy('id')->get()
                ->map(fn ($x) => $x->only(['id', 'judul', 'deskripsi', 'label', 'meta', 'ilustrasi', 'gambar_url']))
                ->all(),
            'manfaat' => LandingManfaat::where('aktif', true)->orderBy('urutan')->orderBy('id')->get()
                ->map(fn ($x) => $x->only(['id', 'peran', 'judul', 'teks', 'poin', 'gambar_bawaan', 'gambar_url']))
                ->all(),
            'testimoni' => LandingTestimoni::where('aktif', true)->orderBy('urutan')->orderBy('id')
                ->get(['id', 'kutipan', 'nama', 'jabatan', 'sekolah'])
                ->all(),
        ]);

        return response()->json($data);
    }

    public function gambar(string $file): StreamedResponse
    {
        $path = self::FOLDER_GAMBAR.'/'.basename($file);
        abort_unless(Storage::disk('public')->exists($path), 404);

        return Storage::disk('public')->response($path, null, ['Cache-Control' => 'public, max-age=86400']);
    }

    /* --------------------------- Super Admin -------------------------- */

    public function index(): JsonResponse
    {
        return response()->json([
            'pengaturan' => LandingPengaturan::current()->konten(),
            'slide' => LandingSlide::orderBy('urutan')->orderBy('id')->get(),
            'fitur' => LandingFitur::orderBy('urutan')->orderBy('id')->get(),
            'manfaat' => LandingManfaat::orderBy('urutan')->orderBy('id')->get(),
            'testimoni' => LandingTestimoni::orderBy('urutan')->orderBy('id')->get(),
        ]);
    }

    public function updatePengaturan(Request $request): JsonResponse
    {
        $tautan = ['nullable', 'string', 'max:500', 'url:http,https'];

        $data = $request->validate([
            'whatsapp' => ['nullable', 'string', 'regex:/^62\d{8,13}$/'],
            'nama_legal' => ['nullable', 'string', 'max:255'],
            'info_legal' => ['nullable', 'string', 'max:255'],
            'alamat' => ['nullable', 'string', 'max:500'],
            'email' => ['nullable', 'email', 'max:255'],
            'telepon' => ['nullable', 'string', 'max:30', 'regex:/^[0-9+()\-\s]+$/'],
            'kebijakan_privasi_url' => $tautan,
            'sosmed_x' => $tautan,
            'sosmed_instagram' => $tautan,
            'sosmed_facebook' => $tautan,
            'sosmed_youtube' => $tautan,
        ], [
            'whatsapp.regex' => 'Nomor WhatsApp harus format internasional diawali 62, tanpa + atau spasi (mis. 6281234567890).',
            'telepon.regex' => 'Nomor telepon hanya boleh berisi angka, spasi, +, -, dan tanda kurung.',
            '*.url' => 'Tautan harus diawali http:// atau https://.',
        ]);

        $pengaturan = LandingPengaturan::current();
        $pengaturan->update($data);
        $this->segarkan();

        return response()->json($pengaturan->konten());
    }

    public function storeSlide(Request $request): JsonResponse
    {
        return $this->buatBergambar($request, LandingSlide::class, $this->validasiSlide($request));
    }

    public function updateSlide(Request $request, LandingSlide $slide): JsonResponse
    {
        return $this->ubahBergambar($request, $slide, $this->validasiSlide($request));
    }

    public function destroySlide(LandingSlide $slide): JsonResponse
    {
        return $this->hapusBergambar($slide, 'Slide berhasil dihapus.');
    }

    public function storeFitur(Request $request): JsonResponse
    {
        return $this->buatBergambar($request, LandingFitur::class, $this->validasiFitur($request));
    }

    public function updateFitur(Request $request, LandingFitur $fitur): JsonResponse
    {
        return $this->ubahBergambar($request, $fitur, $this->validasiFitur($request));
    }

    public function destroyFitur(LandingFitur $fitur): JsonResponse
    {
        return $this->hapusBergambar($fitur, 'Fitur berhasil dihapus.');
    }

    public function storeManfaat(Request $request): JsonResponse
    {
        return $this->buatBergambar($request, LandingManfaat::class, $this->validasiManfaat($request));
    }

    public function updateManfaat(Request $request, LandingManfaat $manfaat): JsonResponse
    {
        return $this->ubahBergambar($request, $manfaat, $this->validasiManfaat($request));
    }

    public function destroyManfaat(LandingManfaat $manfaat): JsonResponse
    {
        return $this->hapusBergambar($manfaat, 'Manfaat berhasil dihapus.');
    }

    public function storeTestimoni(Request $request): JsonResponse
    {
        $data = $this->validasiTestimoni($request);
        $data['urutan'] ??= (int) LandingTestimoni::max('urutan') + 1;

        $testimoni = LandingTestimoni::create($data);
        $this->segarkan();

        return response()->json($testimoni, 201);
    }

    public function updateTestimoni(Request $request, LandingTestimoni $testimoni): JsonResponse
    {
        $testimoni->update($this->validasiTestimoni($request));
        $this->segarkan();

        return response()->json($testimoni);
    }

    public function destroyTestimoni(LandingTestimoni $testimoni): JsonResponse
    {
        $testimoni->delete();
        $this->segarkan();

        return response()->json(['message' => 'Testimoni berhasil dihapus.']);
    }

    /* ----------------------------- Bantuan ---------------------------- */

    /** @param  class-string<Model>  $kelas */
    private function buatBergambar(Request $request, string $kelas, array $data): JsonResponse
    {
        $data['gambar'] = $request->hasFile('gambar') ? $this->simpanGambar($request) : null;
        $data['urutan'] ??= (int) $kelas::max('urutan') + 1;

        $item = $kelas::create($data);
        $this->segarkan();

        return response()->json($item, 201);
    }

    private function ubahBergambar(Request $request, Model $item, array $data): JsonResponse
    {
        if ($request->hasFile('gambar') || $request->boolean('hapus_gambar')) {
            $this->hapusGambar($item->gambar);
            $data['gambar'] = $request->hasFile('gambar') ? $this->simpanGambar($request) : null;
        }

        $item->update($data);
        $this->segarkan();

        return response()->json($item);
    }

    private function hapusBergambar(Model $item, string $pesan): JsonResponse
    {
        $this->hapusGambar($item->gambar);
        $item->delete();
        $this->segarkan();

        return response()->json(['message' => $pesan]);
    }

    private function validasiSlide(Request $request): array
    {
        $data = $request->validate([
            'judul_putih' => ['required', 'string', 'max:60'],
            'judul_emas' => ['nullable', 'string', 'max:60'],
            'judul_lanjutan' => ['nullable', 'string', 'max:80'],
            'teks' => ['required', 'string', 'max:300'],
            'urutan' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'aktif' => ['required', 'boolean'],
            'gambar' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);
        unset($data['gambar']);

        return $this->tanpaUrutanKosong($data);
    }

    private function validasiFitur(Request $request): array
    {
        $data = $request->validate([
            'judul' => ['required', 'string', 'max:80'],
            'deskripsi' => ['required', 'string', 'max:300'],
            'label' => ['nullable', 'string', 'max:30'],
            'meta' => ['nullable', 'array', 'max:3'],
            'meta.*' => ['nullable', 'string', 'max:40'],
            'ilustrasi' => ['required', 'in:'.implode(',', LandingFitur::ILUSTRASI)],
            'urutan' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'aktif' => ['required', 'boolean'],
            'gambar' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);
        unset($data['gambar']);
        $data['meta'] = $this->daftarBersih($data['meta'] ?? []);

        return $this->tanpaUrutanKosong($data);
    }

    private function validasiManfaat(Request $request): array
    {
        $data = $request->validate([
            'peran' => ['required', 'string', 'max:40'],
            'judul' => ['required', 'string', 'max:100'],
            'teks' => ['required', 'string', 'max:400'],
            'poin' => ['nullable', 'array', 'max:6'],
            'poin.*' => ['nullable', 'string', 'max:80'],
            'gambar_bawaan' => ['nullable', 'in:'.implode(',', LandingManfaat::GAMBAR_BAWAAN)],
            'urutan' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'aktif' => ['required', 'boolean'],
            'gambar' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);
        unset($data['gambar']);
        $data['poin'] = $this->daftarBersih($data['poin'] ?? []);
        $data['gambar_bawaan'] ??= null;

        return $this->tanpaUrutanKosong($data);
    }

    /** Buang baris kosong dari daftar teks (poin/meta) dan rapikan indeksnya. */
    private function daftarBersih(array $daftar): array
    {
        return array_values(array_filter(array_map(fn ($x) => trim((string) $x), $daftar), fn ($x) => $x !== ''));
    }

    private function validasiTestimoni(Request $request): array
    {
        return $this->tanpaUrutanKosong($request->validate([
            'kutipan' => ['required', 'string', 'max:600'],
            'nama' => ['required', 'string', 'max:100'],
            'jabatan' => ['nullable', 'string', 'max:100'],
            'sekolah' => ['nullable', 'string', 'max:150'],
            'urutan' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'aktif' => ['required', 'boolean'],
        ]));
    }

    /** Urutan kosong = biarkan (update) atau taruh di paling akhir (tambah). */
    private function tanpaUrutanKosong(array $data): array
    {
        if (($data['urutan'] ?? null) === null) {
            unset($data['urutan']);
        }

        return $data;
    }

    private function simpanGambar(Request $request): string
    {
        return basename($request->file('gambar')->store(self::FOLDER_GAMBAR, 'public'));
    }

    private function hapusGambar(?string $file): void
    {
        if ($file) {
            Storage::disk('public')->delete(self::FOLDER_GAMBAR.'/'.$file);
        }
    }

    private function segarkan(): void
    {
        Cache::forget(self::CACHE_KEY);
    }
}
