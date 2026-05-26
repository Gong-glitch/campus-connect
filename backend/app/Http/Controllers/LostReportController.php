<?php

namespace App\Http\Controllers;

use App\Models\LostReport;
use Illuminate\Http\Request;

class LostReportController extends Controller
{
    // Student: submit a new lost report
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'         => 'required|string|max:255',
            'description'   => 'required|string',
            'category'      => 'required|string',
            'location'      => 'required|string',
            'date_lost'     => 'nullable|date',
            'contact_email' => 'nullable|email|max:255',
            'image_path'    => 'nullable|string|max:500',
        ]);

        $validated['user_id'] = $request->user()->id;
        $validated['status']  = 'Open';

        $report = LostReport::create($validated);
        $report->load('user:id,name');

        return response()->json(['message' => 'Lost report submitted.', 'report' => $report], 201);
    }

    // Student: get only their own lost reports
    public function myReports(Request $request)
    {
        $reports = LostReport::with('user:id,name')
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json($reports);
    }

    // Admin: get all lost reports
    public function index(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $reports = LostReport::with('user:id,name')->latest()->get();

        return response()->json($reports);
    }

    // Admin or owner: update a lost report
    public function update(Request $request, $id)
    {
        $report = LostReport::find($id);

        if (!$report) {
            return response()->json(['message' => 'Lost report not found.'], 404);
        }

        if ($request->user()->role !== 'admin' && $report->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'title'         => 'sometimes|required|string|max:255',
            'description'   => 'sometimes|required|string',
            'category'      => 'sometimes|required|string',
            'location'      => 'sometimes|required|string',
            'date_lost'     => 'sometimes|nullable|date',
            'contact_email' => 'sometimes|nullable|email|max:255',
            'status'        => 'sometimes|required|string',
            'image_path'    => 'sometimes|nullable|string|max:500',
        ]);

        $report->update($validated);
        $report->load('user:id,name');

        return response()->json(['message' => 'Lost report updated.', 'report' => $report]);
    }

    // Admin or owner: delete a lost report
    public function destroy(Request $request, $id)
    {
        $report = LostReport::find($id);

        if (!$report) {
            return response()->json(['message' => 'Lost report not found.'], 404);
        }

        if ($request->user()->role !== 'admin' && $report->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $report->delete();

        return response()->json(['message' => 'Lost report deleted.']);
    }
}
