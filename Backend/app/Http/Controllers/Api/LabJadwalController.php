<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\JadwalLab;
use App\Models\Kelas;
use App\Models\Laboratorium;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity;

class LabJadwalController extends Controller
{
    public function opsi(): JsonResponse
    {
        return response()->json([
            'laboratorium' => Laboratorium::where('status', 'aktif')->orderBy('nama')->get(['id', 'nama']),
            'kelas' => Kelas::orderBy('nama_kelas')->get(['id', 'nama_kelas']),
            'guru' => Guru::orderBy('nama')->get(['id', 'nama']),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $in = $request->validate([
            'laboratorium_id' => ['nullable', 'integer'],
            'kelas_id' => ['nullable', 'integer'],
            'guru_id' => ['nullable', 'integer'],
            'tanggal_mulai' => ['nullable', 'date'],
            'tanggal_selesai' => ['nullable', 'date'],
            'status' => ['nullable', 'in:terjadwal,berlangsung,selesai,dibatalkan'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:200'],
        ]);

        $jadwal = JadwalLab::with(['laboratorium:id,nama', 'kelas:id,nama_kelas', 'guru:id,nama'])
            ->when(! empty($in['laboratorium_id']), fn ($q) => $q->where('laboratorium_id', $in['laboratorium_id']))
            ->when(! empty($in['kelas_id']), fn ($q) => $q->where('kelas_id', $in['kelas_id']))
            ->when(! empty($in['guru_id']), fn ($q) => $q->where('guru_id', $in['guru_id']))
            ->when(! empty($in['tanggal_mulai']), fn ($q) => $q->whereDate('tanggal', '>=', $in['tanggal_mulai']))
            ->when(! empty($in['tanggal_selesai']), fn ($q) => $q->whereDate('tanggal', '<=', $in['tanggal_selesai']))
            ->when(! empty($in['status']), fn ($q) => $q->where('status', $in['status']))
            ->orderBy('tanggal')
            ->orderBy('jam_mulai')
            ->paginate($in['per_page'] ?? 30);

        return response()->json($jadwal);
    }

    private function cekBentrok(array $data, ?int $kecuali = null): void
    {
        $bentrok = JadwalLab::where('laboratorium_id', $data['laboratorium_id'])
            ->whereDate('tanggal', $data['tanggal'])
            ->where('status', '!=', 'dibatalkan')
            ->where('jam_mulai', '<', $data['jam_selesai'])
            ->where('jam_selesai', '>', $data['jam_mulai'])
            ->when($kecuali, fn ($q) => $q->where('id', '!=', $kecuali))
            ->exists();

        abort_if($bentrok, 422, 'Jadwal bentrok dengan penggunaan laboratorium lain pada rentang waktu tersebut.');
    }

    private function rules(): array
    {
        return [
            'laboratorium_id' => ['required', 'integer', 'exists:laboratorium,id'],
            'kelas_id' => ['nullable', 'integer', 'exists:kelas,id'],
            'guru_id' => ['nullable', 'integer', 'exists:guru,id'],
            'tanggal' => ['required', 'date'],
            'jam_mulai' => ['required', 'date_format:H:i'],
            'jam_selesai' => ['required', 'date_format:H:i', 'after:jam_mulai'],
            'keterangan' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'in:terjadwal,berlangsung,selesai,dibatalkan'],
        ];
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());
        $this->cekBentrok($data);

        $jadwal = JadwalLab::create([...$data, 'dibuat_oleh' => $request->user()->id]);

        activity()->performedOn($jadwal)->causedBy($request->user())->log("Membuat jadwal penggunaan laboratorium tanggal {$jadwal->tanggal->toDateString()}.");

        return response()->json($jadwal->load(['laboratorium:id,nama', 'kelas:id,nama_kelas', 'guru:id,nama']), 201);
    }

    public function update(Request $request, JadwalLab $jadwal): JsonResponse
    {
        $rules = $this->rules();
        $rules['laboratorium_id'] = ['sometimes', 'integer', 'exists:laboratorium,id'];
        $rules['tanggal'] = ['sometimes', 'date'];
        $rules['jam_mulai'] = ['sometimes', 'date_format:H:i'];
        $rules['jam_selesai'] = ['sometimes', 'date_format:H:i'];
        $data = $request->validate($rules);

        $cek = [
            'laboratorium_id' => $data['laboratorium_id'] ?? $jadwal->laboratorium_id,
            'tanggal' => $data['tanggal'] ?? $jadwal->tanggal->toDateString(),
            'jam_mulai' => $data['jam_mulai'] ?? $jadwal->jam_mulai,
            'jam_selesai' => $data['jam_selesai'] ?? $jadwal->jam_selesai,
        ];
        if (($data['status'] ?? $jadwal->status) !== 'dibatalkan') {
            $this->cekBentrok($cek, $jadwal->id);
        }

        $jadwal->update($data);

        activity()->performedOn($jadwal)->causedBy($request->user())->log('Memperbarui jadwal penggunaan laboratorium.');

        return response()->json($jadwal->load(['laboratorium:id,nama', 'kelas:id,nama_kelas', 'guru:id,nama']));
    }

    public function destroy(Request $request, JadwalLab $jadwal): JsonResponse
    {
        activity()->performedOn($jadwal)->causedBy($request->user())->log('Menghapus jadwal penggunaan laboratorium.');
        $jadwal->delete();

        return response()->json(['message' => 'Jadwal berhasil dihapus.']);
    }

    public function riwayat(JadwalLab $jadwal): JsonResponse
    {
        $riwayat = Activity::where('subject_type', JadwalLab::class)
            ->where('subject_id', $jadwal->id)
            ->with('causer:id,name')
            ->latest('id')
            ->get()
            ->map(fn (Activity $a) => ['waktu' => $a->created_at, 'pengguna' => $a->causer?->name ?? 'Sistem', 'keterangan' => $a->description]);

        return response()->json($riwayat);
    }
}
