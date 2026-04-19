<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class PlanTrialRequiresVerifiedEmailTest extends TestCase
{
    use DatabaseTransactions;

    public function test_start_trial_rejects_unverified_email(): void
    {
        $this->withoutMiddleware(ValidateCsrfToken::class);

        $user = User::factory()->unverified()->create();

        $this->actingAs($user)
            ->postJson(route('account.plans.trial'))
            ->assertStatus(422)
            ->assertJson(['ok' => false, 'reason' => 'email_unverified']);
    }
}
