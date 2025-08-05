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
        Schema::table('ai_description_logs', function (Blueprint $table) {
            $table->enum('ai_provider', ['gemini', 'deepseek'])->default('gemini')->after('product_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ai_description_logs', function (Blueprint $table) {
            $table->dropColumn('ai_provider');
        });
    }
};
