<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MonetaCheckoutSession;
use App\Models\PricingGlobal;
use App\Models\PricingPlanTerm;
use App\Models\ReferralReward;
use App\Models\SupportTicket;
use App\Models\SupportTicketMessage;
use App\Models\User;
use App\Models\UserTransaction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Index', [
            'stats' => [
                'users' => User::count(),
                'tickets_open' => SupportTicket::query()->whereIn('status', ['open', 'in_progress'])->count(),
                'tickets_total' => SupportTicket::count(),
                'payments_completed' => UserTransaction::query()->where('status', 'completed')->count(),
                'referral_rewards' => ReferralReward::count(),
            ],
        ]);
    }

    public function users(Request $request): Response
    {
        $q = trim((string) $request->string('q'));
        $sort = $request->string('sort')->toString() ?: 'id';
        $dir = $request->string('dir')->toString() === 'asc' ? 'asc' : 'desc';
        $perPage = max(10, min(100, (int) $request->input('limit', 25)));

        $allowedSort = ['id', 'email', 'name', 'subscription_until', 'created_at', 'is_admin'];
        if (! in_array($sort, $allowedSort, true)) {
            $sort = 'id';
        }

        $query = User::query();
        if ($q !== '') {
            $query->where(function ($builder) use ($q) {
                $builder->where('id', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%")
                    ->orWhere('name', 'like', "%{$q}%")
                    ->orWhere('tg_username', 'like', "%{$q}%")
                    ->orWhere('referral_code', 'like', "%{$q}%");
            });
        }

        $users = $query->orderBy($sort, $dir)->orderByDesc('id')->paginate($perPage)->withQueryString();

        return Inertia::render('Admin/Users/Index', [
            'filters' => [
                'q' => $q,
                'sort' => $sort,
                'dir' => $dir,
                'limit' => $perPage,
            ],
            'users' => $users,
        ]);
    }

    public function editUser(User $user): Response
    {
        return Inertia::render('Admin/Users/Edit', [
            'user' => $this->userPayload($user->fresh()),
        ]);
    }

    public function updateUser(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'language' => ['nullable', Rule::in(['ru', 'en'])],
            'is_their' => ['required', 'boolean'],
            'is_admin' => ['required', 'boolean'],
            'subscription_until' => ['nullable', 'date'],
            'trial_ends_at' => ['nullable', 'date'],
            'referral_code' => ['nullable', 'string', 'max:64'],
            'referred_by_user_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        if ($user->id === 20 && empty($data['is_admin'])) {
            abort(403, 'Cannot demote superadmin.');
        }

        $refCode = isset($data['referral_code']) ? strtoupper(trim((string) $data['referral_code'])) : null;
        if ($refCode !== null && $refCode !== '') {
            $taken = User::query()->where('referral_code', $refCode)->where('id', '!=', $user->id)->exists();
            if ($taken) {
                return back()->withErrors(['referral_code' => 'Такой реферальный код уже занят']);
            }
        } else {
            $refCode = null;
        }

        $user->fill([
            'name' => $data['name'] ?? null,
            'language' => $data['language'] ?? null,
            'is_their' => (bool) $data['is_their'],
            'is_admin' => $user->id === 20 ? true : (bool) $data['is_admin'],
            'subscription_until' => $data['subscription_until'] ?? null,
            'trial_ends_at' => $data['trial_ends_at'] ?? null,
            'referral_code' => $refCode,
            'referred_by_user_id' => $data['referred_by_user_id'] ?? null,
        ])->save();

        return redirect()->route('admin.users.edit', $user)->with('success', 'Сохранено');
    }

    public function tariffs(): Response
    {
        return Inertia::render('Admin/Tariffs/Index', [
            'pricingGlobal' => PricingGlobal::query()->firstOrCreate(['id' => 1], [
                'base_monthly_rub' => 60,
                'trial_days' => 7,
            ]),
            'terms' => PricingPlanTerm::query()->orderBy('sort_order')->orderBy('months')->get(),
        ]);
    }

    public function updatePricingGlobal(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'base_monthly_rub' => ['required', 'integer', 'min:1'],
            'trial_days' => ['required', 'integer', 'min:0'],
        ]);

        PricingGlobal::query()->updateOrCreate(
            ['id' => 1],
            [
                'base_monthly_rub' => $data['base_monthly_rub'],
                'trial_days' => $data['trial_days'],
            ],
        );

        return back()->with('success', 'Сохранено');
    }

    public function storePricingTerm(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'months' => ['required', 'integer', 'min:1'],
            'discount_rate' => ['required', 'numeric', 'min:0', 'max:0.99999'],
            'referrer_bonus_days' => ['required', 'integer', 'min:0'],
            'sort_order' => ['required', 'integer'],
            'is_active' => ['required', 'boolean'],
        ]);

        if (PricingPlanTerm::query()->where('months', $data['months'])->exists()) {
            return back()->withErrors(['months' => 'Такой срок (месяцев) уже есть']);
        }

        PricingPlanTerm::query()->create($data);

        return back()->with('success', 'Сохранено');
    }

    public function updatePricingTerm(Request $request, PricingPlanTerm $term): RedirectResponse
    {
        $data = $request->validate([
            'months' => ['required', 'integer', 'min:1'],
            'discount_rate' => ['required', 'numeric', 'min:0', 'max:0.99999'],
            'referrer_bonus_days' => ['required', 'integer', 'min:0'],
            'sort_order' => ['required', 'integer'],
            'is_active' => ['required', 'boolean'],
        ]);

        $dupe = PricingPlanTerm::query()
            ->where('months', $data['months'])
            ->where('id', '!=', $term->id)
            ->exists();
        if ($dupe) {
            return back()->withErrors(['months' => 'Такой срок (месяцев) уже есть']);
        }

        $term->update($data);

        return back()->with('success', 'Сохранено');
    }

    public function destroyPricingTerm(PricingPlanTerm $term): RedirectResponse
    {
        $term->delete();

        return back()->with('success', 'Сохранено');
    }

    public function referrals(Request $request): Response
    {
        $rows = ReferralReward::query()
            ->with([
                'referrerUser:id,email,name',
                'refereeUser:id,email,name',
            ])
            ->latest('created_at')
            ->paginate(max(10, min(100, (int) $request->input('limit', 25))))
            ->withQueryString();

        return Inertia::render('Admin/Referrals/Index', [
            'rows' => $rows,
        ]);
    }

    public function support(Request $request): Response
    {
        $q = trim((string) $request->string('q'));
        $query = SupportTicket::query()->with('user:id,email,name');
        if ($q !== '') {
            $query->where(function ($builder) use ($q) {
                $builder->where('id', 'like', "%{$q}%")
                    ->orWhere('user_id', 'like', "%{$q}%")
                    ->orWhere('subject', 'like', "%{$q}%")
                    ->orWhere('body', 'like', "%{$q}%");
            });
        }

        $tickets = $query->latest()->paginate(max(10, min(100, (int) $request->input('limit', 25))))->withQueryString();

        return Inertia::render('Admin/Support/Index', [
            'filters' => [
                'q' => $q,
            ],
            'tickets' => $tickets,
        ]);
    }

    public function showTicket(SupportTicket $ticket): Response
    {
        $ticket->load(['user:id,email,name', 'messages' => function ($query) {
            $query->orderBy('created_at');
        }]);
        $replies = $ticket->messages;
        $ticket->unsetRelation('messages');

        return Inertia::render('Admin/Support/Show', [
            'ticket' => $ticket,
            'replies' => $replies,
        ]);
    }

    public function updateTicketStatus(Request $request, SupportTicket $ticket): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(['open', 'in_progress', 'closed'])],
        ]);

        $ticket->update(['status' => $data['status']]);

        return back()->with('success', 'Сохранено');
    }

    public function replyTicket(Request $request, SupportTicket $ticket): RedirectResponse
    {
        $data = $request->validate([
            'body' => ['required', 'string', 'min:1'],
        ]);

        SupportTicketMessage::query()->create([
            'ticket_id' => $ticket->id,
            'author_role' => 'support',
            'author_user_id' => null,
            'body' => $data['body'],
            'created_at' => now(),
        ]);

        $ticket->update([
            'status' => $ticket->status === 'closed' ? 'closed' : 'in_progress',
            'updated_at' => now(),
        ]);

        return back()->with('success', 'Сообщение отправлено');
    }

    public function payments(Request $request): Response
    {
        $rows = UserTransaction::query()
            ->with('user:id,email,name')
            ->latest('created_at')
            ->paginate(max(10, min(100, (int) $request->input('limit', 25))))
            ->withQueryString();

        return Inertia::render('Admin/Payments/Index', [
            'rows' => $rows,
        ]);
    }

    public function moneta(Request $request): Response
    {
        $rows = MonetaCheckoutSession::query()
            ->orderByDesc('created_at')
            ->paginate(max(10, min(100, (int) $request->input('limit', 25))))
            ->withQueryString();

        return Inertia::render('Admin/Moneta/Index', [
            'rows' => $rows,
        ]);
    }

    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'email' => $user->email,
            'name' => $user->name,
            'language' => $user->language,
            'is_their' => (bool) $user->is_their,
            'is_admin' => (bool) $user->is_admin,
            'subscription_until' => $user->subscription_until?->toDateTimeString(),
            'trial_ends_at' => $user->trial_ends_at?->toDateTimeString(),
            'referral_code' => $user->referral_code,
            'referred_by_user_id' => $user->referred_by_user_id,
        ];
    }
}
