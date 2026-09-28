<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('marital_document_requirements', function (Blueprint $table) {
            $table->id();
            $table->string('marital_status');
            $table->foreignId('document_catalog_id')->constrained()->cascadeOnDelete();
            $table->boolean('is_required')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marital_document_requirements');
    }
};
