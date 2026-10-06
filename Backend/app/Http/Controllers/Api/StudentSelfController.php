<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Absensi;
use App\Models\JadwalPelajaran;
use App\Models\Materi;
use App\Models\Notifikasi;
use App\Models\Pelanggaran;
use App\Models\Prestasi;
use App\Models\Siswa;
use App\Models\Tagihan;
use App\Models\Tugas;
use App\Models\TugasJawaban;
use App\Models\Ujian;
use App\Models\UjianAttempt;
use App\Models\UjianJawaban;
use App\Models\UjianSoal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * Endpoint self-service untuk siswa — semua method di sini SELALU
 * mengambil profil Siswa dari user yang sedang login (bukan dari
 * parameter request), jadi tidak ada cara bagi siswa untuk melihat data
 * siswa lain lewat endpoint ini. Cukup butuh auth:sanctum, tidak ada
 * permission tambahan yang perlu diberikan ke role apa pun.
 */
class StudentSelfController extends Controller
{
    private function siswaFor(Request $request): Siswa
    {
        $siswa = $request->user()->siswa;

        abort_unless($siswa, 403, 'Akun ini tidak tertaut ke profil siswa.');

        return $siswa;
    }

    public function profil(Request $request): JsonResponse
    {
        return response()->json($this->siswaFor($request)->load('kelas.waliKelas:id,nama'));
    }

    public function jadwal(Request $request): JsonResponse
    {
        $siswa = $this->siswaFor($request);

        $jadwal = JadwalPelajaran::where('kelas_id', $siswa->kelas_id)
            ->with(['mataPelajaran:id,nama_mapel', 'guru:id,nama'])
            ->orderBy('hari')
            ->orderBy('jam_mulai')
            ->get();

        return response()->json($jadwal);
    }

    public function nilai(Request $request): JsonResponse
    {
        $siswa = $this->siswaFor($request);

        $nilai = $siswa->nilai()
            ->with(['mataPelajaran:id,nama_mapel', 'guru:id,nama'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json($nilai);
    }

    public function absensi(Request $request): JsonResponse
    {
        $siswa = $this->siswaFor($request);

        $absensi = $siswa->absensi()
            ->orderByDesc('tanggal')
            ->paginate($request->integer('per_page', 30));

        return response()->json($absensi);
    }

    public function ajukanAbsensi(Request $request): JsonResponse
    {
        $siswa = $this->siswaFor($request);

        $data = $request->validate([
            'tanggal' => ['required', 'date', 'after_or_equal:today'],
            'status' => ['required', 'in:izin,sakit'],
            'keterangan' => ['required', 'string', 'max:500'],
        ]);

        $absensi = Absensi::updateOrCreate(
            ['siswa_id' => $siswa->id, 'tanggal' => $data['tanggal']],
            ['kelas_id' => $siswa->kelas_id, 'status' => $data['status'], 'keterangan' => $data['keterangan']]
        );

        // Beri tahu wali kelas siswa dan guru yang mengajar di kelasnya pada
        // hari tersebut.
        $tanggal = Carbon::parse($data['tanggal'])->locale('id');
        $hari = [1 => 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'][$tanggal->dayOfWeekIso];
        $penerima = JadwalPelajaran::where('kelas_id', $siswa->kelas_id)
            ->where('hari', $hari)
            ->with('guru:id,user_id')
            ->get()
            ->pluck('guru.user_id')
            ->prepend($this->waliKelasUserId($siswa))
            ->filter()
            ->unique();

        foreach ($penerima as $userId) {
            Notifikasi::kirim(
                $userId,
                'izin_siswa',
                "izin_siswa:{$siswa->id}:{$tanggal->toDateString()}",
                "{$siswa->nama} mengajukan ".($data['status'] === 'sakit' ? 'sakit' : 'izin'),
                $this->namaDanKelas($siswa).' tidak masuk pada '.$hari.', '.$tanggal->translatedFormat('j F Y').
                    ' ('.$data['status'].'): '.$data['keterangan'],
                [
                    'siswa_id' => $siswa->id,
                    'kelas_id' => $siswa->kelas_id,
                    'tanggal' => $tanggal->toDateString(),
                ]
            );
        }

        return response()->json($absensi, 201);
    }

    public function updateKeteranganAbsensi(Request $request, Absensi $absensi): JsonResponse
    {
        $siswa = $this->siswaFor($request);

        abort_unless((int) $absensi->siswa_id === (int) $siswa->id, 403, 'Absensi ini bukan milik Anda.');

        $data = $request->validate([
            'keterangan' => ['nullable', 'string', 'max:500'],
        ]);

        $absensi->update($data);

        return response()->json($absensi);
    }

    public function tagihan(Request $request): JsonResponse
    {
        $siswa = $this->siswaFor($request);

        $tagihan = Tagihan::aktif()->where('siswa_id', $siswa->id)
            ->with('pembayaran')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($tagihan);
    }

    /**
     * Saldo uang jajan digital siswa beserta riwayat transaksinya (mis. isi
     * saldo dari orang tua). Read-only — pengisian dilakukan orang tua lewat
     * ParentSelfController::isiSaldo.
     */
    public function saldo(Request $request): JsonResponse
    {
        $siswa = $this->siswaFor($request);

        $riwayat = $siswa->saldoTransaksi()
            ->with('diisiOleh:id,name')
            ->latest()
            ->limit(50)
            ->get();

        return response()->json([
            'saldo' => (float) ($siswa->saldo?->saldo ?? 0),
            'total_masuk' => (float) $siswa->saldoTransaksi()->where('jenis', 'masuk')->sum('jumlah'),
            'total_keluar' => (float) $siswa->saldoTransaksi()->where('jenis', 'keluar')->sum('jumlah'),
            'riwayat' => $riwayat,
        ]);
    }

    public function prestasi(Request $request): JsonResponse
    {
        $siswa = $this->siswaFor($request);

        $prestasi = Prestasi::where('siswa_id', $siswa->id)
            ->orderByDesc('tanggal')
            ->get();

        return response()->json($prestasi);
    }

    public function pelanggaran(Request $request): JsonResponse
    {
        $siswa = $this->siswaFor($request);

        $pelanggaran = Pelanggaran::where('siswa_id', $siswa->id)
            ->orderByDesc('tanggal')
            ->get();

        return response()->json($pelanggaran);
    }

    public function submitPrestasi(Request $request): JsonResponse
    {
        $siswa = $this->siswaFor($request);

        $data = $request->validate([
            'judul' => ['required', 'string', 'max:255'],
            'tingkat' => ['required', 'in:sekolah,kecamatan,kabupaten_kota,provinsi,nasional,internasional'],
            'tanggal' => ['required', 'date', 'before_or_equal:today'],
            'keterangan' => ['nullable', 'string'],
            'file' => ['nullable', 'file', 'max:10240'],
        ]);

        if ($request->hasFile('file')) {
            $data['file'] = $request->file('file')->store('prestasi-bukti', 'public');
        }

        $data['siswa_id'] = $siswa->id;
        $data['sumber'] = 'siswa';
        $data['status'] = 'menunggu';

        $prestasi = Prestasi::create($data);

        return response()->json($prestasi, 201);
    }

    public function destroyPrestasi(Request $request, Prestasi $prestasi): JsonResponse
    {
        $siswa = $this->siswaFor($request);

        abort_unless((int) $prestasi->siswa_id === (int) $siswa->id, 403, 'Prestasi ini bukan milik Anda.');
        abort_unless($prestasi->sumber === 'siswa', 403, 'Prestasi yang dicatat sekolah tidak bisa dihapus dari sini.');

        if ($prestasi->file) {
            Storage::disk('public')->delete($prestasi->file);
        }

        $prestasi->delete();

        return response()->json(['message' => 'Pengajuan prestasi berhasil dihapus.']);
    }

    public function materi(Request $request): JsonResponse
    {
        $siswa = $this->siswaFor($request);

        $materi = Materi::where('kelas_id', $siswa->kelas_id)
            ->when($request->filled('mata_pelajaran_id'), fn ($q) => $q->where('mata_pelajaran_id', $request->integer('mata_pelajaran_id')))
            ->with(['mataPelajaran:id,nama_mapel', 'guru:id,nama'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json($materi);
    }

    public function tugas(Request $request): JsonResponse
    {
        $siswa = $this->siswaFor($request);

        $tugasList = Tugas::where('kelas_id', $siswa->kelas_id)
            ->with(['mataPelajaran:id,nama_mapel', 'guru:id,nama'])
            ->orderByDesc('deadline')
            ->get();

        $jawabanMap = TugasJawaban::where('siswa_id', $siswa->id)
            ->whereIn('tugas_id', $tugasList->pluck('id'))
            ->get()
            ->keyBy('tugas_id');

        $result = $tugasList->map(function ($t) use ($jawabanMap) {
            $t->jawaban_saya = $jawabanMap->get($t->id);

            return $t;
        });

        return response()->json($result);
    }

    public function submitTugas(Request $request, Tugas $tugas): JsonResponse
    {
        $siswa = $this->siswaFor($request);

        abort_unless((int) $tugas->kelas_id === (int) $siswa->kelas_id, 403, 'Tugas ini bukan untuk kelas Anda.');

        $data = $request->validate([
            'jawaban_text' => ['nullable', 'string'],
            'file' => ['nullable', 'file', 'max:10240'],
        ]);

        if ($request->hasFile('file')) {
            $data['file'] = $request->file('file')->store('tugas-jawaban', 'public');
        }

        $data['status'] = 'terkumpul';
        $data['submitted_at'] = now();

        $jawaban = TugasJawaban::updateOrCreate(
            ['tugas_id' => $tugas->id, 'siswa_id' => $siswa->id],
            $data
        );

        // Satu notifikasi per tugas untuk guru pembuatnya, diperbarui setiap
        // ada siswa yang mengumpulkan.
        $terkumpul = TugasJawaban::where('tugas_id', $tugas->id)->whereNotNull('submitted_at')->count();
        $terlambat = $tugas->deadline && now()->greaterThan($tugas->deadline);
        Notifikasi::kirim(
            $tugas->guru?->user_id,
            'tugas_dikumpulkan',
            "tugas_dikumpulkan:{$tugas->id}",
            "{$siswa->nama} mengumpulkan tugas",
            $this->namaDanKelas($siswa)." mengumpulkan \"{$tugas->judul}\"".($terlambat ? ' (terlambat)' : '').
                ". {$terkumpul} siswa sudah mengumpulkan.",
            [
                'tugas_id' => $tugas->id,
                'siswa_id' => $siswa->id,
                'kelas_id' => $tugas->kelas_id,
                'mata_pelajaran_id' => $tugas->mata_pelajaran_id,
            ],
            $terkumpul
        );

        return response()->json($jawaban);
    }

    public function ujianList(Request $request): JsonResponse
    {
        $siswa = $this->siswaFor($request);

        $ujianList = Ujian::where('kelas_id', $siswa->kelas_id)
            ->with(['mataPelajaran:id,nama_mapel', 'guru:id,nama'])
            ->withCount('soal')
            ->orderByDesc('waktu_mulai')
            ->get();

        $attemptMap = UjianAttempt::where('siswa_id', $siswa->id)
            ->whereIn('ujian_id', $ujianList->pluck('id'))
            ->get()
            ->keyBy('ujian_id');

        $now = now();

        $result = $ujianList->map(function ($u) use ($attemptMap, $now) {
            $attempt = $attemptMap->get($u->id);
            $u->attempt_saya = $attempt;
            $u->status = match (true) {
                $attempt && $attempt->finished_at => 'selesai',
                (bool) $attempt => 'berlangsung',
                $now->lt($u->waktu_mulai) => 'belum_mulai',
                $now->gt($u->waktu_selesai) => 'berakhir',
                default => 'bisa_dimulai',
            };

            return $u;
        });

        return response()->json($result);
    }

    public function ujianMulai(Request $request, Ujian $ujian): JsonResponse
    {
        $siswa = $this->siswaFor($request);

        abort_unless((int) $ujian->kelas_id === (int) $siswa->kelas_id, 403, 'Ujian ini bukan untuk kelas Anda.');

        $now = now();
        abort_if($now->lt($ujian->waktu_mulai), 422, 'Ujian belum dimulai.');
        abort_if($now->gt($ujian->waktu_selesai), 422, 'Waktu ujian sudah berakhir.');

        $attempt = UjianAttempt::firstOrCreate(
            ['ujian_id' => $ujian->id, 'siswa_id' => $siswa->id],
            ['started_at' => $now]
        );

        abort_if($attempt->finished_at, 422, 'Anda sudah menyelesaikan ujian ini.');

        $soal = $ujian->soal()->get(['id', 'ujian_id', 'tipe', 'bobot', 'pertanyaan', 'pilihan_a', 'pilihan_b', 'pilihan_c', 'pilihan_d', 'urutan']);
        $jawabanSaya = UjianJawaban::where('ujian_attempt_id', $attempt->id)->get()->keyBy('ujian_soal_id');

        return response()->json([
            'attempt' => $attempt,
            'soal' => $soal->map(function ($s) use ($jawabanSaya) {
                $s->jawaban_dipilih = $jawabanSaya->get($s->id)?->jawaban_dipilih;
                $s->jawaban_essay = $jawabanSaya->get($s->id)?->jawaban_essay;

                return $s;
            }),
        ]);
    }

    /**
     * Catat pelanggaran mode ujian aman (keluar layar penuh, pindah tab,
     * pindah jendela). Dikirim dari halaman kuis siswa; dilihat guru di
     * daftar hasil kuis.
     */
    public function ujianPelanggaran(Request $request, Ujian $ujian): JsonResponse
    {
        $data = $request->validate([
            'jenis' => ['required', 'in:keluar_layar_penuh,pindah_tab,pindah_jendela,keluar_halaman'],
        ]);
        $siswa = $this->siswaFor($request);

        $attempt = UjianAttempt::where('ujian_id', $ujian->id)->where('siswa_id', $siswa->id)->first();
        abort_unless($attempt, 404, 'Anda belum memulai ujian ini.');
        abort_if($attempt->finished_at, 422, 'Ujian sudah diselesaikan.');

        $log = $attempt->pelanggaran_log ?? [];
        $log[] = ['jenis' => $data['jenis'], 'waktu' => now()->toIso8601String()];

        $attempt->update([
            'pelanggaran' => $attempt->pelanggaran + 1,
            'pelanggaran_log' => array_slice($log, -50),
        ]);

        $this->beriTahuGuruPelanggaran($ujian, $siswa, $attempt, $data['jenis']);

        return response()->json(['pelanggaran' => $attempt->pelanggaran]);
    }

    /**
     * Beri tahu guru pembuat kuis. Kejadian berulang dari siswa yang sama di
     * kuis yang sama digabung ke satu notifikasi yang diperbarui dan
     * ditandai belum dibaca lagi, supaya lonceng guru tidak banjir.
     */
    private function beriTahuGuruPelanggaran(Ujian $ujian, Siswa $siswa, UjianAttempt $attempt, string $jenis): void
    {
        $keterangan = [
            'keluar_layar_penuh' => 'keluar dari layar penuh',
            'pindah_tab' => 'pindah ke tab lain',
            'pindah_jendela' => 'pindah ke jendela/aplikasi lain',
            'keluar_halaman' => 'mencoba meninggalkan halaman ujian',
        ][$jenis];

        // Guru pembuat kuis dan wali kelas siswa (untuk pemantauan kelasnya).
        $penerima = collect([$ujian->guru?->user_id, $this->waliKelasUserId($siswa)])->filter()->unique();
        foreach ($penerima as $userId) {
            Notifikasi::kirim(
                $userId,
                'pelanggaran_ujian',
                "pelanggaran_ujian:{$ujian->id}:{$siswa->id}",
                "{$siswa->nama} keluar dari halaman kuis",
                $this->namaDanKelas($siswa)." {$keterangan} saat mengerjakan \"{$ujian->judul}\". Total keluar {$attempt->pelanggaran}×.",
                [
                    'ujian_id' => $ujian->id,
                    'siswa_id' => $siswa->id,
                    'kelas_id' => $ujian->kelas_id,
                    'mata_pelajaran_id' => $ujian->mata_pelajaran_id,
                    'jenis_terakhir' => $jenis,
                ],
                $attempt->pelanggaran
            );
        }
    }

    /**
     * Satu notifikasi per ujian untuk guru pembuatnya, diperbarui setiap
     * ada siswa yang selesai (berisi siswa terakhir & jumlah yang selesai).
     */
    private function beriTahuGuruUjianSelesai(Ujian $ujian, Siswa $siswa, UjianAttempt $attempt): void
    {
        $selesai = UjianAttempt::where('ujian_id', $ujian->id)->whereNotNull('finished_at')->count();
        $adaEssay = $ujian->soal()->where('tipe', UjianSoal::TIPE_ESSAY)->exists();

        Notifikasi::kirim(
            $ujian->guru?->user_id,
            'ujian_selesai',
            "ujian_selesai:{$ujian->id}",
            "{$siswa->nama} menyelesaikan ujian",
            $this->namaDanKelas($siswa)." menyelesaikan \"{$ujian->judul}\"".
                ($adaEssay ? ' — jawaban essay perlu dikoreksi.' : " dengan nilai {$attempt->nilai}.").
                " {$selesai} siswa sudah selesai.",
            [
                'ujian_id' => $ujian->id,
                'siswa_id' => $siswa->id,
                'kelas_id' => $ujian->kelas_id,
                'mata_pelajaran_id' => $ujian->mata_pelajaran_id,
            ],
            $selesai
        );
    }

    private function namaDanKelas(Siswa $siswa): string
    {
        $kelas = $siswa->kelas?->nama_kelas;

        return $siswa->nama.($kelas ? " ({$kelas})" : '');
    }

    private function waliKelasUserId(Siswa $siswa): ?int
    {
        return $siswa->kelas?->waliKelas?->user_id;
    }

    public function ujianJawab(Request $request, Ujian $ujian): JsonResponse
    {
        $siswa = $this->siswaFor($request);

        $attempt = UjianAttempt::where('ujian_id', $ujian->id)->where('siswa_id', $siswa->id)->first();
        abort_unless($attempt, 404, 'Anda belum memulai ujian ini.');
        abort_if($attempt->finished_at, 422, 'Ujian sudah diselesaikan.');

        $data = $request->validate([
            'ujian_soal_id' => ['required', 'exists:ujian_soal,id'],
            'jawaban_dipilih' => ['nullable', 'in:a,b,c,d'],
            'jawaban_essay' => ['nullable', 'string', 'max:10000'],
        ]);

        $soal = $ujian->soal()->findOrFail($data['ujian_soal_id']);

        if ($soal->tipe === UjianSoal::TIPE_ESSAY) {
            $isi = ['jawaban_essay' => $data['jawaban_essay'] ?? null];
        } else {
            abort_if(empty($data['jawaban_dipilih']), 422, 'Pilih salah satu jawaban.');
            $isi = ['jawaban_dipilih' => $data['jawaban_dipilih']];
        }

        $jawaban = UjianJawaban::updateOrCreate(
            ['ujian_attempt_id' => $attempt->id, 'ujian_soal_id' => $data['ujian_soal_id']],
            $isi
        );

        return response()->json($jawaban);
    }

    public function ujianSelesai(Request $request, Ujian $ujian): JsonResponse
    {
        $siswa = $this->siswaFor($request);

        $attempt = UjianAttempt::where('ujian_id', $ujian->id)->where('siswa_id', $siswa->id)->first();
        abort_unless($attempt, 404, 'Anda belum memulai ujian ini.');
        abort_if($attempt->finished_at, 422, 'Ujian sudah diselesaikan.');

        $soal = $ujian->soal()->get(['id', 'tipe', 'jawaban_benar']);
        $jawabanList = UjianJawaban::where('ujian_attempt_id', $attempt->id)->get()->keyBy('ujian_soal_id');

        foreach ($soal as $s) {
            $jawaban = $jawabanList->get($s->id);

            if ($jawaban && $s->tipe === UjianSoal::TIPE_PILIHAN_GANDA) {
                $jawaban->update(['benar' => $jawaban->jawaban_dipilih === $s->jawaban_benar]);
            }
        }

        $attempt->setRelation('ujian', $ujian);
        $nilai = $attempt->hitungUlangNilai();

        $attempt->update(['finished_at' => now(), 'nilai' => $nilai]);

        $this->beriTahuGuruUjianSelesai($ujian, $siswa, $attempt);

        return response()->json($attempt);
    }

    public function ujianHasil(Request $request, Ujian $ujian): JsonResponse
    {
        $siswa = $this->siswaFor($request);

        $attempt = UjianAttempt::where('ujian_id', $ujian->id)->where('siswa_id', $siswa->id)->first();
        abort_unless($attempt && $attempt->finished_at, 404, 'Hasil ujian belum tersedia.');

        $soal = $ujian->soal()->get();
        $jawabanList = UjianJawaban::where('ujian_attempt_id', $attempt->id)->get()->keyBy('ujian_soal_id');

        $review = $soal->map(function ($s) use ($jawabanList) {
            $jawaban = $jawabanList->get($s->id);

            return [
                'soal' => $s,
                'jawaban_dipilih' => $jawaban?->jawaban_dipilih,
                'jawaban_essay' => $jawaban?->jawaban_essay,
                'nilai_essay' => $jawaban?->nilai_essay,
                'benar' => $jawaban?->benar,
            ];
        });

        $attempt->setRelation('ujian', $ujian);

        return response()->json([
            'attempt' => $attempt,
            'kkm' => $ujian->kkm,
            'lulus' => $attempt->nilai !== null ? (float) $attempt->nilai >= (float) $ujian->kkm : null,
            'essay_belum_dinilai' => $attempt->essayBelumDinilai(),
            'review' => $review,
        ]);
    }
}
