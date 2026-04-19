<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PricingPlanTerm extends Model
{
    public $timestamps = false;

    protected $table = 'pricing_plan_terms';

    protected $fillable = ['months', 'discount_rate', 'referrer_bonus_days', 'sort_order', 'is_active'];

    protected $casts = [
        'months' => 'integer',
        'discount_rate' => 'decimal:5',
        'referrer_bonus_days' => 'integer',
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];
}
