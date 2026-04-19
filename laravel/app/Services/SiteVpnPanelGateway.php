<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Cookie\CookieJar;
use Illuminate\Support\Facades\Log;

/**
 * HTTP к панели 3X-UI с сайта (отдельный кодовый путь от бота; общая БД и поля users).
 */
class SiteVpnPanelGateway
{
    public function __construct(
        private readonly string $panelBaseUrl,
        private readonly string $username,
        private readonly string $password,
        private readonly ?string $loginSecret,
    ) {}

    public static function fromConfig(): ?self
    {
        $url = trim((string) config('vpn.panel.url', ''));
        $user = trim((string) config('vpn.panel.user', ''));
        $pass = (string) config('vpn.panel.password', '');

        if ($url === '' || $user === '' || $pass === '') {
            return null;
        }

        return new self(
            rtrim($url, '/'),
            $user,
            $pass,
            ($s = trim((string) config('vpn.panel.login_secret', ''))) !== '' ? $s : null,
        );
    }

    /**
     * Один клиент: логин и POST с одной cookie-сессией.
     *
     * @param  array<string, mixed>  $jsonBody
     * @return array{ok: bool, reason?: string, http?: int, body?: ?array, raw?: string}
     */
    public function postAuthenticatedJson(string $path, array $jsonBody): array
    {
        $client = $this->newClient();
        $login = $this->doLogin($client);
        if (! $login['ok']) {
            return ['ok' => false, 'reason' => 'panel_login_failed', 'http' => $login['http'] ?? null];
        }

        $uri = $this->panelBaseUrl.$path;
        try {
            $resp = $client->post($uri, [
                'json' => $jsonBody,
                'headers' => ['Accept' => 'application/json'],
            ]);
        } catch (\Throwable $e) {
            Log::warning('site vpn panel request failed', ['path' => $path, 'error' => $e->getMessage()]);

            return ['ok' => false, 'reason' => 'panel_unreachable'];
        }

        $code = $resp->getStatusCode();
        $raw = (string) $resp->getBody();
        $decoded = json_decode($raw, true);

        return [
            'ok' => $code === 200 && is_array($decoded) && ! empty($decoded['success']),
            'http' => $code,
            'body' => is_array($decoded) ? $decoded : null,
            'raw' => $raw,
        ];
    }

    /**
     * @return array{ok: bool, reason?: string, http?: int, body?: ?array, raw?: string}
     */
    public function getAuthenticatedJson(string $path): array
    {
        $client = $this->newClient();
        $login = $this->doLogin($client);
        if (! $login['ok']) {
            return ['ok' => false, 'reason' => 'panel_login_failed', 'http' => $login['http'] ?? null];
        }

        $uri = $this->panelBaseUrl.$path;
        try {
            $resp = $client->get($uri, [
                'headers' => ['Accept' => 'application/json'],
            ]);
        } catch (\Throwable $e) {
            Log::warning('site vpn panel get failed', ['path' => $path, 'error' => $e->getMessage()]);

            return ['ok' => false, 'reason' => 'panel_unreachable'];
        }

        $code = $resp->getStatusCode();
        $raw = (string) $resp->getBody();
        $decoded = json_decode($raw, true);

        return [
            'ok' => $code === 200 && is_array($decoded) && ! empty($decoded['success']),
            'http' => $code,
            'body' => is_array($decoded) ? $decoded : null,
            'raw' => $raw,
        ];
    }

    private function newClient(): Client
    {
        return new Client([
            'cookies' => new CookieJar,
            'verify' => false,
            'timeout' => 30,
            'http_errors' => false,
        ]);
    }

    /**
     * @return array{ok: bool, http?: int}
     */
    private function doLogin(Client $client): array
    {
        $form = [
            'username' => $this->username,
            'password' => $this->password,
        ];
        if ($this->loginSecret !== null) {
            $form['LoginSecret'] = $this->loginSecret;
        }

        try {
            $resp = $client->post($this->panelBaseUrl.'/login', [
                'form_params' => $form,
            ]);
        } catch (\Throwable $e) {
            Log::warning('site vpn panel login failed', ['error' => $e->getMessage()]);

            return ['ok' => false, 'http' => 0];
        }

        $code = $resp->getStatusCode();
        $decoded = json_decode((string) $resp->getBody(), true);
        $ok = $code === 200 && is_array($decoded) && ! empty($decoded['success']);

        return ['ok' => $ok, 'http' => $code];
    }
}
