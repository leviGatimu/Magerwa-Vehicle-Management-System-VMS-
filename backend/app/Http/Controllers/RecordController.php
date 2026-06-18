<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Order;
use App\Models\Vehicle;
use Illuminate\Http\Request;

class RecordController extends Controller
{
    /**
     * Paginated joined view: vehicle + owning client + plate, for the main records table.
     */
    public function index(Request $request)
    {
        $search = $request->query('search');
        $status = $request->query('status');

        $records = Vehicle::query()
            ->with('client:id,full_name,telephone,national_id')
            ->when($status, fn ($q) => $q->where('status', $status))
            ->when($search, function ($q) use ($search) {
                $q->where(function ($w) use ($search) {
                    $w->where('model_name', 'like', "%{$search}%")
                        ->orWhere('manufacture_company', 'like', "%{$search}%")
                        ->orWhere('chassis_number', 'like', "%{$search}%")
                        ->orWhere('plate_number', 'like', "%{$search}%")
                        ->orWhereHas('client', fn ($c) => $c->where('full_name', 'like', "%{$search}%"));
                });
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return response()->json($records);
    }

    /**
     * Dashboard summary counters for the stat strip.
     */
    public function stats()
    {
        return response()->json([
            'vehicles'        => Vehicle::count(),
            'available'       => Vehicle::where('status', 'available')->count(),
            'sold'            => Vehicle::where('status', 'sold')->count(),
            'reserved'        => Vehicle::where('status', 'reserved')->count(),
            'clients'         => Client::count(),
            'orders_pending'  => Order::where('status', 'pending')->count(),
            'revenue'         => (float) Vehicle::where('status', 'sold')->sum('price'),
        ]);
    }
}
