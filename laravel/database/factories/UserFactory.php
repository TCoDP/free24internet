<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return [
            'tg_id' => null,
            'tg_username' => null,
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password_hash' => null,
            'name' => fake()->name(),
            'language' => 'ru',
            'referral_code' => null,
            'referred_by_user_id' => null,
            'subscription_until' => null,
            'trial_ends_at' => null,
            'is_their' => false,
            'is_admin' => false,
            'balance' => 0,
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Email не подтверждён (например, для проверки пробного периода на сайте).
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
