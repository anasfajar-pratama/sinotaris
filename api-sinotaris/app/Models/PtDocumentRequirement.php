<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PtDocumentRequirement extends Model
{
    protected $fillable = [
        'document_catalog_id',
        'is_required',
        'sort_order',
    ];

    public function documentCatalog()
    {
        return $this->belongsTo(DocumentCatalog::class);
    }
}
