-- LinkEdu Student Payment Management Schema (MySQL)

CREATE TABLE IF NOT EXISTS paiements (
    id_paiement BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_etudiant BIGINT UNSIGNED NOT NULL,
    mois TINYINT UNSIGNED NOT NULL,
    annee INT UNSIGNED NOT NULL,
    montant DECIMAL(10,2) NOT NULL DEFAULT 0,
    type ENUM('mensuel', 'annuel') NOT NULL DEFAULT 'mensuel',
    statut ENUM('paye', 'non_paye') NOT NULL DEFAULT 'non_paye',
    date_paiement DATE NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT fk_paiements_etudiant
        FOREIGN KEY (id_etudiant)
        REFERENCES etudiants(id_etudiant)
        ON DELETE CASCADE,
    CONSTRAINT uq_paiements_student_month_year
        UNIQUE (id_etudiant, mois, annee)
);

ALTER TABLE reclamations
    ADD COLUMN IF NOT EXISTS id_etudiant BIGINT UNSIGNED NULL AFTER id_parent,
    ADD COLUMN IF NOT EXISTS date_envoi DATETIME NULL AFTER date_soumission,
    ADD CONSTRAINT fk_reclamations_etudiant
        FOREIGN KEY (id_etudiant)
        REFERENCES etudiants(id_etudiant)
        ON DELETE SET NULL;
