<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class BotVpnDisplayTest extends TestCase
{
    use DatabaseTransactions;

    private mixed $initialBotPaymentSessionSecret = false;

    protected function setUp(): void
    {
        parent::setUp();
        $this->initialBotPaymentSessionSecret = getenv('BOT_PAYMENT_SESSION_SECRET');
    }

    protected function tearDown(): void
    {
        if ($this->initialBotPaymentSessionSecret !== false) {
            putenv('BOT_PAYMENT_SESSION_SECRET='.$this->initialBotPaymentSessionSecret);
            $_ENV['BOT_PAYMENT_SESSION_SECRET'] = $this->initialBotPaymentSessionSecret;
        } else {
            putenv('BOT_PAYMENT_SESSION_SECRET');
            unset($_ENV['BOT_PAYMENT_SESSION_SECRET']);
        }
        parent::tearDown();
    }

    private function setBotPaymentSessionSecret(string $value): void
    {
        putenv('BOT_PAYMENT_SESSION_SECRET='.$value);
        $_ENV['BOT_PAYMENT_SESSION_SECRET'] = $value;
    }

    public function test_forbidden_when_header_secret_mismatch(): void
    {
        $this->setBotPaymentSessionSecret('expected-secret-for-bot-vpn-display');

        $this->postJson(
            '/api/internal/bot-vpn-display',
            ['telegramUserId' => 1],
            ['X-Bot-Payment-Secret' => 'wrong-secret'],
        )->assertStatus(403)->assertJsonPath('reason', 'forbidden');
    }

    public function test_returns_primary_share_url_when_user_has_active_subscription_import(): void
    {
        if (! Schema::hasColumn('users', 'subscription_import_token')
            || ! Schema::hasColumn('users', 'uuid')
            || ! Schema::hasColumn('users', 'port')
            || ! Schema::hasColumn('users', 'short_id')
            || ! Schema::hasColumn('users', 'expire_time')
            || ! Schema::hasColumn('users', 'tg_id')) {
            $this->markTestSkipped('users VPN / tg_id columns not migrated');
        }

        $secret = 'bot_vpn_display_'.bin2hex(random_bytes(8));
        $this->setBotPaymentSessionSecret($secret);

        $tgId = random_int(200_000_000, 900_000_000);
        $user = User::factory()->create(['tg_id' => $tgId]);
        $token = bin2hex(random_bytes(12));
        $future = (int) round(microtime(true) * 1000) + 86_400_000;

        DB::table('users')->where('id', $user->id)->update([
            'subscription_import_token' => $token,
            'uuid' => '550e8400-e29b-41d4-a716-446655440099',
            'port' => 443,
            'short_id' => 'a1b2c3d4',
            'expire_time' => $future,
        ]);

        $response = $this->postJson(
            '/api/internal/bot-vpn-display',
            ['telegramUserId' => $tgId],
            ['X-Bot-Payment-Secret' => $secret],
        );

        $response->assertOk()
            ->assertJsonPath('ok', true);

        $primary = (string) $response->json('primaryShareUrl');
        $this->assertStringContainsString('/sub/'.$token, $primary);
        $this->assertNotNull($response->json('vpnAccess'));
    }
}
