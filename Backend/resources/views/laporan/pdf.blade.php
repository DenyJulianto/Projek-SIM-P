<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $laporan['judul'] }}</title>
    <style>
        body { font-family: sans-serif; font-size: 9.5px; color: #1a1a1a; }
        h1 { font-size: 14px; text-align: center; margin: 0; text-transform: uppercase; }
        h2 { font-size: 12px; text-align: center; margin: 2px 0 2px; }
        h3 { font-size: 11px; margin: 14px 0 3px; }
        .sub { text-align: center; color: #555; margin-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #999; padding: 2.5px 4px; text-align: left; vertical-align: top; }
        th { background: #eee; }
        .r { text-align: right; }
        .stat td { border: 1px solid #ccc; }
        .note { color: #555; font-size: 9px; margin: 2px 0; }
        .foot { margin-top: 10px; font-size: 8.5px; color: #777; }
    </style>
</head>
<body>
@php($k = $laporan['konteks'])
    <h1>{{ $sekolah }}</h1>
    <h2>{{ $laporan['judul'] }}</h2>
    <div class="sub">
        Tahun Ajaran {{ $k['tahun_ajaran'] }} · Semester {{ ucfirst($k['semester']) }} · Periode {{ $k['periode'] }}
        @foreach (['jenjang' => 'Jenjang', 'tingkat' => 'Tingkat', 'rombel' => 'Rombel', 'mata_pelajaran' => 'Mapel', 'guru' => 'Guru'] as $key => $label)
            @if (!empty($k[$key])) · {{ $label }}: {{ $k[$key] }} @endif
        @endforeach
    </div>

    @if (count($laporan['ringkasan']))
        <table class="stat">
            <thead><tr><th>Ringkasan</th><th class="r">Nilai</th><th>Keterangan</th></tr></thead>
            <tbody>
            @foreach ($laporan['ringkasan'] as $s)
                <tr><td>{{ $s['label'] }}</td><td class="r">{{ $s['nilai'] ?? '-' }}</td><td>{{ $s['keterangan'] }}</td></tr>
            @endforeach
            </tbody>
        </table>
    @endif
    @foreach ($laporan['catatan'] as $n)
        <p class="note">Catatan: {{ $n }}</p>
    @endforeach

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

    <div class="foot">Dibuat {{ $dibuat }} oleh SIM Pendidikan. Laporan dihitung dari data modul akademik saat dibuat.</div>
</body>
</html>
