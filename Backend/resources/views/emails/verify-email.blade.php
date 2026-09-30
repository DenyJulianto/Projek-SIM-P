<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Verifikasi Akun</title>
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
                            <h1 style="font-size:20px;color:#0b3d2e;margin:0 0 12px;">Verifikasi Akun Anda</h1>
                            <p style="font-size:14px;color:#4b5563;line-height:1.6;margin:0 0 24px;">
                                Terima kasih telah mendaftar. Klik tombol di bawah untuk mengaktifkan akun Anda.
                                Link ini berlaku selama 24 jam dan hanya bisa dipakai satu kali.
                            </p>
                            <table role="presentation" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="border-radius:999px;background:#14a673;">
                                        <a href="{{ $verificationUrl }}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;">
                                            Verifikasi Email
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="font-size:12px;color:#9ca3af;line-height:1.6;margin:24px 0 0;">
                                Kalau tombolnya tidak berfungsi, salin dan buka tautan berikut di browser Anda:<br>
                                <span style="word-break:break-all;">{{ $verificationUrl }}</span>
                            </p>
                            <p style="font-size:12px;color:#9ca3af;line-height:1.6;margin:16px 0 0;">
                                Jika Anda tidak merasa mendaftar, abaikan saja email ini — tidak ada tindakan lebih
                                lanjut yang diperlukan.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
