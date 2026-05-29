<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\LostReportController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UploadController;
use App\Http\Controllers\ClaimController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

// ==========================================
// Public Routes
// ==========================================
Route::get('/has-admin', [AuthController::class, 'hasAdmin']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::post('/setup-admin', [AuthController::class, 'setupAdmin']);

// ==========================================
// Protected Routes (Sanctum Authenticated)
// ==========================================
Route::middleware('auth:sanctum')->group(function () {

    // Core User Session
    Route::get('/user', fn(Request $request) => $request->user());
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::put('/password', [AuthController::class, 'changePassword']);

    // 🟢 Found Items / General Feed Listings
    Route::apiResource('items', ItemController::class);

    // 🟢 Lost Reports (General Resource Paths)
    Route::post('/lost-reports', [LostReportController::class, 'store']);
    Route::get('/lost-reports', [LostReportController::class, 'index']);
    Route::patch('/lost-reports/{id}', [LostReportController::class, 'update']);
    Route::delete('/lost-reports/{id}', [LostReportController::class, 'destroy']);

    // 🎯 MATCH FRONTEND DESIGNS: Personal Student Dashboard Feeds
    Route::get('/my-lost-reports', [LostReportController::class, 'myReports']);
    Route::get('/my-found-reports', [ItemController::class, 'myReports']);

    // 🟢 Claims Management Endpoints
    Route::post('/claims', [ClaimController::class, 'store']);
    Route::get('/my-claims', [ClaimController::class, 'myClaims']);

    // Admin Claims Controls
    Route::get('/admin/claims', [ClaimController::class, 'index']);
    Route::patch('/admin/claims/{id}/status', [ClaimController::class, 'updateStatus']);

    // Image Upload Pipeline
    Route::post('/upload', [UploadController::class, 'upload']);

    // Admin-Only User Profiling Engine
    Route::get('/admin/users', [UserController::class, 'index']);
    Route::patch('/admin/users/{id}', [UserController::class, 'update']);
    Route::delete('/admin/users/{id}', [UserController::class, 'destroy']);
});

// ==========================================
// Maintenance Utilities (Publicly Accessible)
// ==========================================

// 🎯 AUTOMATIC SYMLINK GENERATION FOR RENDER FREE TIER
Route::get('/force-storage-link', function() {
    try {
        \Artisan::call('storage:link');
        return response()->json([
            'success' => true, 
            'message' => 'The public/storage folder shortcut has been successfully linked!'
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false, 
            'message' => 'Symlink execution skipped or already active: ' . $e->getMessage()
        ]);
    }
});

// Temporary database utility to remove alpha-numeric test strings
Route::get('/clean-db-junk', function() {
    try {
        $deleted = \DB::table('items')->whereRaw('id::text LIKE ?', ['%FOUND%'])->delete();
        return response()->json([
            'success' => true, 
            'message' => "Successfully removed {$deleted} malformed items from the table!"
        ]);
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'error' => $e->getMessage()]);
    }
});