<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserTransaction extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $table = 'user_transactions';

    protected $fillable = ['user_id', 'amount_rub', 'plan_months', 'status', 'provider', 'external_payment_id', 'created_at', 'completed_at'];

    protected $casts = ['user_id' => 'integer', 'plan_months' => 'integer', 'amount_rub' => 'decimal:2', 'created_at' => 'datetime', 'completed_at' => 'datetime'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
