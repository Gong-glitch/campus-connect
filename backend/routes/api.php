<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\LostReportController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UploadController;

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

    // Found items (publicly listed once approved)
    Route::apiResource('items', ItemController::class);

    // Lost reports
    Route::post('/lost-reports', [LostReportController::class, 'store']);
    Route::get('/my-reports/lost', [LostReportController::class, 'myReports']);
    Route::get('/lost-reports', [LostReportController::class, 'index']);
    Route::patch('/lost-reports/{id}', [LostReportController::class, 'update']);
    Route::delete('/lost-reports/{id}', [LostReportController::class, 'destroy']);

    // Image upload
    Route::post('/upload', [UploadController::class, 'upload']);

    // Admin-only user management
    Route::get('/admin/users', [UserController::class, 'index']);
    Route::patch('/admin/users/{id}', [UserController::class, 'update']);
    Route::delete('/admin/users/{id}', [UserController::class, 'destroy']);
});
// 🧽 Temporary database utility to remove alpha-numeric test strings
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