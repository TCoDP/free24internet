<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubscriptionExpiryReminder extends Model
{
    public const ACCESS_SUBSCRIPTION = 'subscription';

    public const ACCESS_TRIAL = 'trial';

    protected $table = 'subscription_expiry_reminders';

    protected $fillable = [
        'user_id',
        'access_type',
        'stage',
        'ends_at',
    ];

    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'ends_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
