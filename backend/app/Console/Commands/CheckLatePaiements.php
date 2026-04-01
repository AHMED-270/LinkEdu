<?php

namespace App\Console\Commands;

use App\Models\Etudiant;
use App\Models\Paiement;
use App\Models\Reclamation;
use Illuminate\Console\Command;

class CheckLatePaiements extends Command
{
    private const SCHOOL_MONTHS = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6];

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'paiements:check-retards {--annee=}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Cree automatiquement des reclamations pour les paiements en retard apres le 6 du mois.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $today = now();
        $currentMonth = (int) $today->month;

        if (! in_array($currentMonth, self::SCHOOL_MONTHS, true)) {
            $this->info('Mois hors periode scolaire. Aucun controle effectue.');
            return self::SUCCESS;
        }

        if ((int) $today->day <= 6) {
            $this->info('Le controle des retards se declenche apres le 6 du mois.');
            return self::SUCCESS;
        }

        $academicYear = $this->option('annee')
            ? (int) $this->option('annee')
            : $this->resolveAcademicYear($today);

        $paidStudentIds = Paiement::query()
            ->where('annee', $academicYear)
            ->where('mois', $currentMonth)
            ->where('statut', 'paye')
            ->pluck('id_etudiant')
            ->all();

        $studentsQuery = Etudiant::query()->whereNotNull('id_parent');

        if (! empty($paidStudentIds)) {
            $studentsQuery->whereNotIn('id_etudiant', $paidStudentIds);
        }

        $studentsToNotify = $studentsQuery->get(['id_etudiant', 'id_parent']);

        $sujet = sprintf(
            'Retard paiement %s %d',
            $this->monthName($currentMonth),
            $academicYear
        );

        $created = 0;
        foreach ($studentsToNotify as $student) {
            $alreadyExists = Reclamation::query()
                ->where('id_etudiant', $student->id_etudiant)
                ->where('sujet', $sujet)
                ->where('message', 'Paiement en retard')
                ->exists();

            if ($alreadyExists) {
                continue;
            }

            Reclamation::create([
                'id_parent' => $student->id_parent,
                'id_etudiant' => $student->id_etudiant,
                'sujet' => $sujet,
                'message' => 'Paiement en retard',
                'statut' => 'en_attente',
                'date_soumission' => now(),
                'date_envoi' => now(),
            ]);

            $created++;
        }

        $this->info("Controle termine. Reclamations creees: {$created}.");

        return self::SUCCESS;
    }

    private function resolveAcademicYear($date): int
    {
        return $date->month >= 9
            ? (int) $date->year
            : (int) $date->year - 1;
    }

    private function monthName(int $month): string
    {
        return match ($month) {
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
            default => (string) $month,
        };
    }
}
