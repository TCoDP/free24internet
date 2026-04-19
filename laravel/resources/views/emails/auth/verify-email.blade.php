<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>{{ $title }}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f8fafc;padding:32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 10px 40px rgba(17,24,39,0.08);">
                    <tr>
                        <td style="height:6px;background:linear-gradient(90deg,#b91c1c 0%,#991b1b 100%);font-size:0;line-height:0;">&nbsp;</td>
                    </tr>
                    <tr>
                        <td style="padding:28px 28px 8px 28px;">
                            <p style="margin:0 0 4px 0;font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#b91c1c;">
                                {{ $appName }}
                            </p>
                            <h1 style="margin:0;font-size:22px;line-height:1.3;font-weight:800;color:#111827;">
                                {{ $title }}
                            </h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:8px 28px 24px 28px;">
                            <p style="margin:0;font-size:15px;line-height:1.6;color:#475569;">
                                {{ $lead }}
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding:0 28px 28px 28px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td style="border-radius:12px;background-color:#b91c1c;">
                                        <a href="{{ $url }}" target="_blank" rel="noopener" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:800;color:#ffffff;text-decoration:none;border-radius:12px;">
                                            {{ $cta }}
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:0 28px 20px 28px;">
                            <p style="margin:0;font-size:13px;line-height:1.55;color:#64748b;">
                                {{ $expiry }}
                            </p>
                            <p style="margin:14px 0 0 0;font-size:13px;line-height:1.55;color:#64748b;">
                                {{ $ignore }}
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:0 28px 24px 28px;border-top:1px solid #f1f5f9;">
                            <p style="margin:20px 0 8px 0;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;">
                                {{ $copyHint }}
                            </p>
                            <p style="margin:0;word-break:break-all;font-size:12px;line-height:1.5;color:#64748b;background-color:#f8fafc;padding:12px 14px;border-radius:10px;border:1px solid #e2e8f0;">
                                {{ $url }}
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:16px 28px 24px 28px;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
                            <p style="margin:0;font-size:12px;line-height:1.5;color:#94a3b8;text-align:center;">
                                {{ $footerBrand }}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
