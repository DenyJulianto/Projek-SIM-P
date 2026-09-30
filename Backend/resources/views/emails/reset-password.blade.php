<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reset Password</title>
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
                            <h1 style="font-size:20px;color:#0b3d2e;margin:0 0 12px;">Reset Password Akun Anda</h1>
                            <p style="font-size:14px;color:#4b5563;line-height:1.6;margin:0 0 16px;">
                                Ada permintaan reset password untuk akun ini dari:
                            </p>
                            <p style="font-size:13px;color:#0b3d2e;background:#f0fdf4;border-radius:10px;padding:10px 14px;margin:0 0 24px;">
                                IP: {{ $requestIp }}<br>
                                Waktu: {{ $requestTime }}
                            </p>
                            <p style="font-size:14px;color:#4b5563;line-height:1.6;margin:0 0 24px;">
                                Klik tombol di bawah untuk membuat password baru. Link ini hanya berlaku selama
                                60 menit dan hanya bisa dipakai satu kali.
                            </p>
                            <table role="presentation" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="border-radius:999px;background:#14a673;">
                                        <a href="{{ $resetUrl }}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;">
                                            Reset Password
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="font-size:12px;color:#9ca3af;line-height:1.6;margin:24px 0 0;">
                                Kalau tombolnya tidak berfungsi, salin dan buka tautan berikut di browser Anda:<br>
                                <span style="word-break:break-all;">{{ $resetUrl }}</span>
                            </p>
                            <p style="font-size:12px;color:#9ca3af;line-height:1.6;margin:16px 0 0;">
                                Jika Anda tidak merasa meminta reset password, abaikan saja email ini — password
                                Anda tidak akan berubah tanpa Anda membuka link di atas.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
