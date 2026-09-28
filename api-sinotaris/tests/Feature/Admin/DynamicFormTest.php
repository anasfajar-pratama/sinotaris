<?php

namespace Tests\Feature\Admin;

use App\Models\ActorType;
use App\Models\Client;
use App\Models\ClientDocument;
use App\Models\ClientMember;
use App\Models\Document;
use App\Models\DocumentCatalog;
use App\Models\DocumentType;
use App\Models\DocumentTypeActor;
use App\Models\DocumentTypeActorDocument;
use App\Models\DocumentTypeActorField;
use App\Models\MaritalDocumentRequirement;
use App\Models\OrderActor;
use App\Models\ProfileField;
use App\Models\PtDocumentRequirement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class DynamicFormTest extends TestCase
{
    use RefreshDatabase;

    private User $adminUser;
    private DocumentType $ajbType;
    private ActorType $penjualType;
    private ActorType $pembeliType;
    private ProfileField $nameField;
    private ProfileField $maritalStatusField;
    private DocumentCatalog $ktpCatalog;
    private DocumentCatalog $kkCatalog;
    private DocumentCatalog $marriageCertCatalog;
    private DocumentCatalog $ktpPasanganCatalog;

    protected function setUp(): void
    {
        parent::setUp();

        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Setup roles and permissions
        Role::firstOrCreate(['name' => 'super-admin', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'documents.create', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'documents.view', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'documents.edit', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'clients.view', 'guard_name' => 'web']);

        $adminRole = Role::findByName('super-admin', 'web');
        $adminRole->syncPermissions(['documents.create', 'documents.view', 'documents.edit', 'clients.view']);

        $this->adminUser = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@test.com',
        ]);
        $this->adminUser->assignRole('super-admin');

        // Setup document type
        $this->ajbType = DocumentType::firstOrCreate(
            ['slug' => 'ajb'],
            [
                'name' => 'Akta Jual Beli',
                'category' => 'ppat',
                'sla_days' => 14,
            ]
        );

        // Setup actor types
        $this->penjualType = ActorType::firstOrCreate(['key' => 'penjual'], ['label' => 'Penjual']);
        $this->pembeliType = ActorType::firstOrCreate(['key' => 'pembeli'], ['label' => 'Pembeli']);

        // Setup profile fields
        $this->nameField = ProfileField::firstOrCreate(
            ['key' => 'name'],
            ['label' => 'Nama Lengkap', 'data_type' => 'text']
        );

        $this->maritalStatusField = ProfileField::firstOrCreate(
            ['key' => 'marital_status'],
            [
                'label' => 'Status Perkawinan',
                'data_type' => 'select',
                'options' => [
                    ['value' => 'single', 'label' => 'Belum Menikah'],
                    ['value' => 'married', 'label' => 'Menikah'],
                    ['value' => 'married_foreign', 'label' => 'Menikah dengan WNA'],
                    ['value' => 'married_prenup', 'label' => 'Menikah dengan Pisah Harta'],
                    ['value' => 'divorced', 'label' => 'Cerai Hidup'],
                    ['value' => 'widowed', 'label' => 'Cerai Mati'],
                ],
            ]
        );

        // Setup document catalogs
        $this->ktpCatalog = DocumentCatalog::firstOrCreate(['key' => 'ktp'], ['label' => 'KTP', 'category' => 'identity']);
        $this->kkCatalog = DocumentCatalog::firstOrCreate(['key' => 'kk'], ['label' => 'Kartu Keluarga', 'category' => 'identity']);
        $this->marriageCertCatalog = DocumentCatalog::firstOrCreate(['key' => 'marriage-certificate'], ['label' => 'Akta Nikah', 'category' => 'legal']);
        $this->ktpPasanganCatalog = DocumentCatalog::firstOrCreate(['key' => 'ktp_pasangan'], ['label' => 'KTP Pasangan', 'category' => 'identity']);

        // Setup template mapping
        $dta = DocumentTypeActor::create([
            'document_type_id' => $this->ajbType->id,
            'actor_type_id' => $this->penjualType->id,
            'is_required' => true,
            'sort_order' => 1,
        ]);

        DocumentTypeActorField::create([
            'document_type_id' => $this->ajbType->id,
            'actor_type_id' => $this->penjualType->id,
            'document_type_actor_id' => $dta->id,
            'profile_field_id' => $this->nameField->id,
            'is_required' => true,
            'sort_order' => 1,
        ]);

        DocumentTypeActorField::create([
            'document_type_id' => $this->ajbType->id,
            'actor_type_id' => $this->penjualType->id,
            'document_type_actor_id' => $dta->id,
            'profile_field_id' => $this->maritalStatusField->id,
            'is_required' => false,
            'sort_order' => 2,
        ]);

        DocumentTypeActorDocument::create([
            'document_type_id' => $this->ajbType->id,
            'actor_type_id' => $this->penjualType->id,
            'document_type_actor_id' => $dta->id,
            'document_catalog_id' => $this->ktpCatalog->id,
            'is_required' => true,
            'sort_order' => 1,
        ]);

        // Setup marital document requirements
        MaritalDocumentRequirement::create([
            'marital_status' => 'single',
            'document_catalog_id' => $this->ktpCatalog->id,
            'is_required' => true,
            'sort_order' => 1,
        ]);
        MaritalDocumentRequirement::create([
            'marital_status' => 'single',
            'document_catalog_id' => $this->kkCatalog->id,
            'is_required' => true,
            'sort_order' => 2,
        ]);

        MaritalDocumentRequirement::create([
            'marital_status' => 'married',
            'document_catalog_id' => $this->ktpCatalog->id,
            'is_required' => true,
            'sort_order' => 1,
        ]);
        MaritalDocumentRequirement::create([
            'marital_status' => 'married',
            'document_catalog_id' => $this->kkCatalog->id,
            'is_required' => true,
            'sort_order' => 2,
        ]);
        MaritalDocumentRequirement::create([
            'marital_status' => 'married',
            'document_catalog_id' => $this->marriageCertCatalog->id,
            'is_required' => true,
            'sort_order' => 3,
        ]);
        MaritalDocumentRequirement::create([
            'marital_status' => 'married',
            'document_catalog_id' => $this->ktpPasanganCatalog->id,
            'is_required' => true,
            'sort_order' => 4,
        ]);
    }

    public function test_document_creation_with_handler_fields(): void
    {
        $client = Client::create([
            'name' => 'Test Client',
            'source' => 'umum',
            'source_detail' => ['name' => 'Test Source'],
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/v1/admin/documents', [
                'type_id' => $this->ajbType->id,
                'client_id' => $client->id,
                'title' => 'Test AJB Order',
                'priority' => 'normal',
                'handler_type' => 'ppat',
                'handler_name' => 'John PPAT',
                'handler_region' => 'Jakarta Selatan',
            ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('documents', [
            'title' => 'Test AJB Order',
            'handler_type' => 'ppat',
            'handler_name' => 'John PPAT',
            'handler_region' => 'Jakarta Selatan',
        ]);
    }

    public function test_document_creation_with_invalid_handler_type(): void
    {
        $client = Client::create([
            'name' => 'Test Client',
            'source' => 'umum',
            'source_detail' => ['name' => 'Test Source'],
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/v1/admin/documents', [
                'type_id' => $this->ajbType->id,
                'client_id' => $client->id,
                'title' => 'Test AJB Order',
                'priority' => 'normal',
                'handler_type' => 'invalid_type',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['handler_type']);
    }

    public function test_template_endpoint_returns_marital_docs(): void
    {
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson("/api/v1/admin/orders/template/{$this->ajbType->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'document_type',
                'actors',
                'assets',
                'marital_docs' => [
                    'single',
                    'married',
                ],
                'pt_docs',
            ]);

        // Check single marital docs
        $singleDocs = $response->json('marital_docs.single');
        $this->assertCount(2, $singleDocs);
        $this->assertEquals('ktp', $singleDocs[0]['key']);
        $this->assertEquals('kk', $singleDocs[1]['key']);

        // Check married marital docs
        $marriedDocs = $response->json('marital_docs.married');
        $this->assertCount(4, $marriedDocs);
        $keys = array_column($marriedDocs, 'key');
        $this->assertContains('ktp', $keys);
        $this->assertContains('kk', $keys);
        $this->assertContains('marriage-certificate', $keys);
        $this->assertContains('ktp_pasangan', $keys);
    }

    public function test_template_endpoint_returns_pt_docs(): void
    {
        // Create PT document catalogs + requirements (pt_docs kini dari tabel pt_document_requirements)
        $ptCatalogs = [
            ['akta-pendirian', 'Akta Pendirian', 'legal'],
            ['akta-perubahan', 'Akta Perubahan', 'legal'],
            ['company-sk', 'SK Kemenkumham', 'legal'],
            ['npwp-pt', 'NPWP PT', 'identity'],
        ];
        foreach ($ptCatalogs as $sort => [$key, $label, $category]) {
            $catalog = DocumentCatalog::firstOrCreate(['key' => $key], ['label' => $label, 'category' => $category]);
            PtDocumentRequirement::create([
                'document_catalog_id' => $catalog->id,
                'is_required' => true,
                'sort_order' => $sort + 1,
            ]);
        }

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson("/api/v1/admin/orders/template/{$this->ajbType->id}");

        $response->assertStatus(200);

        $ptDocs = $response->json('pt_docs');
        $this->assertCount(4, $ptDocs);
        $keys = array_column($ptDocs, 'key');
        $this->assertContains('akta-pendirian', $keys);
        $this->assertContains('akta-perubahan', $keys);
        $this->assertContains('company-sk', $keys);
        $this->assertContains('npwp-pt', $keys);
    }

    public function test_create_actor_from_client(): void
    {
        Storage::fake('public');

        // Create client with member
        $client = Client::create([
            'name' => 'Test Client',
            'source' => 'umum',
            'source_detail' => ['name' => 'Test Source'],
        ]);

        $member = ClientMember::create([
            'client_id' => $client->id,
            'name' => 'Budi Santoso',
            'nik' => '1234567890123456',
            'phone' => '081234567890',
            'email' => 'budi@test.com',
            'gender' => 'male',
            'marital_status' => 'single',
            'address' => 'Jl. Test No. 123',
        ]);

        // Create client documents
        $ktpFile = UploadedFile::fake()->image('ktp.jpg');
        $ktpPath = $ktpFile->store('clients/1/documents', 'public');

        ClientDocument::create([
            'client_id' => $client->id,
            'client_member_id' => $member->id,
            'doc_type' => 'ktp_nasabah',
            'filename' => basename($ktpPath),
            'original_name' => 'ktp.jpg',
            'path' => $ktpPath,
            'size' => 1024,
            'uploaded_by' => $this->adminUser->id,
        ]);

        // Create order first
        $document = Document::create([
            'doc_number' => 'DOC/2026/09/0001',
            'type_id' => $this->ajbType->id,
            'client_id' => $client->id,
            'title' => 'Test Order',
            'status' => 'draft',
            'current_stage' => 1,
            'priority' => 'normal',
            'tracking_code' => 'ABC123',
            'created_by' => $this->adminUser->id,
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/v1/admin/orders/{$document->id}/actors/from-client", [
                'client_id' => $client->id,
                'actor_type_key' => 'pembeli',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'message' => 'Pihak berhasil dibuat dari data nasabah',
            ]);

        // Verify actor was created
        $this->assertDatabaseHas('order_actors', [
            'document_id' => $document->id,
            'actor_type_id' => $this->pembeliType->id,
        ]);

        // Verify actor data
        $actor = OrderActor::where('document_id', $document->id)
            ->where('actor_type_id', $this->pembeliType->id)
            ->first();

        $this->assertEquals('Budi Santoso', $actor->data['name']);
        $this->assertEquals('1234567890123456', $actor->data['nik']);
        $this->assertEquals('single', $actor->data['marital_status']);
    }

    public function test_create_actor_from_client_with_invalid_client(): void
    {
        $client = Client::create([
            'name' => 'Test Client',
            'source' => 'umum',
            'source_detail' => ['name' => 'Test Source'],
        ]);

        $document = Document::create([
            'doc_number' => 'DOC/2026/09/0001',
            'type_id' => $this->ajbType->id,
            'client_id' => $client->id,
            'title' => 'Test Order',
            'status' => 'draft',
            'current_stage' => 1,
            'priority' => 'normal',
            'tracking_code' => 'ABC123',
            'created_by' => $this->adminUser->id,
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/v1/admin/orders/{$document->id}/actors/from-client", [
                'client_id' => 99999,
                'actor_type_key' => 'pembeli',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['client_id']);
    }

    public function test_completeness_with_marital_status_single(): void
    {
        $client = Client::create([
            'name' => 'Test Client',
            'source' => 'umum',
            'source_detail' => ['name' => 'Test Source'],
        ]);

        $document = Document::create([
            'doc_number' => 'DOC/2026/09/0001',
            'type_id' => $this->ajbType->id,
            'client_id' => $client->id,
            'title' => 'Test Order',
            'status' => 'draft',
            'current_stage' => 1,
            'priority' => 'normal',
            'tracking_code' => 'ABC123',
            'created_by' => $this->adminUser->id,
        ]);

        // Create actor with single marital status
        OrderActor::create([
            'document_id' => $document->id,
            'actor_type_id' => $this->penjualType->id,
            'data' => [
                'name' => 'Test Penjual',
                'marital_status' => 'single',
            ],
            'sort_order' => 1,
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson("/api/v1/admin/documents/{$document->id}");

        $response->assertStatus(200);

        $completeness = $response->json('completeness');
        $this->assertArrayHasKey('items', $completeness);
        $this->assertArrayHasKey('total_required', $completeness);
        $this->assertArrayHasKey('total_uploaded', $completeness);

        // For single status, should require ktp and kk
        $items = $completeness['items'];
        $penjualItems = array_filter($items, fn($item) => $item['group'] === 'Penjual');
        $penjualItems = array_values($penjualItems);

        $requiredKeys = array_map(fn($item) => $item['key'], array_filter($penjualItems, fn($item) => $item['required']));
        $this->assertContains('ktp', $requiredKeys);
        $this->assertContains('kk', $requiredKeys);
    }

    public function test_completeness_with_marital_status_married(): void
    {
        $client = Client::create([
            'name' => 'Test Client',
            'source' => 'umum',
            'source_detail' => ['name' => 'Test Source'],
        ]);

        $document = Document::create([
            'doc_number' => 'DOC/2026/09/0001',
            'type_id' => $this->ajbType->id,
            'client_id' => $client->id,
            'title' => 'Test Order',
            'status' => 'draft',
            'current_stage' => 1,
            'priority' => 'normal',
            'tracking_code' => 'ABC123',
            'created_by' => $this->adminUser->id,
        ]);

        // Create actor with married marital status
        OrderActor::create([
            'document_id' => $document->id,
            'actor_type_id' => $this->penjualType->id,
            'data' => [
                'name' => 'Test Penjual',
                'marital_status' => 'married',
            ],
            'sort_order' => 1,
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson("/api/v1/admin/documents/{$document->id}");

        $response->assertStatus(200);

        $completeness = $response->json('completeness');
        $items = $completeness['items'];
        $penjualItems = array_filter($items, fn($item) => $item['group'] === 'Penjual');
        $penjualItems = array_values($penjualItems);

        // For married status, should require ktp, kk, marriage-certificate, ktp_pasangan
        $requiredKeys = array_map(fn($item) => $item['key'], array_filter($penjualItems, fn($item) => $item['required']));
        $this->assertContains('ktp', $requiredKeys);
        $this->assertContains('kk', $requiredKeys);
        $this->assertContains('marriage-certificate', $requiredKeys);
        $this->assertContains('ktp_pasangan', $requiredKeys);
    }

    public function test_completeness_with_actor_kind_pt(): void
    {
        // Create PT document catalogs + requirements (pt_docs kini dari tabel pt_document_requirements)
        $ptCatalogs = [
            ['akta-pendirian', 'Akta Pendirian', 'legal'],
            ['akta-perubahan', 'Akta Perubahan', 'legal'],
            ['company-sk', 'SK Kemenkumham', 'legal'],
            ['npwp-pt', 'NPWP PT', 'identity'],
        ];
        foreach ($ptCatalogs as $sort => [$key, $label, $category]) {
            $catalog = DocumentCatalog::firstOrCreate(['key' => $key], ['label' => $label, 'category' => $category]);
            PtDocumentRequirement::create([
                'document_catalog_id' => $catalog->id,
                'is_required' => true,
                'sort_order' => $sort + 1,
            ]);
        }

        $client = Client::create([
            'name' => 'Test Client',
            'source' => 'umum',
            'source_detail' => ['name' => 'Test Source'],
        ]);

        $document = Document::create([
            'doc_number' => 'DOC/2026/09/0001',
            'type_id' => $this->ajbType->id,
            'client_id' => $client->id,
            'title' => 'Test Order',
            'status' => 'draft',
            'current_stage' => 1,
            'priority' => 'normal',
            'tracking_code' => 'ABC123',
            'created_by' => $this->adminUser->id,
        ]);

        // Create actor with PT kind
        OrderActor::create([
            'document_id' => $document->id,
            'actor_type_id' => $this->penjualType->id,
            'data' => [
                'actor_kind' => 'pt',
                'company_name' => 'PT Test Company',
                'company_id' => '1234567890',
            ],
            'sort_order' => 1,
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson("/api/v1/admin/documents/{$document->id}");

        $response->assertStatus(200);

        $completeness = $response->json('completeness');
        $items = $completeness['items'];
        $penjualItems = array_filter($items, fn($item) => $item['group'] === 'Penjual');
        $penjualItems = array_values($penjualItems);

        // For PT, should require akta-pendirian, akta-perubahan, company-sk, npwp-pt
        $requiredKeys = array_map(fn($item) => $item['key'], array_filter($penjualItems, fn($item) => $item['required']));
        $this->assertContains('akta-pendirian', $requiredKeys);
        $this->assertContains('akta-perubahan', $requiredKeys);
        $this->assertContains('company-sk', $requiredKeys);
        $this->assertContains('npwp-pt', $requiredKeys);
    }

    public function test_completeness_deduplicates_documents(): void
    {
        $client = Client::create([
            'name' => 'Test Client',
            'source' => 'umum',
            'source_detail' => ['name' => 'Test Source'],
        ]);

        $document = Document::create([
            'doc_number' => 'DOC/2026/09/0001',
            'type_id' => $this->ajbType->id,
            'client_id' => $client->id,
            'title' => 'Test Order',
            'status' => 'draft',
            'current_stage' => 1,
            'priority' => 'normal',
            'tracking_code' => 'ABC123',
            'created_by' => $this->adminUser->id,
        ]);

        // Template has ktp as required base doc for penjual.
        // Marital mapping for 'married' also includes ktp.
        // Completeness should NOT list ktp twice for the same actor group.
        OrderActor::create([
            'document_id' => $document->id,
            'actor_type_id' => $this->penjualType->id,
            'data' => [
                'name' => 'Test Penjual',
                'marital_status' => 'married',
            ],
            'sort_order' => 1,
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson("/api/v1/admin/documents/{$document->id}");

        $response->assertStatus(200);

        $completeness = $response->json('completeness');
        $items = $completeness['items'];
        $penjualItems = array_filter($items, fn($item) => $item['group'] === 'Penjual');
        $penjualItems = array_values($penjualItems);

        // Count how many times 'ktp' appears
        $ktpCount = count(array_filter($penjualItems, fn($item) => $item['key'] === 'ktp'));
        $this->assertEquals(1, $ktpCount, 'KTP should appear exactly once per actor group (dedup)');
    }

    public function test_document_show_eager_loads_client_members(): void
    {
        $client = Client::create([
            'name' => 'Test Client',
            'source' => 'umum',
            'source_detail' => ['name' => 'Test Source'],
        ]);

        ClientMember::create([
            'client_id' => $client->id,
            'name' => 'Budi Santoso',
            'nik' => '1234567890123456',
        ]);

        $document = Document::create([
            'doc_number' => 'DOC/2026/09/0001',
            'type_id' => $this->ajbType->id,
            'client_id' => $client->id,
            'title' => 'Test Order',
            'status' => 'draft',
            'current_stage' => 1,
            'priority' => 'normal',
            'tracking_code' => 'ABC123',
            'created_by' => $this->adminUser->id,
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson("/api/v1/admin/documents/{$document->id}");

        $response->assertStatus(200);

        // client.name accessor should return the primary member's name
        $clientData = $response->json('document.client');
        $this->assertEquals('Budi Santoso', $clientData['name']);
        $this->assertEquals('1234567890123456', $clientData['nik']);
    }
}
