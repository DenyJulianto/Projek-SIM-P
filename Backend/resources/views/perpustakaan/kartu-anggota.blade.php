<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Kartu Anggota {{ $anggota->nomor_kartu }}</title>
    <style>
        body { font-family: sans-serif; font-size: 9px; margin: 0; padding: 8px; }
        .kartu { border: 1.5px solid #1a5c3a; border-radius: 8px; padding: 8px; height: 100%; box-sizing: border-box; }
        h1 { font-size: 10px; text-align: center; margin: 0 0 2px; color: #1a5c3a; text-transform: uppercase; }
        h2 { font-size: 8px; text-align: center; margin: 0 0 6px; color: #555; }
        .nomor { text-align: center; font-family: 'Courier New', monospace; font-weight: bold; font-size: 12px; letter-spacing: 2px; border-top: 1px dashed #999; border-bottom: 1px dashed #999; padding: 3px 0; margin: 4px 0; }
        table td { font-size: 9px; padding: 1px 0; }
        table td.k { width: 32%; color: #555; }
    </style>
</head>
<body>
    <div class="kartu">
        <h1>{{ $sekolah }}</h1>
        <h2>Kartu Anggota Perpustakaan</h2>
        <table>
            <tr><td class="k">Nama</td><td>: {{ $anggota->nama }}</td></tr>
            <tr><td class="k">Jenis</td><td>: {{ ucfirst($anggota->jenis_anggota) }}</td></tr>
            <tr><td class="k">{{ $anggota->jenis_anggota === 'siswa' ? 'Kelas' : 'Identitas' }}</td><td>: {{ $anggota->kelas_unit ?? $anggota->nis_nisn_nip ?? '-' }}</td></tr>
        </table>
        <div class="nomor">{{ $anggota->nomor_kartu }}</div>
        <p style="text-align:center;color:#777;">Terdaftar sejak {{ \Illuminate\Support\Carbon::parse($anggota->tanggal_terdaftar)->locale('id')->translatedFormat('d F Y') }}</p>
    </div>
</body>
</html>
