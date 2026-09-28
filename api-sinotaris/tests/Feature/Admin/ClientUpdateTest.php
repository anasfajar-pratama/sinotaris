<?php

namespace Tests\Feature\Admin;

use App\Models\Client;
use App\Models\ClientMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ClientUpdateTest extends TestCase
{
    use RefreshDatabase;

    private User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        Role::firstOrCreate(['name' => 'super-admin', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'clients.view', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'clients.edit', 'guard_name' => 'web']);

        $adminRole = Role::findByName('super-admin', 'web');
        $adminRole->syncPermissions(['clients.view', 'clients.edit']);

        $this->adminUser = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@test.com',
        ]);
        $this->adminUser->assignRole('super-admin');
    }

    private function makeClient(): Client
    {
        return Client::create([
            'source' => 'umum',
            'source_detail' => ['name' => 'Test Source', 'phone' => '08123456789'],
        ]);
    }

    private function makeMember(Client $client, string $name, ?string $nik = null): ClientMember
    {
        return ClientMember::create([
            'client_id' => $client->id,
            'name' => $name,
            'nik' => $nik,
        ]);
    }

    // ========== P2 #9: NIK unik ==========

    public function test_update_members_rejects_nik_already_used_by_other_member(): void
    {
        $clientA = $this->makeClient();
        $this->makeMember($clientA, 'Budi Santoso', '3201010101010001');

        $clientB = $this->makeClient();

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->putJson("/api/v1/admin/clients/{$clientB->id}/members", [
                'members' => [
                    ['name' => 'Orang Lain', 'nik' => '3201010101010001'],
                ],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['members.0.nik']);
    }

    public function test_update_members_allows_member_to_keep_own_nik(): void
    {
        $client = $this->makeClient();
        $member = $this->makeMember($client, 'Budi Santoso', '3201010101010001');

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->putJson("/api/v1/admin/clients/{$client->id}/members", [
                'members' => [
                    ['id' => $member->id, 'name' => 'Budi Santoso Updated', 'nik' => '3201010101010001'],
                ],
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('client_members', [
            'id' => $member->id,
            'name' => 'Budi Santoso Updated',
        ]);
    }

    public function test_update_members_rejects_duplicate_nik_within_payload(): void
    {
        $client = $this->makeClient();

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->putJson("/api/v1/admin/clients/{$client->id}/members", [
                'members' => [
                    ['name' => 'Budi', 'nik' => '3201010101010002'],
                    ['name' => 'Kembar', 'nik' => '3201010101010002'],
                ],
            ]);

        $response->assertStatus(422);
    }

    public function test_update_members_allows_reuse_of_soft_deleted_member_nik(): void
    {
        $client = $this->makeClient();
        $member = $this->makeMember($client, 'Budi Lama', '3201010101010003');
        $member->delete(); // soft delete

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->putJson("/api/v1/admin/clients/{$client->id}/members", [
                'members' => [
                    ['name' => 'Budi Baru', 'nik' => '3201010101010003'],
                ],
            ]);

        $response->assertStatus(200);
    }

    // ========== P2 #14: sync kolom legacy clients ==========

    public function test_update_members_syncs_legacy_client_fields_from_first_member(): void
    {
        $client = $this->makeClient();

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->putJson("/api/v1/admin/clients/{$client->id}/members", [
                'members' => [
                    ['name' => 'Budi Santoso', 'nik' => '3201010101010004', 'phone' => '081200001111', 'email' => 'budi@test.com'],
                    ['name' => 'Siti Rahayu', 'nik' => '3201010101010005'],
                ],
            ]);

        $response->assertStatus(200);

        // Member baru tidak boleh ikut ter-soft-delete oleh proses sync.
        $this->assertDatabaseHas('client_members', [
            'client_id' => $client->id,
            'name' => 'Budi Santoso',
            'deleted_at' => null,
        ]);

        $this->assertDatabaseHas('clients', [
            'id' => $client->id,
            'name' => 'Budi Santoso',
            'nik' => '3201010101010004',
            'phone' => '081200001111',
            'email' => 'budi@test.com',
        ]);
    }
}
