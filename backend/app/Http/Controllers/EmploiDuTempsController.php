<?php

namespace App\Http\Controllers;

use App\Models\EmploiDuTemps;
use Illuminate\Http\Request;

class EmploiDuTempsController extends Controller
{
    public function lookups()
    {
        return response()->json([
            'classes' => \App\Models\Classe::all(),
            'matieres' => \App\Models\Matiere::all(),
            'professeurs' => \App\Models\Professeur::with('user')->get(),
        ]);
    }

    public function index()
    {
        $emplois = EmploiDuTemps::with(['classe', 'matiere', 'professeur'])->get();
        return response()->json($emplois);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'jour' => 'required|string|max:50',
            'heure_debut' => 'required',
            'heure_fin' => 'required',
            'salle' => 'nullable|string|max:50',
            'couleur' => 'nullable|string|max:20',
            'statut' => 'nullable|string|max:50',
            'id_classe' => 'required|integer|exists:classes,id_classe',
            'id_matiere' => 'required|integer|exists:matieres,id_matiere',
            'id_professeur' => 'required|integer|exists:professeurs,id_professeur',
        ]);

        $emploi = EmploiDuTemps::create($validated);
        return response()->json($emploi->load(['classe', 'matiere', 'professeur']), 201);
    }

    public function update(Request $request, $id)
    {
        $emploi = EmploiDuTemps::findOrFail($id);
        
        $validated = $request->validate([
            'jour' => 'required|string|max:50',
            'heure_debut' => 'required', 
            'heure_fin' => 'required',
            'salle' => 'nullable|string|max:50',
            'couleur' => 'nullable|string|max:20',
            'statut' => 'nullable|string|max:50',
            'id_classe' => 'required|integer|exists:classes,id_classe',
            'id_matiere' => 'required|integer|exists:matieres,id_matiere',
            'id_professeur' => 'required|integer|exists:professeurs,id_professeur',
        ]);

        $emploi->update($validated);
        return response()->json($emploi->load(['classe', 'matiere', 'professeur']));
    }

    public function destroy($id)
    {
        EmploiDuTemps::destroy($id);
        return response()->json(null, 204);
    }
}