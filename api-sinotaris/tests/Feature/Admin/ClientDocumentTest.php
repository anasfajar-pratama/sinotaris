<?php

namespace Tests\Feature\Admin;

use App\Models\Client;
use App\Models\ClientDocument;
use App\Models\ClientMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ClientDocumentTest extends TestCase
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

        Storage::fake('public');
    }

    private function makeClient(): Client
    {
        return Client::create([
            'source' => 'umum',
            'source_detail' => ['name' => 'Test Source', 'phone' => '08123456789'],
        ]);
    }

    private function makeMember(Client $client, string $name = 'Budi Santoso', string $marital = 'single'): ClientMember
    {
        return ClientMember::create([
            'client_id' => $client->id,
            'name' => $name,
            'nik' => '1234567890123456',
            'marital_status' => $marital,
        ]);
    }

    private function makeDocument(Client $client, ?ClientMember $member, string $docType, string $path): ClientDocument
    {
        Storage::disk('public')->put($path, 'dummy content');

        return ClientDocument::create([
            'client_id' => $client->id,
            'client_member_id' => $member?->id,
            'doc_type' => $docType,
            'filename' => basename($path),
            'original_name' => basename($path),
            'path' => $path,
            'size' => 13,
            'uploaded_by' => $this->adminUser->id,
        ]);
    }

    // ========== P1 #6: upload dokumen duplikat → replace ==========

    public function test_upload_document_replaces_existing_document_of_same_type(): void
    {
        $client = $this->makeClient();
        $member = $this->makeMember($client);

        // Upload pertama
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/v1/admin/clients/{$client->id}/documents", [
                'file' => UploadedFile::fake()->create('ktp.pdf', 100, 'application/pdf'),
                'doc_type' => 'ktp_nasabah',
                'client_member_id' => $member->id,
            ]);

        $response->assertStatus(201);
        $firstPath = $response->json('document.path');
        Storage::disk('public')->assertExists($firstPath);

        // Upload kedua dengan doc_type + member sama → replace
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/v1/admin/clients/{$client->id}/documents", [
                'file' => UploadedFile::fake()->create('ktp-baru.pdf', 100, 'application/pdf'),
                'doc_type' => 'ktp_nasabah',
                'client_member_id' => $member->id,
            ]);

        $response->assertStatus(201);
        $secondPath = $response->json('document.path');

        // Hanya 1 baris untuk (client, member, doc_type)
        $this->assertEquals(1, ClientDocument::where('client_id', $client->id)
            ->where('client_member_id', $member->id)
            ->where('doc_type', 'ktp_nasabah')
            ->count());

        // File lama dihapus, file baru ada
        Storage::disk('public')->assertMissing($firstPath);
        Storage::disk('public')->assertExists($secondPath);
    }

    public function test_upload_document_lainnya_allows_multiple_documents(): void
    {
        $client = $this->makeClient();
        $member = $this->makeMember($client);

        foreach (['Akta Cerai', 'Surat Kuasa'] as $label) {
            $this->actingAs($this->adminUser, 'sanctum')
                ->postJson("/api/v1/admin/clients/{$client->id}/documents", [
                    'file' => UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf'),
                    'doc_type' => 'lainnya',
                    'client_member_id' => $member->id,
                    'label' => $label,
                ])
                ->assertStatus(201);
        }

        $this->assertEquals(2, ClientDocument::where('client_id', $client->id)
            ->where('doc_type', 'lainnya')
            ->count());
    }

    public function test_upload_document_same_type_different_member_does_not_replace(): void
    {
        $client = $this->makeClient();
        $member1 = $this->makeMember($client, 'Budi Santoso');
        $member2 = $this->makeMember($client, 'Siti Rahayu');

        $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/v1/admin/clients/{$client->id}/documents", [
                'file' => UploadedFile::fake()->create('ktp1.pdf', 100, 'application/pdf'),
                'doc_type' => 'ktp_nasabah',
                'client_member_id' => $member1->id,
            ])->assertStatus(201);

        $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/v1/admin/clients/{$client->id}/documents", [
                'file' => UploadedFile::fake()->create('ktp2.pdf', 100, 'application/pdf'),
                'doc_type' => 'ktp_nasabah',
                'client_member_id' => $member2->id,
            ])->assertStatus(201);

        $this->assertEquals(2, ClientDocument::where('client_id', $client->id)
            ->where('doc_type', 'ktp_nasabah')
            ->count());
    }

    // ========== P1 #5: cascade delete dokumen saat member dihapus ==========

    public function test_update_members_deleting_member_cascades_its_documents(): void
    {
        $client = $this->makeClient();
        $member1 = $this->makeMember($client, 'Budi Santoso');
        $member2 = $this->makeMember($client, 'Siti Rahayu');

        $doc1 = $this->makeDocument($client, $member1, 'ktp_nasabah', "clients/{$client->id}/documents/ktp-budi.pdf");
        $doc2 = $this->makeDocument($client, $member2, 'ktp_nasabah', "clients/{$client->id}/documents/ktp-siti.pdf");

        // Simpan hanya member1 → member2 dihapus
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->putJson("/api/v1/admin/clients/{$client->id}/members", [
                'members' => [
                    ['id' => $member1->id, 'name' => 'Budi Santoso', 'marital_status' => 'single'],
                ],
            ]);

        $response->assertStatus(200);

        // Member2 soft-deleted
        $this->assertSoftDeleted('client_members', ['id' => $member2->id]);

        // Dokumen member2 ikut terhapus (row + file fisik)
        $this->assertDatabaseMissing('client_documents', ['id' => $doc2->id]);
        Storage::disk('public')->assertMissing($doc2->path);

        // Dokumen member1 tetap utuh
        $this->assertDatabaseHas('client_documents', ['id' => $doc1->id]);
        Storage::disk('public')->assertExists($doc1->path);
    }

    public function test_update_members_keeps_documents_of_retained_members(): void
    {
        $client = $this->makeClient();
        $member = $this->makeMember($client);
        $doc = $this->makeDocument($client, $member, 'kk', "clients/{$client->id}/documents/kk.pdf");

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->putJson("/api/v1/admin/clients/{$client->id}/members", [
                'members' => [
                    ['id' => $member->id, 'name' => 'Budi Santoso Diperbarui', 'marital_status' => 'married_foreign'],
                ],
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('client_members', [
            'id' => $member->id,
            'name' => 'Budi Santoso Diperbarui',
            'marital_status' => 'married_foreign',
            'deleted_at' => null,
        ]);
        $this->assertDatabaseHas('client_documents', ['id' => $doc->id]);
        Storage::disk('public')->assertExists($doc->path);
    }

    public function test_update_members_accepts_all_new_marital_statuses(): void
    {
        $client = $this->makeClient();

        $statuses = ['single', 'married', 'married_foreign', 'married_prenup', 'divorced', 'widowed'];
        $members = [];
        foreach ($statuses as $i => $status) {
            $members[] = ['name' => "Nasabah {$i}", 'marital_status' => $status];
        }

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->putJson("/api/v1/admin/clients/{$client->id}/members", ['members' => $members]);

        $response->assertStatus(200);

        foreach ($statuses as $status) {
            $this->assertDatabaseHas('client_members', [
                'client_id' => $client->id,
                'marital_status' => $status,
                'deleted_at' => null,
            ]);
        }
    }

    public function test_update_members_rejects_invalid_marital_status(): void
    {
        $client = $this->makeClient();

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->putJson("/api/v1/admin/clients/{$client->id}/members", [
                'members' => [
                    ['name' => 'Budi', 'marital_status' => 'complicated'],
                ],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['members.0.marital_status']);
    }
}
