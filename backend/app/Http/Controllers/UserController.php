<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    private function requireAdmin(Request $request)
    {
        if ($request->user()?->role !== 'admin') {
            abort(403, 'Admin access required.');
        }
    }

    public function index(Request $request)
    {
        $this->requireAdmin($request);

        // 🛠️ FIX: Fetch any profile that is NOT an admin so 'student' and 'user' both show up
        $users = User::where('role', '!=', 'admin')
            ->orderBy('created_at', 'desc')
            ->get(['id', 'name', 'school_id', 'email', 'status', 'created_at']);

        return response()->json($users);
    }

    public function update(Request $request, $id)
    {
        $this->requireAdmin($request);

        // 🛠️ FIX: Update filter to match non-admin records
        $user = User::where('role', '!=', 'admin')->findOrFail($id);

        $fields = $request->validate([
            'status' => 'required|string|in:Active,Suspended',
        ]);

        $user->update($fields);

        return response()->json(['user' => $user]);
    }

    public function destroy(Request $request, $id)
    {
        $this->requireAdmin($request);

        // 🛠️ FIX: Update filter to match non-admin records
        $user = User::where('role', '!=', 'admin')->findOrFail($id);
        $user->delete();

        return response()->json(['message' => 'User deleted.']);
    }
}