<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Surat Mutasi {{ $siswa->nama }}</title>
    <style>
        body { font-family: serif; font-size: 12px; color: #111; line-height: 1.55; }
        .kop { width: 100%; border-bottom: 2.5px solid #111; padding-bottom: 6px; margin-bottom: 14px; }
        .kop td { border: none; padding: 0; vertical-align: middle; }
        .kop .nama { font-size: 16px; font-weight: bold; text-transform: uppercase; }
        .kop .alamat { font-size: 10px; }
        h2 { font-size: 13px; text-align: center; text-decoration: underline; margin: 6px 0 0; }
        .nomor { text-align: center; margin: 0 0 12px; }
        table.d td { padding: 1px 4px; vertical-align: top; }
        .ttd { margin-top: 28px; width: 45%; margin-left: 55%; text-align: center; }
    </style>
</head>
<body>
    <table class="kop"><tr>
        @if ($logo)<td style="width:64px"><img src="{{ $logo }}" style="height:56px"></td>@endif
        <td style="text-align:center">
            <div class="nama">{{ $pengaturan['kop']['nama'] }}</div>
            @if ($pengaturan['kop']['alamat'])<div class="alamat">{{ $pengaturan['kop']['alamat'] }}</div>@endif
            @if ($pengaturan['kop']['kontak'])<div class="alamat">{{ $pengaturan['kop']['kontak'] }}</div>@endif
        </td>
        @if ($logo)<td style="width:64px"></td>@endif
    </tr></table>

    <h2>SURAT KETERANGAN {{ $m->jenis === 'masuk' ? 'PENERIMAAN SISWA PINDAHAN' : ($m->jenis === 'pindah_sekolah' ? 'PINDAH SEKOLAH' : 'KELUAR SEKOLAH') }}</h2>
    <p class="nomor">Nomor: {{ $m->nomor_surat ?: '............../MUT/............' }}</p>

    <p>Yang bertanda tangan di bawah ini, pimpinan {{ $pengaturan['kop']['nama'] }}, menerangkan bahwa:</p>
    <table class="d">
        <tr><td style="width:150px">Nama</td><td>: {{ $siswa->nama }}</td></tr>
        <tr><td>NIS / NISN</td><td>: {{ $siswa->nis }} / {{ $siswa->nisn ?: '-' }}</td></tr>
        <tr><td>Tempat, tanggal lahir</td><td>: {{ $ttl }}</td></tr>
        <tr><td>Jenis kelamin</td><td>: {{ $siswa->jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan' }}</td></tr>
        <tr><td>Kelas terakhir</td><td>: {{ $siswa->kelas?->nama_kelas ?? '-' }}</td></tr>
    </table>

    @if ($m->jenis === 'masuk')
        <p>Diterima sebagai siswa pindahan pada tanggal <strong>{{ $tanggalMutasi }}</strong>@if ($m->asal_sekolah), berasal dari <strong>{{ $m->asal_sekolah }}</strong>@endif.</p>
    @elseif ($m->jenis === 'pindah_sekolah')
        <p>Pada tanggal <strong>{{ $tanggalMutasi }}</strong> dinyatakan <strong>pindah sekolah</strong> ke <strong>{{ $m->tujuan_sekolah ?: '-' }}</strong>.</p>
    @else
        <p>Pada tanggal <strong>{{ $tanggalMutasi }}</strong> dinyatakan <strong>keluar</strong> dari sekolah ini.</p>
    @endif
    @if ($m->alasan)<p>Alasan: {{ $m->alasan }}.</p>@endif
    @if ($m->keterangan)<p>Keterangan: {{ $m->keterangan }}</p>@endif
    <p>Demikian surat keterangan ini dibuat untuk dipergunakan sebagaimana mestinya.</p>

    <div class="ttd">
        {{ $pengaturan['kota'] ? $pengaturan['kota'].', ' : '' }}{{ $tanggalSurat }}<br>
        {{ $pengaturan['penandatangan'][0]['jabatan'] ?? 'Kepala Sekolah' }}<br><br><br><br>
        <strong style="text-decoration:underline">{{ ! empty($pengaturan['penandatangan'][0]['nama']) ? $pengaturan['penandatangan'][0]['nama'] : '..............................' }}</strong><br>
        @if (!empty($pengaturan['penandatangan'][0]['nip']))NIP. {{ $pengaturan['penandatangan'][0]['nip'] }}@endif
    </div>
</body>
</html>
