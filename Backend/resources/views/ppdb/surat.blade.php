<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Surat Hasil Seleksi {{ $p->nomor_pendaftaran }}</title>
    <style>
        body { font-family: serif; font-size: 12px; color: #111; line-height: 1.5; }
        h1 { font-size: 16px; text-align: center; margin: 0; text-transform: uppercase; }
        .garis { border-bottom: 2px solid #111; margin: 6px 0 14px; }
        h2 { font-size: 13px; text-align: center; text-decoration: underline; margin: 10px 0 2px; }
        td { padding: 1px 4px; vertical-align: top; }
        .hasil { text-align: center; font-size: 15px; font-weight: bold; margin: 12px 0; padding: 8px; border: 1.5px solid #111; }
        .ttd { margin-top: 30px; width: 45%; margin-left: 55%; text-align: center; }
    </style>
</head>
<body>
    <h1>{{ $sekolah }}</h1>
    <div class="garis"></div>
    <h2>SURAT KETERANGAN HASIL SELEKSI</h2>
    <p style="text-align:center;margin-top:0">{{ $periode->nama }} · Tahun Ajaran {{ $periode->tahunAjaran?->nama }}</p>

    <p>Panitia PPDB {{ $sekolah }} menerangkan bahwa:</p>
    <table>
        <tr><td>Nama</td><td>: {{ $p->nama_lengkap }}</td></tr>
        <tr><td>No. Pendaftaran</td><td>: {{ $p->nomor_pendaftaran }}</td></tr>
        <tr><td>Jalur</td><td>: {{ $p->jalur?->nama }}</td></tr>
        <tr><td>Asal Sekolah</td><td>: {{ $p->sekolah_asal ?: '-' }}</td></tr>
    </table>
    <div class="hasil">{{ $lolos ? 'DINYATAKAN LOLOS' : 'TIDAK LOLOS' }}</div>
    @if ($lolos)
        <p>Peserta wajib melakukan daftar ulang pada <strong>{{ $daftarUlang }}</strong> dengan membawa dokumen persyaratan yang ditetapkan panitia. Peserta yang tidak daftar ulang sampai batas waktu dianggap mengundurkan diri.</p>
    @else
        <p>Terima kasih atas partisipasi dalam seleksi penerimaan peserta didik baru. Kami mendoakan yang terbaik untuk pendidikan selanjutnya.</p>
    @endif
    <div class="ttd">Ditetapkan pada {{ $tanggal }}<br>Ketua Panitia PPDB<br><br><br><br>(..............................)</div>
</body>
</html>
