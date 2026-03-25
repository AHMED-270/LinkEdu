<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ParentEleve extends Model
{
    use HasFactory;

    protected $table = 'parents';
    protected $primaryKey = 'id_parent';
    public $incrementing = false;
    protected $keyType = 'int';

    protected $fillable = [
        'id_parent',
        'telephone',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_parent', 'id');
    }

    public function etudiants(): HasMany
    {
        return $this->hasMany(Etudiant::class, 'id_parent', 'id_parent');
    }

    public function reclamations(): HasMany
    {
        return $this->hasMany(Reclamation::class, 'id_parent', 'id_parent');
    }
}
