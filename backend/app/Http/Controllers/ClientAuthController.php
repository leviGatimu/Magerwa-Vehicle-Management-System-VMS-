<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class ClientAuthController extends Controller
{
    /**
     * Self-register a new client account.
     */
    public function register(Request $request)
    {
        $data = $request->validate([
            'full_name'   => ['required', 'string', 'max:150'],
            'email'       => ['required', 'email', 'max:150', 'unique:clients,email'],
            'national_id' => ['required', 'regex:/^\d{16}$/', 'unique:clients,national_id'],
            'telephone'   => ['required', 'string', 'max:20'],
            'address'     => ['required', 'string', 'max:255'],
            'password'    => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $client = Client::create($data);
        $token = $client->createToken('client')->plainTextToken;

        return response()->json([
            'token'  => $token,
            'client' => $client,
        ], 201);
    }

    /**
     * Log a client in and return a bearer token.
     * Generic error — never reveal whether the email exists.
     */
    public function login(Request $request)
    {
        $data = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $client = Client::where('email', $data['email'])->first();

        if (! $client || ! $client->password || ! Hash::check($data['password'], $client->password)) {
            throw ValidationException::withMessages([
                'email' => ['These credentials do not match our records.'],
            ]);
        }

        $token = $client->createToken('client')->plainTextToken;

        return response()->json([
            'token'  => $token,
            'client' => $client,
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
     * Current authenticated client profile.
     */
    public function me(Request $request)
    {
        return response()->json($request->user());
    }
}
