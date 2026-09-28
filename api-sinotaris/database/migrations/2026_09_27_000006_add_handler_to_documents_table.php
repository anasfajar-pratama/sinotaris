<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->string('handler_type')->nullable()->after('notes');
            $table->string('handler_name')->nullable()->after('handler_type');
            $table->string('handler_region')->nullable()->after('handler_name');
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn(['handler_type', 'handler_name', 'handler_region']);
        });
    }
};
