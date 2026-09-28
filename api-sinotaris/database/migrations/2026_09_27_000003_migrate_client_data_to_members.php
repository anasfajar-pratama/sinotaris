<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $clients = DB::table('clients')->whereNotNull('name')->get();

        foreach ($clients as $client) {
            DB::table('client_members')->insert([
                'client_id'  => $client->id,
                'name'       => $client->name,
                'nik'        => $client->nik,
                'phone'      => $client->phone,
                'email'      => $client->email,
                'npwp'       => $client->npwp,
                'gender'     => $client->gender,
                'address'    => $client->address,
                'birth_date' => $client->birth_date,
                'notes'      => $client->notes,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        DB::table('client_members')->truncate();
    }
};
