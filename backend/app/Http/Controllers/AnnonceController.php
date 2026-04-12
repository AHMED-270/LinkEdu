<?php

namespace App\Http\Controllers;

use App\Models\Annonce;
use Illuminate\Http\Request;

class AnnonceController extends Controller
{
    public function index()
    {
        $annonces = Annonce::orderBy('id_annonce', 'desc')->get();
        return response()->json($annonces);
    }

    public function store(Request $request)
    {
        $request->validate([
            'titre' => 'required|string|max:255',
            'contenu' => 'required|string',
            'type' => 'required|string',
            'auteur' => 'required|string',
        ]);

        $annonce = Annonce::create([
            'titre' => $request->titre,
            'contenu' => $request->contenu,
            'type' => $request->type,
            'auteur' => $request->auteur,
            'date_publication' => now(),
        ]);

        return response()->json($annonce, 201);
    }

    public function update(Request $request, $id)
    {
        $annonce = Annonce::findOrFail($id);
        
        $request->validate([
            'titre' => 'required|string|max:255',
            'contenu' => 'required|string',
            'type' => 'required|string',
            'auteur' => 'required|string',
        ]);

        $annonce->update([
            'titre' => $request->titre,
            'contenu' => $request->contenu,
            'type' => $request->type,
            'auteur' => $request->auteur,
        ]);

        return response()->json($annonce);
    }

    public function destroy($id)
    {
        $annonce = Annonce::findOrFail($id);
        $annonce->delete();
        return response()->json(['message' => 'Annonce supprimée']);
    }
}
