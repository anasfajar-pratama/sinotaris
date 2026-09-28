<?php

namespace Tests\Feature\Admin;

use App\Models\ActorType;
use App\Models\AjbCase;
use App\Models\Client;
use App\Models\Document;
use App\Models\DocumentType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AjbMaritalTest extends TestCase
{
    use RefreshDatabase;

    private User $adminUser;
    private AjbCase $ajbCase;

    protected function setUp(): void
    {
        parent::setUp();

        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        Role::firstOrCreate(['name' => 'super-admin', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'ajb.view', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'ajb.edit', 'guard_name' => 'web']);

        $adminRole = Role::findByName('super-admin', 'web');
        $adminRole->syncPermissions(['ajb.view', 'ajb.edit']);

        $this->adminUser = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@test.com',
        ]);
        $this->adminUser->assignRole('super-admin');

        ActorType::firstOrCreate(['key' => 'penjual'], ['label' => 'Penjual']);
        ActorType::firstOrCreate(['key' => 'pembeli'], ['label' => 'Pembeli']);

        $ajbType = DocumentType::firstOrCreate(
            ['slug' => 'ajb'],
            ['name' => 'Akta Jual Beli', 'category' => 'ppat', 'sla_days' => 14]
        );

        $client = Client::create([
            'name' => 'Test Client',
            'source' => 'umum',
            'source_detail' => ['name' => 'Test Source'],
        ]);

        $document = Document::create([
            'doc_number' => 'DOC/2026/09/0001',
            'type_id' => $ajbType->id,
            'client_id' => $client->id,
            'title' => 'Test AJB',
            'status' => 'draft',
            'current_stage' => 1,
            'priority' => 'normal',
            'tracking_code' => 'ABC123',
            'created_by' => $this->adminUser->id,
        ]);

        $this->ajbCase = AjbCase::create([
            'document_id' => $document->id,
            'case_number' => 'AJB/2026/09/0001',
            'source_type' => 'walk_in',
            'current_step' => 1,
            'status' => 'active',
        ]);
    }

    // ========== P2 #7: enum marital baru di AjbController ==========

    public function test_add_seller_accepts_new_marital_statuses(): void
    {
        $statuses = ['single', 'married', 'married_foreign', 'married_prenup', 'divorced', 'widowed'];

        foreach ($statuses as $i => $status) {
            $response = $this->actingAs($this->adminUser, 'sanctum')
                ->postJson("/api/v1/admin/ajb/{$this->ajbCase->id}/seller", [
                    'name' => "Penjual {$i}",
                    'marital_status' => $status,
                ]);

            $response->assertStatus(201);
            $this->assertEquals($status, $response->json('actor.data.marital_status'));
        }
    }

    public function test_add_buyer_accepts_married_foreign(): void
    {
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/v1/admin/ajb/{$this->ajbCase->id}/buyer", [
                'name' => 'Pembeli WNA Pair',
                'marital_status' => 'married_foreign',
            ]);

        $response->assertStatus(201);
        $this->assertEquals('married_foreign', $response->json('actor.data.marital_status'));
    }

    public function test_add_seller_rejects_invalid_marital_status(): void
    {
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/v1/admin/ajb/{$this->ajbCase->id}/seller", [
                'name' => 'Penjual Invalid',
                'marital_status' => 'complicated',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['marital_status']);
    }
}
