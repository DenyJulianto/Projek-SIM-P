<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Password Diubah</title>
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
                            <h1 style="font-size:20px;color:#0b3d2e;margin:0 0 12px;">Password Anda Baru Saja Diubah</h1>
                            <p style="font-size:14px;color:#4b5563;line-height:1.6;margin:0 0 16px;">
                                Password akun ini baru saja diubah lewat menu lupa password:
                            </p>
                            <p style="font-size:13px;color:#0b3d2e;background:#f0fdf4;border-radius:10px;padding:10px 14px;margin:0 0 24px;">
                                IP: {{ $ip }}<br>
                                Waktu: {{ $changedAt }}
                            </p>
                            <p style="font-size:14px;color:#b91c1c;line-height:1.6;margin:0;">
                                Semua sesi login aktif Anda telah dikeluarkan otomatis. Jika ini bukan Anda,
                                segera hubungi Admin Sekolah atau Tata Usaha untuk mengamankan akun Anda.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
