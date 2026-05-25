<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ItemController;

// 🔓 PUBLIC ROUTES: Anyone can access these to get a token
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login'])->name('login');

// 🔒 PROTECTED ROUTES: You MUST have a valid token to access these
Route::middleware('auth:sanctum')->group(function () {
    
    // Default route to check who is currently logged in
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Your new Lost & Found routes!
    Route::apiResource('items', ItemController::class);
    
    // Route to destroy the token
    Route::post('/logout', [AuthController::class, 'logout']);
});