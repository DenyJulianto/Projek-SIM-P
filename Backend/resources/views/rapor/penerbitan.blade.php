<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Rapor</title>
    <style>
        body { font-family: sans-serif; font-size: 11px; color: #1a1a1a; }
        h1 { font-size: 15px; text-align: center; margin: 6px 0 2px; }
        h2 { font-size: 12px; text-align: center; margin: 0 0 8px; color: #555; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #999; padding: 4px 6px; text-align: left; }
        th { background: #f0f0f0; }
        .info td { border: none; padding: 1px 6px 1px 0; }
        .center { text-align: center; }
        .right { text-align: right; }
        .section { margin-top: 14px; font-size: 12px; font-weight: bold; }
        .kop { text-align: center; margin-bottom: 4px; }
        .kop img { max-height: 48px; }
        .kop h3 { margin: 2px 0 0; font-size: 13px; }
        .kop p { margin: 0; font-size: 9px; color: #555; }
        .banner { border: 1px dashed #b45309; color: #b45309; text-align: center; padding: 3px; margin-bottom: 6px; font-weight: bold; }
        .ttd { width: 100%; margin-top: 28px; }
        .ttd td { border: none; text-align: center; width: 50%; vertical-align: top; }
        .ttd .space { height: 48px; }
        .nomor { text-align: right; font-size: 10px; color: #444; }
        .foot { margin-top: 14px; font-size: 9px; color: #666; }
        .pb { page-break-after: always; }
    </style>
</head>
<body>
@foreach ($items as $i => $r)
    <div @if (! $loop->last) class="pb" @endif>
        @if (! empty($r['_draft']))
            <div class="banner">DRAFT — BELUM DITERBITKAN</div>
        @endif
        <div class="kop">
            @if (! empty($r['template']['tampilkan_logo']) && ! empty($r['sekolah']['logo']))
                <img src="{{ $r['sekolah']['logo'] }}" alt="Logo">
            @endif
            <h3>{{ $r['sekolah']['nama'] }}</h3>
            @if (! empty($r['sekolah']['alamat']))
                <p>{{ $r['sekolah']['alamat'] }}</p>
            @endif
        </div>

        <h1>{{ $r['template']['header_text'] }}</h1>
        <h2>Semester {{ ucfirst($r['semester']) }} — Tahun Ajaran {{ $r['tahun_ajaran'] }}</h2>
        @if (! empty($r['nomor_rapor']))
            <div class="nomor">Nomor Rapor: <strong>{{ $r['nomor_rapor'] }}</strong></div>
        @endif

        <table class="info">
            <tr>
                <td><strong>Nama</strong></td><td>: {{ $r['siswa']['nama'] }}</td>
                <td><strong>Kelas</strong></td><td>: {{ $r['kelas']['nama_kelas'] ?? '-' }}</td>
            </tr>
            <tr>
                <td><strong>NIS / NISN</strong></td><td>: {{ $r['siswa']['nis'] ?? '-' }} / {{ $r['siswa']['nisn'] ?? '-' }}</td>
                <td><strong>Wali Kelas</strong></td><td>: {{ $r['wali_kelas']['nama'] ?? '-' }}</td>
            </tr>
        </table>

        <div class="section">Nilai Akademik</div>
        <table>
            <thead>
                <tr>
                    <th style="width:24px">No</th>
                    <th>Mata Pelajaran</th>
                    <th class="center">Harian</th>
                    <th class="center">Tugas</th>
                    <th class="center">UTS</th>
                    <th class="center">UAS</th>
                    <th class="center">Nilai Akhir</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($r['nilai'] as $n => $item)
                    <tr>
                        <td class="center">{{ $n + 1 }}</td>
                        <td>{{ $item['mata_pelajaran'] }}</td>
                        <td class="center">{{ $item['rincian']['harian'] ?? '-' }}</td>
                        <td class="center">{{ $item['rincian']['tugas'] ?? '-' }}</td>
                        <td class="center">{{ $item['rincian']['uts'] ?? '-' }}</td>
                        <td class="center">{{ $item['rincian']['uas'] ?? '-' }}</td>
                        <td class="center"><strong>{{ $item['rata_rata'] }}</strong></td>
                    </tr>
                @empty
                    <tr><td colspan="7" class="center">Belum ada data nilai.</td></tr>
                @endforelse
                @if (count($r['nilai']) > 0)
                    <tr>
                        <td colspan="6" class="right"><strong>Rata-rata Keseluruhan</strong></td>
                        <td class="center"><strong>{{ $r['rata_rata_umum'] }}</strong></td>
                    </tr>
                @endif
            </tbody>
        </table>

        <div class="section">Rekap Kehadiran</div>
        <table>
            <thead><tr><th>Hadir</th><th>Izin</th><th>Sakit</th><th>Alpha</th></tr></thead>
            <tbody>
                <tr class="center">
                    <td>{{ $r['absensi']['hadir'] }}</td>
                    <td>{{ $r['absensi']['izin'] }}</td>
                    <td>{{ $r['absensi']['sakit'] }}</td>
                    <td>{{ $r['absensi']['alpha'] }}</td>
                </tr>
            </tbody>
        </table>

        @if (! empty($r['catatan_wali_kelas']))
            <div class="section">Catatan Wali Kelas</div>
            <p>{{ $r['catatan_wali_kelas'] }}</p>
        @endif

        <table class="ttd">
            <tr>
                <td>
                    Wali Kelas
                    <div class="space"></div>
                    <strong>{{ $r['wali_kelas']['nama'] ?? '(.........................)' }}</strong>
                </td>
                <td>
                    @if (! empty($r['tanggal_terbit']))
                        {{ \Carbon\Carbon::parse($r['tanggal_terbit'])->translatedFormat('d F Y') }}<br>
                    @endif
                    {{ $r['penandatangan']['jabatan'] ?? 'Kepala Sekolah' }}
                    <div class="space"></div>
                    <strong>{{ $r['penandatangan']['nama'] ?? '(.........................)' }}</strong>
                </td>
            </tr>
        </table>

        @if (! empty($r['template']['catatan_kaki']))
            <div class="foot">{{ $r['template']['catatan_kaki'] }}</div>
        @endif
    </div>
@endforeach
</body>
</html>
