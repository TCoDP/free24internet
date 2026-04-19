<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class VpnSubscriptionImportTest extends TestCase
{
    use DatabaseTransactions;

    private function panelColumnsPresent(): bool
    {
        return Schema::hasColumn('users', 'subscription_import_token')
            && Schema::hasColumn('users', 'uuid')
            && Schema::hasColumn('users', 'port')
            && Schema::hasColumn('users', 'short_id')
            && Schema::hasColumn('users', 'expire_time');
    }

    public function test_sub_returns_base64_vless_when_key_active(): void
    {
        if (! $this->panelColumnsPresent()) {
            $this->markTestSkipped('users VPN / subscription_import columns not migrated');
        }

        $user = User::factory()->create();
        $token = bin2hex(random_bytes(16));
        $future = (int) round(microtime(true) * 1000) + 86_400_000;

        DB::table('users')->where('id', $user->id)->update([
            'subscription_import_token' => $token,
            'uuid' => '550e8400-e29b-41d4-a716-446655440000',
            'port' => 443,
            'short_id' => 'a1b2c3d4',
            'expire_time' => $future,
        ]);

        $res = $this->get('/sub/'.$token);
        $res->assertOk();
        $res->assertHeader('Profile-Title', 'Free24Internet');
        $webUrl = rtrim((string) (config('vpn.subscription_import_profile_web_url') ?: config('app.url')), '/');
        if ($webUrl !== '') {
            $this->assertSame($webUrl, $res->headers->get('Profile-Web-Page-Url'));
        }
        $expectedExpire = (int) floor($future / 1000);
        $userinfo = (string) ($res->headers->get('Subscription-Userinfo') ?? '');
        $this->assertStringContainsString('expire='.$expectedExpire, $userinfo);
        $this->assertStringContainsString('total=0', $userinfo);
        $decoded = base64_decode((string) $res->getContent(), true);
        $this->assertNotFalse($decoded);
        $this->assertStringStartsWith('vless://', $decoded);
        $fragment = parse_url((string) $decoded, PHP_URL_FRAGMENT);
        $this->assertIsString($fragment);
        $this->assertStringContainsString('Нидерланды', rawurldecode($fragment));
    }

    public function test_sub_404_when_key_expired(): void
    {
        if (! $this->panelColumnsPresent()) {
            $this->markTestSkipped('users VPN / subscription_import columns not migrated');
        }

        $user = User::factory()->create();
        $token = bin2hex(random_bytes(16));

        DB::table('users')->where('id', $user->id)->update([
            'subscription_import_token' => $token,
            'uuid' => '550e8400-e29b-41d4-a716-446655440000',
            'port' => 443,
            'short_id' => 'a1b2c3d4',
            'expire_time' => 1_000,
        ]);

        $this->get('/sub/'.$token)->assertNotFound();
    }

    public function test_rotate_invalidates_old_sub_url(): void
    {
        if (! $this->panelColumnsPresent()) {
            $this->markTestSkipped('users VPN / subscription_import columns not migrated');
        }

        $this->withoutMiddleware(ValidateCsrfToken::class);

        $user = User::factory()->create();
        $old = bin2hex(random_bytes(16));
        $future = (int) round(microtime(true) * 1000) + 86_400_000;

        DB::table('users')->where('id', $user->id)->update([
            'subscription_import_token' => $old,
            'uuid' => '550e8400-e29b-41d4-a716-446655440000',
            'port' => 443,
            'short_id' => 'a1b2c3d4',
            'expire_time' => $future,
        ]);

        $this->actingAs($user)
            ->postJson(route('account.plans.subscription-import.rotate'))
            ->assertOk()
            ->assertJson(['ok' => true]);

        $new = (string) DB::table('users')->where('id', $user->id)->value('subscription_import_token');
        $this->assertNotSame($old, $new);
        $this->get('/sub/'.$old)->assertNotFound();
        $this->get('/sub/'.$new)->assertOk();
    }
}
