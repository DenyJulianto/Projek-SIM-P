<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Spatie\QueryBuilder\QueryBuilder;
use Symfony\Component\HttpFoundation\StreamedResponse;

class GuruController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $guru = QueryBuilder::for(Guru::class)
            ->allowedFilters('nama', 'nip', 'status')
            ->allowedSorts('nama', 'created_at')
            ->allowedIncludes('user', 'kelasWali')
            ->paginate($request->integer('per_page', 15));

        return response()->json($guru);
    }

    public function export(): StreamedResponse
    {
        $guru = Guru::orderBy('nama')->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Data Guru');

        $sheet->fromArray([
            'Nama Lengkap + Gelar',
            'NIP',
            'NUPTK',
            'Jabatan',
            'Pendidikan Terakhir',
            'Tahun Mulai Mengajar',
            'Agama',
            'Alamat',
            'No. Telp',
        ], null, 'A1');
        $sheet->getStyle('A1:I1')->getFont()->setBold(true);

        $rows = $guru->map(fn (Guru $g) => [
            trim($g->nama . ($g->gelar ? ", {$g->gelar}" : '')),
            $g->nip,
            $g->nuptk,
            $g->jabatan,
            $g->pendidikan_terakhir,
            $g->tahun_mulai_mengajar,
            $g->agama,
            $g->alamat,
            $g->no_telepon,
        ])->all();

        $sheet->fromArray($rows, null, 'A2');

        foreach (range('A', 'I') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);
        $filename = 'data-guru-' . now()->format('Y-m-d') . '.xlsx';

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['nullable', 'exists:users,id'],
            'nip' => ['nullable', 'string', 'max:30', 'unique:guru,nip'],
            'nuptk' => ['nullable', 'string', 'max:30', 'unique:guru,nuptk'],
            'nama' => ['required', 'string', 'max:255'],
            'gelar' => ['nullable', 'string', 'max:100'],
            'jabatan' => ['nullable', 'string', 'max:255'],
            'mata_pelajaran' => ['nullable', 'string', 'max:255'],
            'status_kepegawaian' => ['nullable', 'string', 'max:100'],
            'pendidikan_terakhir' => ['nullable', 'string', 'max:100'],
            'tahun_mulai_mengajar' => ['nullable', 'integer', 'min:1950', 'max:2100'],
            'agama' => ['nullable', 'string', 'max:20'],
            'jenis_kelamin' => ['required', 'in:L,P'],
            'tempat_lahir' => ['nullable', 'string', 'max:255'],
            'tanggal_lahir' => ['nullable', 'date'],
            'alamat' => ['nullable', 'string'],
            'no_telepon' => ['nullable', 'string', 'max:20'],
            'status' => ['nullable', 'in:aktif,nonaktif'],
        ]);

        $guru = Guru::create($data);

        return response()->json($guru, 201);
    }

    public function show(Guru $guru): JsonResponse
    {
        return response()->json($guru->load('user', 'kelasWali'));
    }

    public function update(Request $request, Guru $guru): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['nullable', 'exists:users,id'],
            'nip' => ['nullable', 'string', 'max:30', 'unique:guru,nip,' . $guru->id],
            'nuptk' => ['nullable', 'string', 'max:30', 'unique:guru,nuptk,' . $guru->id],
            'nama' => ['sometimes', 'string', 'max:255'],
            'gelar' => ['nullable', 'string', 'max:100'],
            'jabatan' => ['nullable', 'string', 'max:255'],
            'mata_pelajaran' => ['nullable', 'string', 'max:255'],
            'status_kepegawaian' => ['nullable', 'string', 'max:100'],
            'pendidikan_terakhir' => ['nullable', 'string', 'max:100'],
            'tahun_mulai_mengajar' => ['nullable', 'integer', 'min:1950', 'max:2100'],
            'agama' => ['nullable', 'string', 'max:20'],
            'jenis_kelamin' => ['sometimes', 'in:L,P'],
            'tempat_lahir' => ['nullable', 'string', 'max:255'],
            'tanggal_lahir' => ['nullable', 'date'],
            'alamat' => ['nullable', 'string'],
            'no_telepon' => ['nullable', 'string', 'max:20'],
            'status' => ['nullable', 'in:aktif,nonaktif'],
        ]);

        $guru->update($data);

        return response()->json($guru);
    }

    public function destroy(Guru $guru): JsonResponse
    {
        $guru->delete();

        return response()->json(['message' => 'Guru berhasil dihapus.']);
    }
}
