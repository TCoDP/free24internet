<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReferralReward extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $table = 'referral_rewards';

    protected $fillable = ['referrer_user_id', 'referee_user_id', 'plan_months', 'bonus_days', 'created_at'];

    protected $casts = ['referrer_user_id' => 'integer', 'referee_user_id' => 'integer', 'plan_months' => 'integer', 'bonus_days' => 'integer', 'created_at' => 'datetime'];

    public function referrerUser()
    {
        return $this->belongsTo(User::class, 'referrer_user_id');
    }

    public function refereeUser()
    {
        return $this->belongsTo(User::class, 'referee_user_id');
    }
}
