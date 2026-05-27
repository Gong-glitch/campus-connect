<?php

namespace App\Http\Controllers;

use App\Models\Claim;
use App\Models\Item;
use Illuminate\Http\Request;

class ClaimController extends Controller
{
    /**
     * Student: Log a claim verification request against an item.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'item_id'    => 'required|exists:items,id',
            'proof_text' => 'required|string|min:10',
        ]);

        $item = Item::findOrFail($validated['item_id']);

        // Check if item status equals 'Found' before allowing submittals
        if ($item->status !== 'Found') {
            return response()->json([
                'message' => 'This item cannot be claimed. Current item state: ' . $item->status
            ], 422);
        }

        // Prevent a student from creating duplicate active claims on the same item
        $hasDuplicate = Claim::where('item_id', $item->id)
            ->where('user_id', $request->user()->id)
            ->whereIn('status', ['Pending', 'Approved'])
            ->exists();

        if ($hasDuplicate) {
            return response()->json([
                'message' => 'You already have an active verification claim submitted for this item.'
            ], 422);
        }

        $claim = Claim::create([
            'item_id'    => $validated['item_id'],
            'user_id'    => $request->user()->id,
            'proof_text' => $validated['proof_text'],
            'status'     => 'Pending',
        ]);

        return response()->json([
            'message' => 'Claim submission logged successfully for review.',
            'claim'   => $claim->load('item')
        ], 201);
    }

    /**
     * Student: Retrieve logged personal claim listings.
     */
    public function myClaims(Request $request)
    {
        $claims = Claim::with('item')
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json($claims, 200);
    }

    /**
     * Admin: Index all submitted claims across the system.
     */
    public function index(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized admin dashboard context.'], 403);
        }

        $claims = Claim::with(['user:id,name,school_id,email', 'item'])
            ->latest()
            ->get();

        return response()->json($claims, 200);
    }

    /**
     * Admin: Process updates, approving or rejecting student property claims.
     */
    public function updateStatus(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized admin operation context.'], 403);
        }

        $validated = $request->validate([
            'status'      => 'required|in:Approved,Rejected',
            'admin_notes' => 'nullable|string',
        ]);

        $claim = Claim::with('item')->findOrFail($id);

        if ($claim->status !== 'Pending') {
            return response()->json(['message' => 'This claim has already been evaluated and processed.'], 422);
        }

        $claim->update($validated);

        // If the claim is approved, mark the item as 'Resolved'
        if ($claim->status === 'Approved') {
            $claim->item->update(['status' => 'Resolved']);

            // Auto-reject competing pending claims for this specific item
            Claim::where('item_id', $claim->item_id)
                ->where('id', '!=', $claim->id)
                ->where('status', 'Pending')
                ->update([
                    'status'      => 'Rejected',
                    'admin_notes' => 'This listing asset has been claimed and resolved by another student profile verification match.',
                ]);
        }

        return response()->json([
            'message' => 'Claim record updated to ' . $claim->status . ' status conditions successfully.',
            'claim'   => $claim
        ], 200);
    }
}