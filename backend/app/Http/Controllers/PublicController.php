<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Vehicle;
use Illuminate\Http\Request;

class PublicController extends Controller
{
    /**
     * Public, paginated, searchable car catalogue. No owner/client info exposed.
     */
    public function index(Request $request)
    {
        $search = $request->query('search');
        $category = $request->query('category');

        $vehicles = Vehicle::query()
            ->select([
                'id',
                'chassis_number',
                'manufacture_company',
                'manufacturer',
                'manufacture_year',
                'price',
                'model_name',
                'image_url',
                'status',
                'category',
                'plate_number',
            ])
            ->when($category, fn ($q) => $q->where('category', $category))
            ->when($search, function ($q) use ($search) {
                $q->where(function ($w) use ($search) {
                    $w->where('model_name', 'like', "%{$search}%")
                        ->orWhere('manufacture_company', 'like', "%{$search}%")
                        ->orWhere('manufacturer', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return response()->json($vehicles);
    }

    /**
     * Single car detail — public spec fields only.
     */
    public function show($id)
    {
        $vehicle = Vehicle::query()
            ->select([
                'id',
                'chassis_number',
                'manufacture_company',
                'manufacturer',
                'manufacture_year',
                'price',
                'model_name',
                'image_url',
                'status',
                'category',
                'plate_number',
            ])
            ->findOrFail($id);

        return response()->json($vehicle);
    }

    /**
     * Public landing-page counters.
     */
    public function stats()
    {
        return response()->json([
            'vehicles'  => Vehicle::count(),
            'available' => Vehicle::where('status', 'available')->count(),
            'sold'      => Vehicle::where('status', 'sold')->count(),
            'clients'   => Client::count(),
            'brands'    => Vehicle::distinct('manufacture_company')->count('manufacture_company'),
        ]);
    }
}
