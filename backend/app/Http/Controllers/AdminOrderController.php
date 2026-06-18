<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminOrderController extends Controller
{
    /**
     * All orders with client + vehicle, optionally filtered by status, latest first.
     */
    public function index(Request $request)
    {
        $status = $request->query('status');

        $orders = Order::query()
            ->with(['client:id,full_name,telephone,national_id,email', 'vehicle'])
            ->when($status, fn ($q) => $q->where('status', $status))
            ->latest()
            ->get();

        return response()->json($orders);
    }

    /**
     * Approve a sale: order approved, vehicle sold + owner assigned + plate set.
     */
    public function approve(Request $request, Order $order)
    {
        $data = $request->validate([
            'plate_number' => ['required', 'string', 'max:20', Rule::unique('vehicles', 'plate_number')],
        ]);

        $order->update(['status' => 'approved']);

        $order->vehicle->update([
            'status'       => 'sold',
            'client_id'    => $order->client_id,
            'plate_number' => $data['plate_number'],
        ]);

        return response()->json($order->load(['client', 'vehicle']));
    }

    /**
     * Reject a sale: order rejected, vehicle freed and detached.
     */
    public function reject(Request $request, Order $order)
    {
        $order->update(['status' => 'rejected']);

        $order->vehicle->update([
            'status'       => 'available',
            'client_id'    => null,
            'plate_number' => null,
        ]);

        return response()->json($order->load(['client', 'vehicle']));
    }
}
