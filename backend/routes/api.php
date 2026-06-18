<?php

use App\Http\Controllers\AdminOrderController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClientAuthController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\ClientOrderController;
use App\Http\Controllers\PublicController;
use App\Http\Controllers\RecordController;
use App\Http\Controllers\VehicleController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public — no authentication (car catalogue + landing stats)
|--------------------------------------------------------------------------
*/
Route::get('/public/vehicles', [PublicController::class, 'index']);
Route::get('/public/vehicles/{vehicle}', [PublicController::class, 'show']);
Route::get('/public/stats', [PublicController::class, 'stats']);

/*
|--------------------------------------------------------------------------
| Auth entry points (public)
|--------------------------------------------------------------------------
*/
Route::post('/client/register', [ClientAuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/client/login', [ClientAuthController::class, 'login'])->middleware('throttle:10,1');

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

/*
|--------------------------------------------------------------------------
| Client area — logged-in clients only
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'ensure.client'])->group(function () {
    Route::post('/client/logout', [ClientAuthController::class, 'logout']);
    Route::get('/client/me', [ClientAuthController::class, 'me']);

    Route::get('/client/orders', [ClientOrderController::class, 'index']);
    Route::post('/client/orders', [ClientOrderController::class, 'store']);
    Route::delete('/client/orders/{order}', [ClientOrderController::class, 'destroy']);
});

/*
|--------------------------------------------------------------------------
| Admin area — logged-in admins only
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'ensure.admin'])->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    Route::get('/admin/stats', [RecordController::class, 'stats']);

    Route::apiResource('vehicles', VehicleController::class);
    Route::post('/vehicles/upload', [VehicleController::class, 'upload']);
    Route::apiResource('clients', ClientController::class);

    Route::post('/vehicles/{vehicle}/link', [VehicleController::class, 'link']);
    Route::post('/vehicles/{vehicle}/unlink', [VehicleController::class, 'unlink']);

    Route::get('/admin/orders', [AdminOrderController::class, 'index']);
    Route::post('/admin/orders/{order}/approve', [AdminOrderController::class, 'approve']);
    Route::post('/admin/orders/{order}/reject', [AdminOrderController::class, 'reject']);

    Route::get('/records', [RecordController::class, 'index']);
});
