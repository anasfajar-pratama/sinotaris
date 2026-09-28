<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE client_members MODIFY COLUMN marital_status VARCHAR(30) NULL");
        } else {
            // SQLite: enum dibuat sebagai VARCHAR + CHECK constraint berisi nilai lama.
            // Drop & re-create agar nilai baru (married_foreign, married_prenup) diterima.
            Schema::table('client_members', function (Blueprint $table) {
                $table->dropColumn('marital_status');
            });
            Schema::table('client_members', function (Blueprint $table) {
                $table->string('marital_status', 30)->nullable()->after('gender');
            });
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE client_members MODIFY COLUMN marital_status ENUM('single','married','divorced','widowed') NULL");
        } else {
            Schema::table('client_members', function (Blueprint $table) {
                $table->dropColumn('marital_status');
            });
            Schema::table('client_members', function (Blueprint $table) {
                $table->enum('marital_status', ['single', 'married', 'divorced', 'widowed'])->nullable()->after('gender');
            });
        }
    }
};
