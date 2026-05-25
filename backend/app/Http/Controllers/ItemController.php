<?php

namespace App\Http\Controllers;

use App\Models\Item;
use Illuminate\Http\Request;

class ItemController extends Controller
{
    // 1. READ: Get items (with Search & Filter logic!)
    public function index(Request $request)
    {
        // Start building the query, attaching the user's name, ordered by newest first
        $query = Item::with('user:id,name')->latest();

        // FEATURE 1: Search by Keyword (looks in both title and description)
        $query->when($request->query('search'), function ($q, $search) {
            $q->where(function ($subQ) use ($search) {
                $subQ->where('title', 'like', '%' . $search . '%')
                     ->orWhere('description', 'like', '%' . $search . '%');
            });
        });

        // FEATURE 2: Filter by Status (e.g., show only 'Lost' or only 'Found')
        $query->when($request->query('status'), function ($q, $status) {
            $q->where('status', $status);
        });

        // FEATURE 3: Filter by Category (e.g., show only 'Electronics')
        $query->when($request->query('category'), function ($q, $category) {
            $q->where('category', $category);
        });

        // Execute the query and get the results
        $items = $query->get();
        
        return response()->json($items, 200);
    }

    // 2. CREATE: Save a new item
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'required|string',
            'category'    => 'required|string',
            'location'    => 'required|string',
            'status'      => 'required|string',
            'image_path'  => 'nullable|string'
        ]);

        // Automatically assign the user_id based on who is logged in!
        $validated['user_id'] = $request->user()->id;

        $item = Item::create($validated);

        return response()->json([
            'message' => 'Item posted successfully!',
            'item'    => $item
        ], 201);
    }

    // 3. READ: Get a single specific item
    public function show($id)
    {
        $item = Item::with('user:id,name')->find($id);

        if (!$item) {
            return response()->json(['message' => 'Item not found'], 404);
        }

        return response()->json($item, 200);
    }

    // 4. UPDATE: Modify an existing item (e.g., Changing "Lost" to "Resolved")
    public function update(Request $request, $id)
    {
        $item = Item::find($id);

        if (!$item) {
            return response()->json(['message' => 'Item not found'], 404);
        }

        // Security check: Only allow the person who posted it to edit it
        if ($item->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized to edit this item'], 403);
        }

        $validated = $request->validate([
            'title'       => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string',
            'category'    => 'sometimes|required|string',
            'location'    => 'sometimes|required|string',
            'status'      => 'sometimes|required|string',
        ]);

        $item->update($validated);

        return response()->json([
            'message' => 'Item updated successfully!',
            'item'    => $item
        ], 200);
    }

    // 5. DELETE: Remove an item
    public function destroy(Request $request, $id)
    {
        $item = Item::find($id);

        if (!$item) {
            return response()->json(['message' => 'Item not found'], 404);
        }

        // Security check: Only allow the person who posted it to delete it
        if ($item->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized to delete this item'], 403);
        }

        $item->delete();

        return response()->json(['message' => 'Item deleted successfully!'], 200);
    }
}