<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TelegramLinkToken extends Model
{
    public $timestamps = false;

    protected $table = 'telegram_link_tokens';

    protected $fillable = ['token', 'user_id', 'locale', 'expires_at', 'used_at', 'created_at'];

    protected $casts = ['user_id' => 'integer', 'expires_at' => 'datetime', 'used_at' => 'datetime', 'created_at' => 'datetime'];
}
