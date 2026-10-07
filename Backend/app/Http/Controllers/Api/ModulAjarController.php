<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CapaianPembelajaran;
use App\Models\Guru;
use App\Models\JadwalPelajaran;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\ModulAjar;
use App\Models\ModulAjarLampiran;
use App\Models\TahunAjaran;
use App\Models\TujuanPembelajaran;
use App\Support\DokumenModulAjar;
use App\Support\StrukturPerangkatAjar;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

/**
 * Perangkat ajar milik guru (RPP K13 / Modul Ajar Kurikulum Merdeka):
 * simpan draf (termasuk simpan otomatis), ajukan ke peninjau, lampiran,
 * pratinjau, dan unduh PDF/Word. Persetujuan ada di
 * ReviewPerangkatAjarController.
 */
class ModulAjarController extends Controller
{
    private function guruFor(Request $request): Guru
    {
        $guru = $request->user()->guru;

        abort_unless($guru, 403, 'Akun ini tidak tertaut ke profil guru.');

        return $guru;
    }

    private function ownedOrFail(Request $request, ModulAjar $modul): ModulAjar
    {
        abort_unless($modul->guru_id === $this->guruFor($request)->id, 403);

        return $modul;
    }

    private function k13Aktif(): bool
    {
        return (bool) (tenant()?->resolvedModuleSettings()['rpp_k13'] ?? true);
    }

    public function index(Request $request): JsonResponse
    {
        $guru = $this->guruFor($request);

        return response()->json(
            ModulAjar::where('guru_id', $guru->id)
                ->with(['lampiran', 'peninjau:id,name'])
                ->orderByDesc('updated_at')
                ->get()
        );
    }

    /** Data pendukung form: identitas otomatis, kelas & mapel yang diajar, opsi K13. */
    public function opsi(Request $request): JsonResponse
    {
        $guru = $this->guruFor($request);
        $jenjang = tenant('jenjang');

        return response()->json([
            'identitas' => [
                'nama_guru' => $this->namaGuru($guru),
                'nip_guru' => $guru->nip,
                'institusi' => tenant('nama_sekolah'),
                'kota' => tenant('kabupaten_kota'),
                'jenjang' => $jenjang,
                'tahun_penyusunan' => (string) now()->year,
                'tahun_ajaran' => $this->tahunAjaranAktif(),
            ],
            'menit_per_jp' => StrukturPerangkatAjar::menitPerJp($jenjang),
            'k13_aktif' => $this->k13Aktif(),
            'mengajar' => JadwalPelajaran::mengajarGuru($guru->id),
            'jenis_lampiran' => ModulAjarLampiran::JENIS,
        ]);
    }

    /** CP aktif (data master Kurikulum) untuk mapel & fase, beserta TP-nya. */
    public function capaian(Request $request): JsonResponse
    {
        $this->guruFor($request);
        $q = $request->validate([
            'mata_pelajaran_id' => ['required', 'integer'],
            'fase' => ['required', 'string', 'max:5'],
            'tingkat' => ['nullable', 'string', 'max:20'],
        ]);

        $cp = CapaianPembelajaran::where('mata_pelajaran_id', $q['mata_pelajaran_id'])
            ->where('fase', $q['fase'])
            ->where('status', 'aktif')
            ->with(['tujuanPembelajaran' => fn ($t) => $t->where('status', 'aktif')
                ->when($q['tingkat'] ?? null, fn ($t, $tingkat) => $t->where('tingkat', $tingkat))
                ->orderBy('semester')->orderBy('urutan')])
            ->orderBy('elemen')
            ->get(['id', 'elemen', 'deskripsi', 'fase']);

        return response()->json($cp->map(fn ($c) => [
            'id' => $c->id,
            'elemen' => $c->elemen,
            'deskripsi' => $c->deskripsi,
            'tujuan' => $c->tujuanPembelajaran->map(fn ($t) => [
                'id' => $t->id, 'deskripsi' => $t->deskripsi, 'semester' => $t->semester, 'tingkat' => $t->tingkat,
            ])->values(),
        ]));
    }

    public function store(Request $request): JsonResponse
    {
        $guru = $this->guruFor($request);
        $request->validate(['kurikulum' => ['required', 'in:merdeka,k13']]);
        abort_if($request->input('kurikulum') === 'k13' && ! $this->k13Aktif(), 403, 'RPP Kurikulum 2013 tidak diaktifkan untuk sekolah Anda.');

        $modul = new ModulAjar(['kurikulum' => $request->input('kurikulum'), 'status' => ModulAjar::DRAFT]);
        $modul->guru_id = $guru->id;
        $this->isiDariRequest($request, $guru, $modul)->save();

        return response()->json($this->muat($modul), 201);
    }

    /** Simpan draf (juga dipakai simpan otomatis). */
    public function update(Request $request, ModulAjar $modul): JsonResponse
    {
        $guru = $this->guruFor($request);
        $this->ownedOrFail($request, $modul);
        abort_unless($modul->bisaDiubahGuru(), 422, 'Perangkat ajar yang sedang diajukan atau sudah disetujui tidak bisa diubah.');

        $this->isiDariRequest($request, $guru, $modul)->save();

        return response()->json($this->muat($modul));
    }

    public function ajukan(Request $request, ModulAjar $modul): JsonResponse
    {
        $this->ownedOrFail($request, $modul);
        abort_unless($modul->bisaDiubahGuru(), 422, 'Perangkat ajar ini sudah diajukan atau disetujui.');

        $kurang = StrukturPerangkatAjar::kekurangan($modul->toArray());
        if ($kurang) {
            throw ValidationException::withMessages(['kekurangan' => $kurang]);
        }

        $modul->update(['status' => ModulAjar::DIAJUKAN, 'diajukan_at' => now()]);

        return response()->json($this->muat($modul));
    }

    /** Tarik kembali pengajuan yang belum ditinjau, supaya bisa diubah lagi. */
    public function tarik(Request $request, ModulAjar $modul): JsonResponse
    {
        $this->ownedOrFail($request, $modul);
        abort_unless($modul->status === ModulAjar::DIAJUKAN, 422, 'Hanya pengajuan yang belum ditinjau yang bisa ditarik.');

        $modul->update(['status' => ModulAjar::DRAFT, 'diajukan_at' => null]);

        return response()->json($this->muat($modul));
    }

    public function destroy(Request $request, ModulAjar $modul): JsonResponse
    {
        $this->ownedOrFail($request, $modul);
        abort_if($modul->status === ModulAjar::DISETUJUI, 422, 'Perangkat ajar yang sudah disetujui tidak bisa dihapus.');

        foreach ($modul->lampiran as $l) {
            Storage::disk('local')->delete($l->path);
        }
        $modul->delete();

        return response()->json(['message' => 'Perangkat ajar dihapus.']);
    }

    public function unggahLampiran(Request $request, ModulAjar $modul): JsonResponse
    {
        $this->ownedOrFail($request, $modul);
        abort_unless($modul->bisaDiubahGuru(), 422, 'Lampiran hanya bisa diubah saat draf atau revisi.');
        abort_if($modul->lampiran()->count() >= 10, 422, 'Maksimal 10 lampiran per perangkat ajar.');

        $data = $request->validate([
            'jenis' => ['required', Rule::in(array_keys(ModulAjarLampiran::JENIS))],
            'file' => ['required', 'file', 'max:10240', 'mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png'],
        ], [
            'file.max' => 'Ukuran file maksimal 10 MB.',
            'file.mimes' => 'Format file harus PDF, Word, Excel, PowerPoint, atau gambar (JPG/PNG).',
        ]);

        $file = $data['file'];
        $lampiran = $modul->lampiran()->create([
            'jenis' => $data['jenis'],
            'nama_file' => mb_substr($file->getClientOriginalName(), 0, 200),
            'path' => $file->store('modul-ajar/lampiran', 'local'),
            'ukuran' => $file->getSize(),
        ]);
        $modul->touch();

        return response()->json($lampiran, 201);
    }

    public function hapusLampiran(Request $request, ModulAjar $modul, ModulAjarLampiran $lampiran): JsonResponse
    {
        $this->ownedOrFail($request, $modul);
        abort_unless($lampiran->modul_ajar_id === $modul->id, 404);
        abort_unless($modul->bisaDiubahGuru(), 422, 'Lampiran hanya bisa diubah saat draf atau revisi.');

        Storage::disk('local')->delete($lampiran->path);
        $lampiran->delete();

        return response()->json(['message' => 'Lampiran dihapus.']);
    }

    public function unduhLampiran(Request $request, ModulAjar $modul, ModulAjarLampiran $lampiran): Response
    {
        $this->ownedOrFail($request, $modul);
        abort_unless($lampiran->modul_ajar_id === $modul->id, 404);

        return Storage::disk('local')->download($lampiran->path, $lampiran->nama_file);
    }

    /** Unduh perangkat ajar tersimpan sebagai dokumen PDF atau Word (.docx). */
    public function unduh(Request $request, ModulAjar $modul, string $format): Response
    {
        $this->ownedOrFail($request, $modul);

        return (new DokumenModulAjar($modul->load(['guru', 'lampiran', 'peninjau'])))->respons($format);
    }

    /** Pratinjau/ekspor isian form yang belum disimpan. */
    public function pratinjau(Request $request, string $format): Response
    {
        $guru = $this->guruFor($request);
        $request->validate(['kurikulum' => ['required', 'in:merdeka,k13']]);

        $modul = $request->filled('id')
            ? $this->ownedOrFail($request, ModulAjar::findOrFail($request->integer('id')))->replicate()
            : new ModulAjar(['status' => ModulAjar::DRAFT]);
        $modul->kurikulum = $request->input('kurikulum');
        $modul->guru_id = $guru->id;
        $this->isiDariRequest($request, $guru, $modul);
        $modul->setRelation('guru', $guru);
        $modul->setRelation('lampiran', $request->filled('id') ? ModulAjarLampiran::where('modul_ajar_id', $request->integer('id'))->get() : collect());

        return (new DokumenModulAjar($modul))->respons($format);
    }

    /**
     * Isi model dari request: kelas & mapel harus dari jadwal mengajar guru,
     * identitas (nama guru, sekolah, jenjang, fase) diisi oleh sistem,
     * CP/TP diambil dari data master, teks berformat dibersihkan.
     */
    private function isiDariRequest(Request $request, Guru $guru, ModulAjar $modul): ModulAjar
    {
        $v = $request->validate([
            'judul' => ['required', 'string', 'max:255'],
            'mata_pelajaran_id' => ['nullable', 'integer'],
            'kelas_id' => ['nullable', 'integer'],
            'data' => ['required', 'array'],
            'data.cp_ids' => ['nullable', 'array', 'max:20'],
            'data.cp_ids.*' => ['integer'],
            'data.tp_ids' => ['nullable', 'array', 'max:50'],
            'data.tp_ids.*' => ['integer'],
        ], ['judul.required' => 'Judul wajib diisi.']);

        $mapelId = $v['mata_pelajaran_id'] ?? null;
        $kelasId = $v['kelas_id'] ?? null;
        if ($mapelId || $kelasId) {
            $diajar = JadwalPelajaran::where('guru_id', $guru->id)
                ->when($mapelId, fn ($q) => $q->where('mata_pelajaran_id', $mapelId))
                ->when($kelasId, fn ($q) => $q->where('kelas_id', $kelasId))
                ->exists();
            if (! $diajar) {
                throw ValidationException::withMessages(['kelas_id' => 'Pilih kelas dan mata pelajaran sesuai jadwal mengajar Anda.']);
            }
        }
        $mapel = $mapelId ? MataPelajaran::find($mapelId) : null;
        $kelas = $kelasId ? Kelas::find($kelasId) : null;

        $lama = $modul->data ?? [];
        // Isi `data` diambil utuh dari request (validated() hanya memuat kunci
        // yang punya aturan), lalu dibersihkan sesuai struktur kurikulum.
        $masukan = (array) $request->input('data', []);
        $data = StrukturPerangkatAjar::bersihkan($masukan, $modul->kurikulum);

        // Identitas diisi otomatis dari akun & sekolah bila dikosongkan; guru
        // tetap boleh mengubahnya di form.
        $data['nama_guru'] = ($data['nama_guru'] ?? '') ?: $this->namaGuru($guru);
        $data['jenjang'] = ($data['jenjang'] ?? '') ?: tenant('jenjang');
        $data['tahun_penyusunan'] = ($data['tahun_penyusunan'] ?? '') ?: ($lama['tahun_penyusunan'] ?? (string) now()->year);
        if ($modul->kurikulum === 'merdeka') {
            $data['institusi'] = ($data['institusi'] ?? '') ?: tenant('nama_sekolah');
            $data['nip_guru'] = ($data['nip_guru'] ?? '') ?: (string) $guru->nip;
            $data['kota'] = ($data['kota'] ?? '') ?: (string) tenant('kabupaten_kota');
            $data['tahun_ajaran'] = ($data['tahun_ajaran'] ?? '') ?: (string) $this->tahunAjaranAktif();
            // Fase selalu dari tingkat kelas yang dipilih (tidak diisi guru).
            $data['fase'] = $kelas ? StrukturPerangkatAjar::faseDariTingkat($kelas->tingkat) : null;
        } else {
            $data['nama_sekolah'] = ($data['nama_sekolah'] ?? '') ?: tenant('nama_sekolah');
        }

        if ($modul->kurikulum === 'merdeka') {
            $cp = $mapelId
                ? CapaianPembelajaran::whereIn('id', array_map('intval', (array) ($masukan['cp_ids'] ?? [])))->where('mata_pelajaran_id', $mapelId)->get(['id', 'elemen', 'deskripsi'])
                : collect();
            $data['cp_ids'] = $cp->pluck('id')->all();
            $data['cp'] = $cp->map(fn ($c) => ['id' => $c->id, 'elemen' => $c->elemen, 'deskripsi' => $c->deskripsi])->all();

            $tp = $cp->isNotEmpty()
                ? TujuanPembelajaran::whereIn('id', array_map('intval', (array) ($masukan['tp_ids'] ?? [])))->whereIn('capaian_pembelajaran_id', $data['cp_ids'])->orderBy('urutan')->get(['id', 'deskripsi', 'capaian_pembelajaran_id'])
                : collect();
            $elemen = $cp->pluck('elemen', 'id');
            $data['tp_ids'] = $tp->pluck('id')->all();
            // Elemen ikut disimpan untuk rekap "TP per elemen" di penutup dokumen.
            $data['tp_master'] = $tp->map(fn ($t) => ['id' => $t->id, 'deskripsi' => $t->deskripsi, 'elemen' => $elemen[$t->capaian_pembelajaran_id] ?? null])->all();
        }

        $modul->fill([
            'judul' => trim($v['judul']),
            'mata_pelajaran_id' => $mapel?->id,
            'mata_pelajaran' => $mapel?->nama_mapel,
            'kelas_id' => $kelas?->id,
            'kelas' => $kelas?->nama_kelas,
            'data' => $data,
        ]);

        return $modul;
    }

    private function muat(ModulAjar $modul): ModulAjar
    {
        return $modul->fresh(['lampiran', 'peninjau:id,name']);
    }

    /** Nama tahun ajaran aktif (mis. "2025/2026"), untuk diisikan otomatis. */
    private function tahunAjaranAktif(): ?string
    {
        return TahunAjaran::where('is_active', true)->value('nama');
    }

    private function namaGuru(?Guru $guru): ?string
    {
        return $guru ? (implode(', ', array_filter([$guru->nama, $guru->gelar])) ?: null) : null;
    }
}
