import { useEffect, useState } from 'react';
import { professorGet } from '../services/professorApi';
import { Clock, Calendar as CalendarIcon, MapPin, Users, Printer, Download, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

const JOURS_SEMAINE = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

// Couleurs pastel pour les cartes de cours (donne un effet emploi du temps classique)
const CARD_COLORS = [
  'bg-blue-50 border-blue-200 text-blue-800',
  'bg-emerald-50 border-emerald-200 text-emerald-800',
  'bg-purple-50 border-purple-200 text-purple-800',
  'bg-orange-50 border-orange-200 text-orange-800',
  'bg-pink-50 border-pink-200 text-pink-800',
  'bg-indigo-50 border-indigo-200 text-indigo-800',
];

export default function EmploiDuTemps() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSchedule = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await professorGet('/api/professeur/emploi-du-temps');
        setSchedule(data.schedule || []);
      } catch {
        setError("Impossible de charger l'emploi du temps.");
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, []);

  // 1. Organiser les données brutes (liste) en un objet groupé par jour
  const scheduleByDay = JOURS_SEMAINE.reduce((acc, jour) => {
    acc[jour] = schedule
      .filter((s) => s.jour?.toLowerCase() === jour.toLowerCase())
      // Trier par heure de début pour que les cours du matin soient en haut
      .sort((a, b) => a.heure_debut.localeCompare(b.heure_debut));
    return acc;
  }, {});

  // Fonction pour assigner une couleur constante basée sur le nom de la matière
  const getColorForMatiere = (matiereNom) => {
    if (!matiereNom) return CARD_COLORS[0];
    const charCode = matiereNom.charCodeAt(0) || 0;
    return CARD_COLORS[charCode % CARD_COLORS.length];
  };

  const toCsvCell = (value) => {
    const safe = String(value ?? '').replace(/"/g, '""');
    return `"${safe}"`;
  };

  const handleExportPdf = () => {
    if (!schedule.length) return;

    const rows = schedule.map((cours) => [
      cours.jour,
      `${cours.heure_debut || ''} - ${cours.heure_fin || ''}`,
      cours.matiere_nom,
      `${cours.classe_nom || ''} ${cours.classe_niveau ? `(${cours.classe_niveau})` : ''}`.trim(),
    ]);

    const csvRows = [
      ['Jour', 'Horaire', 'Matiere', 'Classe'].map(toCsvCell).join(';'),
      ...rows.map((row) => row.map(toCsvCell).join(';')),
    ];

    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'emploi-du-temps.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=1100,height=720');
    if (!printWindow) {
      alert("S'il vous plaît, autorisez les pop-ups pour imprimer.");
      return;
    }

    const rows = schedule.map((cours) => `
      <tr>
        <td>${escapeHtml(cours.jour)}</td>
        <td>${escapeHtml(cours.heure_debut)} - ${escapeHtml(cours.heure_fin)}</td>
        <td>${escapeHtml(cours.matiere_nom)}</td>
        <td>${escapeHtml(cours.classe_nom)} ${escapeHtml(cours.classe_niveau ? `(${cours.classe_niveau})` : '')}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Emploi du Temps</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            h1 { font-size: 20px; margin: 0 0 12px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 13px; }
            th { background: #f8fafc; text-transform: uppercase; letter-spacing: 0.04em; font-size: 11px; }
          </style>
        </head>
        <body>
          <h1>Emploi du Temps</h1>
          <table>
            <thead>
              <tr>
                <th>Jour</th>
                <th>Horaire</th>
                <th>Matiere</th>
                <th>Classe</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // Animations Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const columnVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className="layout-content">
      {/* En-tête */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <CalendarIcon className="text-blue-600" size={28} /> Mon Emploi du Temps
          </h1>
          <p className="text-slate-500 text-sm mt-1">Consultez votre planning hebdomadaire dynamique.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn btn-outline bg-white shadow-sm"
            onClick={handleExportPdf}
            disabled={!schedule.length}
          >
            <Download size={16} /> Exporter CSV
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn btn-primary shadow-[0_4px_14px_rgba(59,130,246,0.25)]"
            onClick={handlePrint}
            disabled={!schedule.length}
          >
            <Printer size={16} className="mr-2"/> Imprimer
          </motion.button>
        </div>
      </header>

      {/* Zone principale (Card) avec défilement horizontal pour mobile */}
      <div className="card p-0 overflow-hidden border border-slate-200 bg-white">
        
        {loading ? (
          <div className="flex flex-col justify-center items-center py-24">
            <span className="loading-spinner border-blue-500 mb-4"></span>
            <p className="text-slate-500 font-medium">Chargement du calendrier...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 font-medium bg-red-50 m-4 rounded-xl border border-red-100">
            {error}
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            {/* Grille du Calendrier */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex min-w-[1000px] divide-x divide-slate-100"
            >
              {JOURS_SEMAINE.map((jour) => {
                const coursDuJour = scheduleByDay[jour];
                const estAujourdhui = new Date().toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase() === jour.toLowerCase();

                return (
                  <motion.div variants={columnVariants} key={jour} className="flex-1 flex flex-col min-w-[180px] bg-slate-50/30">
                    
                    {/* En-tête de la colonne (Jour) */}
                    <div className={`py-4 text-center border-b border-slate-100 ${estAujourdhui ? 'bg-blue-50' : 'bg-slate-50'}`}>
                      <h3 className={`text-sm font-extrabold uppercase tracking-wider ${estAujourdhui ? 'text-blue-600' : 'text-slate-600'}`}>
                        {jour}
                      </h3>
                      {estAujourdhui && <div className="w-8 h-1 bg-blue-500 rounded-full mx-auto mt-1"></div>}
                    </div>

                    {/* Contenu de la colonne (Les cours) */}
                    <div className="flex-1 p-3 flex flex-col gap-3 min-h-[400px]">
                      {coursDuJour.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl opacity-50">
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Libre</p>
                        </div>
                      ) : (
                        coursDuJour.map((cours) => {
                          const colorClass = getColorForMatiere(cours.matiere_nom);
                          return (
                            <motion.div 
                              key={cours.id_edt}
                              whileHover={{ y: -2, scale: 1.02 }}
                              className={`p-3 rounded-xl border shadow-sm relative overflow-hidden flex flex-col gap-2 cursor-default ${colorClass}`}
                            >
                              {/* Ligne colorée décorative à gauche */}
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-current opacity-20"></div>
                              
                              {/* Heure */}
                              <div className="flex items-center gap-1.5 text-xs font-bold opacity-80">
                                <Clock size={12} />
                                <span>{cours.heure_debut} - {cours.heure_fin}</span>
                              </div>
                              
                              {/* Matière */}
                              <div className="font-extrabold text-sm leading-tight flex items-start gap-1.5 mt-1">
                                <BookOpen size={14} className="mt-0.5 shrink-0 opacity-70" />
                                {cours.matiere_nom}
                              </div>
                              
                              {/* Classe & Salle (Optionnelle) */}
                              <div className="mt-auto pt-2 border-t border-current/10 flex flex-col gap-1 text-xs font-semibold">
                                <div className="flex items-center gap-1.5">
                                  <Users size={12} className="opacity-70" />
                                  {cours.classe_nom} <span className="opacity-60 font-normal">({cours.classe_niveau})</span>
                                </div>
                                {/* Si vous ajoutez une salle dans le backend plus tard, elle s'affichera ici */}
                                {cours.salle && (
                                  <div className="flex items-center gap-1.5 opacity-80">
                                    <MapPin size={12} /> Salle {cours.salle}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

