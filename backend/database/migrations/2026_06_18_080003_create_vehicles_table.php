<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->string('chassis_number', 50)->unique();      // VIN / chassis, globally unique
            $table->string('manufacture_company', 100);          // e.g. Mercedes-Benz
            $table->string('manufacturer', 100);                 // assembling manufacturer (may differ)
            $table->smallInteger('manufacture_year');
            $table->decimal('price', 12, 2);
            $table->string('model_name', 100);                   // e.g. CLA250

            // Linkage fields (Task 4) — nullable until linked:
            $table->foreignId('client_id')->nullable()
                ->constrained('clients')->nullOnDelete();
            $table->string('plate_number', 20)->nullable()->unique(); // assigned when a sale is approved
            $table->string('image_url', 255)->nullable();             // public car photo path
            $table->string('category', 30)->nullable();               // Economy/Luxury/SUV/Sport/Exotic
            $table->enum('status', ['available', 'reserved', 'sold'])->default('available');
            $table->foreignId('created_by')->nullable()
                ->constrained('admins')->nullOnDelete();
            $table->timestamps();

            $table->index('client_id', 'idx_vehicles_client');
            $table->index('status', 'idx_vehicles_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
