<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new admin account.
     */
    public function register(Request $request)
    {
        $data = $request->validate([
            'full_name'   => ['required', 'string', 'max:150'],
            'email'       => ['required', 'email', 'max:150', 'unique:admins,email'],
            'phone'       => ['required', 'string', 'max:20'],
            'national_id' => ['required', 'regex:/^\d{16}$/', 'unique:admins,national_id'],
            'password'    => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $admin = Admin::create($data);
        $token = $admin->createToken('vtms')->plainTextToken;

        return response()->json([
            'token' => $token,
            'admin' => $admin,
        ], 201);
    }

    /**
     * Log an admin in and return a bearer token.
     * Generic error — never reveal whether the email exists.
     */
    public function login(Request $request)
    {
        $data = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $admin = Admin::where('email', $data['email'])->first();

        if (! $admin || ! Hash::check($data['password'], $admin->password)) {
            throw ValidationException::withMessages([
                'email' => ['These credentials do not match our records.'],
            ]);
        }

        $token = $admin->createToken('vtms')->plainTextToken;

        return response()->json([
            'token' => $token,
            'admin' => $admin,
        ]);
    }

    /**
     * Revoke the token used for the current request.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out.']);
    }

    /**
     * Current authenticated admin profile.
     */
    public function me(Request $request)
    {
        return response()->json($request->user());
    }
}
