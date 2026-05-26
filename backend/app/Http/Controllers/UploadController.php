<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class UploadController extends Controller
{
    public function upload(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:4096',
        ]);

        $path = $request->file('image')->store('items', 'public');

        // Return a root-relative path so any reverse-proxy can serve it
        return response()->json(['url' => '/storage/' . $path]);
    }
}
