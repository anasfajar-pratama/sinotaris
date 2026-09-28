<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClientDocument extends Model
{
    protected $fillable = [
        'client_id',
        'client_member_id',
        'doc_type',
        'label',
        'filename',
        'original_name',
        'path',
        'size',
        'uploaded_by',
    ];

    protected $appends = ['url'];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function member()
    {
        return $this->belongsTo(ClientMember::class, 'client_member_id');
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function getUrlAttribute(): string
    {
        return asset('storage/' . $this->path);
    }
}
