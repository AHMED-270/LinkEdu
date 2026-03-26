<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reclamation extends Model
{
    use HasFactory;

    protected $table = 'reclamations';
    protected $primaryKey = 'id_reclamation';

    protected $fillable = [
        'sujet',
        'message',
        'date_soumission',
        'statut',
        'id_parent',
    ];

    protected $casts = [
        'date_soumission' => 'datetime',
    ];

    public function parentEleve(): BelongsTo
    {
        return $this->belongsTo(ParentEleve::class, 'id_parent', 'id_parent');
    }
}
