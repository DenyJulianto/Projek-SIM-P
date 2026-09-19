<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\Kelas;
use App\Models\ProgramSemester;
use App\Models\ProgramTahunan;
use App\Models\StrukturKurikulum;
use App\Models\TahunAjaran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Spatie\Activitylog\Models\Activity;

/**
 * Kelas / rombongan belajar: satu baris = satu rombel (mis. "7A") pada satu
 * tahun ajaran, lengkap dengan tingkat, fase, kurikulum, kapasitas, dan wali
 * kelas. Kelas yang masih berisi siswa aktif tidak bisa dinonaktifkan dan
 * kelas yang sudah dipakai data lain tidak bisa dihapus; perubahan dicatat
 * lewat activity log untuk riwayat.
 */
class KelasController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $kelas = Kelas::query()
            ->with('waliKelas:id,nama')
            ->withCount(['siswa as siswa_aktif_count' => fn ($q) => $q->where('status', 'aktif')])
            ->when($request->filled('search'), function ($q) use ($request) {
                $like = '%'.$request->string('search')->trim().'%';
                $q->where(fn ($qq) => $qq->where('nama_kelas', 'like', $like)->orWhere('jurusan', 'like', $like));
            })
            ->when($request->filled('tahun_ajaran_id'), fn ($q) => $q->where('tahun_ajaran_id', $request->integer('tahun_ajaran_id')))
            ->when($request->filled('tingkat'), fn ($q) => $q->where('tingkat', $request->string('tingkat')->value()))
            ->when($request->filled('fase'), fn ($q) => $q->where('fase', $request->string('fase')->value()))
            ->when($request->filled('kurikulum'), fn ($q) => $q->where('kurikulum', $request->string('kurikulum')->value()))
            ->when($request->filled('jenjang'), fn ($q) => $q->where('jenjang', $request->string('jenjang')->value()))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')->value()))
            ->when($request->filled('wali_kelas_id'), fn ($q) => $q->where('wali_kelas_id', $request->integer('wali_kelas_id')))
            ->orderBy('tingkat')
            ->orderBy('nama_kelas')
            ->paginate($request->integer('per_page', 15));

        return response()->json($kelas);
    }

    /** Pilihan untuk form Kelas (role Kurikulum tidak punya akses ke /guru). */
    public function opsi(): JsonResponse
    {
        return response()->json([
            'tahun_ajaran' => TahunAjaran::orderByDesc('id')->get(['id', 'nama', 'is_active']),
            'guru' => Guru::orderBy('nama')->get(['id', 'nama']),
            'jenjang_sekolah' => tenant()->jenjang,
            'kurikulum' => StrukturKurikulum::query()->whereNotNull('kurikulum')->distinct()->orderBy('kurikulum')->pluck('kurikulum'),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateKelas($request);
        $this->assertBisaDisimpan($data);

        $kelas = Kelas::create($data + ['status' => 'aktif']);
        $kelas->load('waliKelas:id,nama');

        activity()
            ->performedOn($kelas)
            ->causedBy($request->user())
            ->event('created')
            ->withProperties(['new' => $this->snapshot($kelas)])
            ->log("Menambahkan kelas \"{$kelas->nama_kelas}\" ({$kelas->tahun_ajaran}).");

        return response()->json($kelas, 201);
    }

    public function show(Kelas $kela): JsonResponse
    {
        $kela->load('waliKelas:id,nama');

        $siswa = $kela->siswa()->orderBy('nama')->get(['id', 'nis', 'nisn', 'nama', 'jenis_kelamin', 'status']);

        $rombelSejajar = Kelas::query()
            ->where('id', '!=', $kela->id)
            ->where('tahun_ajaran', $kela->tahun_ajaran)
            ->when($kela->tingkat, fn ($q) => $q->where('tingkat', $kela->tingkat), fn ($q) => $q->whereNull('tingkat'))
            ->with('waliKelas:id,nama')
            ->withCount(['siswa as siswa_aktif_count' => fn ($q) => $q->where('status', 'aktif')])
            ->orderBy('nama_kelas')
            ->get(['id', 'nama_kelas', 'jurusan', 'kapasitas', 'status', 'wali_kelas_id']);

        $riwayat = Activity::where('subject_type', Kelas::class)
            ->where('subject_id', $kela->id)
            ->with('causer:id,name')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get()
            ->map(fn (Activity $a) => [
                'id' => $a->id,
                'event' => $a->event,
                'description' => $a->description,
                'causer' => $a->causer?->name,
                'properties' => $a->properties,
                'created_at' => $a->created_at,
            ]);

        return response()->json([
            ...$kela->toArray(),
            'siswa_aktif_count' => $siswa->where('status', 'aktif')->count(),
            'siswa' => $siswa,
            'rombel_sejajar' => $rombelSejajar,
            'riwayat' => $riwayat,
        ]);
    }

    public function update(Request $request, Kelas $kela): JsonResponse
    {
        $data = $this->validateKelas($request);
        $this->assertBisaDisimpan($data, $kela);

        $kela->load('waliKelas:id,nama');
        $old = $this->snapshot($kela);

        $kela->update($data);
        $kela->load('waliKelas:id,nama');
        $new = $this->snapshot($kela);

        if ($old !== $new) {
            activity()
                ->performedOn($kela)
                ->causedBy($request->user())
                ->event('updated')
                ->withProperties(['old' => $old, 'new' => $new])
                ->log("Memperbarui kelas \"{$kela->nama_kelas}\" ({$kela->tahun_ajaran}).");
        }

        return response()->json($kela);
    }

    public function updateStatus(Request $request, Kelas $kela): JsonResponse
    {
        $status = $request->validate(['status' => ['required', 'in:aktif,nonaktif']])['status'];

        if ($status === 'nonaktif') {
            $aktif = $kela->siswa()->where('status', 'aktif')->count();
            if ($aktif > 0) {
                throw ValidationException::withMessages([
                    'status' => "Kelas masih memiliki {$aktif} siswa aktif. Pindahkan atau luluskan siswa terlebih dahulu sebelum menonaktifkan kelas.",
                ]);
            }
        }

        $lama = $kela->status;
        $kela->update(['status' => $status]);

        if ($lama !== $status) {
            activity()
                ->performedOn($kela)
                ->causedBy($request->user())
                ->event('updated')
                ->withProperties(['old' => ['status' => $lama], 'new' => ['status' => $status]])
                ->log(($status === 'aktif' ? 'Mengaktifkan' : 'Menonaktifkan')." kelas \"{$kela->nama_kelas}\".");
        }

        return response()->json($kela->fresh('waliKelas:id,nama'));
    }

    /**
     * Salin kelas ke tahun ajaran lain (mis. saat menyiapkan tahun ajaran
     * baru). Yang disalin hanya pengaturan kelas — siswa tidak ikut pindah.
     */
    public function duplikasi(Request $request, Kelas $kela): JsonResponse
    {
        $input = $request->validate([
            'tahun_ajaran_id' => ['required', 'integer', 'exists:tahun_ajaran,id'],
            'nama_kelas' => ['nullable', 'string', 'max:255'],
            'tingkat' => ['nullable', 'string', 'max:20'],
            'fase' => ['nullable', 'in:A,B,C,D,E,F'],
            'salin_wali_kelas' => ['boolean'],
        ]);

        $data = [
            'nama_kelas' => $input['nama_kelas'] ?? $kela->nama_kelas,
            'tingkat' => $input['tingkat'] ?? $kela->tingkat,
            'jurusan' => $kela->jurusan,
            'jenjang' => $kela->jenjang,
            'fase' => $input['fase'] ?? $kela->fase,
            'kurikulum' => $kela->kurikulum,
            'kapasitas' => $kela->kapasitas,
            'ruang_kelas' => $kela->ruang_kelas,
            'tahun_ajaran_id' => $input['tahun_ajaran_id'],
            'wali_kelas_id' => ($input['salin_wali_kelas'] ?? false) ? $kela->wali_kelas_id : null,
        ];
        $this->assertBisaDisimpan($data);

        $baru = Kelas::create($data + ['status' => 'aktif']);
        $baru->load('waliKelas:id,nama');

        activity()
            ->performedOn($baru)
            ->causedBy($request->user())
            ->event('created')
            ->withProperties(['new' => $this->snapshot($baru), 'disalin_dari' => "{$kela->nama_kelas} ({$kela->tahun_ajaran})"])
            ->log("Menduplikasi kelas \"{$kela->nama_kelas}\" ({$kela->tahun_ajaran}) menjadi \"{$baru->nama_kelas}\" ({$baru->tahun_ajaran}).");

        return response()->json($baru, 201);
    }

    public function destroy(Request $request, Kelas $kela): JsonResponse
    {
        $terpakai = collect([
            'siswa' => $kela->siswa()->count(),
            'jadwal pelajaran' => $kela->jadwalPelajaran()->count(),
            'absensi' => $kela->absensi()->count(),
            'program tahunan' => ProgramTahunan::where('kelas_id', $kela->id)->count(),
            'program semester' => ProgramSemester::where('kelas_id', $kela->id)->count(),
        ])->filter();

        if ($terpakai->isNotEmpty()) {
            $rincian = $terpakai->map(fn ($n, $k) => "{$n} {$k}")->implode(', ');
            throw ValidationException::withMessages([
                'kelas' => "Kelas tidak dapat dihapus karena sudah dipakai ({$rincian}). Nonaktifkan kelas jika tidak digunakan lagi.",
            ]);
        }

        $label = "{$kela->nama_kelas} ({$kela->tahun_ajaran})";
        $kela->delete();

        activity()->causedBy($request->user())->event('deleted')->log("Menghapus kelas \"{$label}\".");

        return response()->json(['message' => 'Kelas berhasil dihapus.']);
    }

    private function validateKelas(Request $request): array
    {
        $data = $request->validate([
            'nama_kelas' => ['required', 'string', 'max:255'],
            'tingkat' => ['nullable', 'string', 'max:20'],
            'jurusan' => ['nullable', 'string', 'max:255'],
            'jenjang' => ['nullable', 'string', 'max:20'],
            'fase' => ['nullable', 'in:A,B,C,D,E,F'],
            'kurikulum' => ['nullable', 'string', 'max:255'],
            'kapasitas' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'ruang_kelas' => ['nullable', 'string', 'max:100'],
            'tahun_ajaran_id' => ['required_without:tahun_ajaran', 'nullable', 'integer', 'exists:tahun_ajaran,id'],
            'tahun_ajaran' => ['required_without:tahun_ajaran_id', 'nullable', 'string', 'max:20'],
            'wali_kelas_id' => ['nullable', 'integer', 'exists:guru,id'],
        ]);

        $data['jenjang'] ??= tenant()->jenjang;

        return $data;
    }

    /**
     * Validasi yang butuh konteks: nama tahun ajaran diselaraskan dengan
     * tahun_ajaran_id, nama kelas unik per tahun ajaran, satu guru hanya
     * menjadi wali satu kelas aktif per tahun ajaran, dan kapasitas tidak
     * boleh di bawah jumlah siswa aktif yang sudah ada.
     */
    private function assertBisaDisimpan(array &$data, ?Kelas $existing = null): void
    {
        if (! empty($data['tahun_ajaran_id'])) {
            $data['tahun_ajaran'] = TahunAjaran::whereKey($data['tahun_ajaran_id'])->value('nama');
        }

        $duplikat = Kelas::where('tahun_ajaran', $data['tahun_ajaran'])
            ->where('nama_kelas', $data['nama_kelas'])
            ->when($existing, fn ($q) => $q->where('id', '!=', $existing->id))
            ->exists();
        if ($duplikat) {
            throw ValidationException::withMessages([
                'nama_kelas' => "Kelas \"{$data['nama_kelas']}\" sudah ada pada tahun ajaran {$data['tahun_ajaran']}.",
            ]);
        }

        if (! empty($data['wali_kelas_id'])) {
            $bentrok = Kelas::where('tahun_ajaran', $data['tahun_ajaran'])
                ->where('wali_kelas_id', $data['wali_kelas_id'])
                ->where('status', 'aktif')
                ->when($existing, fn ($q) => $q->where('id', '!=', $existing->id))
                ->first(['nama_kelas']);
            if ($bentrok) {
                throw ValidationException::withMessages([
                    'wali_kelas_id' => "Guru tersebut sudah menjadi wali kelas {$bentrok->nama_kelas} pada tahun ajaran {$data['tahun_ajaran']}.",
                ]);
            }
        }

        if ($existing && ! empty($data['kapasitas'])) {
            $aktif = $existing->siswa()->where('status', 'aktif')->count();
            if ($data['kapasitas'] < $aktif) {
                throw ValidationException::withMessages([
                    'kapasitas' => "Kapasitas tidak boleh di bawah jumlah siswa aktif saat ini ({$aktif}).",
                ]);
            }
        }
    }

    private function snapshot(Kelas $kelas): array
    {
        return [
            'nama_kelas' => $kelas->nama_kelas,
            'tahun_ajaran' => $kelas->tahun_ajaran,
            'jenjang' => $kelas->jenjang,
            'tingkat' => $kelas->tingkat,
            'fase' => $kelas->fase,
            'jurusan' => $kelas->jurusan,
            'kurikulum' => $kelas->kurikulum,
            'kapasitas' => $kelas->kapasitas,
            'ruang_kelas' => $kelas->ruang_kelas,
            'wali_kelas' => $kelas->waliKelas?->nama,
            'status' => $kelas->status,
        ];
    }
}
