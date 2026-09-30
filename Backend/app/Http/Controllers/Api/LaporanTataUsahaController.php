<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AbsensiGuru;
use App\Models\Absensi;
use App\Models\ArsipDokumen;
use App\Models\Guru;
use App\Models\Inventaris;
use App\Models\Siswa;
use App\Models\Surat;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LaporanTataUsahaController extends Controller
{
    public function siswa(): JsonResponse
    {
        $data = Siswa::with('kelas:id,nama_kelas')->orderBy('nama')->get();

        return response()->json([
            'total' => $data->count(),
            'total_aktif' => $data->where('status', 'aktif')->count(),
            'data' => $data,
        ]);
    }

    public function pegawai(): JsonResponse
    {
        $guru = Guru::orderBy('nama')->get()->map(fn (Guru $g) => [
            'id' => 'guru-'.$g->id,
            'nama' => $g->nama,
            'jenis' => 'Guru',
            'identitas' => $g->nip,
            'jabatan' => $g->jabatan ?: 'Guru',
            'status_kepegawaian' => $g->status_kepegawaian,
            'status' => $g->status,
        ]);

        $staf = User::whereNotIn('id', Guru::whereNotNull('user_id')->pluck('user_id'))
            ->whereNotIn('id', Siswa::whereNotNull('user_id')->pluck('user_id'))
            ->whereNotIn('id', DB::table('wali_siswa')->pluck('user_id'))
            ->with('roles:id,name')
            ->orderBy('name')
            ->get()
            ->map(fn (User $u) => [
                'id' => 'staf-'.$u->id,
                'nama' => $u->name,
                'jenis' => 'Tenaga Kependidikan',
                'identitas' => $u->email,
                'jabatan' => $u->roles->pluck('name')->implode(', ') ?: '-',
                'status_kepegawaian' => null,
                'status' => $u->is_active ? 'aktif' : 'nonaktif',
            ]);

        $data = $guru->concat($staf)->sortBy('nama')->values();

        return response()->json([
            'total' => $data->count(),
            'total_guru' => $guru->count(),
            'total_staf' => $staf->count(),
            'data' => $data,
        ]);
    }

    public function absensi(Request $request): JsonResponse
    {
        $in = $request->validate([
            'dari_tanggal' => ['nullable', 'date'],
            'sampai_tanggal' => ['nullable', 'date'],
        ]);

        $siswa = Absensi::with(['siswa:id,nama,nis,kelas_id', 'kelas:id,nama_kelas'])
            ->when(! empty($in['dari_tanggal']), fn ($q) => $q->whereDate('tanggal', '>=', $in['dari_tanggal']))
            ->when(! empty($in['sampai_tanggal']), fn ($q) => $q->whereDate('tanggal', '<=', $in['sampai_tanggal']))
            ->orderByDesc('tanggal')
            ->get()
            ->map(fn (Absensi $a) => [
                'id' => 'siswa-'.$a->id,
                'jenis' => 'Siswa',
                'tanggal' => $a->tanggal,
                'nama' => $a->siswa?->nama,
                'identitas' => $a->siswa?->nis,
                'kelompok' => $a->kelas?->nama_kelas,
                'status' => $a->status,
                'keterangan' => $a->keterangan,
            ]);

        $guru = AbsensiGuru::with('guru:id,nama,nip')
            ->when(! empty($in['dari_tanggal']), fn ($q) => $q->whereDate('tanggal', '>=', $in['dari_tanggal']))
            ->when(! empty($in['sampai_tanggal']), fn ($q) => $q->whereDate('tanggal', '<=', $in['sampai_tanggal']))
            ->orderByDesc('tanggal')
            ->get()
            ->map(fn (AbsensiGuru $a) => [
                'id' => 'guru-'.$a->id,
                'jenis' => 'Guru',
                'tanggal' => $a->tanggal,
                'nama' => $a->guru?->nama,
                'identitas' => $a->guru?->nip,
                'kelompok' => 'Guru',
                'status' => $a->status,
                'keterangan' => $a->keterangan,
            ]);

        $data = $siswa->concat($guru)->sortByDesc('tanggal')->values();

        return response()->json([
            'total' => $data->count(),
            'total_hadir' => $data->where('status', 'hadir')->count(),
            'total_tidak_hadir' => $data->whereIn('status', ['izin', 'sakit', 'alpha'])->count(),
            'data' => $data,
        ]);
    }

    public function administrasi(Request $request): JsonResponse
    {
        $in = $request->validate([
            'dari_tanggal' => ['nullable', 'date'],
            'sampai_tanggal' => ['nullable', 'date'],
        ]);

        $surat = Surat::with('user:id,name')
            ->when(! empty($in['dari_tanggal']), fn ($q) => $q->whereDate('tanggal_surat', '>=', $in['dari_tanggal']))
            ->when(! empty($in['sampai_tanggal']), fn ($q) => $q->whereDate('tanggal_surat', '<=', $in['sampai_tanggal']))
            ->get()
            ->map(fn (Surat $s) => [
                'id' => 'surat-'.$s->id,
                'jenis' => 'Surat',
                'judul' => $s->perihal,
                'nomor' => $s->nomor_surat,
                'tanggal' => $s->tanggal_surat,
                'kategori' => $s->jenis,
                'status' => $s->status,
            ]);

        $arsip = ArsipDokumen::with('user:id,name')
            ->when(! empty($in['dari_tanggal']), fn ($q) => $q->whereDate('tanggal_dokumen', '>=', $in['dari_tanggal']))
            ->when(! empty($in['sampai_tanggal']), fn ($q) => $q->whereDate('tanggal_dokumen', '<=', $in['sampai_tanggal']))
            ->get()
            ->map(fn (ArsipDokumen $a) => [
                'id' => 'arsip-'.$a->id,
                'jenis' => 'Arsip',
                'judul' => $a->judul,
                'nomor' => $a->nomor_dokumen,
                'tanggal' => $a->tanggal_dokumen,
                'kategori' => $a->kategori,
                'status' => null,
            ]);

        $sarana = Inventaris::when(! empty($in['dari_tanggal']), fn ($q) => $q->whereDate('tanggal_perolehan', '>=', $in['dari_tanggal']))
            ->when(! empty($in['sampai_tanggal']), fn ($q) => $q->whereDate('tanggal_perolehan', '<=', $in['sampai_tanggal']))
            ->get()
            ->map(fn (Inventaris $i) => [
                'id' => 'sarana-'.$i->id,
                'jenis' => 'Sarana',
                'judul' => $i->nama_barang,
                'nomor' => $i->kode_barang,
                'tanggal' => $i->tanggal_perolehan,
                'kategori' => $i->kategori,
                'status' => $i->kondisi,
            ]);

        $data = $surat->concat($arsip)->concat($sarana)->sortByDesc('tanggal')->values();

        return response()->json([
            'total' => $data->count(),
            'total_surat' => $surat->count(),
            'total_arsip' => $arsip->count(),
            'total_sarana' => $sarana->count(),
            'data' => $data,
        ]);
    }
}
