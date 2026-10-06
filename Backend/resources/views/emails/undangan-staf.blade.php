<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Undangan Akun</title>
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
                            <p style="font-size:14px;color:#4b5563;line-height:1.6;margin:0 0 24px;">
                                Admin {{ $namaSekolah }} telah membuatkan akun SIM Pendidikan untuk Anda. Klik tombol
                                di bawah untuk membuat password dan mengaktifkan akun.
                            </p>
                            <table role="presentation" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="border-radius:999px;background:#14a673;">
                                        <a href="{{ $url }}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;">
                                            Aktifkan Akun
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="font-size:13px;color:#4b5563;line-height:1.6;margin:24px 0 0;">
                                Link berlaku sampai <strong>{{ $berlakuSampai }}</strong> dan hanya bisa dipakai satu kali.
                                Jika sudah kedaluwarsa, minta admin sekolah mengirim ulang undangan.
                            </p>
                            <p style="font-size:12px;color:#9ca3af;line-height:1.6;margin:16px 0 0;">
                                Kalau tombolnya tidak berfungsi, salin dan buka tautan berikut di browser Anda:<br>
                                <span style="word-break:break-all;">{{ $url }}</span>
                            </p>
                            <p style="font-size:12px;color:#9ca3af;line-height:1.6;margin:16px 0 0;">
                                Jika Anda merasa tidak bekerja di sekolah ini, abaikan email ini.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
