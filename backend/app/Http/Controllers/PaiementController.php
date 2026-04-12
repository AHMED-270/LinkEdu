<?php

namespace App\Http\Controllers;

use App\Models\Classe;
use App\Models\Etudiant;
use App\Models\Paiement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PaiementController extends Controller
{
    private const SCHOOL_MONTHS = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6];

    private const MONTH_NAMES = [
        9 => 'Septembre',
        10 => 'Octobre',
        11 => 'Novembre',
        12 => 'Decembre',
        1 => 'Janvier',
        2 => 'Fevrier',
        3 => 'Mars',
        4 => 'Avril',
        5 => 'Mai',
        6 => 'Juin',
    ];

    public function index(Request $request): JsonResponse
    {
        $annee = (int) $request->query('annee', $this->defaultAcademicYear());
        $classId = $request->query('id_classe');
        $search = trim((string) $request->query('q', ''));

        $studentsQuery = Etudiant::query()
            ->with(['user:id,nom,prenom,email', 'classe:id_classe,nom,niveau'])
            ->join('users', 'etudiants.id_etudiant', '=', 'users.id')
            ->select('etudiants.*')
            ->orderBy('users.nom')
            ->orderBy('users.prenom');

        if ($classId && $classId !== 'all') {
            $studentsQuery->where('etudiants.id_classe', (int) $classId);
        }

        if ($search !== '') {
            $studentsQuery->where(function ($query) use ($search) {
                $query->whereHas('user', function ($inner) use ($search) {
                    $inner->where('nom', 'like', "%{$search}%")
                        ->orWhere('prenom', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                })->orWhere('etudiants.matricule', 'like', "%{$search}%");
            });
        }

        $students = $studentsQuery->get();
        $studentIds = $students->pluck('id_etudiant');

        $payments = Paiement::query()
            ->whereIn('id_etudiant', $studentIds)
            ->where('annee', $annee)
            ->whereIn('mois', self::SCHOOL_MONTHS)
            ->get()
            ->groupBy('id_etudiant');

        $rows = $students->map(function (Etudiant $student) use ($payments) {
            $byMonth = $payments
                ->get($student->id_etudiant, collect())
                ->keyBy('mois');

            $monthlyPayments = [];
            foreach (self::SCHOOL_MONTHS as $month) {
                $payment = $byMonth->get($month);
                $monthlyPayments[(string) $month] = $payment ? $this->serializePayment($payment) : null;
            }

            return [
                'id_etudiant' => $student->id_etudiant,
                'nom' => $student->user->nom ?? '',
                'prenom' => $student->user->prenom ?? '',
                'email' => $student->user->email ?? '',
                'matricule' => $student->matricule,
                'id_classe' => $student->id_classe,
                'classe_nom' => $student->classe->nom ?? null,
                'classe_niveau' => $student->classe->niveau ?? null,
                'classe' => $student->classe
                    ? trim(($student->classe->nom ?? '') . ' - ' . ($student->classe->niveau ?? ''))
                    : null,
                'paiements' => $monthlyPayments,
            ];
        });

        $classes = Classe::query()
            ->orderBy('niveau')
            ->orderBy('nom')
            ->get(['id_classe', 'nom', 'niveau', 'pricing'])
            ->map(function ($classe) {
                return [
                    'id_classe' => $classe->id_classe,
                    'nom' => $classe->nom,
                    'niveau' => $classe->niveau,
                    'pricing' => $classe->pricing,
                    'label' => trim($classe->nom . ' - ' . $classe->niveau),
                ];
            });

        return response()->json([
            'annee' => $annee,
            'months' => $this->monthsPayload(),
            'classes' => $classes,
            'students' => $rows,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id_etudiant' => ['required', 'integer', 'exists:etudiants,id_etudiant'],
            'mois' => ['nullable', 'integer', Rule::in(self::SCHOOL_MONTHS)],
            'annee' => ['required', 'integer', 'min:2000', 'max:2100'],
            'montant' => ['required', 'numeric', 'min:0.01'],
            'reste' => ['nullable', 'numeric', 'min:0'],
            'type' => ['required', 'in:mensuel,annuel'],
            'date_paiement' => ['nullable', 'date'],
        ]);

        $type = $validated['type'];
        $amount = (float) ($validated['montant'] ?? 0);
        $remaining = (float) ($validated['reste'] ?? 0);

        if ($type === 'annuel') {
            $monthlyAmount = $amount / count(self::SCHOOL_MONTHS);
            $monthlyReste = $remaining / count(self::SCHOOL_MONTHS);
            $payments = DB::transaction(function () use ($validated, $monthlyAmount, $monthlyReste) {
                $result = [];
                foreach (self::SCHOOL_MONTHS as $month) {
                    $payment = Paiement::updateOrCreate(
                        [
                            'id_etudiant' => $validated['id_etudiant'],
                            'mois' => $month,
                            'annee' => $validated['annee'],
                        ],
                        [
                            'montant' => $monthlyAmount,
                            'reste' => $monthlyReste,
                            'type' => 'annuel',
                            'statut' => 'paye',
                            'date_paiement' => $validated['date_paiement'] ?? now()->toDateString(),
                        ]
                    );

                    $result[] = $this->serializePayment($payment);
                }

                return $result;
            });

            return response()->json([
                'message' => 'Paiement annuel enregistre. Tous les mois sont marques comme payes.',
                'paiements' => $payments,
            ], 201);
        }

        if (! isset($validated['mois'])) {
            return response()->json([
                'message' => 'Le mois est obligatoire pour un paiement mensuel.',
            ], 422);
        }

        $status = 'paye';

        $payment = Paiement::updateOrCreate(
            [
                'id_etudiant' => $validated['id_etudiant'],
                'mois' => (int) $validated['mois'],
                'annee' => $validated['annee'],
            ],
            [
                'montant' => $amount,
                'reste' => $remaining,
                'type' => 'mensuel',
                'statut' => $status,
                'date_paiement' => $status === 'paye'
                    ? ($validated['date_paiement'] ?? now()->toDateString())
                    : null,
            ]
        );

        return response()->json([
            'message' => 'Paiement enregistre avec succes.',
            'paiement' => $this->serializePayment($payment),
        ], $payment->wasRecentlyCreated ? 201 : 200);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $payment = Paiement::findOrFail($id);

        $validated = $request->validate([
            'mois' => ['nullable', 'integer', Rule::in(self::SCHOOL_MONTHS)],
            'annee' => ['nullable', 'integer', 'min:2000', 'max:2100'],
            'montant' => ['required', 'numeric', 'min:0.01'],
            'reste' => ['nullable', 'numeric', 'min:0'],
            'type' => ['nullable', 'in:mensuel,annuel'],
            'date_paiement' => ['nullable', 'date'],
        ]);

        $type = $validated['type'] ?? $payment->type;
        $year = (int) ($validated['annee'] ?? $payment->annee);

        if ($type === 'annuel') {
            $amount = (float) ($validated['montant'] ?? $payment->montant);
            $remaining = (float) ($validated['reste'] ?? 0);
            $monthlyAmount = $amount / count(self::SCHOOL_MONTHS);
            $monthlyReste = $remaining / count(self::SCHOOL_MONTHS);

            $payments = DB::transaction(function () use ($payment, $year, $monthlyAmount, $monthlyReste, $validated) {
                $result = [];

                foreach (self::SCHOOL_MONTHS as $month) {
                    $entry = Paiement::updateOrCreate(
                        [
                            'id_etudiant' => $payment->id_etudiant,
                            'mois' => $month,
                            'annee' => $year,
                        ],
                        [
                            'montant' => $monthlyAmount,
                            'reste' => $monthlyReste,
                            'type' => 'annuel',
                            'statut' => 'paye',
                            'date_paiement' => $validated['date_paiement'] ?? now()->toDateString(),
                        ]
                    );

                    $result[] = $this->serializePayment($entry);
                }

                return $result;
            });

            return response()->json([
                'message' => 'Paiement annuel applique avec succes.',
                'paiements' => $payments,
            ]);
        }

        if (array_key_exists('mois', $validated) && $validated['mois'] !== null) {
            $payment->mois = (int) $validated['mois'];
        }

        if (array_key_exists('annee', $validated) && $validated['annee'] !== null) {
            $payment->annee = (int) $validated['annee'];
        }

        if (array_key_exists('montant', $validated) && $validated['montant'] !== null) {
            $payment->montant = (float) $validated['montant'];
        }

        if (array_key_exists('reste', $validated) && $validated['reste'] !== null) {
            $payment->reste = (float) $validated['reste'];
        }

        if (array_key_exists('type', $validated) && $validated['type'] !== null) {
            $payment->type = $validated['type'];
        }

        $payment->statut = 'paye';
        if (! array_key_exists('date_paiement', $validated)) {
            $payment->date_paiement = now()->toDateString();
        }

        if (array_key_exists('date_paiement', $validated)) {
            $payment->date_paiement = $validated['date_paiement'];
        }

        $payment->save();

        return response()->json([
            'message' => 'Paiement mis a jour avec succes.',
            'paiement' => $this->serializePayment($payment),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $payment = Paiement::findOrFail($id);
        $payment->delete();

        return response()->json([
            'message' => 'Paiement supprime avec succes.',
        ]);
    }

    public function togglePaid(int $id): JsonResponse
    {
        $payment = Paiement::findOrFail($id);
        $isPaid = $payment->statut === 'paye';

        $payment->update([
            'statut' => $isPaid ? 'non_paye' : 'paye',
            'date_paiement' => $isPaid ? null : now()->toDateString(),
        ]);

        return response()->json([
            'message' => $isPaid ? 'Paiement marque comme non paye.' : 'Paiement marque comme paye.',
            'paiement' => $this->serializePayment($payment->fresh()),
        ]);
    }

    private function defaultAcademicYear(): int
    {
        $now = now();

        return $now->month >= 9
            ? $now->year
            : $now->year - 1;
    }

    private function monthsPayload(): array
    {
        $labels = [
            9 => 'Sep',
            10 => 'Oct',
            11 => 'Nov',
            12 => 'Dec',
            1 => 'Jan',
            2 => 'Fev',
            3 => 'Mar',
            4 => 'Avr',
            5 => 'Mai',
            6 => 'Juin',
        ];

        return array_map(function (int $month) use ($labels) {
            return [
                'value' => $month,
                'label' => $labels[$month] ?? (string) $month,
                'name' => self::MONTH_NAMES[$month] ?? (string) $month,
            ];
        }, self::SCHOOL_MONTHS);
    }

    private function serializePayment(Paiement $payment): array
    {
        return [
            'id_paiement' => $payment->id_paiement,
            'id_etudiant' => $payment->id_etudiant,
            'mois' => (int) $payment->mois,
            'annee' => (int) $payment->annee,
            'montant' => (float) $payment->montant,
            'reste' => (float) ($payment->reste ?? 0),
            'type' => $payment->type,
            'statut' => $payment->statut,
            'date_paiement' => $payment->date_paiement?->toDateString(),
            'month_name' => self::MONTH_NAMES[(int) $payment->mois] ?? (string) $payment->mois,
        ];
    }
}
