<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $laporan['judul'] }}</title>
    <style>
        body { font-family: sans-serif; font-size: 9px; color: #1a1a1a; }
        .kop { width: 100%; border-bottom: 2px solid #222; padding-bottom: 6px; margin-bottom: 8px; }
        .kop td { border: none; padding: 0; vertical-align: middle; }
        .kop .nama { font-size: 14px; font-weight: bold; text-transform: uppercase; }
        .kop .alamat { font-size: 9px; color: #444; }
        h2 { font-size: 12px; text-align: center; margin: 4px 0 1px; text-transform: uppercase; }
        .sub { text-align: center; color: #555; margin-bottom: 8px; }
        h3 { font-size: 10.5px; margin: 12px 0 3px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #999; padding: 2.5px 4px; text-align: left; vertical-align: top; }
        th { background: #eee; }
        .r { text-align: right; }
        .note { color: #555; font-size: 8.5px; margin: 2px 0; }
        .ttd { width: 100%; margin-top: 18px; page-break-inside: avoid; }
        .ttd td { border: none; text-align: center; vertical-align: top; }
        .foot { margin-top: 8px; font-size: 8px; color: #777; }
    </style>
</head>
<body>
@php($k = $laporan['konteks'])
@php($p = $laporan['pengaturan'])
    <table class="kop"><tr>
        @if ($logo)<td style="width:60px"><img src="{{ $logo }}" style="height:52px"></td>@endif
        <td style="text-align:center">
            <div class="nama">{{ $p['kop']['nama'] }}</div>
            @if ($p['kop']['alamat'])<div class="alamat">{{ $p['kop']['alamat'] }}</div>@endif
            @if ($p['kop']['kontak'])<div class="alamat">{{ $p['kop']['kontak'] }}</div>@endif
        </td>
        @if ($logo)<td style="width:60px"></td>@endif
    </tr></table>

    <h2>{{ $laporan['judul'] }}</h2>
    <div class="sub">
        Tahun Ajaran {{ $k['tahun_ajaran'] }} · Semester {{ $k['semester'] === 'ganjil' ? 'Ganjil' : ($k['semester'] === 'genap' ? 'Genap' : 'Semua') }} · Periode {{ $k['periode'] }}
        @foreach (['jenjang' => 'Jenjang', 'tingkat' => 'Tingkat', 'rombel' => 'Rombel'] as $key => $label)
            @if (!empty($k[$key])) · {{ $label }}: {{ $k[$key] }} @endif
        @endforeach
    </div>

    @if (count($laporan['ringkasan']))
        <table>
            <tbody>
            @foreach ($laporan['ringkasan'] as $s)
                <tr>
                    <td>{{ $s['label'] }}</td>
                    <td class="r" style="width:70px;font-weight:bold">{{ $s['nilai'] ?? '-' }}{{ ! empty($s['keterangan']) && str_starts_with($s['keterangan'], '%') && $s['nilai'] !== null ? '%' : '' }}</td>
                    <td style="color:#666">{{ ! empty($s['keterangan']) && $s['keterangan'] !== '%' ? ltrim($s['keterangan'], '% ') : '' }}</td>
                </tr>
            @endforeach
            </tbody>
        </table>
    @endif
    @foreach ($laporan['catatan'] as $n)<p class="note">Catatan: {{ $n }}</p>@endforeach

    @foreach ($laporan['tabel'] as $t)
        <h3>{{ $t['judul'] }}</h3>
        @if ($t['keterangan'])<p class="note">{{ $t['keterangan'] }}</p>@endif
        <table>
            <thead><tr>@foreach ($t['kolom'] as $kol)<th class="{{ in_array($kol['tipe'], ['angka','desimal','persen']) ? 'r' : '' }}">{{ $kol['label'] }}</th>@endforeach</tr></thead>
            <tbody>
            @forelse ($t['baris'] as $b)
                <tr>
                @foreach ($t['kolom'] as $kol)
                    @php($v = $b[$kol['key']] ?? null)
                    <td class="{{ in_array($kol['tipe'], ['angka','desimal','persen']) ? 'r' : '' }}">{{ $v === null || $v === '' ? '-' : $v }}{{ $kol['tipe'] === 'persen' && $v !== null ? '%' : '' }}</td>
                @endforeach
                </tr>
            @empty
                <tr><td colspan="{{ count($t['kolom']) }}" style="text-align:center;color:#777">Tidak ada data.</td></tr>
            @endforelse
            </tbody>
        </table>
    @endforeach

    @if (count($p['penandatangan']))
        <table class="ttd"><tr>
            @foreach ($p['penandatangan'] as $i => $ttd)
                <td style="width:{{ 100 / count($p['penandatangan']) }}%">
                    @if ($i === count($p['penandatangan']) - 1){{ $p['kota'] ? $p['kota'].', ' : '' }}{{ $tanggalLaporan }}@else&nbsp;@endif<br>
                    {{ $ttd['jabatan'] }}<br><br><br><br>
                    <strong style="text-decoration:underline">{{ ! empty($ttd['nama']) ? $ttd['nama'] : '..............................' }}</strong><br>
                    @if (!empty($ttd['nip']))NIP. {{ $ttd['nip'] }}@endif
                </td>
            @endforeach
        </tr></table>
    @endif
    <div class="foot">Dibuat {{ $dibuat }} melalui SIM Pendidikan. Isi laporan dihitung dari data modul kesiswaan saat dibuat.</div>
</body>
</html>
