<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use App\Models\SupportTicketMessage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TicketController extends Controller
{
    public function index(Request $request): Response
    {
        $tickets = SupportTicket::query()
            ->where('user_id', $request->user()->id)
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->get();

        return Inertia::render('Account/Tickets/Index', [
            'tickets' => $tickets,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Account/Tickets/New');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'subject' => ['required', 'string', 'max:255', 'min:3'],
            'body' => ['required', 'string', 'min:10'],
        ]);

        $ticket = SupportTicket::create([
            'user_id' => $request->user()->id,
            'subject' => $data['subject'],
            'body' => $data['body'],
            'status' => 'open',
        ]);

        return redirect()->route('account.tickets.show', $ticket->id);
    }

    public function show(Request $request, SupportTicket $ticket): Response
    {
        abort_unless((int) $ticket->user_id === (int) $request->user()->id, 404);

        $ticket->load(['messages' => fn ($query) => $query->orderBy('created_at')]);
        $replies = $ticket->messages;
        $ticket->unsetRelation('messages');

        return Inertia::render('Account/Tickets/Show', [
            'ticket' => $ticket,
            'replies' => $replies,
        ]);
    }

    public function reply(Request $request, SupportTicket $ticket): RedirectResponse
    {
        abort_unless((int) $ticket->user_id === (int) $request->user()->id, 404);

        $data = $request->validate([
            'body' => ['required', 'string', 'min:2'],
        ]);

        SupportTicketMessage::create([
            'ticket_id' => $ticket->id,
            'author_role' => 'user',
            'author_user_id' => $request->user()->id,
            'body' => $data['body'],
            'created_at' => now(),
        ]);

        $ticket->touch();

        return back();
    }
}
