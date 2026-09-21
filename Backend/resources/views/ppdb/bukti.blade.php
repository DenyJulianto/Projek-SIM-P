<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Bukti Pendaftaran {{ $p->nomor_pendaftaran }}</title>
    <style>
        body { font-family: sans-serif; font-size: 10.5px; color: #1a1a1a; }
        h1 { font-size: 14px; text-align: center; margin: 0; text-transform: uppercase; }
        h2 { font-size: 12px; text-align: center; margin: 2px 0 8px; }
        .nomor { text-align: center; border: 1.5px solid #333; padding: 6px; margin: 8px 0; font-size: 14px; font-weight: bold; letter-spacing: 1px; }
        table { width: 100%; border-collapse: collapse; }
        td, th { padding: 2.5px 4px; vertical-align: top; text-align: left; }
        td.k { width: 34%; color: #555; }
        table.b td, table.b th { border: 1px solid #999; }
        table.b th { background: #eee; }
        h3 { font-size: 11px; margin: 10px 0 3px; }
        .ttd { margin-top: 18px; width: 100%; }
        .note { font-size: 9px; color: #555; margin-top: 8px; }
    </style>
</head>
<body>
    <h1>{{ $sekolah }}</h1>
    <h2>Bukti Pendaftaran {{ $periode->nama }}<br>Tahun Ajaran {{ $periode->tahunAjaran?->nama }}</h2>
    <div class="nomor">{{ $p->nomor_pendaftaran }}</div>

    <table>
        <tr><td class="k">Nama lengkap</td><td>{{ $p->nama_lengkap }}</td></tr>
        <tr><td class="k">NIK</td><td>{{ $p->nik }}</td></tr>
        <tr><td class="k">NISN</td><td>{{ $p->nisn ?: '-' }}</td></tr>
        <tr><td class="k">Jenis kelamin</td><td>{{ $p->jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan' }}</td></tr>
        <tr><td class="k">Tempat, tanggal lahir</td><td>{{ $p->tempat_lahir ?: '-' }}, {{ $tglLahir }}</td></tr>
        <tr><td class="k">Sekolah asal</td><td>{{ $p->sekolah_asal ?: '-' }}</td></tr>
        <tr><td class="k">Jalur pendaftaran</td><td>{{ $p->jalur?->nama }}</td></tr>
        @if ($p->pilihan_program)<tr><td class="k">Pilihan program</td><td>{{ $p->pilihan_program }}</td></tr>@endif
        <tr><td class="k">Tanggal mendaftar</td><td>{{ $tglDaftar }}</td></tr>
    </table>

    <h3>Kelengkapan persyaratan</h3>
    <table class="b">
        <thead><tr><th>Persyaratan</th><th>Wajib</th><th>Status dokumen</th></tr></thead>
        <tbody>
        @forelse ($persyaratan as $r)
            <tr><td>{{ $r['nama'] }}</td><td>{{ $r['wajib'] ? 'Ya' : 'Tidak' }}</td><td>{{ $r['status'] }}</td></tr>
        @empty
            <tr><td colspan="3">Tidak ada persyaratan dokumen.</td></tr>
        @endforelse
        </tbody>
    </table>

    <h3>Jadwal</h3>
    <table>
        @foreach ($jadwal as $k => $v)
            <tr><td class="k">{{ $k }}</td><td>{{ $v }}</td></tr>
        @endforeach
    </table>

    <table class="ttd"><tr>
        <td style="text-align:center;width:50%">Calon peserta didik/<br>orang tua/wali<br><br><br><br>(..............................)</td>
        <td style="text-align:center;width:50%">Panitia PPDB<br><br><br><br><br>(..............................)</td>
    </tr></table>
    <p class="note">Simpan bukti ini dan bawa saat pengumuman dan daftar ulang. Status pendaftaran dapat berubah setelah verifikasi panitia.</p>
</body>
</html>
