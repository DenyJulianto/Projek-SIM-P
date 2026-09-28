<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Bukti Pembayaran Denda #{{ $denda->id }}</title>
    <style>
        body { font-family: sans-serif; font-size: 11px; color: #1a1a1a; }
        h1 { font-size: 14px; text-align: center; margin: 0; text-transform: uppercase; }
        h2 { font-size: 12px; text-align: center; margin: 2px 0 10px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 3px 4px; vertical-align: top; }
        td.k { width: 38%; color: #555; }
        .jumlah { text-align: center; border: 1.5px solid #333; padding: 8px; margin: 10px 0; font-size: 16px; font-weight: bold; }
        .ttd { margin-top: 24px; width: 100%; }
    </style>
</head>
<body>
    <h1>{{ $sekolah }}</h1>
    <h2>Bukti Pembayaran Denda Perpustakaan</h2>

    <table>
        <tr><td class="k">Nama anggota</td><td>: {{ $denda->anggota->nama }}</td></tr>
        <tr><td class="k">Nomor kartu</td><td>: {{ $denda->anggota->nomor_kartu }}</td></tr>
        <tr><td class="k">Jenis denda</td><td>: {{ ucfirst($denda->jenis_denda) }}</td></tr>
        <tr><td class="k">Tanggal</td><td>: {{ \Illuminate\Support\Carbon::parse($denda->tanggal)->locale('id')->translatedFormat('d F Y') }}</td></tr>
        <tr><td class="k">Catatan</td><td>: {{ $denda->catatan ?: '-' }}</td></tr>
        <tr><td class="k">Dibayar pada</td><td>: {{ $denda->dibayar_at?->locale('id')->translatedFormat('d F Y H:i') }}</td></tr>
        <tr><td class="k">Diterima oleh</td><td>: {{ $denda->petugas?->name ?? '-' }}</td></tr>
    </table>

    <div class="jumlah">Rp {{ number_format((float) $denda->jumlah, 0, ',', '.') }}</div>

    <table class="ttd"><tr>
        <td style="text-align:center;width:50%">Pembayar<br><br><br><br>(..............................)</td>
        <td style="text-align:center;width:50%">Petugas Perpustakaan<br><br><br><br>(..............................)</td>
    </tr></table>
</body>
</html>
