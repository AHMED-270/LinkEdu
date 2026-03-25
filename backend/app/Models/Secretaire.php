<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Secretaire extends Model
{
    use HasFactory;

    protected $table = 'secretaires';
    protected $primaryKey = 'id_secretaire';
    public $incrementing = false;
    protected $keyType = 'int';

    protected $fillable = [
        'id_secretaire',
        'departement',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_secretaire', 'id');
    }
}
