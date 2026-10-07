<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>{{ $dok['judul'] }}</title>
<style>
    @page { margin: 1.6cm 1.5cm; }
    body { font-family: 'DejaVu Serif', 'Times New Roman', serif; font-size: 9pt; color: #000; line-height: 1.3; }
    .judul { font-size: 13pt; font-weight: bold; text-align: center; margin: 0 0 10px; }
    table.identitas { border-collapse: collapse; margin: 0 0 10px; }
    table.identitas td { padding: 1px 6px 1px 0; vertical-align: top; }
    .label { font-weight: bold; margin: 6px 0 2px; }
    .teks { margin: 0 0 8px; text-align: justify; }
    table.isi { width: 100%; border-collapse: collapse; table-layout: fixed; }
    table.isi th { background: #e8f3ee; font-weight: bold; text-align: center; }
    table.isi th, table.isi td { border: 1px solid #000; padding: 3px 4px; vertical-align: top; word-wrap: break-word; }
    table.isi tr { page-break-inside: avoid; }
    table.isi thead { display: table-header-group; }
    .tengah { text-align: center; }
    /* DejaVu Serif tidak punya glyph ✓. */
    .centang { font-family: 'DejaVu Sans', sans-serif; font-size: 11pt; }
    .kosong { text-align: center; font-style: italic; color: #555; }
    table.ttd { width: 100%; margin-top: 24px; page-break-inside: avoid; }
    table.ttd td { width: 50%; vertical-align: top; text-align: center; }
    .ruang-ttd { height: 60px; }
    .nama-ttd { font-weight: bold; text-decoration: underline; }
</style>
</head>
<body>
    <p class="judul">{{ $dok['judul'] }}</p>

    <table class="identitas">
        @foreach ($dok['identitas'] as $label => $nilai)
            <tr><td>{{ $label }}</td><td>:</td><td><strong>{{ $nilai }}</strong></td></tr>
        @endforeach
    </table>

    @if ($dok['pengantar'])
        <p class="label">{{ $dok['pengantar'][0] }}</p>
        <p class="teks">{!! nl2br(e($dok['pengantar'][1])) !!}</p>
    @endif

    <table class="isi">
        <thead>
            <tr>
                @foreach ($dok['kolom'] as $i => $k)
                    <th style="width: {{ $dok['lebar_persen'][$i] }}%">{{ $k[0] }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @forelse ($dok['baris'] as $baris)
                <tr>
                    @foreach ($baris as $i => $sel)
                        <td class="{{ in_array($i, $dok['tengah'], true) ? 'tengah' : '' }}">@if ($sel === '✓')<span class="centang">✓</span>@else{!! nl2br(e($sel)) !!}@endif</td>
                    @endforeach
                </tr>
            @empty
                <tr><td class="kosong" colspan="{{ count($dok['kolom']) }}">Belum ada isian.</td></tr>
            @endforelse
        </tbody>
    </table>

    @if ($dok['catatan'] !== '')
        <p class="label">Catatan:</p>
        <p class="teks">{!! nl2br(e($dok['catatan'])) !!}</p>
    @endif

    <table class="ttd">
        <tr>
            <td>
                <br>Mengetahui,<br>Kepala Sekolah
                <div class="ruang-ttd"></div>
                <span class="nama-ttd">{{ $dok['kepala']['nama'] ?: '(.................................)' }}</span><br>
                NIP. {{ $dok['kepala']['nip'] ?: '-' }}
            </td>
            <td>
                {{ trim(($dok['kota'] ? $dok['kota'].', ' : '').$dok['tanggal']) }}<br><br>{{ $dok['guru']['jabatan'] }}
                <div class="ruang-ttd"></div>
                <span class="nama-ttd">{{ $dok['guru']['nama'] ?: '(.................................)' }}</span><br>
                NIP. {{ $dok['guru']['nip'] ?: '-' }}
            </td>
        </tr>
    </table>
</body>
</html>
