<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\EkskulHelpers;
use App\Http\Controllers\Controller;
use App\Models\Ekskul;
use App\Models\EkskulAnggota;
use App\Models\EkskulKegiatan;
use App\Models\EkskulPenilaian;
use App\Models\Guru;
use App\Models\Semester;
use App\Models\TahunAjaran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

/** Master data ekstrakurikuler (per tahun ajaran & semester). */
class EkskulController extends Controller
{
    use EkskulHelpers;

    public function opsi(): JsonResponse
    {
        $semesterAktif = Semester::where('is_active', true)->value('nama');

        return response()->json([
            'tahun_ajaran' => TahunAjaran::orderByDesc('id')->get(['id', 'nama', 'is_active']),
            'semester_aktif' => $semesterAktif ? strtolower($semesterAktif) : null,
            'guru' => Guru::orderBy('nama')->get(['id', 'nama']),
            'kategori' => collect(self::KATEGORI)->map(fn ($l, $k) => ['key' => $k, 'label' => $l])->values(),
            'hari' => self::HARI,
            'jenis_kegiatan' => collect(self::JENIS_KEGIATAN)->map(fn ($l, $k) => ['key' => $k, 'label' => $l])->values(),
            'aspek_bawaan' => self::ASPEK_BAWAAN,
            'skala_predikat' => [['A', 'Sangat Baik', '≥ 90'], ['B', 'Baik', '80 – 89,99'], ['C', 'Cukup', '70 – 79,99'], ['D', 'Perlu Bimbingan', '< 70']],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $in = $request->validate([
            'tahun_ajaran_id' => ['nullable', 'integer'], 'semester' => ['nullable', 'in:ganjil,genap'], 'kategori' => ['nullable', 'string'],
            'status' => ['nullable', 'in:aktif,nonaktif'], 'pembina_id' => ['nullable', 'integer'], 'search' => ['nullable', 'string', 'max:100'],
        ]);

        return response()->json(
            Ekskul::query()
                ->when(! empty($in['tahun_ajaran_id']), fn ($q) => $q->where('tahun_ajaran_id', $in['tahun_ajaran_id']))
                ->when(! empty($in['semester']), fn ($q) => $q->where('semester', $in['semester']))
                ->when(! empty($in['kategori']), fn ($q) => $q->where('kategori', $in['kategori']))
                ->when(! empty($in['status']), fn ($q) => $q->where('status', $in['status']))
                ->when(! empty($in['pembina_id']), fn ($q) => $q->where('pembina_guru_id', $in['pembina_id']))
                ->when(! empty($in['search']), fn ($q) => $q->where(fn ($w) => $w->where('nama', 'like', '%'.$in['search'].'%')->orWhere('pelatih', 'like', '%'.$in['search'].'%')->orWhere('tempat', 'like', '%'.$in['search'].'%')))
                ->orderBy('nama')->get()->map(fn (Ekskul $e) => $this->present($e))
        );
    }

    public function show(Ekskul $ekskul): JsonResponse
    {
        $hariIni = now()->toDateString();

        return response()->json($this->present($ekskul) + [
            'kegiatan_mendatang' => EkskulKegiatan::where('ekskul_id', $ekskul->id)->where('tanggal', '>=', $hariIni)->where('status', '!=', 'dibatalkan')->orderBy('tanggal')->limit(5)->get(['id', 'tanggal', 'hari', 'jam_mulai', 'jam_selesai', 'jenis', 'materi'])
                ->map(fn ($k) => ['id' => $k->id, 'tanggal' => substr((string) $k->tanggal, 0, 10), 'hari' => $k->hari, 'jam' => $this->hm($k->jam_mulai).'–'.$this->hm($k->jam_selesai), 'jenis' => self::JENIS_KEGIATAN[$k->jenis], 'materi' => $k->materi]),
            'jumlah_kegiatan' => EkskulKegiatan::where('ekskul_id', $ekskul->id)->count(),
            'jumlah_anggota_total' => EkskulAnggota::where('ekskul_id', $ekskul->id)->count(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validasi($request, null);
        $ekskul = Ekskul::create($data + ['dibuat_oleh' => $request->user()?->id]);
        $this->logEkskul($request, $ekskul, 'created', "Menambahkan ekstrakurikuler \"{$ekskul->nama}\".", ['sebelum' => null, 'sesudah' => $data]);

        return response()->json($this->present($ekskul), 201);
    }

    public function update(Request $request, Ekskul $ekskul): JsonResponse
    {
        $data = $this->validasi($request, $ekskul);
        $lama = $ekskul->only(array_keys($data));
        $ekskul->update($data);
        $berubah = array_filter($data, fn ($v, $k) => json_encode($lama[$k]) !== json_encode($v), ARRAY_FILTER_USE_BOTH);
        if ($berubah) {
            $this->logEkskul($request, $ekskul, 'updated', "Mengubah ekstrakurikuler \"{$ekskul->nama}\".", ['sebelum' => array_intersect_key($lama, $berubah), 'sesudah' => $berubah]);
        }

        return response()->json($this->present($ekskul->fresh()));
    }

    public function status(Request $request, Ekskul $ekskul): JsonResponse
    {
        $in = $request->validate(['status' => ['required', 'in:aktif,nonaktif']]);
        $lama = $ekskul->status;
        $ekskul->update(['status' => $in['status']]);
        $this->logEkskul($request, $ekskul, 'status', "Ekstrakurikuler \"{$ekskul->nama}\" ".($in['status'] === 'aktif' ? 'diaktifkan' : 'dinonaktifkan').'.', ['sebelum' => ['status' => $lama], 'sesudah' => ['status' => $in['status']]]);

        return response()->json($this->present($ekskul));
    }

    public function destroy(Request $request, Ekskul $ekskul): JsonResponse
    {
        if (EkskulAnggota::where('ekskul_id', $ekskul->id)->exists() || EkskulKegiatan::where('ekskul_id', $ekskul->id)->exists() || EkskulPenilaian::where('ekskul_id', $ekskul->id)->exists()) {
            throw ValidationException::withMessages(['ekskul' => 'Ekstrakurikuler yang sudah memiliki peserta, kegiatan, atau nilai tidak dapat dihapus. Nonaktifkan saja agar riwayatnya tetap tersimpan.']);
        }
        if ($ekskul->logo_path) {
            Storage::disk('local')->delete($ekskul->logo_path);
        }
        $this->logEkskul($request, $ekskul, 'deleted', "Menghapus ekstrakurikuler \"{$ekskul->nama}\".", ['sebelum' => ['nama' => $ekskul->nama], 'sesudah' => null]);
        $ekskul->delete();

        return response()->json(['message' => 'Ekstrakurikuler dihapus.']);
    }

    // ------------------------------------------------------------------- logo

    public function unggahLogo(Request $request, Ekskul $ekskul): JsonResponse
    {
        $request->validate(['file' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:2048']]);
        if ($ekskul->logo_path) {
            Storage::disk('local')->delete($ekskul->logo_path);
        }
        $ekskul->update(['logo_path' => $request->file('file')->store("ekskul/{$ekskul->id}", 'local')]);
        $this->logEkskul($request, $ekskul, 'logo', "Mengunggah logo/foto \"{$ekskul->nama}\".");

        return response()->json($this->present($ekskul));
    }

    public function hapusLogo(Request $request, Ekskul $ekskul): JsonResponse
    {
        if ($ekskul->logo_path) {
            Storage::disk('local')->delete($ekskul->logo_path);
            $ekskul->update(['logo_path' => null]);
            $this->logEkskul($request, $ekskul, 'logo', "Menghapus logo/foto \"{$ekskul->nama}\".");
        }

        return response()->json($this->present($ekskul));
    }

    public function logo(Ekskul $ekskul): Response
    {
        abort_unless($ekskul->logo_path && Storage::disk('local')->exists($ekskul->logo_path), 404);

        return Storage::disk('local')->response($ekskul->logo_path);
    }

    // -------------------------------------------------------------- duplikasi

    /** Salin master ekstrakurikuler dari satu tahun ajaran/semester ke yang lain (tanpa peserta, kegiatan, dan nilai). */
    public function duplikasi(Request $request): JsonResponse
    {
        $in = $request->validate([
            'tahun_ajaran_sumber_id' => ['required', 'integer', 'exists:tahun_ajaran,id'], 'semester_sumber' => ['required', 'in:ganjil,genap'],
            'tahun_ajaran_tujuan_id' => ['required', 'integer', 'exists:tahun_ajaran,id'], 'semester_tujuan' => ['required', 'in:ganjil,genap'],
            'ids' => ['nullable', 'array'], 'ids.*' => ['integer'],
        ]);
        if ($in['tahun_ajaran_sumber_id'] === $in['tahun_ajaran_tujuan_id'] && $in['semester_sumber'] === $in['semester_tujuan']) {
            throw ValidationException::withMessages(['tahun_ajaran_tujuan_id' => 'Sumber dan tujuan tidak boleh sama.']);
        }

        $sumber = Ekskul::where('tahun_ajaran_id', $in['tahun_ajaran_sumber_id'])->where('semester', $in['semester_sumber'])
            ->when(! empty($in['ids']), fn ($q) => $q->whereIn('id', $in['ids']))->get();
        if ($sumber->isEmpty()) {
            throw ValidationException::withMessages(['tahun_ajaran_sumber_id' => 'Tidak ada ekstrakurikuler pada tahun ajaran dan semester sumber.']);
        }

        $ada = Ekskul::where('tahun_ajaran_id', $in['tahun_ajaran_tujuan_id'])->where('semester', $in['semester_tujuan'])->pluck('nama')->map(fn ($n) => mb_strtolower($n))->all();
        $disalin = 0;
        $dilewati = [];
        foreach ($sumber as $e) {
            if (in_array(mb_strtolower($e->nama), $ada, true)) {
                $dilewati[] = $e->nama;

                continue;
            }
            $baru = Ekskul::create([
                'tahun_ajaran_id' => $in['tahun_ajaran_tujuan_id'], 'semester' => $in['semester_tujuan'], 'status' => 'aktif', 'disalin_dari_id' => $e->id, 'dibuat_oleh' => $request->user()?->id,
            ] + $e->only(['nama', 'kategori', 'deskripsi', 'pembina_guru_id', 'pelatih', 'hari', 'jam_mulai', 'jam_selesai', 'tempat', 'kuota', 'persyaratan', 'aspek_penilaian']));
            if ($e->logo_path && Storage::disk('local')->exists($e->logo_path)) {
                $tujuan = "ekskul/{$baru->id}/".basename($e->logo_path);
                Storage::disk('local')->copy($e->logo_path, $tujuan);
                $baru->update(['logo_path' => $tujuan]);
            }
            $this->logEkskul($request, $baru, 'duplikasi', "Menyalin ekstrakurikuler \"{$baru->nama}\" dari periode sebelumnya.", ['sebelum' => null, 'sesudah' => ['disalin_dari_id' => $e->id]]);
            $disalin++;
        }

        return response()->json(['disalin' => $disalin, 'dilewati' => $dilewati, 'message' => "{$disalin} ekstrakurikuler disalin".($dilewati ? ', '.count($dilewati).' dilewati karena namanya sudah ada di tujuan.' : '.')]);
    }

    // ------------------------------------------------------------- pembantu

    public function present(Ekskul $e): array
    {
        $terisi = $this->terisi($e);

        return [
            'id' => $e->id, 'tahun_ajaran_id' => $e->tahun_ajaran_id, 'tahun_ajaran' => TahunAjaran::whereKey($e->tahun_ajaran_id)->value('nama'), 'semester' => $e->semester,
            'nama' => $e->nama, 'kategori' => $e->kategori, 'kategori_label' => self::KATEGORI[$e->kategori], 'deskripsi' => $e->deskripsi,
            'pembina_guru_id' => $e->pembina_guru_id, 'pembina' => $e->pembina_guru_id ? Guru::whereKey($e->pembina_guru_id)->value('nama') : null, 'pelatih' => $e->pelatih,
            'hari' => $e->hari, 'jam_mulai' => $this->hm($e->jam_mulai), 'jam_selesai' => $this->hm($e->jam_selesai), 'tempat' => $e->tempat,
            'kuota' => $e->kuota, 'terisi' => $terisi, 'sisa_kuota' => $e->kuota !== null ? max(0, $e->kuota - $terisi) : null,
            'persyaratan' => $e->persyaratan, 'aspek_penilaian' => $e->aspek_penilaian ?? [], 'status' => $e->status, 'punya_logo' => (bool) $e->logo_path,
            'disalin_dari_id' => $e->disalin_dari_id,
        ];
    }

    private function validasi(Request $request, ?Ekskul $ada): array
    {
        $d = $request->validate([
            'tahun_ajaran_id' => ['required', 'integer', 'exists:tahun_ajaran,id'],
            'semester' => ['required', 'in:ganjil,genap'],
            'nama' => ['required', 'string', 'max:255'],
            'kategori' => ['required', 'in:'.implode(',', array_keys(self::KATEGORI))],
            'deskripsi' => ['nullable', 'string', 'max:3000'],
            'pembina_guru_id' => ['nullable', 'integer', 'exists:guru,id'],
            'pelatih' => ['nullable', 'string', 'max:255'],
            'hari' => ['nullable', 'in:'.implode(',', self::HARI)],
            'jam_mulai' => ['nullable', 'date_format:H:i'],
            'jam_selesai' => ['nullable', 'date_format:H:i', 'after:jam_mulai'],
            'tempat' => ['nullable', 'string', 'max:255'],
            'kuota' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'persyaratan' => ['nullable', 'string', 'max:2000'],
            'aspek_penilaian' => ['nullable', 'array', 'max:12'],
            'aspek_penilaian.*' => ['string', 'max:60', 'distinct'],
            'status' => ['nullable', 'in:aktif,nonaktif'],
        ]);

        if (Ekskul::where('tahun_ajaran_id', $d['tahun_ajaran_id'])->where('semester', $d['semester'])->whereRaw('lower(nama) = ?', [mb_strtolower($d['nama'])])->when($ada, fn ($q) => $q->where('id', '!=', $ada->id))->exists()) {
            throw ValidationException::withMessages(['nama' => 'Nama ekstrakurikuler sudah ada pada tahun ajaran dan semester ini.']);
        }
        if ($ada && ! empty($d['kuota']) && $d['kuota'] < $this->terisi($ada)) {
            throw ValidationException::withMessages(['kuota' => "Kuota ({$d['kuota']}) lebih kecil dari peserta aktif saat ini (".$this->terisi($ada).').']);
        }
        if (($d['jam_mulai'] ?? null) xor ($d['jam_selesai'] ?? null)) {
            throw ValidationException::withMessages(['jam_selesai' => 'Isi jam mulai dan jam selesai bersamaan.']);
        }
        $d['status'] = $d['status'] ?? ($ada?->status ?? 'aktif');
        $d['aspek_penilaian'] = array_values($d['aspek_penilaian'] ?? []);

        return collect($d)->map(fn ($v) => is_string($v) && trim($v) === '' ? null : $v)->all();
    }
}
