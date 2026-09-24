<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Kuitansi {{ $nomor }}</title>
    <style>
        @page { margin: 24px 32px; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 10.5px; color: #111; line-height: 1.5; }
        table { border-collapse: collapse; }
        .kop { width: 100%; border-bottom: 2px solid #111; padding-bottom: 6px; margin-bottom: 10px; }
        .kop td { border: none; padding: 0; vertical-align: middle; }
        .kop .nama { font-size: 14px; font-weight: bold; text-transform: uppercase; }
        .kop .alamat { font-size: 9px; color: #444; }
        .judul { text-align: center; font-size: 13px; font-weight: bold; letter-spacing: 2px; margin: 4px 0 0; }
        .nomor { text-align: center; font-size: 10px; color: #555; margin: 0 0 10px; }
        table.d { width: 100%; }
        table.d td { padding: 2px 3px; vertical-align: top; }
        table.d td.l { width: 120px; color: #444; }
        table.d td.c { width: 8px; }
        .kotak { border: 2px solid #111; padding: 6px 10px; text-align: center; }
        .kotak .k { font-size: 8px; letter-spacing: 1.5px; text-transform: uppercase; color: #555; }
        .kotak .v { font-size: 17px; font-weight: bold; }
        .ttd { text-align: center; }
    </style>
</head>
<body>
    <table class="kop"><tr>
        @if ($logo)<td style="width:56px"><img src="{{ $logo }}" style="height:48px"></td>@endif
        <td style="text-align:center">
            <div class="nama">{{ $sekolah->nama_sekolah }}</div>
            @if ($alamat)<div class="alamat">{{ $alamat }}</div>@endif
            @if ($kontak)<div class="alamat">{{ $kontak }}</div>@endif
        </td>
        @if ($logo)<td style="width:56px"></td>@endif
    </tr></table>

    <p class="judul">KUITANSI PEMBAYARAN</p>
    <p class="nomor">No. {{ $nomor }}</p>

    <table class="d">
        <tr>
            <td class="l">Telah terima dari</td><td class="c">:</td>
            <td><strong>{{ $siswa->nama }}</strong>@if ($siswa->nisn) &middot; NISN {{ $siswa->nisn }}@endif @if ($siswa->kelas) &middot; Kelas {{ $siswa->kelas->nama_kelas }}@endif</td>
        </tr>
        <tr>
            <td class="l">Uang sejumlah</td><td class="c">:</td>
            <td><em><strong>{{ $terbilang }}</strong></em></td>
        </tr>
        <tr>
            <td class="l">Untuk pembayaran</td><td class="c">:</td>
            <td><strong>{{ $tagihan->judul }}</strong>@if ($tagihan->periode) ({{ $tagihan->periode }})@endif</td>
        </tr>
        <tr>
            <td class="l">Metode</td><td class="c">:</td>
            <td>{{ $metode }}</td>
        </tr>
    </table>

    <table style="width:100%; margin-top:10px">
        <tr>
            <td style="width:50%; vertical-align:bottom; font-size:9.5px; color:#444">
                <table style="width:100%">
                    <tr><td>Nominal tagihan</td><td style="text-align:right"><strong>{{ $rp($tagihan->jumlah) }}</strong></td></tr>
                    <tr><td>Total terbayar</td><td style="text-align:right"><strong>{{ $rp($totalTerbayar) }}</strong></td></tr>
                    <tr><td>Sisa tagihan</td><td style="text-align:right"><strong>{{ $sisa > 0 ? $rp($sisa) : 'LUNAS' }}</strong></td></tr>
                </table>
            </td>
            <td style="width:8%"></td>
            <td style="width:42%; vertical-align:bottom">
                <div class="kotak"><div class="k">Jumlah dibayar</div><div class="v">{{ $rp($pembayaran->jumlah) }}</div></div>
            </td>
        </tr>
    </table>

    <table style="width:100%; margin-top:14px">
        <tr>
            <td style="width:58%"></td>
            <td class="ttd">
                {{ $kota ? $kota.', ' : '' }}{{ $tanggal }}<br>
                <strong>Bendahara</strong>
                <div style="height:44px"></div>
                <strong style="border-top:1px solid #444; padding-top:2px; display:inline-block; min-width:140px">{{ $penandatangan }}</strong>
            </td>
        </tr>
    </table>
</body>
</html>
