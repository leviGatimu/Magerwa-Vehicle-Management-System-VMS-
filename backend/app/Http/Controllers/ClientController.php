<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    /**
     * Paginated, searchable client list.
     */
    public function index(Request $request)
    {
        $search = $request->query('search');

        $clients = Client::query()
            ->withCount('vehicles')
            ->when($search, function ($q) use ($search) {
                $q->where(function ($w) use ($search) {
                    $w->where('full_name', 'like', "%{$search}%")
                        ->orWhere('national_id', 'like', "%{$search}%")
                        ->orWhere('telephone', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return response()->json($clients);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'full_name'   => ['required', 'string', 'max:150'],
            'national_id' => ['required', 'regex:/^\d{16}$/', 'unique:clients,national_id'],
            'telephone'   => ['required', 'string', 'max:20'],
            'address'     => ['required', 'string', 'max:255'],
        ]);

        $data['created_by'] = $request->user()->id;
        $client = Client::create($data);

        return response()->json($client, 201);
    }

    public function show(Client $client)
    {
        return response()->json($client->load('vehicles'));
    }

    public function update(Request $request, Client $client)
    {
        $data = $request->validate([
            'full_name'   => ['sometimes', 'required', 'string', 'max:150'],
            'national_id' => ['sometimes', 'required', 'regex:/^\d{16}$/', 'unique:clients,national_id,' . $client->id],
            'telephone'   => ['sometimes', 'required', 'string', 'max:20'],
            'address'     => ['sometimes', 'required', 'string', 'max:255'],
        ]);

        $client->update($data);

        return response()->json($client);
    }

    public function destroy(Client $client)
    {
        $client->delete();

        return response()->json(['message' => 'Client deleted.']);
    }
}
