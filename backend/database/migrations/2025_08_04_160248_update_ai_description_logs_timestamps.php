<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update existing AI description logs that have NULL timestamps
        // Set both created_at and updated_at to current timestamp for existing records
        DB::table('ai_description_logs')
            ->whereNull('created_at')
            ->orWhereNull('updated_at')
            ->update([
                'created_at' => now(),
                'updated_at' => now(),
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // We can't reliably reverse this migration since we don't know the original values
        // This is a one-way migration
    }
};
