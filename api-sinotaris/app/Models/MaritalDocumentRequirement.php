<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MaritalDocumentRequirement extends Model
{
    protected $fillable = [
        'marital_status',
        'document_catalog_id',
        'is_required',
        'sort_order',
    ];

    public function documentCatalog()
    {
        return $this->belongsTo(DocumentCatalog::class);
    }
}
