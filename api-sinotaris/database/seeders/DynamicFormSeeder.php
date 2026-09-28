<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ActorType;
use App\Models\AssetType;
use App\Models\DocumentCatalog;
use App\Models\DocumentType;
use App\Models\DocumentTypeActor;
use App\Models\DocumentTypeActorField;
use App\Models\DocumentTypeActorDocument;
use App\Models\DocumentTypeAsset;
use App\Models\DocumentTypeStage;
use App\Models\MaritalDocumentRequirement;
use App\Models\ProfileField;
use App\Models\PtDocumentRequirement;

class DynamicFormSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedProfileFields();
        $this->seedDocumentCatalogs();
        $this->seedDocumentTypes();
        $this->seedMaritalDocumentRequirements();
        $this->seedPtDocumentRequirements();
    }

    private function seedProfileFields(): void
    {
        $newFields = [
            ['gender', 'Jenis Kelamin', 'select', [
                ['value' => 'male', 'label' => 'Laki-laki'],
                ['value' => 'female', 'label' => 'Perempuan'],
            ]],
        ];

        foreach ($newFields as [$key, $label, $type, $options]) {
            ProfileField::updateOrCreate(
                ['key' => $key],
                ['label' => $label, 'data_type' => $type, 'options' => $options, 'is_active' => true]
            );
        }

        $maritalField = ProfileField::where('key', 'marital_status')->first();
        if ($maritalField) {
            $maritalField->update([
                'options' => [
                    ['value' => 'single', 'label' => 'Belum Menikah'],
                    ['value' => 'married', 'label' => 'Menikah'],
                    ['value' => 'married_foreign', 'label' => 'Menikah dengan WNA'],
                    ['value' => 'married_prenup', 'label' => 'Menikah dengan Perjanjian Pisah Harta'],
                    ['value' => 'divorced', 'label' => 'Cerai Hidup'],
                    ['value' => 'widowed', 'label' => 'Cerai Mati'],
                ],
            ]);
        }
    }

    private function seedDocumentCatalogs(): void
    {
        $newCatalogs = [
            ['pm1', 'Surat Keterangan Belum Menikah (PM1)', 'legal'],
            ['akta-pisah-harta', 'Akta Perjanjian Pisah Harta', 'legal'],
            ['akta-kematian', 'Akta Kematian', 'legal'],
            ['sk-tanpa-persetujuan', 'SK Tidak Memerlukan Persetujuan Pasangan', 'legal'],
            ['akta-perubahan', 'Akta Perubahan Terakhir', 'legal'],
            ['npwp-pt', 'NPWP Perusahaan', 'identity'],
        ];

        foreach ($newCatalogs as [$key, $label, $cat]) {
            DocumentCatalog::firstOrCreate(
                ['key' => $key],
                ['label' => $label, 'category' => $cat, 'is_active' => true]
            );
        }
    }

    private function seedDocumentTypes(): void
    {
        $newTypes = [
            [
                'name' => 'Peningkatan Hak',
                'slug' => 'peningkatan-hak',
                'category' => 'ppat',
                'sla_days' => 14,
                'actors' => ['pemohon'],
                'assets' => ['sertifikat-tanah'],
            ],
            [
                'name' => 'Penggabungan Sertifikat',
                'slug' => 'penggabungan-sertifikat',
                'category' => 'ppat',
                'sla_days' => 14,
                'actors' => ['pemohon'],
                'assets' => ['sertifikat-tanah'],
            ],
        ];

        $defaultStages = [
            'Pembuatan Dokumen',
            'Verifikasi',
            'Proses',
            'Review / Pemeriksaan',
            'Selesai',
        ];

        $defaultFields = ['name', 'nik', 'address', 'phone', 'marital_status', 'spouse_name', 'spouse_nik', 'gender'];
        $defaultDocs = ['ktp', 'npwp'];

        foreach ($newTypes as $typeConfig) {
            $dt = DocumentType::firstOrCreate(
                ['slug' => $typeConfig['slug']],
                [
                    'name' => $typeConfig['name'],
                    'description' => $typeConfig['name'],
                    'category' => $typeConfig['category'],
                    'sla_days' => $typeConfig['sla_days'],
                    'is_active' => true,
                ]
            );

            foreach ($defaultStages as $snum => $stageName) {
                DocumentTypeStage::firstOrCreate(
                    ['document_type_id' => $dt->id, 'stage_number' => $snum + 1],
                    ['stage_name' => $stageName]
                );
            }

            foreach ($typeConfig['actors'] as $sort => $actorKey) {
                $actorId = ActorType::where('key', $actorKey)->value('id');
                if (!$actorId) continue;

                $dta = DocumentTypeActor::firstOrCreate(
                    ['document_type_id' => $dt->id, 'actor_type_id' => $actorId],
                    ['is_required' => true, 'sort_order' => $sort + 1]
                );

                foreach ($defaultFields as $fsort => $fieldKey) {
                    $pf = ProfileField::where('key', $fieldKey)->first();
                    if (!$pf) continue;
                    DocumentTypeActorField::firstOrCreate(
                        ['document_type_id' => $dt->id, 'actor_type_id' => $actorId, 'profile_field_id' => $pf->id],
                        [
                            'document_type_actor_id' => $dta->id,
                            'is_required' => in_array($fieldKey, ['name', 'nik']),
                            'sort_order' => $fsort + 1,
                        ]
                    );
                }

                foreach ($defaultDocs as $dsort => $docKey) {
                    $dc = DocumentCatalog::where('key', $docKey)->first();
                    if (!$dc) continue;
                    DocumentTypeActorDocument::firstOrCreate(
                        ['document_type_id' => $dt->id, 'actor_type_id' => $actorId, 'document_catalog_id' => $dc->id],
                        [
                            'document_type_actor_id' => $dta->id,
                            'is_required' => $docKey === 'ktp',
                            'sort_order' => $dsort + 1,
                        ]
                    );
                }
            }

            foreach ($typeConfig['assets'] ?? [] as $sort => $assetKey) {
                $assetId = AssetType::where('key', $assetKey)->value('id');
                if (!$assetId) continue;
                DocumentTypeAsset::firstOrCreate(
                    ['document_type_id' => $dt->id, 'asset_type_id' => $assetId],
                    ['is_required' => true, 'sort_order' => $sort + 1]
                );
            }
        }
    }

    private function seedMaritalDocumentRequirements(): void
    {
        $mapping = [
            'single' => ['ktp', 'kk', 'pm1'],
            'married' => ['ktp', 'kk', 'marriage-certificate', 'ktp_pasangan'],
            'married_foreign' => ['ktp', 'kk', 'marriage-certificate', 'passport', 'sk-tanpa-persetujuan'],
            'married_prenup' => ['ktp', 'kk', 'marriage-certificate', 'ktp_pasangan', 'akta-pisah-harta'],
            'divorced' => ['ktp', 'kk', 'marriage-certificate', 'akta-cerai'],
            'widowed' => ['ktp', 'kk', 'marriage-certificate', 'ktp_pasangan', 'akta-kematian'],
        ];

        foreach ($mapping as $status => $docKeys) {
            foreach ($docKeys as $sort => $key) {
                $dc = DocumentCatalog::where('key', $key)->first();
                if (!$dc) continue;
                MaritalDocumentRequirement::firstOrCreate(
                    ['marital_status' => $status, 'document_catalog_id' => $dc->id],
                    ['is_required' => true, 'sort_order' => $sort + 1]
                );
            }
        }
    }

    private function seedPtDocumentRequirements(): void
    {
        $ptDocs = [
            ['akta-pendirian', 'Akta Pendirian', 'legal'],
            ['akta-perubahan', 'Akta Perubahan Terakhir', 'legal'],
            ['company-sk', 'SK Kemenkumham', 'legal'],
            ['npwp-pt', 'NPWP Perusahaan', 'identity'],
        ];

        foreach ($ptDocs as $sort => [$key, $label, $category]) {
            $dc = DocumentCatalog::firstOrCreate(
                ['key' => $key],
                ['label' => $label, 'category' => $category, 'is_active' => true]
            );

            PtDocumentRequirement::firstOrCreate(
                ['document_catalog_id' => $dc->id],
                ['is_required' => true, 'sort_order' => $sort + 1]
            );
        }
    }
}
