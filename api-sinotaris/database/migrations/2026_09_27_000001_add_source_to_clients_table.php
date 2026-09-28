<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->enum('source', ['bank', 'notaris', 'developer', 'umum'])->nullable()->after('user_id');
            $table->json('source_detail')->nullable()->after('source');
        });
    }

    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn(['source', 'source_detail']);
        });
    }
};
