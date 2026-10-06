<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\User;
use App\Support\UndanganStaf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Spatie\Permission\Models\Role;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Import akun staf dari Excel. Tiap akun baru belum bisa dipakai login
 * sampai pemiliknya membuat password sendiri lewat link undangan di email.
 */
class ImportStafController extends Controller
{
    private const KOLOM = ['Nama Lengkap', 'Email', 'Peran', 'NIP', 'Jenis Kelamin (L/P)'];

    private const MAKS_BARIS = 500;

    public const PERAN_BUKAN_STAF = ['Super Admin', 'Siswa', 'Orang Tua'];

    public function template(): StreamedResponse
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Import Staf');
        $sheet->fromArray(self::KOLOM, null, 'A1');
        $sheet->getStyle('A1:E1')->getFont()->setBold(true);
        $sheet->fromArray([
            ['Budi Santoso, S.Pd.', 'budi.santoso@contoh.sch.id', 'Guru Mata Pelajaran, Wali Kelas', '198501012010011001', 'L'],
            ['Siti Aminah', 'siti.aminah@contoh.sch.id', 'Tata Usaha', '', ''],
        ], null, 'A2');
        foreach (range('A', 'E') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $peran = $spreadsheet->createSheet()->setTitle('Daftar Peran');
        $peran->setCellValue('A1', 'Peran yang bisa dipakai (pisahkan dengan koma jika lebih dari satu)');
        $peran->getStyle('A1')->getFont()->setBold(true);
        foreach ($this->peranStaf() as $i => $nama) {
            $peran->setCellValue('A'.($i + 2), $nama);
        }
        $peran->getColumnDimension('A')->setAutoSize(true);
        $spreadsheet->setActiveSheetIndex(0);

        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(fn () => $writer->save('php://output'), 'template-import-staf.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function import(Request $request): JsonResponse
    {
        $request->validate(['file' => ['required', 'file', 'mimes:xlsx,xls', 'max:5120']]);

        $rows = IOFactory::load($request->file('file')->getRealPath())
            ->getSheet(0)
            ->toArray(null, true, true, false);
        array_shift($rows);

        $rows = array_filter($rows, fn ($r) => trim(implode('', array_map('strval', $r))) !== '');

        if (count($rows) > self::MAKS_BARIS) {
            return response()->json(['message' => 'Maksimal '.self::MAKS_BARIS.' baris per file.'], 422);
        }

        // Tiap undangan dikirim lewat SMTP satu per satu; beri waktu cukup
        // untuk file besar agar proses tidak terputus di tengah jalan.
        set_time_limit(0);

        $peranValid = $this->peranStaf();
        $berhasil = [];
        $dilewati = [];
        $emailDiFile = [];

        foreach ($rows as $i => $row) {
            $baris = $i + 2;
            [$nama, $email, $peran, $nip, $jk] = array_map(fn ($v) => trim((string) $v), array_pad($row, 5, ''));
            $email = mb_strtolower($email);
            $daftarPeran = array_values(array_filter(array_map('trim', explode(',', $peran))));
            $jk = strtoupper($jk);

            $alasan = match (true) {
                $nama === '' => 'Nama kosong',
                ! filter_var($email, FILTER_VALIDATE_EMAIL) => 'Email tidak valid',
                isset($emailDiFile[$email]) => "Email ganda di file (sama dengan baris {$emailDiFile[$email]})",
                $daftarPeran === [] => 'Peran kosong',
                (bool) array_diff($daftarPeran, $peranValid) => 'Peran tidak dikenal: '.implode(', ', array_diff($daftarPeran, $peranValid)),
                User::where('email', $email)->exists() => 'Email sudah terdaftar',
                default => $this->periksaNip($nip, $jk),
            };
            $emailDiFile[$email] ??= $baris;

            if ($alasan !== null) {
                $dilewati[] = compact('baris', 'nama', 'email', 'alasan');

                continue;
            }

            try {
                $user = DB::transaction(function () use ($nama, $email, $daftarPeran, $nip, $jk) {
                    $user = User::create(['name' => $nama, 'email' => $email, 'password' => Str::random(40)]);
                    $user->forceFill(['is_active' => true, 'must_change_password' => false, 'jenis_kelamin' => in_array($jk, ['L', 'P'], true) ? $jk : null])->save();
                    $user->syncRoles($daftarPeran);

                    if ($nip !== '') {
                        $guru = Guru::where('nip', $nip)->first();
                        $guru
                            ? $guru->update(['user_id' => $user->id])
                            : Guru::create(['user_id' => $user->id, 'nip' => $nip, 'nama' => $nama, 'jenis_kelamin' => $jk]);
                    }

                    return $user;
                });
            } catch (\Throwable $e) {
                report($e);
                $dilewati[] = compact('baris', 'nama', 'email') + ['alasan' => 'Gagal disimpan'];

                continue;
            }

            // Undangan dikirim langsung setelah akun tersimpan, tanpa menunggu
            // queue worker; yang gagal bisa dikirim ulang dari Kelola Pengguna.
            try {
                $undanganTerkirim = UndanganStaf::kirim($user);
            } catch (\Throwable $e) {
                report($e);
                $undanganTerkirim = false;
            }
            $berhasil[] = compact('baris', 'nama', 'email') + ['undangan_terkirim' => $undanganTerkirim];
        }

        activity()->causedBy($request->user())->useLog('pengguna')
            ->withProperties(['berhasil' => count($berhasil), 'dilewati' => count($dilewati)])
            ->log('Import akun staf dari Excel ('.count($berhasil).' akun, undangan dikirim).');

        return response()->json(['berhasil' => $berhasil, 'dilewati' => $dilewati]);
    }

    private function periksaNip(string $nip, string $jk): ?string
    {
        if ($nip === '') {
            return null;
        }

        $guru = Guru::where('nip', $nip)->first();

        return match (true) {
            $guru !== null && $guru->user_id !== null => 'NIP sudah tertaut ke akun lain',
            User::where('username', $nip)->exists() => 'NIP sudah dipakai sebagai username akun lain',
            $guru === null && ! in_array($jk, ['L', 'P'], true) => 'Jenis Kelamin wajib L/P jika NIP diisi',
            default => null,
        };
    }

    /** @return array<int, string> */
    private function peranStaf(): array
    {
        return Role::whereNotIn('name', self::PERAN_BUKAN_STAF)->orderBy('name')->pluck('name')->all();
    }
}
