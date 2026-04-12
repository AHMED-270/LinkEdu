<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ProfesseurController extends Controller
{
    public function getEmploiDuTemps(Request $request)
    {
        return response()->json([
            'lundi' => [
                [ 'time' => '08:00', 'subject' => 'Physique Chimie', 'class' => '2BAC-G1', 'room' => 'Salle A12', 'empty' => false ],
                [ 'time' => '09:30', 'subject' => 'Mathématiques', 'class' => '1BAC-G3', 'room' => 'Salle B04', 'empty' => false ],
                [ 'time' => '11:00', 'empty' => true ],
                [ 'time' => '14:00', 'subject' => 'SVT', 'class' => 'TCS-G2', 'room' => 'Labo 2', 'empty' => false ]
            ]
        ]);
    }
}

