<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'nom', 'prenom', 'email', 'password', 'role'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function professeur(): HasOne
    {
        return $this->hasOne(Professeur::class, 'id_professeur');
    }

    public function secretaire(): HasOne
    {
        return $this->hasOne(Secretaire::class, 'id_secretaire');
    }

    public function directeur(): HasOne
    {
        return $this->hasOne(Directeur::class, 'id_directeur');
    }

    public function adminEcole(): HasOne
    {
        return $this->hasOne(AdminEcole::class, 'id_admin');
    }

    public function parentEleve(): HasOne
    {
        return $this->hasOne(ParentEleve::class, 'id_parent');
    }

    public function etudiant(): HasOne
    {
        return $this->hasOne(Etudiant::class, 'id_etudiant');
    }
}
