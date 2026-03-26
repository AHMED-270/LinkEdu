<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminEcole extends Model
{
    use HasFactory;

    protected $table = 'admin_ecoles';
    protected $primaryKey = 'id_admin';
    public $incrementing = false;
    protected $keyType = 'int';

    protected $fillable = [
        'id_admin',
        'permissions',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_admin', 'id');
    }
}
