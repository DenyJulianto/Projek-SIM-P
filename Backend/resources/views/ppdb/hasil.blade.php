<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Hasil Seleksi {{ $periode->nama }}</title>
    <style>
        body { font-family: sans-serif; font-size: 10px; color: #1a1a1a; }
        h1 { font-size: 14px; text-align: center; margin: 0; text-transform: uppercase; }
        h2 { font-size: 12px; text-align: center; margin: 2px 0 8px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #999; padding: 3px 5px; text-align: left; }
        th { background: #eee; }
        .l { color: #0a7a3d; font-weight: bold; }
        .t { color: #b00020; }
        .ttd { margin-top: 24px; width: 40%; margin-left: 60%; text-align: center; }
    </style>
</head>
<body>
    <h1>{{ $sekolah }}</h1>
    <h2>Hasil Seleksi {{ $periode->nama }}<br>Tahun Ajaran {{ $periode->tahunAjaran?->nama }}@if ($filter) — {{ $filter === 'lolos' ? 'Peserta Lolos' : 'Peserta Tidak Lolos' }}@endif</h2>
    <table>
        <thead><tr><th style="width:24px">No</th><th>No. Pendaftaran</th><th>Nama</th><th>Jalur</th><th>Asal Sekolah</th><th>Status</th></tr></thead>
        <tbody>
        @forelse ($baris as $i => $b)
            <tr>
                <td>{{ $i + 1 }}</td><td>{{ $b['nomor_pendaftaran'] }}</td><td>{{ $b['nama_lengkap'] }}</td><td>{{ $b['jalur'] }}</td><td>{{ $b['sekolah_asal'] ?: '-' }}</td>
                <td class="{{ $b['kelulusan'] === 'lolos' ? 'l' : 't' }}">{{ $b['kelulusan_label'] }}</td>
            </tr>
        @empty
            <tr><td colspan="6" style="text-align:center">Tidak ada data.</td></tr>
        @endforelse
        </tbody>
    </table>
    <div class="ttd">Ditetapkan pada {{ $tanggal }}<br>Ketua Panitia PPDB<br><br><br><br>(..............................)</div>
</body>
</html>
