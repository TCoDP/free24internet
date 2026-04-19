<?php

namespace App\Models;

use Illuminate\Auth\MustVerifyEmail as MustVerifyEmailTrait;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Contracts\Translation\HasLocalePreference;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements HasLocalePreference, MustVerifyEmail
{
    use HasApiTokens, HasFactory, MustVerifyEmailTrait, Notifiable;

    protected $table = 'users';

    protected $primaryKey = 'id';

    public $incrementing = true;

    protected $keyType = 'int';

    protected $fillable = [
        'tg_id',
        'tg_username',
        'email',
        'password_hash',
        'name',
        'language',
        'referral_code',
        'referred_by_user_id',
        'subscription_until',
        'trial_ends_at',
        'is_their',
        'is_admin',
        'balance',
    ];

    protected $hidden = [
        'password_hash',
        'remember_token',
        'subscription_import_token',
    ];

    public function getAuthPasswordName(): string
    {
        return 'password_hash';
    }

    public function getAuthPassword(): string
    {
        $hash = (string) ($this->password_hash ?? '');

        // Node.js bcryptjs generates hashes with $2a$ prefix.
        // Python passlib/bcrypt often generates hashes with $2b$ prefix.
        // Laravel's BcryptHasher requires hashes to start with $2y$ (PHP's default for bcrypt).
        // Since $2a$, $2b$, and $2y$ use the exact same algorithm, we can safely replace the prefix.
        if (str_starts_with($hash, '$2a$')) {
            $hash = str_replace('$2a$', '$2y$', $hash);
        } elseif (str_starts_with($hash, '$2b$')) {
            $hash = str_replace('$2b$', '$2y$', $hash);
        }

        return $hash;
    }

    public function setPasswordAttribute(string $value): void
    {
        $this->attributes['password_hash'] = Hash::make($value);
    }

    public function preferredLocale(): string
    {
        $lang = strtolower((string) ($this->language ?? 'ru'));

        return in_array($lang, ['en', 'ru'], true) ? $lang : 'ru';
    }

    public function sendEmailVerificationNotification(): void
    {
        if (! filled((string) $this->email)) {
            return;
        }

        $this->notify(new VerifyEmail);

        $this->forceFill([
            'email_verification_sent_at' => now(),
        ])->saveQuietly();
    }

    protected function casts(): array
    {
        return [
            'tg_id' => 'integer',
            'referred_by_user_id' => 'integer',
            'email_verified_at' => 'datetime',
            'email_verification_sent_at' => 'datetime',
            'subscription_until' => 'datetime',
            'trial_ends_at' => 'datetime',
            'is_their' => 'boolean',
            'is_admin' => 'boolean',
            'balance' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }
}
