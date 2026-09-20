<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Kalender Akademik {{ $ta['nama'] }}</title>
    <style>
        body { font-family: sans-serif; font-size: 10.5px; color: #1a1a1a; }
        h1 { font-size: 15px; text-align: center; margin: 0; }
        h2 { font-size: 12px; text-align: center; margin: 2px 0 10px; color: #555; }
        h3 { font-size: 12px; margin: 14px 0 4px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #999; padding: 3px 5px; text-align: left; vertical-align: top; }
        th { background: #f0f0f0; }
        .tag { font-size: 9px; color: #555; }
        .center { text-align: center; }
    </style>
</head>
<body>
    <h1>{{ $sekolah }}</h1>
    <h2>Kalender Akademik Tahun Ajaran {{ $ta['nama'] }}</h2>

    <h3>Periode Akademik</h3>
    <table>
        <thead>
            <tr><th>Periode</th><th>Awal</th><th>Akhir</th><th class="center">Hari Efektif</th><th class="center">Libur</th><th class="center">Minggu Efektif</th></tr>
        </thead>
        <tbody>
            <tr><td>Tahun Ajaran {{ $ta['nama'] }}</td><td>{{ $ta['awal'] }}</td><td>{{ $ta['akhir'] }}</td><td></td><td></td><td></td></tr>
            @foreach ($semester as $s)
                <tr>
                    <td>Semester {{ ucfirst($s['semester']) }}</td>
                    <td>{{ $s['awal'] ?? '-' }}</td>
                    <td>{{ $s['akhir'] ?? '-' }}</td>
                    <td class="center">{{ $s['hari_efektif']['hari_efektif'] ?? '-' }}</td>
                    <td class="center">{{ $s['hari_efektif']['libur'] ?? '-' }}</td>
                    <td class="center">{{ $s['hari_efektif']['minggu_efektif'] ?? '-' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    @forelse ($perBulan as $bulan => $items)
        <h3>{{ \Carbon\Carbon::parse($bulan.'-01')->translatedFormat('F Y') }}</h3>
        <table>
            <thead>
                <tr><th style="width:90px">Tanggal</th><th>Kegiatan</th><th style="width:85px">Kategori</th><th>Penanggung Jawab / Lokasi</th><th style="width:70px">Status</th></tr>
            </thead>
            <tbody>
                @foreach ($items as $e)
                    <tr>
                        <td>
                            {{ \Carbon\Carbon::parse($e['tanggal_mulai'])->format('d/m/Y') }}
                            @if ($e['tanggal_selesai'] !== $e['tanggal_mulai'])
                                – {{ \Carbon\Carbon::parse($e['tanggal_selesai'])->format('d/m/Y') }}
                            @endif
                        </td>
                        <td>{{ $e['judul'] }} <span class="tag">({{ $e['sumber_label'] }})</span></td>
                        <td>{{ $e['kategori_label'] }}</td>
                        <td>{{ trim(($e['penanggung_jawab'] ?? '').' '.($e['lokasi'] ? '· '.$e['lokasi'] : '')) ?: '-' }}</td>
                        <td>{{ $e['status_label'] }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @empty
        <p>Belum ada agenda.</p>
    @endforelse
</body>
</html>
