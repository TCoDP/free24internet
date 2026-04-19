<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TelegramNotificationLog extends Model
{
    protected $table = 'telegram_notification_logs';

    protected $fillable = [
        'tg_id',
        'user_id',
        'kind',
        'status',
        'body',
        'error',
        'telegram_message_id',
        'telegram_response',
    ];

    protected function casts(): array
    {
        return [
            'tg_id' => 'integer',
            'telegram_message_id' => 'integer',
            'telegram_response' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
