<?php

namespace App\Http\Controllers;

use App\Models\Vehicle;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class VehicleController extends Controller
{
    /**
     * Paginated list, filterable by status + searchable.
     */
    public function index(Request $request)
    {
        $search = $request->query('search');
        $status = $request->query('status');
        $category = $request->query('category');

        $vehicles = Vehicle::query()
            ->with('client:id,full_name')
            ->when($status, fn ($q) => $q->where('status', $status))
            ->when($category, fn ($q) => $q->where('category', $category))
            ->when($search, function ($q) use ($search) {
                $q->where(function ($w) use ($search) {
                    $w->where('model_name', 'like', "%{$search}%")
                        ->orWhere('manufacture_company', 'like', "%{$search}%")
                        ->orWhere('manufacturer', 'like', "%{$search}%")
                        ->orWhere('chassis_number', 'like', "%{$search}%")
                        ->orWhere('plate_number', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return response()->json($vehicles);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'chassis_number'      => ['required', 'string', 'max:50', 'unique:vehicles,chassis_number'],
            'manufacture_company' => ['required', 'string', 'max:100'],
            'manufacturer'        => ['required', 'string', 'max:100'],
            'manufacture_year'    => ['required', 'integer', 'min:1950', 'max:' . (date('Y') + 1)],
            'price'               => ['required', 'numeric', 'min:0'],
            'model_name'          => ['required', 'string', 'max:100'],
            'category'            => ['nullable', 'string', 'max:30'],
            'image_url'           => ['nullable', 'string', 'max:255'],
        ]);

        $data['created_by'] = $request->user()->id;
        $vehicle = Vehicle::create($data);

        return response()->json($vehicle, 201);
    }

    public function show(Vehicle $vehicle)
    {
        return response()->json($vehicle->load('client'));
    }

    public function update(Request $request, Vehicle $vehicle)
    {
        $data = $request->validate([
            'chassis_number'      => ['sometimes', 'required', 'string', 'max:50', Rule::unique('vehicles', 'chassis_number')->ignore($vehicle->id)],
            'manufacture_company' => ['sometimes', 'required', 'string', 'max:100'],
            'manufacturer'        => ['sometimes', 'required', 'string', 'max:100'],
            'manufacture_year'    => ['sometimes', 'required', 'integer', 'min:1950', 'max:' . (date('Y') + 1)],
            'price'               => ['sometimes', 'required', 'numeric', 'min:0'],
            'model_name'          => ['sometimes', 'required', 'string', 'max:100'],
            'category'            => ['nullable', 'string', 'max:30'],
            'image_url'           => ['nullable', 'string', 'max:255'],
        ]);

        $vehicle->update($data);

        return response()->json($vehicle);
    }

    public function destroy(Vehicle $vehicle)
    {
        $vehicle->delete();

        return response()->json(['message' => 'Vehicle deleted.']);
    }

    public function upload(Request $request)
    {
        $request->validate([
            'image' => ['required', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('cars', 'public');
            return response()->json([
                'url' => asset('storage/' . $path)
            ]);
        }

        return response()->json(['message' => 'No image uploaded.'], 400);
    }

    /**
     * Link a vehicle to a client + assign a unique plate (Task 4).
     */
    public function link(Request $request, Vehicle $vehicle)
    {
        $data = $request->validate([
            'client_id'    => ['required', 'exists:clients,id'],
            'plate_number' => ['required', 'string', 'max:20', Rule::unique('vehicles', 'plate_number')->ignore($vehicle->id)],
        ]);

        $vehicle->update([
            'client_id'    => $data['client_id'],
            'plate_number' => $data['plate_number'],
            'status'       => 'sold',
        ]);

        return response()->json($vehicle->load('client'));
    }

    /**
     * Detach a vehicle from its client (e.g. correcting a mistake).
     */
    public function unlink(Vehicle $vehicle)
    {
        $vehicle->update([
            'client_id'    => null,
            'plate_number' => null,
            'status'       => 'available',
        ]);

        return response()->json($vehicle);
    }
}
