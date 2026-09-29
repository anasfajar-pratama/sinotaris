<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\DocumentType;

class DocumentTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['name' => 'Akta Jual Beli (AJB)', 'slug' => 'ajb', 'category' => 'ppat', 'description' => 'Akta peralihan hak atas tanah/bangunan melalui jual beli', 'sla_days' => 14],
            ['name' => 'Akta Hibah', 'slug' => 'hibah', 'category' => 'ppat', 'description' => 'Pemindahan hak secara cuma-cuma (hadiah)', 'sla_days' => 14],
            ['name' => 'Akta Waris', 'slug' => 'waris', 'category' => 'notaris', 'description' => 'Pembagian harta warisan sesuai hukum yang berlaku', 'sla_days' => 21],
            ['name' => 'Akta Wasiat', 'slug' => 'wasiat', 'category' => 'notaris', 'description' => 'Surat pernyataan kehendak terakhir seseorang', 'sla_days' => 2],
            ['name' => 'Perjanjian Pranikah', 'slug' => 'pranikah', 'category' => 'notaris', 'description' => 'Perjanjian sebelum pernikahan tentang harta', 'sla_days' => 2],
            ['name' => 'Akta Pendirian PT', 'slug' => 'pendirian-pt', 'category' => 'notaris', 'description' => 'Pendirian badan hukum Perseroan Terbatas', 'sla_days' => 2],
            ['name' => 'Akta PPJB', 'slug' => 'ppjb', 'category' => 'notaris', 'description' => 'Perjanjian Pengikatan Jual Beli', 'sla_days' => 14],
            ['name' => 'Surat Kuasa', 'slug' => 'surat-kuasa', 'category' => 'notaris', 'description' => 'Pemberian kuasa kepada pihak lain', 'sla_days' => 1],
            ['name' => 'Legalisasi Dokumen', 'slug' => 'legalisasi', 'category' => 'notaris', 'description' => 'Pengesahan dokumen oleh notaris', 'sla_days' => 1],
            ['name' => 'Hak Tanggungan', 'slug' => 'hak-tanggungan', 'category' => 'ppat', 'description' => 'Jaminan atas hak atas tanah', 'sla_days' => 10],
            ['name' => 'Peningkatan Hak', 'slug' => 'peningkatan-hak', 'category' => 'ppat', 'description' => 'Peningkatan Hak', 'sla_days' => 14],
            ['name' => 'Penggabungan Sertifikat', 'slug' => 'penggabungan-sertifikat', 'category' => 'ppat', 'description' => 'Penggabungan Sertifikat', 'sla_days' => 14],
        ];

        foreach ($types as $type) {
            $dt = DocumentType::firstOrCreate(['slug' => $type['slug']], $type);
            // Lengkapi kategori pada data lama yang belum punya.
            if (!$dt->category) {
                $dt->update(['category' => $type['category']]);
            }
        }
    }
}
