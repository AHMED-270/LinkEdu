import { useEffect, useState, useMemo } from 'react';
import { professorGet } from '../services/professorApi';
import { Clock, Calendar as CalendarIcon, MapPin, Users, Printer, Download, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import '../components/DirectoryTimetable.css';

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
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const formatClassLabel = (classe) => {
    const explicitLabel = String(classe?.label || '').trim();
    if (explicitLabel) return explicitLabel;

    const name = String(classe?.nom || '').trim();
    const level = String(classe?.niveau || '').trim();
    if (name && level) return `${name} (${level})`;
    return name || level || 'Classe';
  };

  const loadSchedule = async (classId = '') => {
    setLoading(true);
    setError('');
    try {
      const params = classId ? { class_id: classId } : {};
      const data = await professorGet('/api/professeur/emploi-du-temps', params);
      setClasses(data.classes || []);
      setSelectedClass(data.selectedClassId ? String(data.selectedClassId) : '');
      setSchedule(data.schedule || []);
    } catch {
      setError("Impossible de charger l'emploi du temps.");
      setClasses([]);
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  // Helper functions for time calculation
  const normalizeTime = (value) => String(value || '').slice(0, 5);
  const timeToMinutes = (value) => {
    const normalized = normalizeTime(value);
    if (!/^\d{2}:\d{2}$/.test(normalized)) return null;
    const [hoursRaw, minutesRaw] = normalized.split(':').map(Number);
    return (hoursRaw * 60) + minutesRaw;
  };
  const addHoursTime = (startTime, durationHours = 1) => {
    const normalized = normalizeTime(startTime);
    if (!/^\d{2}:\d{2}$/.test(normalized)) return normalized;
    const safeDuration = Number.isFinite(Number(durationHours)) ? Number(durationHours) : 1;
    const [hoursRaw, minutesRaw] = normalized.split(':').map(Number);
    const nextHours = (hoursRaw + safeDuration) % 24;
    return `${String(nextHours).padStart(2, '0')}:${String(minutesRaw).padStart(2, '0')}`;
  };
  const addOneHourTime = (startTime) => addHoursTime(startTime, 1);

  const buildCoveredTimeSlots = (startTime, endTime) => {
    const normalizedStart = normalizeTime(startTime);
    const normalizedEnd = normalizeTime(endTime);
    if (!/^\d{2}:\d{2}$/.test(normalizedStart)) return [];
    const startMinutes = timeToMinutes(normalizedStart);
    const endMinutes = timeToMinutes(normalizedEnd);
    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) return [normalizedStart];
    const slots = [];
    let current = normalizedStart;
    let guard = 0;
    while (guard < 24) {
      const currentMinutes = timeToMinutes(current);
      if (currentMinutes === null || currentMinutes >= endMinutes) break;
      slots.push(current);
      current = addHoursTime(current, 1);
      guard += 1;
    }
    return slots.length > 0 ? slots : [normalizedStart];
  };

  const buildHourlySlots = (start = '08:30', count = 10) => {
    const slots = [];
    let current = start;
    for (let index = 0; index < count; index += 1) {
      slots.push(current);
      current = addHoursTime(current, 1);
    }
    return slots;
  };

  // Convert raw schedule to timetable format
  const tableTimes = useMemo(() => {
    const defaultSlots = buildHourlySlots('08:30', 10);
    const coveredTimes = schedule.flatMap((item) => {
      const startTime = normalizeTime(item?.heure_debut);
      const endTime = normalizeTime(item?.heure_fin) || addHoursTime(startTime, 1);
      return buildCoveredTimeSlots(startTime, endTime);
    });
    const uniqueTimes = [...new Set(coveredTimes.filter((time) => /^\d{2}:\d{2}$/.test(time)))].sort((a, b) => a.localeCompare(b));
    return [...new Set([...defaultSlots, ...uniqueTimes])].sort((a, b) => a.localeCompare(b));
  }, [schedule]);

  const scheduleData = useMemo(() => {
    const formatted = {};
    schedule.forEach((item) => {
      const day = String(item?.jour || '');
      const startTime = normalizeTime(item?.heure_debut);
      const endTime = normalizeTime(item?.heure_fin) || addHoursTime(startTime, 1);

      if (!day || !/^\d{2}:\d{2}$/.test(startTime)) return;

      const coveredSlots = buildCoveredTimeSlots(startTime, endTime);
      const cardData = {
        id: item.id_edt,
        raw: item,
        subject: item.matiere_nom || 'Matière Inconnue',
        class: `${item.classe_nom} (${item.classe_niveau})` || 'Classe Inconnue'
      };

      coveredSlots.forEach((slotTime) => {
        if (!formatted[slotTime]) formatted[slotTime] = {};
        formatted[slotTime][day] = cardData;
      });
    });
    return formatted;
  }, [schedule]);

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
      setError('Veuillez autoriser les popups du navigateur pour imprimer.');
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
    <div className="relative">
      {/* En-tête */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <CalendarIcon className="text-brand-teal" size={28} /> Mon Emploi du Temps
          </h1>
          <p className="text-slate-500 text-sm mt-1">Consultez votre planning hebdomadaire dynamique.</p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <select
            className="form-select min-w-[240px] !px-4 !py-2.5 rounded-xl border border-slate-300 bg-white shadow-sm backdrop-blur-xl border border-white/80 !shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(41,107,116,0.06)] transition-all duration-300"
            value={selectedClass}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedClass(value);
              loadSchedule(value);
            }}
            disabled={loading || classes.length === 0}
          >
            {classes.length === 0 ? (
              <option value="">Aucune classe</option>
            ) : (
              classes.map((classe) => (
                <option key={classe.id} value={classe.id}>
                  {formatClassLabel(classe)}
                </option>
              ))
            )}
          </select>
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
            <span className="loading-spinner border-brand-teal mb-4"></span>
            <p className="text-slate-500 font-medium">Chargement du calendrier...</p>
          </div>
        ) : error ? (
          <div className="py-20 px-6 text-center text-red-600 font-medium">{error}</div>
        ) : (
          <div className="directory-timetable" style={{ margin: 0, padding: 0, border: 'none', background: 'transparent' }}>
            <div className="timetable-grid-container" style={{ margin: 0, border: 'none', borderRadius: 0, boxShadow: 'none' }}>
              <table className="timetable-table">
                <thead>
                  <tr>
                    <th className="time-col"></th>
                    {JOURS_SEMAINE.map(day => (
                      <th key={day} className={day.toLowerCase() === new Date().toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase() ? 'current-day-header' : ''}>{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableTimes.map(time => (
                    <tr key={time}>
                      <td className="time-cell" style={{ fontWeight: 600 }}>{`${time} - ${addOneHourTime(time)}`}</td>
                      {JOURS_SEMAINE.map(day => {
                        const cellData = scheduleData[time]?.[day];
                        return (
                          <td key={`${time}-${day}`} className={day.toLowerCase() === new Date().toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase() ? 'current-day-col' : ''}>
                            {cellData ? (
                              <div className="course-card border-blue" style={{ cursor: 'default' }}>
                                <strong className="course-subject">{cellData.subject}</strong>
                                <div className="course-details">
                                  <span className="course-class">{cellData.class}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="empty-cell"></div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}






