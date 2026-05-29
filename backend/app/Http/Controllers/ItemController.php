<?php

namespace App\Http\Controllers;

use App\Models\Item;
use Illuminate\Http\Request;

class ItemController extends Controller
{
    public function index(Request $request)
    {
        $query = Item::with('user:id,name')->latest();

        // ?search= full-text filter
        $query->when($request->query('search'), function ($q, $search) {
            $q->where(function ($sub) use ($search) {
                $sub->where('title', 'like', '%' . $search . '%')
                    ->orWhere('description', 'like', '%' . $search . '%');
            });
        });

        // ?status= single-status filter
        $query->when($request->query('status'), function ($q, $status) {
            $q->where('status', $status);
        });

        // ?category= category filter
        $query->when($request->query('category'), function ($q, $category) {
            $q->where('category', $category);
        });

        // ?mine=1 — return only the authenticated user's own items (all statuses)
        $query->when($request->query('mine'), function ($q) use ($request) {
            $q->where('user_id', $request->user()->id);
        });

        // ?pending=1 — return items awaiting admin review (Pending Approval or Rejected)
        $query->when($request->query('pending'), function ($q) {
            $q->whereIn('status', ['Pending Approval', 'Rejected']);
        });

        return response()->json($query->get(), 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'         => 'required|string|max:255',
            'description'   => 'required|string',
            'category'      => 'required|string',
            'location'      => 'required|string',
            'status'        => 'required|string',
            'image_path'    => 'nullable|string|max:500',
            'contact_email' => 'nullable|email|max:255',
            'found_date'    => 'nullable|date',
        ]);

        $validated['user_id'] = $request->user()->id;

        // Students may only submit pending reports — admins may set any status
        if ($request->user()->role !== 'admin') {
            $validated['status'] = 'Pending Approval';
        }

        $item = Item::create($validated);
        $item->load('user:id,name');

        return response()->json(['message' => 'Item created successfully.', 'item' => $item], 201);
    }

    public function show($id)
    {
        $item = Item::with('user:id,name')->find($id);

        if (!$item) {
            return response()->json(['message' => 'Item not found.'], 404);
        }

        return response()->json($item, 200);
    }

    public function update(Request $request, $id)
    {
        $item = Item::find($id);

        if (!$item) {
            return response()->json(['message' => 'Item not found.'], 404);
        }

        // Admins may edit any item; regular users may only edit their own
        if ($request->user()->role !== 'admin' && $item->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized to edit this item.'], 403);
        }

        $validated = $request->validate([
            'title'         => 'sometimes|required|string|max:255',
            'description'   => 'sometimes|required|string',
            'category'      => 'sometimes|required|string',
            'location'      => 'sometimes|required|string',
            'status'        => 'sometimes|required|string',
            'image_path'    => 'sometimes|nullable|string|max:500',
            'contact_email' => 'sometimes|nullable|email|max:255',
            'found_date'    => 'sometimes|nullable|date',
        ]);

        $item->update($validated);
        $item->load('user:id,name');

        return response()->json(['message' => 'Item updated successfully.', 'item' => $item], 200);
    }

    public function destroy(Request $request, $id)
    {
        $item = Item::find($id);

        if (!$item) {
            return response()->json(['message' => 'Item not found.'], 404);
        }

        // Admins may delete any item; regular users may only delete their own
        if ($request->user()->role !== 'admin' && $item->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized to delete this item.'], 403);
        }

        $item->delete();

        return response()->json(['message' => 'Item deleted successfully.'], 200);
    }

    /**
     * 🟢 PERSONAL STUDENT DASHBOARD FEED
     * Fetches all found item submissions uploaded by the logged-in user.
     */
    public function myReports(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json(['error' => 'User context not found.'], 401);
            }

            $items = Item::with('user:id,name')
                ->where('user_id', $user->id)
                ->latest()
                ->get();

            return response()->json($items, 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to resolve user dashboard rows: ' . $e->getMessage()
            ], 500);
        }
    }
}