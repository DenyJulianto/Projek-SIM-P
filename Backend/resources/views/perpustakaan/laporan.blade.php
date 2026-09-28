<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Perpustakaan</title>
    <style>
        body { font-family: sans-serif; font-size: 9px; }
        h1 { font-size: 13px; text-align: center; margin: 0; }
        h2 { font-size: 11px; text-align: center; margin: 2px 0 10px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #999; padding: 3px 4px; text-align: left; }
        th { background: #eee; }
    </style>
</head>
<body>
    <h1>{{ $sekolah }}</h1>
    <h2>Laporan Sirkulasi Perpustakaan</h2>
    <table>
        <thead>
            <tr>
                <th>No</th><th>Nomor Transaksi</th><th>Anggota</th><th>Jenis</th><th>Kelas/Unit</th>
                <th>Judul Buku</th><th>Kode Inventaris</th><th>Tgl Pinjam</th><th>Jatuh Tempo</th><th>Tgl Kembali</th><th>Status</th>
            </tr>
        </thead>
        <tbody>
        @forelse ($baris as $i => $b)
            <tr>
                <td>{{ $i + 1 }}</td>
                <td>{{ $b['nomor_transaksi'] }}</td>
                <td>{{ $b['anggota'] }}</td>
                <td>{{ ucfirst((string) $b['jenis_anggota']) }}</td>
                <td>{{ $b['kelas_unit'] }}</td>
                <td>{{ $b['judul_buku'] }}</td>
                <td>{{ $b['kode_inventaris'] }}</td>
                <td>{{ $b['tanggal_pinjam'] }}</td>
                <td>{{ $b['tanggal_jatuh_tempo'] }}</td>
                <td>{{ $b['tanggal_kembali'] ?? '-' }}</td>
                <td>{{ ucfirst($b['status']) }}</td>
            </tr>
        @empty
            <tr><td colspan="11" style="text-align:center;">Tidak ada data.</td></tr>
        @endforelse
        </tbody>
    </table>
</body>
</html>
