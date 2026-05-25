<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ItemController;

// Public routes
Route::get('/has-admin', [AuthController::class, 'hasAdmin']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::post('/setup-admin', [AuthController::class, 'setupAdmin']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', fn(Request $request) => $request->user());
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::put('/password', [AuthController::class, 'changePassword']);
    Route::apiResource('items', ItemController::class);
});
