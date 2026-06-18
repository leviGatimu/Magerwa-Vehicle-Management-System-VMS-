<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Vehicle;
use Illuminate\Http\Request;

class ClientOrderController extends Controller
{
    /**
     * The authenticated client's own orders, with the related vehicle.
     */
    public function index(Request $request)
    {
        $orders = $request->user()
            ->orders()
            ->with('vehicle')
            ->latest()
            ->get();

        return response()->json($orders);
    }

    /**
     * Place a purchase request on an available vehicle.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'vehicle_id' => ['required', 'exists:vehicles,id'],
        ]);

        $vehicle = Vehicle::findOrFail($data['vehicle_id']);

        if ($vehicle->status !== 'available') {
            return response()->json(['message' => 'Vehicle is not available'], 422);
        }

        $order = Order::create([
            'client_id'  => $request->user()->id,
            'vehicle_id' => $vehicle->id,
            'price'      => $vehicle->price,
            'status'     => 'pending',
        ]);

        $vehicle->update(['status' => 'reserved']);

        return response()->json($order->load('vehicle'), 201);
    }

    /**
     * Cancel a still-pending order owned by the client; frees the vehicle again.
     */
    public function destroy(Request $request, $id)
    {
        $order = $request->user()
            ->orders()
            ->where('id', $id)
            ->where('status', 'pending')
            ->firstOrFail();

        $vehicle = $order->vehicle;
        $order->delete();

        if ($vehicle && $vehicle->status === 'reserved') {
            $vehicle->update(['status' => 'available']);
        }

        return response()->json(['message' => 'Order cancelled.']);
    }
}
