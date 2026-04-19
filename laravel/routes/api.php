<?php

use App\Http\Controllers\Api\BotRegistrationController;
use App\Http\Controllers\Api\BotTelegramLinkConsumeController;
use App\Http\Controllers\Api\BotVpnDisplayController;
use App\Http\Controllers\Api\MonetaController;
use App\Http\Controllers\Api\PlategaController;
use Illuminate\Support\Facades\Route;

Route::post('/internal/bot-register', [BotRegistrationController::class, 'store']);
Route::post('/internal/bot-consume-telegram-link', [BotTelegramLinkConsumeController::class, 'store']);
Route::post('/internal/bot-vpn-display', [BotVpnDisplayController::class, 'show']);

Route::prefix('internal/bot-payment')->group(function () {
    Route::post('/capabilities', [MonetaController::class, 'capabilities']);
    Route::post('/create-session', [MonetaController::class, 'createBotPlanSession']);
    Route::post('/create-balance-session', [MonetaController::class, 'createBotBalanceSession']);
    Route::post('/platega/create-session', [PlategaController::class, 'createBotPlanSession']);
    Route::post('/platega/create-balance-session', [PlategaController::class, 'createBotBalanceSession']);
});

Route::match(['get', 'post'], '/webhooks/moneta', [MonetaController::class, 'webhook']);
Route::match(['get', 'post'], '/webhooks/platega', [PlategaController::class, 'webhook']);
