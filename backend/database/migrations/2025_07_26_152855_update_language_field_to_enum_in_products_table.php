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
        // First, update existing data to match new enum values
        DB::table('products')->where('language', 'ar')->update(['language' => 'العربية']);
        DB::table('products')->where('language', 'en')->update(['language' => 'English']);
        DB::table('products')->where('language', 'both')->update(['language' => 'كلاهما']);
        DB::table('products')->whereNull('language')->update(['language' => 'كلاهما']);
        DB::table('products')->where('language', '')->update(['language' => 'كلاهما']);
        
        Schema::table('products', function (Blueprint $table) {
            // Change language field from string to enum with clear Arabic/English options
            $table->enum('language', ['العربية', 'English', 'كلاهما'])
                  ->default('كلاهما')
                  ->change()
                  ->comment('Language choice: العربية, English, or كلاهما');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Update data back to old format
        DB::table('products')->where('language', 'العربية')->update(['language' => 'ar']);
        DB::table('products')->where('language', 'English')->update(['language' => 'en']);
        DB::table('products')->where('language', 'كلاهما')->update(['language' => 'both']);
        
        Schema::table('products', function (Blueprint $table) {
            // Revert back to string
            $table->string('language', 10)
                  ->default('both')
                  ->change()
                  ->comment('ar, en, or both');
        });
    }
};
