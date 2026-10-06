<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>{{ $dok['judul'] }}</title>
<style>
    @page { margin: 2cm 2cm 2cm 2.5cm; }
    body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #000; line-height: 1.35; }
    .tengah { text-align: center; }
    .judul-dokumen { font-size: 14pt; font-weight: bold; margin: 0; }
    .sub-judul { margin: 2px 0 0; }
    .judul { font-weight: bold; text-transform: uppercase; margin: 4px 0 0; }
    .status { font-size: 10pt; font-style: italic; color: #555; margin: 2px 0 0; }
    table.identitas { border-collapse: collapse; margin: 16px 0 6px; }
    table.identitas td { padding: 1px 4px 1px 0; vertical-align: top; }
    h2 { font-size: 12pt; font-weight: bold; text-transform: uppercase; margin: 16px 0 6px; page-break-after: avoid; }
    .label { font-weight: bold; margin: 8px 0 2px; page-break-after: avoid; }
    .isi { text-align: justify; }
    .isi p { margin: 0 0 4px; }
    .isi ol, .isi ul, ul.daftar { margin: 2px 0 4px 0; padding-left: 22px; }
    .isi table { width: 100%; border-collapse: collapse; margin: 4px 0; }
    .isi td, .isi th { border: 1px solid #000; padding: 3px 5px; vertical-align: top; }
    .cp-elemen { font-weight: bold; margin: 6px 0 1px; }
    .pertemuan-judul { font-weight: bold; font-style: italic; margin: 10px 0 4px; }
    table.pertemuan { width: 100%; border-collapse: collapse; }
    table.pertemuan th { background: #e8f3ee; }
    table.pertemuan td, table.pertemuan th { border: 1px solid #000; padding: 4px 6px; vertical-align: top; text-align: left; }
    table.pertemuan .isi p { margin: 0 0 2px; }
    table.ttd { width: 100%; margin-top: 30px; }
    table.ttd td { width: 50%; vertical-align: top; }
    .ruang-ttd { height: 70px; }
    .nama-ttd { font-weight: bold; text-decoration: underline; }
</style>
</head>
<body>
    <div class="tengah">
        <p class="judul-dokumen">{{ $dok['judul_dokumen'] }}</p>
        <p class="sub-judul">{{ $dok['sub_judul'] }}</p>
        <p class="judul">{{ $dok['judul'] }}</p>
        @if ($dok['status'])
            <p class="status">{{ $dok['status'] }}</p>
        @endif
    </div>

    <table class="identitas">
        @foreach ($dok['identitas'] as $label => $nilai)
            <tr>
                <td style="width: 150px">{{ $label }}</td>
                <td style="width: 10px">:</td>
                <td>{{ $nilai }}</td>
            </tr>
        @endforeach
    </table>

    {{-- Nilai bertipe html sudah dibersihkan App\Support\HtmlAman (hanya tag format dasar, tanpa atribut). --}}
    @foreach ($dok['bagian'] as $i => $bagian)
        <h2>{{ chr(65 + $i) }}. {{ $bagian['judul'] }}</h2>
        @foreach ($bagian['butir'] as $butir)
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
            @elseif ($butir['tipe'] === 'cp')
                @foreach ($butir['nilai'] as $cp)
                    <p class="cp-elemen">Elemen: {{ $cp['elemen'] }}</p>
                    <div class="isi">{{ $cp['deskripsi'] }}</div>
                @endforeach
            @elseif ($butir['tipe'] === 'pertemuan')
                @foreach ($butir['nilai'] as $p)
                    <p class="pertemuan-judul">{{ $p['judul'] }}</p>
                    <table class="pertemuan">
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
                Mengetahui,<br>Kepala Sekolah
                <div class="ruang-ttd"></div>
                <span class="nama-ttd">{{ $dok['kepala']['nama'] ?: '(.................................)' }}</span><br>
                NIP. {{ $dok['kepala']['nip'] ?: '-' }}
            </td>
            <td>
                {{ $dok['kota'] ? $dok['kota'].', ' : '' }}{{ $dok['tanggal'] }}<br>Guru Mata Pelajaran
                <div class="ruang-ttd"></div>
                <span class="nama-ttd">{{ $dok['guru']['nama'] ?: '(.................................)' }}</span><br>
                NIP. {{ $dok['guru']['nip'] ?: '-' }}
            </td>
        </tr>
    </table>
</body>
</html>
