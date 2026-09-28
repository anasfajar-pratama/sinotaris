<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->string('status')->default('draft')->after('source_detail');
        });

        Schema::table('client_members', function (Blueprint $table) {
            $table->enum('marital_status', ['single', 'married', 'divorced', 'widowed'])->nullable()->after('gender');
        });
    }

    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('client_members', function (Blueprint $table) {
            $table->dropColumn('marital_status');
        });
    }
};
