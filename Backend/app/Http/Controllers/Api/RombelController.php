<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kelas;
use App\Models\Siswa;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Keanggotaan siswa pada rombongan belajar. Satu rombel adalah satu baris
 * kelas (siswa.kelas_id), jadi menambah, mengeluarkan, dan memindahkan siswa
 * di sini langsung berlaku untuk seluruh modul lain (absensi, wali kelas,
 * nilai). Setiap perubahan keanggotaan divalidasi terhadap kapasitas dan
 * dicatat ke riwayat rombel lewat activity log.
 */
class RombelController extends Controller
{
    /** Siswa aktif yang belum punya rombel, untuk dipilih saat menambah anggota. */
    public function siswaTersedia(Request $request): JsonResponse
    {
        $siswa = Siswa::query()
            ->where('status', 'aktif')
            ->whereNull('kelas_id')
            ->when($request->filled('search'), function ($q) use ($request) {
                $like = '%'.$request->string('search')->trim().'%';
                $q->where(fn ($qq) => $qq->where('nama', 'like', $like)->orWhere('nis', 'like', $like)->orWhere('nisn', 'like', $like));
            })
            ->orderBy('nama')
            ->limit(50)
            ->get(['id', 'nis', 'nisn', 'nama', 'jenis_kelamin']);

        return response()->json($siswa);
    }

    public function tambah(Request $request, Kelas $kela): JsonResponse
    {
        $ids = $this->validateIds($request);

        $siswa = DB::transaction(function () use ($ids, $kela) {
            $this->assertRombelAktif($kela);
            $siswa = Siswa::whereIn('id', $ids)->get(['id', 'nis', 'nama', 'status', 'kelas_id']);

            $tidakBisa = $siswa->filter(fn (Siswa $s) => $s->status !== 'aktif' || $s->kelas_id !== null);
            if ($tidakBisa->isNotEmpty()) {
                throw ValidationException::withMessages([
                    'siswa_ids' => 'Siswa berikut bukan siswa aktif atau sudah punya rombel (gunakan Pindah Rombel): '
                        .$tidakBisa->pluck('nama')->implode(', ').'.',
                ]);
            }

            $this->assertKapasitas($kela, $siswa->count());
            Siswa::whereIn('id', $ids)->update(['kelas_id' => $kela->id]);

            return $siswa;
        });

        $this->catat($request, $kela, 'siswa_ditambahkan', "Menambahkan {$siswa->count()} siswa ke rombel \"{$kela->nama_kelas}\".", $siswa);

        return response()->json(['message' => "{$siswa->count()} siswa ditambahkan.", 'ditambahkan' => $siswa->count()]);
    }

    public function keluarkan(Request $request, Kelas $kela): JsonResponse
    {
        $ids = $this->validateIds($request);

        $siswa = Siswa::whereIn('id', $ids)->where('kelas_id', $kela->id)->get(['id', 'nis', 'nama']);
        if ($siswa->count() !== count($ids)) {
            throw ValidationException::withMessages(['siswa_ids' => 'Sebagian siswa bukan anggota rombel ini.']);
        }

        Siswa::whereIn('id', $ids)->update(['kelas_id' => null]);

        $this->catat($request, $kela, 'siswa_dikeluarkan', "Mengeluarkan {$siswa->count()} siswa dari rombel \"{$kela->nama_kelas}\".", $siswa);

        return response()->json(['message' => "{$siswa->count()} siswa dikeluarkan.", 'dikeluarkan' => $siswa->count()]);
    }

    public function pindah(Request $request, Kelas $kela): JsonResponse
    {
        $ids = $this->validateIds($request);
        $tujuanId = $request->validate(['tujuan_kelas_id' => ['required', 'integer', 'exists:kelas,id']])['tujuan_kelas_id'];

        $tujuan = Kelas::findOrFail($tujuanId);
        if ($tujuan->id === $kela->id) {
            throw ValidationException::withMessages(['tujuan_kelas_id' => 'Rombel tujuan harus berbeda dari rombel asal.']);
        }
        if ($kela->tahun_ajaran && $tujuan->tahun_ajaran && $kela->tahun_ajaran !== $tujuan->tahun_ajaran) {
            throw ValidationException::withMessages([
                'tujuan_kelas_id' => "Pindah rombel hanya dalam tahun ajaran yang sama ({$kela->tahun_ajaran}).",
            ]);
        }

        $siswa = DB::transaction(function () use ($ids, $kela, $tujuan) {
            $this->assertRombelAktif($tujuan);
            $siswa = Siswa::whereIn('id', $ids)->where('kelas_id', $kela->id)->get(['id', 'nis', 'nama']);
            if ($siswa->count() !== count($ids)) {
                throw ValidationException::withMessages(['siswa_ids' => 'Sebagian siswa bukan anggota rombel asal.']);
            }

            $this->assertKapasitas($tujuan, $siswa->count());
            Siswa::whereIn('id', $ids)->update(['kelas_id' => $tujuan->id]);

            return $siswa;
        });

        $n = $siswa->count();
        $this->catat($request, $kela, 'siswa_dipindah_keluar', "Memindahkan {$n} siswa ke rombel \"{$tujuan->nama_kelas}\".", $siswa);
        $this->catat($request, $tujuan, 'siswa_dipindah_masuk', "Menerima {$n} siswa pindahan dari rombel \"{$kela->nama_kelas}\".", $siswa);

        return response()->json(['message' => "{$n} siswa dipindahkan ke {$tujuan->nama_kelas}.", 'dipindahkan' => $n]);
    }

    public function export(Kelas $kela): StreamedResponse
    {
        $siswa = $kela->siswa()->orderBy('nama')->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Siswa '.mb_substr($kela->nama_kelas, 0, 20));

        $sheet->fromArray(['No', 'NIS', 'NISN', 'Nama', 'L/P', 'Status'], null, 'A1');
        $sheet->getStyle('A1:F1')->getFont()->setBold(true);
        $sheet->fromArray(
            $siswa->values()->map(fn (Siswa $s, int $i) => [$i + 1, $s->nis, $s->nisn, $s->nama, $s->jenis_kelamin, ucfirst((string) $s->status)])->all(),
            null,
            'A2'
        );
        // NIS/NISN sebagai teks agar angka nol di depan tidak hilang.
        $sheet->getStyle('B2:C'.max(2, $siswa->count() + 1))->getNumberFormat()->setFormatCode('@');
        foreach (range('A', 'F') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);
        $filename = 'rombel-'.preg_replace('/[^A-Za-z0-9_-]+/', '-', $kela->nama_kelas).'-'.now()->format('Y-m-d').'.xlsx';

        return response()->streamDownload(fn () => $writer->save('php://output'), $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function importTemplate(): StreamedResponse
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Import Siswa Rombel');

        $sheet->fromArray(['NIS', 'Nama (opsional, hanya untuk memudahkan)'], null, 'A1');
        $sheet->getStyle('A1:B1')->getFont()->setBold(true);
        $sheet->getStyle('A2:A500')->getNumberFormat()->setFormatCode('@');
        $sheet->fromArray([['1001', 'Contoh Siswa'], ['1002', 'Contoh Siswa Dua']], null, 'A2');
        $sheet->getColumnDimension('A')->setAutoSize(true);
        $sheet->getColumnDimension('B')->setWidth(40);

        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(fn () => $writer->save('php://output'), 'template-import-siswa-rombel.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * Import anggota rombel berdasarkan NIS. Baris yang bermasalah dilewati
     * dan dilaporkan; baris yang valid tetap masuk selama kapasitas cukup.
     */
    public function import(Request $request, Kelas $kela): JsonResponse
    {
        $request->validate(['file' => ['required', 'file', 'mimes:xlsx,xls', 'max:5120']]);
        $this->assertRombelAktif($kela);

        $rows = IOFactory::load($request->file('file')->getRealPath())
            ->getActiveSheet()
            ->toArray(null, true, true, false);
        array_shift($rows);

        if (count($rows) > 1000) {
            return response()->json(['message' => 'Maksimal 1000 baris per file.'], 422);
        }

        $masuk = collect();
        $errors = [];
        $dilewati = 0;
        $sisa = $kela->kapasitas === null
            ? PHP_INT_MAX
            : max(0, $kela->kapasitas - $kela->siswa()->where('status', 'aktif')->count());
        $dilihat = [];

        DB::transaction(function () use ($rows, $kela, &$masuk, &$errors, &$dilewati, &$sisa, &$dilihat) {
            foreach ($rows as $i => $row) {
                $line = $i + 2;
                $nis = trim((string) ($row[0] ?? ''));
                if ($nis === '') {
                    continue;
                }
                if (isset($dilihat[$nis])) {
                    $errors[] = "Baris {$line}: NIS {$nis} muncul lebih dari sekali, dilewati.";

                    continue;
                }
                $dilihat[$nis] = true;

                $siswa = Siswa::with('kelas:id,nama_kelas')->where('nis', $nis)->first();
                if (! $siswa) {
                    $errors[] = "Baris {$line}: NIS {$nis} tidak ditemukan.";
                } elseif ($siswa->status !== 'aktif') {
                    $errors[] = "Baris {$line}: {$siswa->nama} bukan siswa aktif.";
                } elseif ($siswa->kelas_id === $kela->id) {
                    $dilewati++;
                } elseif ($siswa->kelas_id !== null) {
                    $errors[] = "Baris {$line}: {$siswa->nama} sudah berada di rombel {$siswa->kelas?->nama_kelas} (gunakan Pindah Rombel).";
                } elseif ($sisa <= 0) {
                    $errors[] = "Baris {$line}: {$siswa->nama} tidak dimasukkan karena kapasitas rombel penuh.";
                } else {
                    $siswa->update(['kelas_id' => $kela->id]);
                    $masuk->push($siswa);
                    $sisa--;
                }
            }
        });

        if ($masuk->isNotEmpty()) {
            $this->catat($request, $kela, 'siswa_diimport', "Mengimpor {$masuk->count()} siswa ke rombel \"{$kela->nama_kelas}\".", $masuk);
        }

        return response()->json([
            'message' => "{$masuk->count()} siswa berhasil diimpor.",
            'berhasil' => $masuk->count(),
            'dilewati' => $dilewati,
            'errors' => $errors,
        ]);
    }

    private function validateIds(Request $request): array
    {
        return array_values(array_unique($request->validate([
            'siswa_ids' => ['required', 'array', 'min:1', 'max:200'],
            'siswa_ids.*' => ['integer', 'exists:siswa,id'],
        ])['siswa_ids']));
    }

    private function assertRombelAktif(Kelas $kelas): void
    {
        if ($kelas->status !== 'aktif') {
            throw ValidationException::withMessages(['rombel' => "Rombel \"{$kelas->nama_kelas}\" nonaktif. Aktifkan terlebih dahulu."]);
        }
    }

    private function assertKapasitas(Kelas $kelas, int $tambahan): void
    {
        if ($kelas->kapasitas === null) {
            return;
        }

        $aktif = $kelas->siswa()->where('status', 'aktif')->count();
        if ($aktif + $tambahan > $kelas->kapasitas) {
            $sisa = max(0, $kelas->kapasitas - $aktif);
            throw ValidationException::withMessages([
                'kapasitas' => "Kapasitas rombel \"{$kelas->nama_kelas}\" tidak cukup: terisi {$aktif} dari {$kelas->kapasitas}, sisa {$sisa}, sedangkan {$tambahan} siswa akan masuk.",
            ]);
        }
    }

    private function catat(Request $request, Kelas $kelas, string $event, string $deskripsi, $siswa): void
    {
        activity()
            ->performedOn($kelas)
            ->causedBy($request->user())
            ->event($event)
            ->withProperties(['siswa' => $siswa->map(fn (Siswa $s) => ['nis' => $s->nis, 'nama' => $s->nama])->values()->all()])
            ->log($deskripsi);
    }
}
