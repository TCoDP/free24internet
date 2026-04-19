<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PricingGlobal extends Model
{
    public $timestamps = false;

    protected $table = 'pricing_global';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'int';

    protected $fillable = ['id', 'base_monthly_rub', 'trial_days'];

    protected $casts = ['id' => 'integer', 'base_monthly_rub' => 'integer', 'trial_days' => 'integer'];
}
