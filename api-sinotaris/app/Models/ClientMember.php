<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ClientMember extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'client_id',
        'name',
        'nik',
        'phone',
        'email',
        'npwp',
        'gender',
        'marital_status',
        'address',
        'birth_date',
        'notes',
    ];

    protected $casts = [
        'birth_date' => 'date',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function clientDocuments()
    {
        return $this->hasMany(ClientDocument::class, 'client_member_id');
    }
}
