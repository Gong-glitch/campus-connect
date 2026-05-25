<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function hasAdmin()
    {
        return response()->json(['hasAdmin' => User::where('role', 'admin')->exists()]);
    }

    public function register(Request $request)
    {
        $fields = $request->validate([
            'name'      => 'required|string|max:255',
            'school_id' => 'required|string|max:40',
            'email'     => 'required|string|email|unique:users,email',
            'password'  => 'required|string|min:8',
        ]);

        $user = User::create([
            'name'      => $fields['name'],
            'school_id' => $fields['school_id'],
            'email'     => $fields['email'],
            'password'  => $fields['password'],
            'role'      => 'user',
        ]);

        $token = $user->createToken('app_token')->plainTextToken;

        return response()->json(['user' => $user, 'token' => $token], 201);
    }

    public function login(Request $request)
    {
        $fields = $request->validate([
            'email'    => 'required|string|email',
            'password' => 'required|string',
            'role'     => 'nullable|string|in:user,admin',
        ]);

        $user = User::where('email', $fields['email'])->first();

        if (!$user || !Hash::check($fields['password'], $user->password)) {
            return response()->json(['message' => 'Invalid email or password.'], 401);
        }

        $requestedRole = $fields['role'] ?? 'user';
        if ($user->role !== $requestedRole) {
            return response()->json(['message' => 'Invalid credentials for this role.'], 401);
        }

        $token = $user->createToken('app_token')->plainTextToken;

        return response()->json(['user' => $user, 'token' => $token], 200);
    }

    public function setupAdmin(Request $request)
    {
        if (User::where('role', 'admin')->exists()) {
            return response()->json(['message' => 'Admin account already exists.'], 409);
        }

        $fields = $request->validate([
            'name'      => 'required|string|max:255',
            'school_id' => 'required|string|max:40',
            'email'     => 'required|string|email|unique:users,email',
            'password'  => 'required|string|min:8',
        ]);

        User::create([
            'name'      => $fields['name'],
            'school_id' => $fields['school_id'],
            'email'     => $fields['email'],
            'password'  => $fields['password'],
            'role'      => 'admin',
        ]);

        return response()->json(['message' => 'Admin account created.'], 201);
    }

    public function changePassword(Request $request)
    {
        $fields = $request->validate([
            'current_password' => 'required|string',
            'new_password'     => 'required|string|min:8',
        ]);

        $user = $request->user();

        if (!Hash::check($fields['current_password'], $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }

        $user->password = $fields['new_password'];
        $user->save();

        return response()->json(['message' => 'Password updated successfully.']);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully.']);
    }
}
