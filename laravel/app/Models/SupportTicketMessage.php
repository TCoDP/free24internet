<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupportTicketMessage extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $table = 'support_ticket_messages';

    protected $fillable = ['ticket_id', 'author_role', 'author_user_id', 'body', 'created_at'];

    protected $casts = ['ticket_id' => 'integer', 'author_user_id' => 'integer', 'created_at' => 'datetime'];
}
