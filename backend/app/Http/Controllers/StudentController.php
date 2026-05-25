<?php

namespace App\Http\Controllers;

use App\Models\Student;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function store(Request $request)
    {
        // 1. Validate the incoming data
        $validatedData = $request->validate([
            'student_id' => 'required|string|unique:students,student_id',
            'first_name' => 'required|string|max:255',
            'last_name'  => 'required|string|max:255',
            'course'     => 'required|string|max:255',
            'year_level' => 'required|integer|min:1|max:5',
        ]);

        // 2. Create and save the new record/data entry correctly 
        $student = Student::create($validatedData);

        // 3. Return a successful JSON response back to the frontend
        return response()->json([
            'message' => 'Student successfully created!',
            'data' => $student
        ], 201); 
    }

    public function index()
    {
        // Retrieve all students from the database
        $students = Student::all();

        // Return them as a JSON response
        return response()->json([
            'message' => 'Students retrieved successfully',
            'data' => $students
        ], 200);
    }

    public function show($id)
    {
        // Find the student by their database ID
        $student = Student::find($id);

        if (!$student) {
            return response()->json([
                'message' => 'Student not found'
            ], 404);
        }

        return response()->json([
            'message' => 'Student retrieved successfully',
            'data' => $student
        ], 200);
    }

    public function update(Request $request, $id)
    {
        // 1. Find the specific student
        $student = Student::find($id);

        if (!$student) {
            return response()->json(['message' => 'Student not found'], 404);
        }

        // 2. Validate the incoming changes
        // Using 'sometimes' means it only validates the field if the frontend actually sent it
        $validatedData = $request->validate([
            'first_name' => 'sometimes|required|string|max:255',
            'last_name'  => 'sometimes|required|string|max:255',
            'course'     => 'sometimes|required|string|max:255',
            'year_level' => 'sometimes|required|integer|min:1|max:5',
        ]);

        // 3. Apply the updates and save to the database
        $student->update($validatedData);

        return response()->json([
            'message' => 'Student updated successfully!',
            'data' => $student
        ], 200);
    }
    public function destroy($id)
    {
        $student = Student::find($id);

        if (!$student) {
            return response()->json(['message' => 'Student not found'], 404);
        }

        $student->delete();

        return response()->json([
            'message' => 'Student deleted successfully!'
        ], 200);
    }
}