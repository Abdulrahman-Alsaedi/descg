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
        // First, change column to a temporary string column with more space
        Schema::table('products', function (Blueprint $table) {
            $table->string('tone_temp', 50)->nullable()->after('tone');
        });
        
        // Update existing Arabic tone values to English equivalents in the temp column
        DB::table('products')->where('tone', 'احترافي')->update(['tone_temp' => 'professional']);
        DB::table('products')->where('tone', 'ودود')->update(['tone_temp' => 'friendly']);
        DB::table('products')->where('tone', 'بسيط')->update(['tone_temp' => 'casual']);
        DB::table('products')->where('tone', 'فخم')->update(['tone_temp' => 'luxury']);
        DB::table('products')->where('tone', 'مرح')->update(['tone_temp' => 'playful']);
        DB::table('products')->where('tone', 'عاطفي')->update(['tone_temp' => 'emotional']);
        
        // Copy any English values that might already exist
        DB::table('products')->whereIn('tone', ['professional', 'friendly', 'casual', 'luxury', 'playful', 'emotional'])
                            ->update(['tone_temp' => DB::raw('tone')]);
        
        // Drop the old column and rename the temp column
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('tone');
        });
        
        Schema::table('products', function (Blueprint $table) {
            $table->renameColumn('tone_temp', 'tone');
        });
        
        // Finally, change to enum
        Schema::table('products', function (Blueprint $table) {
            $table->enum('tone', ['professional', 'friendly', 'casual', 'luxury', 'playful', 'emotional'])
                  ->nullable()
                  ->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to string
        Schema::table('products', function (Blueprint $table) {
            $table->string('tone', 50)->nullable()->change();
        });
    }
};
