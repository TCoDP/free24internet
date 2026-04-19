<?php

use App\Http\Controllers\Account\AccountController;
use App\Http\Controllers\Account\AccountNotificationController;
use App\Http\Controllers\Account\BalanceTopupController;
use App\Http\Controllers\Account\LanguageController;
use App\Http\Controllers\Account\PlansController;
use App\Http\Controllers\Account\ProfileController;
use App\Http\Controllers\Account\ReferralsController;
use App\Http\Controllers\Account\SecurityController;
use App\Http\Controllers\Account\TelegramLinkController;
use App\Http\Controllers\Account\TicketController;
use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Admin\ArticleAdminController;
use App\Http\Controllers\ArticleController;
use App\Http\Controllers\VpnSubscriptionImportController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return inertia('Public/Home', [
        'locale' => 'ru',
    ]);
})->name('home');

Route::get('/en', function () {
    return inertia('Public/Home', [
        'locale' => 'en',
    ]);
})->name('home.en');

Route::get('/terms', function () {
    return inertia('Public/Terms', [
        'locale' => 'ru',
    ]);
})->name('terms');

Route::get('/privacy', function () {
    return inertia('Public/Privacy', [
        'locale' => 'ru',
    ]);
})->name('privacy');

Route::get('/manuals', function () {
    return inertia('Public/Manuals', [
        'locale' => 'ru',
    ]);
})->name('manuals');

Route::get('/manuals/{device}', function (string $device) {
    return inertia('Public/ManualDevice', [
        'locale' => 'ru',
        'device' => $device,
    ]);
})->where('device', 'ios|android|macos|windows')->name('manuals.device');

Route::get('/en/terms', function () {
    return inertia('Public/Terms', [
        'locale' => 'en',
    ]);
})->name('terms.en');

Route::get('/en/privacy', function () {
    return inertia('Public/Privacy', [
        'locale' => 'en',
    ]);
})->name('privacy.en');

Route::get('/en/manuals', function () {
    return inertia('Public/Manuals', [
        'locale' => 'en',
    ]);
})->name('manuals.en');

Route::get('/en/manuals/{device}', function (string $device) {
    return inertia('Public/ManualDevice', [
        'locale' => 'en',
        'device' => $device,
    ]);
})->where('device', 'ios|android|macos|windows')->name('manuals.device.en');

Route::get('/articles', [ArticleController::class, 'index'])
    ->defaults('locale', 'ru')
    ->name('articles.index');
Route::get('/en/articles', [ArticleController::class, 'index'])
    ->defaults('locale', 'en')
    ->name('articles.index.en');
Route::get('/articles/{slug}', [ArticleController::class, 'show'])
    ->defaults('locale', 'ru')
    ->where('slug', '[a-z0-9-]+')
    ->name('articles.show');
Route::get('/en/articles/{slug}', [ArticleController::class, 'show'])
    ->defaults('locale', 'en')
    ->where('slug', '[a-z0-9-]+')
    ->name('articles.show.en');

Route::get('/sub/{token}', [VpnSubscriptionImportController::class, 'show'])
    ->where('token', '[a-f0-9]{32}')
    ->middleware('throttle:120,1')
    ->name('vpn.subscription.import');

Route::middleware(['auth'])->group(function () {
    Route::redirect('/dashboard', '/account')->name('dashboard');

    Route::prefix('account')->name('account.')->group(function () {
        Route::get('/', [AccountController::class, 'index'])->name('home');
        Route::post('/notifications/{notification}/read', [AccountNotificationController::class, 'markRead'])
            ->name('notifications.read');
        Route::get('/profile', [ProfileController::class, 'edit'])->name('profile');
        Route::put('/profile', [ProfileController::class, 'update'])->name('profile.update');
        Route::post('/telegram-link', [TelegramLinkController::class, 'store'])->name('telegram-link');
        Route::get('/plans', [PlansController::class, 'index'])->name('plans');
        Route::post('/plans/pay', [PlansController::class, 'pay'])->name('plans.pay');
        Route::post('/plans/trial', [PlansController::class, 'startTrial'])
            ->middleware('throttle:5,1')
            ->name('plans.trial');
        Route::post('/plans/subscription-import/rotate', [PlansController::class, 'rotateSubscriptionImport'])
            ->middleware('throttle:10,1')
            ->name('plans.subscription-import.rotate');
        Route::post('/balance/topup', [BalanceTopupController::class, 'pay'])->name('balance.topup');
        Route::get('/security', [SecurityController::class, 'edit'])->name('security');
        Route::put('/security', [SecurityController::class, 'update'])->name('security.update');
        Route::get('/referrals', [ReferralsController::class, 'index'])->name('referrals');
        Route::post('/referrals/apply', [ReferralsController::class, 'apply'])->name('referrals.apply');
        Route::get('/language', [LanguageController::class, 'edit'])->name('language');
        Route::put('/language', [LanguageController::class, 'update'])->name('language.update');
        Route::get('/tickets', [TicketController::class, 'index'])->name('tickets.index');
        Route::get('/tickets/new', [TicketController::class, 'create'])->name('tickets.create');
        Route::post('/tickets', [TicketController::class, 'store'])->name('tickets.store');
        Route::get('/tickets/{ticket}', [TicketController::class, 'show'])->name('tickets.show');
        Route::post('/tickets/{ticket}/reply', [TicketController::class, 'reply'])->name('tickets.reply');
    });
});

Route::prefix('admin')->name('admin.')->middleware(['auth', 'verified', 'admin'])->group(function () {
    Route::get('/', [AdminController::class, 'index'])->name('dashboard');

    Route::prefix('users')->name('users.')->group(function () {
        Route::get('/', [AdminController::class, 'users'])->name('index');
        Route::get('/{user}', [AdminController::class, 'editUser'])->name('edit');
        Route::put('/{user}', [AdminController::class, 'updateUser'])->name('update');
    });

    Route::prefix('tariffs')->name('tariffs.')->group(function () {
        Route::get('/', [AdminController::class, 'tariffs'])->name('index');
        Route::put('/global', [AdminController::class, 'updatePricingGlobal'])->name('global.update');
        Route::post('/terms', [AdminController::class, 'storePricingTerm'])->name('terms.store');
        Route::put('/terms/{term}', [AdminController::class, 'updatePricingTerm'])->name('terms.update');
        Route::delete('/terms/{term}', [AdminController::class, 'destroyPricingTerm'])->name('terms.destroy');
    });

    Route::get('/referrals', [AdminController::class, 'referrals'])->name('referrals.index');

    Route::prefix('support')->name('support.')->group(function () {
        Route::get('/', [AdminController::class, 'support'])->name('index');
        Route::get('/{ticket}', [AdminController::class, 'showTicket'])->name('show');
        Route::put('/{ticket}/status', [AdminController::class, 'updateTicketStatus'])->name('status');
        Route::post('/{ticket}/reply', [AdminController::class, 'replyTicket'])->name('reply');
    });

    Route::get('/payments', [AdminController::class, 'payments'])->name('payments.index');
    Route::get('/moneta', [AdminController::class, 'moneta'])->name('moneta.index');

    Route::prefix('articles')->name('articles.')->group(function () {
        Route::get('/', [ArticleAdminController::class, 'index'])->name('index');
        Route::get('/create', [ArticleAdminController::class, 'create'])->name('create');
        Route::post('/', [ArticleAdminController::class, 'store'])->name('store');
        Route::get('/{article}/edit', [ArticleAdminController::class, 'edit'])->name('edit');
        Route::put('/{article}', [ArticleAdminController::class, 'update'])->name('update');
    });
});

require __DIR__.'/auth.php';
