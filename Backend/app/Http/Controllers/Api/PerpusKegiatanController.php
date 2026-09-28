<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KegiatanPerpustakaan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PerpusKegiatanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $in = $request->validate([
            'jenis_kegiatan' => ['nullable', 'in:literasi,kunjungan,bedah_buku,pameran_buku,program_membaca,lainnya'],
            'status' => ['nullable', 'in:direncanakan,berlangsung,selesai,dibatalkan'],
            'tahun' => ['nullable', 'integer'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $kegiatan = KegiatanPerpustakaan::when(! empty($in['jenis_kegiatan']), fn ($q) => $q->where('jenis_kegiatan', $in['jenis_kegiatan']))
            ->when(! empty($in['status']), fn ($q) => $q->where('status', $in['status']))
            ->when(! empty($in['tahun']), fn ($q) => $q->whereYear('tanggal', $in['tahun']))
            ->orderByDesc('tanggal')
            ->paginate($in['per_page'] ?? 15);

        return response()->json($kegiatan);
    }

    private function rules(): array
    {
        return [
            'nama_kegiatan' => ['required', 'string', 'max:255'],
            'jenis_kegiatan' => ['required', 'in:literasi,kunjungan,bedah_buku,pameran_buku,program_membaca,lainnya'],
            'tanggal' => ['required', 'date'],
            'lokasi' => ['nullable', 'string', 'max:255'],
            'penanggung_jawab' => ['nullable', 'string', 'max:255'],
            'jumlah_peserta' => ['nullable', 'integer', 'min:0'],
            'deskripsi' => ['nullable', 'string'],
            'status' => ['nullable', 'in:direncanakan,berlangsung,selesai,dibatalkan'],
            'dokumentasi' => ['nullable', 'image', 'max:2048'],
        ];
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());

        if ($request->hasFile('dokumentasi')) {
            $data['dokumentasi_path'] = $request->file('dokumentasi')->store('perpustakaan/kegiatan', 'public');
        }
        unset($data['dokumentasi']);

        $kegiatan = KegiatanPerpustakaan::create([...$data, 'dibuat_oleh' => $request->user()->id]);

        return response()->json($kegiatan, 201);
    }

    public function show(KegiatanPerpustakaan $kegiatan): JsonResponse
    {
        return response()->json($kegiatan);
    }

    public function update(Request $request, KegiatanPerpustakaan $kegiatan): JsonResponse
    {
        $rules = $this->rules();
        $rules['nama_kegiatan'] = ['sometimes', 'string', 'max:255'];
        $rules['jenis_kegiatan'] = ['sometimes', 'in:literasi,kunjungan,bedah_buku,pameran_buku,program_membaca,lainnya'];
        $rules['tanggal'] = ['sometimes', 'date'];
        $data = $request->validate($rules);

        if ($request->hasFile('dokumentasi')) {
            $data['dokumentasi_path'] = $request->file('dokumentasi')->store('perpustakaan/kegiatan', 'public');
        }
        unset($data['dokumentasi']);

        $kegiatan->update($data);

        return response()->json($kegiatan);
    }

    public function destroy(KegiatanPerpustakaan $kegiatan): JsonResponse
    {
        $kegiatan->delete();

        return response()->json(['message' => 'Kegiatan berhasil dihapus.']);
    }
}
