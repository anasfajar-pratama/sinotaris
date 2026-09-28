<?php

namespace Tests\Feature\Admin;

use App\Models\Client;
use App\Models\Document;
use App\Models\DocumentType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class DocumentUpdateTest extends TestCase
{
    use RefreshDatabase;

    private User $adminUser;
    private DocumentType $ajbType;

    protected function setUp(): void
    {
        parent::setUp();

        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        Role::firstOrCreate(['name' => 'super-admin', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'documents.view', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'documents.edit', 'guard_name' => 'web']);

        $adminRole = Role::findByName('super-admin', 'web');
        $adminRole->syncPermissions(['documents.view', 'documents.edit']);

        $this->adminUser = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@test.com',
        ]);
        $this->adminUser->assignRole('super-admin');

        $this->ajbType = DocumentType::firstOrCreate(
            ['slug' => 'ajb'],
            ['name' => 'Akta Jual Beli', 'category' => 'ppat', 'sla_days' => 14]
        );
    }

    private function makeDocument(array $attributes = []): Document
    {
        $client = Client::create([
            'name' => 'Test Client',
            'source' => 'umum',
            'source_detail' => ['name' => 'Test Source'],
        ]);

        return Document::create(array_merge([
            'doc_number' => 'DOC/2026/09/0001',
            'type_id' => $this->ajbType->id,
            'client_id' => $client->id,
            'title' => 'Test Order',
            'status' => 'draft',
            'current_stage' => 1,
            'priority' => 'normal',
            'tracking_code' => 'ABC123',
            'created_by' => $this->adminUser->id,
        ], $attributes));
    }

    // ========== P2 #8: handler bisa diedit ==========

    public function test_update_document_sets_handler_fields(): void
    {
        $document = $this->makeDocument();

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->putJson("/api/v1/admin/documents/{$document->id}", [
                'handler_type' => 'ppat',
                'handler_name' => 'John PPAT',
                'handler_region' => 'Jakarta Selatan',
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('documents', [
            'id' => $document->id,
            'handler_type' => 'ppat',
            'handler_name' => 'John PPAT',
            'handler_region' => 'Jakarta Selatan',
        ]);
    }

    public function test_update_document_can_change_existing_handler(): void
    {
        $document = $this->makeDocument([
            'handler_type' => 'notaris',
            'handler_name' => 'Notaris Awal',
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->putJson("/api/v1/admin/documents/{$document->id}", [
                'handler_type' => 'ppat_rekanan',
                'handler_name' => 'PPAT Rekanan Baru',
                'handler_region' => 'Depok',
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('documents', [
            'id' => $document->id,
            'handler_type' => 'ppat_rekanan',
            'handler_name' => 'PPAT Rekanan Baru',
            'handler_region' => 'Depok',
        ]);
    }

    public function test_update_document_rejects_invalid_handler_type(): void
    {
        $document = $this->makeDocument();

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->putJson("/api/v1/admin/documents/{$document->id}", [
                'handler_type' => 'camat',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['handler_type']);
    }

    public function test_update_document_still_updates_basic_fields(): void
    {
        $document = $this->makeDocument();

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->putJson("/api/v1/admin/documents/{$document->id}", [
                'title' => 'Judul Baru',
                'priority' => 'high',
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('documents', [
            'id' => $document->id,
            'title' => 'Judul Baru',
            'priority' => 'high',
        ]);
    }
}
