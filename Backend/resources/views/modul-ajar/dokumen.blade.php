<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>{{ $dok['judul'] }}</title>
<style>
    @page { margin: 2cm 2cm 2cm 2.5cm; }
    body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #000; line-height: 1.35; }
    .tengah { text-align: center; }
    .sampul { page-break-after: always; text-align: center; padding-top: 120px; }
    .sampul .judul-sampul { font-size: 18pt; font-weight: bold; margin: 0 0 18px; }
    .sampul .topik { font-size: 14pt; font-weight: bold; text-transform: uppercase; margin: 0 0 90px; }
    .sampul table { margin: 0 auto 120px; border-collapse: collapse; text-align: left; }
    .sampul table td { padding: 3px 6px; vertical-align: top; }
    .sampul .instansi { font-size: 13pt; font-weight: bold; text-transform: uppercase; margin: 2px 0; }
    .judul-dokumen { font-size: 14pt; font-weight: bold; margin: 0; }
    .sub-judul { margin: 2px 0 0; }
    .judul { font-weight: bold; text-transform: uppercase; margin: 4px 0 0; }
    .status { font-size: 10pt; font-style: italic; color: #555; margin: 2px 0 0; }
    table.identitas { border-collapse: collapse; margin: 10px 0 6px; }
    table.identitas td { padding: 1px 4px 1px 0; vertical-align: top; }
    h2 { font-size: 12pt; font-weight: bold; text-transform: uppercase; margin: 16px 0 6px; page-break-after: avoid; }
    .sub { font-weight: bold; margin: 12px 0 3px; page-break-after: avoid; }
    .label { font-weight: bold; margin: 8px 0 2px; page-break-after: avoid; }
    .merdeka .label { font-style: italic; }
    .isi { text-align: justify; }
    .isi p { margin: 0 0 4px; }
    .isi ol, .isi ul, ul.daftar { margin: 2px 0 4px 0; padding-left: 22px; }
    .isi table { width: 100%; border-collapse: collapse; margin: 4px 0; }
    .isi td, .isi th { border: 1px solid #000; padding: 3px 5px; vertical-align: top; }
    .cp-elemen { font-weight: bold; margin: 6px 0 1px; }
    .pertemuan-judul { font-weight: bold; font-style: italic; margin: 10px 0 4px; }
    table.garis { width: 100%; border-collapse: collapse; }
    table.garis th { background: #e8f3ee; }
    table.garis td, table.garis th { border: 1px solid #000; padding: 4px 6px; vertical-align: top; text-align: left; }
    table.garis .isi p { margin: 0 0 2px; }
    table.garis ol { margin: 0; padding-left: 18px; }
    table.lkpd-kepala { width: 100%; border-collapse: collapse; margin: 2px 0 8px; }
    table.lkpd-kepala td { border: 1px solid #000; padding: 6px; }
    table.ttd { width: 100%; margin-top: 30px; page-break-inside: avoid; }
    table.ttd td { width: 50%; vertical-align: top; }
    .ruang-ttd { height: 70px; }
    .nama-ttd { font-weight: bold; text-decoration: underline; }
</style>
</head>
<body class="{{ $dok['sampul'] ? 'merdeka' : '' }}">
    @if ($dok['sampul'])
        @php($s = $dok['sampul'])
        <div class="sampul">
            <p class="judul-sampul">{{ $s['judul'] }}</p>
            <p class="topik">{{ $s['topik'] }}</p>
            <table>
                @foreach ($s['baris'] as $label => $nilai)
                    <tr><td>{{ $label }}</td><td>:</td><td><strong>{{ $nilai }}</strong></td></tr>
                @endforeach
            </table>
            @foreach (array_filter([$s['sekolah'], $s['kota'], $s['tahun_ajaran']]) as $baris)
                <p class="instansi">{{ $baris }}</p>
            @endforeach
        </div>
    @endif

    <div class="tengah">
        <p class="judul-dokumen">{{ $dok['judul_dokumen'] }}</p>
        <p class="sub-judul">{{ $dok['sub_judul'] }}</p>
        <p class="judul">{{ $dok['judul'] }}</p>
        @if ($dok['status'])
            <p class="status">{{ $dok['status'] }}</p>
        @endif
    </div>

    @if ($dok['identitas'])
        <table class="identitas">
            @foreach ($dok['identitas'] as $label => $nilai)
                <tr>
                    <td style="width: 150px">{{ $label }}</td>
                    <td style="width: 10px">:</td>
                    <td>{{ $nilai }}</td>
                </tr>
            @endforeach
        </table>
    @endif

    {{-- Nilai bertipe html/lkpd sudah dibersihkan App\Support\HtmlAman (hanya tag format dasar, tanpa atribut). --}}
    @foreach ($dok['bagian'] as $bagian)
        <h2>{{ $bagian['judul'] }}</h2>
        @foreach ($bagian['butir'] as $butir)
            @if ($butir['tipe'] === 'judul')
                <p class="sub">{{ $butir['label'] }}</p>
                @continue
            @endif
            @if ($butir['label'])
                <p class="label">{{ $butir['label'] }}</p>
            @endif
            @if ($butir['tipe'] === 'html')
                <div class="isi">{!! $butir['nilai'] !!}</div>
            @elseif ($butir['tipe'] === 'daftar')
                <ul class="daftar">
                    @foreach ($butir['nilai'] as $x)
                        <li>{{ $x }}</li>
                    @endforeach
                </ul>
            @elseif ($butir['tipe'] === 'info')
                <table class="identitas">
                    @foreach ($butir['nilai'] as $label => $nilai)
                        <tr>
                            <td style="width: 210px">{{ $label }}</td>
                            <td style="width: 10px">:</td>
                            <td>{{ $nilai }}</td>
                        </tr>
                    @endforeach
                </table>
            @elseif ($butir['tipe'] === 'cp')
                @foreach ($butir['nilai'] as $cp)
                    <p class="cp-elemen">Elemen: {{ $cp['elemen'] }}</p>
                    <div class="isi">{{ $cp['deskripsi'] }}</div>
                @endforeach
            @elseif ($butir['tipe'] === 'atp')
                <table class="garis">
                    <tr><th style="width: 22%">Waktu</th><th>Alur Tujuan Pembelajaran</th></tr>
                    @foreach ($butir['nilai'] as $g)
                        <tr>
                            <td><strong>{{ $g['waktu'] }}</strong></td>
                            <td><ol>@foreach ($g['kalimat'] as $k)<li>{{ $k }}</li>@endforeach</ol></td>
                        </tr>
                    @endforeach
                </table>
            @elseif ($butir['tipe'] === 'lkpd')
                <table class="lkpd-kepala"><tr><td style="width: 68%">Nama: ...............................................</td><td>Nilai: ............</td></tr></table>
                <div class="isi">{!! $butir['nilai'] !!}</div>
            @elseif ($butir['tipe'] === 'pertemuan')
                @foreach ($butir['nilai'] as $p)
                    <p class="pertemuan-judul">{{ $p['judul'] }}</p>
                    <table class="garis">
                        <tr><th style="width: 22%">Tahap</th><th>Kegiatan</th><th style="width: 13%">Durasi</th></tr>
                        @foreach ($p['tahap'] as $t)
                            <tr>
                                <td><strong>{{ $t['label'] }}</strong></td>
                                <td class="isi">{!! $t['isi'] !== '' ? $t['isi'] : '-' !!}</td>
                                <td>{{ $t['durasi'] ? $t['durasi'].' menit' : '-' }}</td>
                            </tr>
                        @endforeach
                    </table>
                @endforeach
            @endif
        @endforeach
    @endforeach

    <table class="ttd">
        <tr>
            <td>
                <br>Mengetahui,<br>Kepala Sekolah
                <div class="ruang-ttd"></div>
                <span class="nama-ttd">{{ $dok['kepala']['nama'] ?: '(.................................)' }}</span><br>
                NIP. {{ $dok['kepala']['nip'] ?: '-' }}
            </td>
            <td>
                {{ $dok['kota'] ? $dok['kota'].', ' : '' }}{{ $dok['tanggal'] }}<br><br>{{ $dok['guru']['jabatan'] }}
                <div class="ruang-ttd"></div>
                <span class="nama-ttd">{{ $dok['guru']['nama'] ?: '(.................................)' }}</span><br>
                NIP. {{ $dok['guru']['nip'] ?: '-' }}
            </td>
        </tr>
    </table>
</body>
</html>
