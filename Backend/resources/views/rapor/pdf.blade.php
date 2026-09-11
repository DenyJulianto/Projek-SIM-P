<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Rapor {{ $siswa->nama }}</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; color: #1a1a1a; }
        h1 { font-size: 16px; text-align: center; margin-bottom: 4px; }
        h2 { font-size: 13px; text-align: center; margin-top: 0; color: #555; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #999; padding: 6px 8px; text-align: left; }
        th { background: #f0f0f0; }
        .info-table td { border: none; padding: 2px 8px 2px 0; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .section-title { margin-top: 20px; font-size: 13px; font-weight: bold; }
        .kop { display: table; width: 100%; margin-bottom: 8px; }
        .kop-logo { display: table-cell; width: 60px; vertical-align: middle; }
        .kop-logo img { max-width: 50px; max-height: 50px; }
        .kop-text { display: table-cell; vertical-align: middle; text-align: center; }
        .kop-text h3 { margin: 0; font-size: 13px; }
        .ttd { margin-top: 40px; width: 260px; margin-left: auto; text-align: center; }
        .ttd .space { height: 50px; }
        .footer-note { margin-top: 24px; font-size: 10px; color: #666; }
    </style>
</head>
<body>
    <div class="kop">
        @if ($template->tampilkan_logo && $sekolah->logo)
            <div class="kop-logo"><img src="{{ $sekolah->logo }}" alt="Logo"></div>
        @endif
        <div class="kop-text">
            <h3>{{ $sekolah->nama_sekolah }}</h3>
        </div>
    </div>

    <h1>{{ $template->header_text }}</h1>
    <h2>Semester {{ $semester }} - Tahun Ajaran {{ $tahunAjaran }}</h2>

    <table class="info-table">
        <tr>
            <td><strong>Nama</strong></td>
            <td>: {{ $siswa->nama }}</td>
            <td><strong>Kelas</strong></td>
            <td>: {{ $siswa->kelas->nama_kelas ?? '-' }}</td>
        </tr>
        <tr>
            <td><strong>NIS</strong></td>
            <td>: {{ $siswa->nis }}</td>
            <td><strong>NISN</strong></td>
            <td>: {{ $siswa->nisn ?? '-' }}</td>
        </tr>
    </table>

    <div class="section-title">Nilai Akademik</div>
    <table>
        <thead>
            <tr>
                <th>Mata Pelajaran</th>
                <th class="text-center">Rata-rata</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($nilai as $item)
                <tr>
                    <td>{{ $item['mata_pelajaran'] }}</td>
                    <td class="text-center">{{ $item['rata_rata'] }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="2" class="text-center">Belum ada data nilai.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="section-title">Rekap Kehadiran</div>
    <table>
        <thead>
            <tr>
                <th>Hadir</th>
                <th>Izin</th>
                <th>Sakit</th>
                <th>Alpha</th>
            </tr>
        </thead>
        <tbody>
            <tr class="text-center">
                <td>{{ $rekapAbsensi['hadir'] ?? 0 }}</td>
                <td>{{ $rekapAbsensi['izin'] ?? 0 }}</td>
                <td>{{ $rekapAbsensi['sakit'] ?? 0 }}</td>
                <td>{{ $rekapAbsensi['alpha'] ?? 0 }}</td>
            </tr>
        </tbody>
    </table>

    @if ($template->nama_penandatangan)
        <div class="ttd">
            <p>{{ $template->jabatan_penandatangan }}</p>
            <div class="space"></div>
            <p><strong>{{ $template->nama_penandatangan }}</strong></p>
        </div>
    @endif

    @if ($template->catatan_kaki)
        <div class="footer-note">{{ $template->catatan_kaki }}</div>
    @endif
</body>
</html>
