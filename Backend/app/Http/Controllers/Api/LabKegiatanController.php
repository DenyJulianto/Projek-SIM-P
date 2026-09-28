<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KegiatanLab;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LabKegiatanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $in = $request->validate([
            'laboratorium_id' => ['nullable', 'integer'],
            'jenis_kegiatan' => ['nullable', 'string'],
            'status' => ['nullable', 'in:direncanakan,berlangsung,selesai,dibatalkan'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $kegiatan = KegiatanLab::with(['laboratorium:id,nama', 'kelas:id,nama_kelas', 'mataPelajaran:id,nama_mapel'])
            ->when(! empty($in['laboratorium_id']), fn ($q) => $q->where('laboratorium_id', $in['laboratorium_id']))
            ->when(! empty($in['jenis_kegiatan']), fn ($q) => $q->where('jenis_kegiatan', $in['jenis_kegiatan']))
            ->when(! empty($in['status']), fn ($q) => $q->where('status', $in['status']))
            ->orderByDesc('tanggal')
            ->paginate($in['per_page'] ?? 15);

        return response()->json($kegiatan);
    }

    private function rules(): array
    {
        return [
            'nama_kegiatan' => ['required', 'string', 'max:255'],
            'jenis_kegiatan' => ['required', 'in:praktikum,pelatihan,ujian_praktik,penelitian,workshop,kegiatan_guru,kegiatan_siswa'],
            'laboratorium_id' => ['required', 'integer', 'exists:laboratorium,id'],
            'tanggal' => ['required', 'date'],
            'jam_mulai' => ['nullable', 'date_format:H:i'],
            'jam_selesai' => ['nullable', 'date_format:H:i'],
            'penanggung_jawab' => ['nullable', 'string', 'max:255'],
            'kelas_id' => ['nullable', 'integer', 'exists:kelas,id'],
            'peserta_lainnya' => ['nullable', 'string', 'max:255'],
            'mata_pelajaran_id' => ['nullable', 'integer', 'exists:mata_pelajaran,id'],
            'tujuan' => ['nullable', 'string'],
            'peralatan_digunakan' => ['nullable', 'string'],
            'bahan_digunakan' => ['nullable', 'string'],
            'catatan' => ['nullable', 'string'],
            'status' => ['nullable', 'in:direncanakan,berlangsung,selesai,dibatalkan'],
            'dokumentasi' => ['nullable', 'image', 'max:2048'],
        ];
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());
        if ($request->hasFile('dokumentasi')) {
            $data['dokumentasi_path'] = $request->file('dokumentasi')->store('laboratorium/kegiatan', 'public');
        }
        unset($data['dokumentasi']);

        $kegiatan = KegiatanLab::create([...$data, 'dibuat_oleh' => $request->user()->id]);

        return response()->json($kegiatan, 201);
    }

    public function show(KegiatanLab $kegiatanLab): JsonResponse
    {
        return response()->json($kegiatanLab->load(['laboratorium', 'kelas', 'mataPelajaran']));
    }

    public function update(Request $request, KegiatanLab $kegiatanLab): JsonResponse
    {
        $rules = $this->rules();
        $rules['nama_kegiatan'] = ['sometimes', 'string', 'max:255'];
        $rules['jenis_kegiatan'] = ['sometimes', 'in:praktikum,pelatihan,ujian_praktik,penelitian,workshop,kegiatan_guru,kegiatan_siswa'];
        $rules['laboratorium_id'] = ['sometimes', 'integer', 'exists:laboratorium,id'];
        $rules['tanggal'] = ['sometimes', 'date'];
        $data = $request->validate($rules);

        if ($request->hasFile('dokumentasi')) {
            $data['dokumentasi_path'] = $request->file('dokumentasi')->store('laboratorium/kegiatan', 'public');
        }
        unset($data['dokumentasi']);

        $kegiatanLab->update($data);

        return response()->json($kegiatanLab);
    }

    public function destroy(KegiatanLab $kegiatanLab): JsonResponse
    {
        $kegiatanLab->delete();

        return response()->json(['message' => 'Kegiatan berhasil dihapus.']);
    }
}
