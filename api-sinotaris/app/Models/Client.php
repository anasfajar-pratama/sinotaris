<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Client extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'source',
        'source_detail',
        'status',
        'nik',
        'name',
        'phone',
        'email',
        'address',
        'npwp',
        'birth_date',
        'gender',
        'notes',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'source_detail' => 'array',
    ];

    protected $appends = ['name', 'nik', 'phone', 'email'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function members()
    {
        return $this->hasMany(ClientMember::class);
    }

    public function documents()
    {
        return $this->hasMany(Document::class);
    }

    public function clientDocuments()
    {
        return $this->hasMany(ClientDocument::class);
    }

    public function getPrimaryMemberAttribute()
    {
        return $this->members()->oldest()->first();
    }

    public function getNameAttribute()
    {
        if ($this->relationLoaded('members') && $this->members->isNotEmpty()) {
            return $this->members->first()->name;
        }
        return $this->attributes['name'] ?? null;
    }

    public function getNikAttribute()
    {
        if ($this->relationLoaded('members') && $this->members->isNotEmpty()) {
            return $this->members->first()->nik;
        }
        return $this->attributes['nik'] ?? null;
    }

    public function getPhoneAttribute()
    {
        if ($this->relationLoaded('members') && $this->members->isNotEmpty()) {
            return $this->members->first()->phone;
        }
        return $this->attributes['phone'] ?? null;
    }

    public function getEmailAttribute()
    {
        if ($this->relationLoaded('members') && $this->members->isNotEmpty()) {
            return $this->members->first()->email;
        }
        return $this->attributes['email'] ?? null;
    }

    public function getActiveDocumentsCountAttribute(): int
    {
        return $this->documents()->whereIn('status', ['draft', 'in_progress', 'review'])->count();
    }

    public function getCompletedDocumentsCountAttribute(): int
    {
        return $this->documents()->where('status', 'completed')->count();
    }
}
