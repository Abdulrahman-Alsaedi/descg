<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('salla_products', function (Blueprint $table) {
            $table->id(); // internal auto-incrementing ID
            $table->unsignedBigInteger('salla_product_id')->unique(); // external product ID from Salla
            $table->unsignedBigInteger('merchant_id');
            $table->string('name');
            $table->string('type')->default('default'); // product type, e.g., 'default', 'variant'
            $table->decimal('price', 10, 2);
            $table->decimal('taxed_price', 10, 2);
            $table->decimal('tax', 10, 2);
            $table->integer('quantity');
            $table->string('status')->default('hidden');
            $table->boolean('is_available')->default(false);
            $table->string('url');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('salla_products');
    }
};
