<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('full_name', 150);
            $table->string('national_id', 20)->unique();
            $table->string('telephone', 20);
            $table->string('address', 255);
            $table->string('email', 150)->nullable()->unique();      // self-registering clients log in with this
            $table->string('password', 255)->nullable();             // nullable so admin-created clients without login still work
            $table->foreignId('created_by')->nullable()
                ->constrained('admins')->nullOnDelete(); // which admin registered them
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
