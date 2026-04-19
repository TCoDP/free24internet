<?php

namespace App\Http\Controllers;

use App\Services\VpnSubscriptionImportService;
use Illuminate\Http\Response;

class VpnSubscriptionImportController extends Controller
{
    public function show(string $token, VpnSubscriptionImportService $import): Response
    {
        $payload = $import->subscriptionPayloadForImportToken($token);
        if ($payload === null) {
            abort(404);
        }

        $profile = (string) config('vpn.subscription_import_profile_name', 'Free24Internet');
        $webUrl = rtrim((string) (config('vpn.subscription_import_profile_web_url') ?: config('app.url')), '/');

        $headers = [
            'Content-Type' => 'text/plain; charset=utf-8',
            'Cache-Control' => 'no-store, private',
            'Profile-Update-Interval' => '3600',
            'Content-Disposition' => 'attachment; filename="'.$profile.'.txt"',
            'Profile-Title' => $profile,
        ];

        if ($webUrl !== '') {
            $headers['Profile-Web-Page-Url'] = $webUrl;
        }

        // v2rayN / v2rayNG и др.: срок подписки в UI (upload/download/total в байтах; 0 = без лимита по трафику)
        $exp = (int) ($payload['expire_unix'] ?? 0);
        if ($exp > 0) {
            $headers['Subscription-Userinfo'] = sprintf('upload=0; download=0; total=0; expire=%d', $exp);
        }

        return response($payload['body'], 200, $headers);
    }
}
