<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Directeur extends Model
{
    use HasFactory;

    protected $table = 'directeurs';
    protected $primaryKey = 'id_directeur';
    public $incrementing = false;
    protected $keyType = 'int';

    protected $fillable = [
        'id_directeur',
        'mandat',
        'telephone',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_directeur', 'id');
    }
}
