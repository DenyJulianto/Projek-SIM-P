<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Pendaftaran Siswa Disetujui</title>
</head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;">
                    <tr>
                        <td style="background:#0b3d2e;padding:24px 32px;">
                            <span style="color:#ffffff;font-size:18px;font-weight:bold;">{{ $namaSekolah }}</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px;">
                            <h1 style="font-size:20px;color:#0b3d2e;margin:0 0 12px;">Halo, {{ $nama }}</h1>
                            <p style="font-size:14px;color:#4b5563;line-height:1.6;margin:0 0 16px;">
                                Pendaftaran Anda sebagai siswa {{ $namaSekolah }} telah disetujui. Anda ditempatkan di
                                kelas <strong>{{ $kelas }}</strong>. Berikut informasi login akun siswa Anda:
                            </p>
                            <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#f0fdf4;border-radius:10px;margin:0 0 16px;">
                                <tr>
                                    <td style="padding:12px 14px;font-size:13px;color:#4b5563;">Username (NISN)</td>
                                    <td style="padding:12px 14px;font-size:14px;color:#0b3d2e;font-weight:bold;">{{ $username }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:0 14px 12px;font-size:13px;color:#4b5563;">Password sementara</td>
                                    <td style="padding:0 14px 12px;font-size:14px;color:#0b3d2e;font-weight:bold;font-family:monospace;">{{ $password }}</td>
                                </tr>
                            </table>
                            <p style="margin:0 0 20px;">
                                <a href="{{ $loginUrl }}" style="display:inline-block;background:#14a673;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 24px;border-radius:999px;">Masuk ke Akun Siswa</a>
                            </p>
                            <p style="font-size:13px;color:#4b5563;line-height:1.6;margin:0;">
                                Anda akan diminta mengganti password saat login pertama. Jangan bagikan password ini kepada siapa pun.
                                Akun orang tua/wali diserahkan langsung oleh sekolah.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
