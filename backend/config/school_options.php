<?php

return [
    'niveaux' => [
        ['code' => 'ms', 'label' => 'Petite Section', 'cycle' => 'maternelle'],
        ['code' => 'mm', 'label' => 'Moyenne Section', 'cycle' => 'maternelle'],
        ['code' => 'gs', 'label' => 'Grande Section', 'cycle' => 'maternelle'],
        ['code' => '1ap', 'label' => '1ere Annee Primaire', 'cycle' => 'primaire'],
        ['code' => '2ap', 'label' => '2eme Annee Primaire', 'cycle' => 'primaire'],
        ['code' => '3ap', 'label' => '3eme Annee Primaire', 'cycle' => 'primaire'],
        ['code' => '4ap', 'label' => '4eme Annee Primaire', 'cycle' => 'primaire'],
        ['code' => '5ap', 'label' => '5eme Annee Primaire', 'cycle' => 'primaire'],
        ['code' => '6ap', 'label' => '6eme Annee Primaire', 'cycle' => 'primaire'],
        ['code' => '1ac', 'label' => '1ere Annee College', 'cycle' => 'college'],
        ['code' => '2ac', 'label' => '2eme Annee College', 'cycle' => 'college'],
        ['code' => '3ac', 'label' => '3eme Annee College', 'cycle' => 'college'],
        ['code' => 'tc', 'label' => 'Tronc Commun', 'cycle' => 'lycee'],
        ['code' => '1bac', 'label' => '1ere Annee Baccalaureat', 'cycle' => 'lycee'],
        ['code' => '2bac', 'label' => '2eme Annee Baccalaureat', 'cycle' => 'lycee'],
    ],

    'filieres_by_niveau' => [
        'ms' => ['General'],
        'mm' => ['General'],
        'gs' => ['General'],
        '1ap' => ['General'],
        '2ap' => ['General'],
        '3ap' => ['General'],
        '4ap' => ['General'],
        '5ap' => ['General'],
        '6ap' => ['General'],
        '1ac' => ['General'],
        '2ac' => ['General'],
        '3ac' => ['General'],
        'tc' => ['TC Scientifique', 'TC Technologique', 'TC Lettres'],
        '1bac' => [
            'Sciences Experimentales',
            'Sciences Mathematiques',
            'Sciences et Technologies',
            'Lettres et Ressources Humaines',
            
            'Economie',
        ],
        '2bac' => [
            'Sciences Experimentales - SVT',
            'Sciences Experimentales - Physique-Chimie',
            'Sciences Mathematiques A',
            'Sciences Mathematiques B',
            'Sciences et Technologies Electrique',
            'Sciences et Technologies Mecanique',
            'Lettres et Sciences Humaines',
            'Sciences Economiques',
        ],
    ],

    'pricing_by_niveau_filiere' => [
        'ms' => ['General' => 900],
        'mm' => ['General' => 950],
        'gs' => ['General' => 1000],
        '1ap' => ['General' => 1200],
        '2ap' => ['General' => 1200],
        '3ap' => ['General' => 1300],
        '4ap' => ['General' => 1300],
        '5ap' => ['General' => 1400],
        '6ap' => ['General' => 1400],
        '1ac' => ['General' => 1600],
        '2ac' => ['General' => 1700],
        '3ac' => ['General' => 1800],
        'tc' => [
            'TC Scientifique' => 2100,
            'TC Technologique' => 2100,
            'TC Lettres' => 1900,
        ],
        '1bac' => [
            'Sciences Experimentales' => 2500,
            'Sciences Mathematiques' => 2600,
            'Sciences et Technologies' => 2450,
            'Lettres et Ressources Humaines' => 2200,
            'Economie' => 2300,
        ],
        '2bac' => [
            'Sciences Experimentales - SVT' => 3000,
            'Sciences Experimentales - Physique-Chimie' => 3000,
            'Sciences Mathematiques A' => 3200,
            'Sciences Mathematiques B' => 3200,
            'Sciences et Technologies Electrique' => 2950,
            'Sciences et Technologies Mecanique' => 2950,
            'Lettres et Sciences Humaines' => 2400,
            'Sciences Economiques' => 2700,
        ],
    ],

    'matieres_by_niveau_filiere' => [
        '1ac' => [
            'General' => [
                'Mathematiques', 'Physique-Chimie', 'Sciences de la Vie et de la Terre (SVT)', 'Francais', 'Arabe',
                'Education Islamique', 'Histoire-Geographie', 'Education Physique', 'Anglais',
            ],
        ],
        '2ac' => [
            'General' => [
                'Mathematiques', 'Physique-Chimie', 'Sciences de la Vie et de la Terre (SVT)', 'Francais', 'Arabe',
                'Education Islamique', 'Histoire-Geographie', 'Education Physique', 'Anglais',
            ],
        ],
        '3ac' => [
            'General' => [
                'Mathematiques', 'Physique-Chimie', 'Sciences de la Vie et de la Terre (SVT)', 'Francais', 'Arabe',
                'Education Islamique', 'Histoire-Geographie', 'Education Physique', 'Anglais',
            ],
        ],
        'tc' => [
            'TC Scientifique' => [
                'Mathematiques', 'Physique-Chimie', 'Sciences de la Vie et de la Terre (SVT)', 'Francais', 'Arabe',
                'Education Islamique', 'Histoire-Geographie', 'Economie Generale et Statistiques', 'Education Physique', 'Anglais',
            ],
            'TC Technologique' => [
                'Mathematiques', 'Physique-Chimie', 'Sciences d Ingenieur', 'Francais', 'Arabe',
                'Education Islamique', 'Histoire-Geographie', 'Economie Generale et Statistiques', 'Education Physique', 'Anglais',
            ],
            'TC Lettres' => [
                'Langue Arabe', 'Francais', 'Anglais', 'Histoire-Geographie', 'Education Islamique', 'Philosophie', 'Economie Generale et Statistiques', 'Education Physique',
            ],
        ],
        '1bac' => [
            'Sciences Experimentales' => [
                'Mathematiques', 'Physique-Chimie', 'Sciences de la Vie et de la Terre (SVT)', 'Francais', 'Arabe',
                'Education Islamique', 'Histoire-Geographie', 'Education Physique', 'Philosophie', 'Anglais',
            ],
            'Sciences Mathematiques' => [
                'Mathematiques', 'Physique-Chimie', 'Sciences d Ingenieur', 'Francais', 'Arabe',
                'Education Islamique', 'Histoire-Geographie', 'Education Physique', 'Philosophie', 'Anglais',
            ],
            'Sciences et Technologies' => [
                'Mathematiques', 'Physique-Chimie', 'Electrotechnique', 'Electronique', 'Sciences d Ingenieur', 'Francais',
                'Arabe', 'Education Islamique', 'Histoire-Geographie', 'Education Physique', 'Anglais',
            ],
            'Lettres et Ressources Humaines' => [
                'Langue Arabe', 'Francais', 'Anglais', 'Philosophie', 'Histoire-Geographie', 'Education Islamique', 'Sociologie', 'Education Physique', 'Management des Ressources Humaines',
            ],
            'Economie' => [
                'Economie Generale et Statistiques', 'Comptabilite Generale', 'Mathematiques', 'Histoire-Geographie', 'Francais',
                'Arabe', 'Education Islamique', 'Anglais', 'Education Physique', 'Philosophie',
            ],
        ],
        '2bac' => [
            'Sciences Experimentales - SVT' => [
                'Mathematiques', 'Physique-Chimie', 'Sciences de la Vie et de la Terre (SVT)', 'Francais', 'Arabe',
                'Education Islamique', 'Histoire-Geographie', 'Education Physique', 'Philosophie', 'Anglais',
            ],
            'Sciences Experimentales - Physique-Chimie' => [
                'Mathematiques', 'Physique-Chimie', 'Sciences de la Vie et de la Terre (SVT)', 'Francais', 'Arabe',
                'Education Islamique', 'Histoire-Geographie', 'Education Physique', 'Philosophie', 'Anglais',
            ],
            'Sciences Mathematiques A' => [
                'Mathematiques', 'Physique-Chimie', 'Sciences d Ingenieur', 'Francais', 'Arabe',
                'Education Islamique', 'Histoire-Geographie', 'Education Physique', 'Philosophie', 'Anglais',
            ],
            'Sciences Mathematiques B' => [
                'Mathematiques', 'Physique-Chimie', 'Sciences de la Vie et de la Terre (SVT)', 'Francais', 'Arabe',
                'Education Islamique', 'Histoire-Geographie', 'Education Physique', 'Philosophie', 'Anglais',
            ],
            'Sciences et Technologies Electrique' => [
                'Mathematiques', 'Physique-Chimie', 'Electrotechnique', 'Electronique', 'Sciences d Ingenieur', 'Francais',
                'Arabe', 'Education Islamique', 'Histoire-Geographie', 'Education Physique', 'Anglais',
            ],
            'Sciences et Technologies Mecanique' => [
                'Mathematiques', 'Physique-Chimie', 'Mecanique Appliquee', 'Conception Mecanique', 'Sciences d Ingenieur', 'Francais',
                'Arabe', 'Education Islamique', 'Histoire-Geographie', 'Education Physique', 'Anglais',
            ],
            'Lettres et Sciences Humaines' => [
                'Langue Arabe', 'Francais', 'Anglais', 'Philosophie', 'Histoire-Geographie', 'Education Islamique', 'Sociologie', 'Education Physique',
            ],
            'Sciences Economiques' => [
                'Economie Generale et Statistiques', 'Comptabilite Generale', 'Mathematiques', 'Histoire-Geographie', 'Francais',
                'Arabe', 'Education Islamique', 'Anglais', 'Education Physique', 'Philosophie',
            ],
        ],
    ],

    'matieres' => [
        ['nom' => 'Mathematiques', 'coefficient' => 5],
        ['nom' => 'Physique Chimie', 'coefficient' => 4],
        ['nom' => 'Sciences de la Vie et de la Terre', 'coefficient' => 4],
        ['nom' => 'Arabe', 'coefficient' => 4],
        ['nom' => 'Francais', 'coefficient' => 4],
        ['nom' => 'Anglais', 'coefficient' => 3],
        ['nom' => 'Espagnol', 'coefficient' => 2],
        ['nom' => 'Histoire Geographie', 'coefficient' => 3],
        ['nom' => 'Philosophie', 'coefficient' => 2],
        ['nom' => 'Informatique', 'coefficient' => 3],
        ['nom' => 'Education Islamique', 'coefficient' => 2],
        ['nom' => 'Education Physique', 'coefficient' => 2],
        ['nom' => 'Arts Plastiques', 'coefficient' => 1],
        ['nom' => 'Economie Generale', 'coefficient' => 3],
        ['nom' => 'Comptabilite et Math Financieres', 'coefficient' => 3],
        ['nom' => 'Comptabilite Generale', 'coefficient' => 3],
        ['nom' => 'Economie Generale et Statistiques', 'coefficient' => 3],
        ['nom' => 'Science de l Ingenieur', 'coefficient' => 4],
        ['nom' => 'Sciences d Ingenieur', 'coefficient' => 4],
        ['nom' => 'Sciences de la Vie et de la Terre (SVT)', 'coefficient' => 4],
        ['nom' => 'Physique-Chimie', 'coefficient' => 4],
        ['nom' => 'Histoire-Geographie', 'coefficient' => 3],
        ['nom' => 'Langue Arabe', 'coefficient' => 4],
        ['nom' => 'Electrotechnique', 'coefficient' => 4],
        ['nom' => 'Electronique', 'coefficient' => 4],
        ['nom' => 'Mecanique Appliquee', 'coefficient' => 4],
        ['nom' => 'Conception Mecanique', 'coefficient' => 4],
        ['nom' => 'Sociologie', 'coefficient' => 2],
        ['nom' => 'Technologie', 'coefficient' => 2],
        ['nom' => 'Communication et Soft Skills', 'coefficient' => 1],
    ],
];
