<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MonetaCheckoutSession extends Model
{
    public $timestamps = false;

    protected $table = 'moneta_checkout_sessions';

    protected $fillable = ['mnt_transaction_id', 'user_id', 'purpose', 'plan_months', 'referral_code', 'amount_rub', 'created_at', 'completed_at'];

    protected $casts = ['user_id' => 'integer', 'plan_months' => 'integer', 'amount_rub' => 'decimal:2', 'created_at' => 'datetime', 'completed_at' => 'datetime'];
}
