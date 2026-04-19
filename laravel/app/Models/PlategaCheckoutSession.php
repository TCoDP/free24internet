<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlategaCheckoutSession extends Model
{
    public $timestamps = false;

    protected $table = 'platega_checkout_sessions';

    protected $fillable = [
        'platega_transaction_id',
        'user_id',
        'purpose',
        'plan_months',
        'referral_code',
        'amount_rub',
        'payment_method',
        'created_at',
        'completed_at',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'plan_months' => 'integer',
        'payment_method' => 'integer',
        'amount_rub' => 'decimal:2',
        'created_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
