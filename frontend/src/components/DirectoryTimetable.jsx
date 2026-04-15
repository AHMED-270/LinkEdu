import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./DirectoryTimetable.css";

axios.defaults.withCredentials = true;

const AUTH_TOKEN_KEY = 'linkedu_token';

const NIVEAU_LABELS = {
  ms: 'Petite Section',
  mm: 'Moyenne Section',
  gs: 'Grande Section',
  '1ap': '1ere Primaire',
  '2ap': '2eme Primaire',
  '3ap': '3eme Primaire',
  '4ap': '4eme Primaire',
  '5ap': '5eme Primaire',
  '6ap': '6eme Primaire',
  '1ac': '1ere College',
  '2ac': '2eme College',
  '3ac': '3eme College',
  tc: 'Tronc Commun',
  '1bac': '1ere Bac',
  '2bac': '2eme Bac',
};

const CYCLE_LABELS = {
  maternelle: 'Maternelle',
  primaire: 'Primaire',
  college: 'College',
  lycee: 'Lycee',
};

const NIVEAU_CYCLE_MAP = {
  ms: 'maternelle',
  mm: 'maternelle',
  gs: 'maternelle',
  '1ap': 'primaire',
  '2ap': 'primaire',
  '3ap': 'primaire',
  '4ap': 'primaire',
  '5ap': 'primaire',
  '6ap': 'primaire',
  '1ac': 'college',
  '2ac': 'college',
  '3ac': 'college',
  tc: 'lycee',
  '1bac': 'lycee',
  '2bac': 'lycee',
};

const NIVEAU_FILTER_OPTIONS = [
  { value: 'maternelle', label: 'Maternelle' },
  { value: 'primaire', label: 'Primaire' },
  { value: 'college', label: 'College' },
  { value: 'lycee', label: 'Lycee' },
];

function getStoredToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

function normalizeTime(value) {
  return String(value || '').slice(0, 5);
}

function timeToMinutes(value) {
  const normalized = normalizeTime(value);
  if (!/^\d{2}:\d{2}$/.test(normalized)) {
    return null;
  }

  const [hoursRaw, minutesRaw] = normalized.split(':').map((item) => Number(item));
  return (hoursRaw * 60) + minutesRaw;
}

function addHoursTime(startTime, durationHours = 1) {
  const normalized = normalizeTime(startTime);
  if (!/^\d{2}:\d{2}$/.test(normalized)) {
    return normalized;
  }

  const safeDuration = Number.isFinite(Number(durationHours)) ? Number(durationHours) : 1;
  const [hoursRaw, minutesRaw] = normalized.split(':').map((value) => Number(value));
  const nextHours = (hoursRaw + safeDuration) % 24;
  return `${String(nextHours).padStart(2, '0')}:${String(minutesRaw).padStart(2, '0')}`;
}

function addOneHourTime(startTime) {
  return addHoursTime(startTime, 1);
}

function resolveDurationHours(startTime, endTime) {
  const normalizedStart = normalizeTime(startTime);
  const normalizedEnd = normalizeTime(endTime);

  if (!/^\d{2}:\d{2}$/.test(normalizedStart) || !/^\d{2}:\d{2}$/.test(normalizedEnd)) {
    return 1;
  }

  const [startHours, startMinutes] = normalizedStart.split(':').map((value) => Number(value));
  const [endHours, endMinutes] = normalizedEnd.split(':').map((value) => Number(value));

  const startTotalMinutes = (startHours * 60) + startMinutes;
  const endTotalMinutes = (endHours * 60) + endMinutes;
  const diffHours = (endTotalMinutes - startTotalMinutes) / 60;

  return diffHours >= 2 ? 2 : 1;
}

function buildHourlySlots(start = '08:30', count = 10) {
  const slots = [];
  let current = start;

  for (let index = 0; index < count; index += 1) {
    slots.push(current);
    current = addHoursTime(current, 1);
  }

  return slots;
}

function hasTimeOverlap(startA, endA, startB, endB) {
  const startAMinutes = timeToMinutes(startA);
  const endAMinutes = timeToMinutes(endA);
  const startBMinutes = timeToMinutes(startB);
  const endBMinutes = timeToMinutes(endB);

  if (
    startAMinutes === null
    || endAMinutes === null
    || startBMinutes === null
    || endBMinutes === null
  ) {
    return false;
  }

  return startAMinutes < endBMinutes && endAMinutes > startBMinutes;
}

function buildCoveredTimeSlots(startTime, endTime) {
  const normalizedStart = normalizeTime(startTime);
  const normalizedEnd = normalizeTime(endTime);

  if (!/^\d{2}:\d{2}$/.test(normalizedStart)) {
    return [];
  }

  const startMinutes = timeToMinutes(normalizedStart);
  const endMinutes = timeToMinutes(normalizedEnd);

  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    return [normalizedStart];
  }

  const slots = [];
  let current = normalizedStart;
  let guard = 0;

  while (guard < 24) {
    const currentMinutes = timeToMinutes(current);
    if (currentMinutes === null || currentMinutes >= endMinutes) {
      break;
    }

    slots.push(current);
    current = addHoursTime(current, 1);
    guard += 1;
  }

  return slots.length > 0 ? slots : [normalizedStart];
}

function getNiveauLabel(code) {
  const normalizedCode = String(code || '').toLowerCase();
  return CYCLE_LABELS[normalizedCode] || NIVEAU_LABELS[normalizedCode] || String(code || '-');
}

function getCycleFromNiveau(code) {
  return NIVEAU_CYCLE_MAP[String(code || '').toLowerCase()] || '';
}

function DirectoryTimetable() {
  const [rawEmplois, setRawEmplois] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lookups
  const [classes, setClasses] = useState([]);
  const [matieresByClass, setMatieresByClass] = useState({});
  const [professeurByClassMatiere, setProfesseurByClassMatiere] = useState({});

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedNiveauFilter, setSelectedNiveauFilter] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');
  const [formData, setFormData] = useState({
    jour: 'Lundi',
    heure_debut: '08:30',
    duree_heures: '1',
    id_classe: '',
    id_matiere: ''
  });

  const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

  const authConfig = useMemo(() => {
    const token = getStoredToken();
    return {
      withCredentials: true,
      withXSRFToken: true,
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
  }, []);

  const niveauOptions = useMemo(() => {
    return NIVEAU_FILTER_OPTIONS;
  }, []);

  const classesForSelectedNiveau = useMemo(() => {
    if (!selectedNiveauFilter) return [];

    return [...classes]
      .filter((c) => getCycleFromNiveau(c?.niveau) === String(selectedNiveauFilter))
      .sort((a, b) => String(a?.nom || '').localeCompare(String(b?.nom || ''), 'fr'));
  }, [classes, selectedNiveauFilter]);

  const selectedClassObject = useMemo(() => {
    return classes.find((c) => String(c?.id_classe) === String(selectedClassFilter)) || null;
  }, [classes, selectedClassFilter]);

  const filteredEmplois = useMemo(() => {
    if (!selectedClassFilter) {
      return [];
    }

    return rawEmplois.filter((item) => String(item?.id_classe || '') === String(selectedClassFilter));
  }, [rawEmplois, selectedClassFilter]);

  const tableTimes = useMemo(() => {
    const defaultSlots = buildHourlySlots('08:30', 10);
    const coveredTimes = filteredEmplois.flatMap((item) => {
      const startTime = normalizeTime(item?.heure_debut);
      const endTime = normalizeTime(item?.heure_fin) || addHoursTime(startTime, 1);
      return buildCoveredTimeSlots(startTime, endTime);
    });

    const uniqueTimes = [...new Set(coveredTimes.filter((time) => /^\d{2}:\d{2}$/.test(time)))]
      .sort((a, b) => a.localeCompare(b));

    return [...new Set([...defaultSlots, ...uniqueTimes])].sort((a, b) => a.localeCompare(b));
  }, [filteredEmplois]);

  const matiereOptions = useMemo(() => {
    const classKey = String(formData.id_classe || '');
    const entries = matieresByClass?.[classKey];
    return Array.isArray(entries) ? entries : [];
  }, [formData.id_classe, matieresByClass]);

  const autoAssignedProfesseur = useMemo(() => {
    const classKey = String(formData.id_classe || '');
    const matiereKey = String(formData.id_matiere || '');
    if (!classKey || !matiereKey) return null;
    return professeurByClassMatiere?.[`${classKey}-${matiereKey}`] || null;
  }, [formData.id_classe, formData.id_matiere, professeurByClassMatiere]);

  const selectedDurationHours = useMemo(() => {
    return String(formData.duree_heures) === '2' ? 2 : 1;
  }, [formData.duree_heures]);

  const occupiedSlotsByDay = useMemo(() => {
    const grouped = {};

    filteredEmplois.forEach((item) => {
      const dayKey = String(item?.jour || '');
      const startTime = normalizeTime(item?.heure_debut);
      const endTime = normalizeTime(item?.heure_fin) || addHoursTime(startTime, 1);

      if (!dayKey || !/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
        return;
      }

      if (!Array.isArray(grouped[dayKey])) {
        grouped[dayKey] = [];
      }

      grouped[dayKey].push({
        id: Number(item?.id_edt || 0),
        start: startTime,
        end: endTime,
      });
    });

    return grouped;
  }, [filteredEmplois]);

  const unavailableTimeSlots = useMemo(() => {
    const daySlots = Array.isArray(occupiedSlotsByDay?.[formData.jour])
      ? occupiedSlotsByDay[formData.jour]
      : [];

    return new Set(
      tableTimes.filter((startTime) => {
        const endTime = addHoursTime(startTime, selectedDurationHours);
        return daySlots.some((slot) => {
          if (editingId !== null && Number(slot.id) === Number(editingId)) {
            return false;
          }

          return hasTimeOverlap(startTime, endTime, slot.start, slot.end);
        });
      })
    );
  }, [occupiedSlotsByDay, formData.jour, selectedDurationHours, tableTimes, editingId]);

  const selectedSlotUnavailable = useMemo(() => {
    return unavailableTimeSlots.has(formData.heure_debut);
  }, [unavailableTimeSlots, formData.heure_debut]);

  useEffect(() => {
    fetchTimetable();
    fetchLookups();
  }, []);

  useEffect(() => {
    if (!selectedNiveauFilter) {
      if (selectedClassFilter) {
        setSelectedClassFilter('');
      }
      return;
    }

    if (
      selectedClassFilter
      && !classesForSelectedNiveau.some((c) => String(c?.id_classe) === String(selectedClassFilter))
    ) {
      setSelectedClassFilter('');
    }
  }, [selectedNiveauFilter, selectedClassFilter, classesForSelectedNiveau]);

  useEffect(() => {
    if (!showModal || editingId !== null) {
      return;
    }

    const nextClassId = String(selectedClassFilter || '');
    const nextMatieres = nextClassId ? (matieresByClass?.[nextClassId] || []) : [];
    const fallbackMatiereId = nextMatieres.length > 0 ? String(nextMatieres[0].id_matiere) : '';

    setFormData((prev) => {
      const sameClass = String(prev.id_classe || '') === nextClassId;
      const hasMatiereInClass = nextMatieres.some((m) => String(m.id_matiere) === String(prev.id_matiere || ''));
      const nextMatiereId = sameClass && hasMatiereInClass ? String(prev.id_matiere || '') : fallbackMatiereId;

      if (
        String(prev.id_classe || '') === nextClassId
        && String(prev.id_matiere || '') === String(nextMatiereId || '')
      ) {
        return prev;
      }

      return {
        ...prev,
        id_classe: nextClassId,
        id_matiere: nextMatiereId,
      };
    });
  }, [showModal, editingId, selectedClassFilter, matieresByClass]);

  useEffect(() => {
    if (!showModal) {
      return;
    }

    if (!formData.heure_debut || unavailableTimeSlots.has(formData.heure_debut)) {
      const firstAvailable = tableTimes.find((time) => !unavailableTimeSlots.has(time));

      if (firstAvailable && firstAvailable !== formData.heure_debut) {
        setFormData((prev) => ({ ...prev, heure_debut: firstAvailable }));
      }
    }
  }, [showModal, formData.heure_debut, tableTimes, unavailableTimeSlots]);

  const fetchLookups = async () => {
    try {
      const url = `http://${window.location.hostname}:8000/api/emplois/lookups`;
      const response = await axios.get(url, authConfig);
      setClasses(Array.isArray(response?.data?.classes) ? response.data.classes : []);
      setMatieresByClass(response?.data?.matieres_by_class && typeof response.data.matieres_by_class === 'object' ? response.data.matieres_by_class : {});
      setProfesseurByClassMatiere(response?.data?.professeur_by_class_matiere && typeof response.data.professeur_by_class_matiere === 'object' ? response.data.professeur_by_class_matiere : {});
    } catch (error) {
      console.error("Error fetching lookups:", error);
    }
  };

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const url = `http://${window.location.hostname}:8000/api/emplois`;
      const response = await axios.get(url, authConfig);
      setRawEmplois(response.data);
    } catch (error) {
      console.error("Error fetching timetable:", error);
    } finally {
      setLoading(false);
    }
  };

  function formatScheduleData(data) {
    const formatted = {};
    
    data.forEach((item) => {
      const day = String(item?.jour || '');
      const startTime = normalizeTime(item?.heure_debut);
      const endTime = normalizeTime(item?.heure_fin) || addHoursTime(startTime, 1);

      if (!day || !/^\d{2}:\d{2}$/.test(startTime)) {
        return;
      }

      const coveredSlots = buildCoveredTimeSlots(startTime, endTime);
      const cardData = {
        id: item.id_edt,
        raw: item,
        subject: item.matiere ? item.matiere.nom : 'Matière Inconnue',
        class: item.classe ? item.classe.nom : 'Classe Inconnue'
      };

      coveredSlots.forEach((slotTime) => {
        if (!formatted[slotTime]) {
          formatted[slotTime] = {};
        }

        formatted[slotTime][day] = cardData;
      });
    });
    
    return formatted;
  }

  const scheduleData = useMemo(() => {
    return formatScheduleData(filteredEmplois);
  }, [filteredEmplois]);

  const handleOpenModal = () => {
    if (!selectedClassFilter) {
      alert('Choisissez une classe pour afficher l\'emploi.');
      return;
    }

    setEditingId(null);
    const classKey = String(selectedClassFilter);
    const initialMatieres = matieresByClass?.[classKey] || [];
    const initialMatiereId = initialMatieres.length > 0 ? String(initialMatieres[0].id_matiere) : '';

    setFormData({
      jour: 'Lundi',
      heure_debut: '08:30',
      duree_heures: '1',
      id_classe: classKey,
      id_matiere: initialMatiereId,
    });
    setShowModal(true);
  };

  const handleEditModal = (cellData) => {
    const item = cellData.raw;

    setEditingId(item.id_edt);
    setFormData({
      jour: item.jour || 'Lundi',
      heure_debut: item.heure_debut ? item.heure_debut.substring(0, 5) : '08:30',
      duree_heures: String(resolveDurationHours(item.heure_debut, item.heure_fin)),
      id_classe: String(item.id_classe || (classes.length > 0 ? classes[0].id_classe : '')),
      id_matiere: String(item.id_matiere || '')
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet emploi ?")) {
      try {
        const url = `http://${window.location.hostname}:8000/api/emplois/${id}`;
        await axios.delete(url, authConfig);
        fetchTimetable();
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'heure_debut') {
      setFormData((prev) => ({ ...prev, heure_debut: value }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (selectedSlotUnavailable) {
      alert('Ce créneau est déjà occupé pour ce jour.');
      return;
    }

    if (!formData.id_classe) {
      alert('Aucune classe sélectionnée. Choisissez une classe dans les filtres.');
      return;
    }

    const url = `http://${window.location.hostname}:8000/api/emplois`;
    const payload = {
      jour: formData.jour,
      heure_debut: formData.heure_debut,
      duree_heures: Number(formData.duree_heures || 1),
      id_classe: formData.id_classe,
      id_matiere: formData.id_matiere,
    };
    
    try {
      if (editingId !== null) {
        await axios.put(`${url}/${editingId}`, payload, authConfig);
      } else {
        await axios.post(url, payload, authConfig);
      }
      handleCloseModal();
      fetchTimetable();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      if (error.response && error.response.status === 422) {
          const errors = error.response?.data?.errors;
          const customMessage = error.response?.data?.message;
          if (errors && typeof errors === 'object') {
            const messages = Object.values(errors).flat().join("\n");
            alert("Erreur de validation :\n" + messages);
          } else if (customMessage) {
            alert(customMessage);
          } else {
            alert("Erreur de validation.");
          }
      } else {
          alert("Erreur lors de l'enregistrement. Vérifiez votre connexion.");
      }
    }
  };

  if (loading) return <div style={{padding: '20px'}}>Chargement de l'emploi du temps...</div>;

  return (
    <div className="directory-timetable">
      <div className="timetable-header">
        <div className="timetable-title-group">
          <h1>Emploi du Temps</h1>
          <p>Un emploi du temps unique par classe</p>
        </div>
        <div className="timetable-actions">
          <button className="btn-new-emploi" onClick={handleOpenModal}>+ Ajouter un Emploi</button>
        </div>
      </div>

      <div className="timetable-filter-bar">
        <div className="timetable-filter-group">
          <label>Niveau</label>
          <select
            value={selectedNiveauFilter}
            onChange={(event) => {
              setSelectedNiveauFilter(event.target.value);
              setSelectedClassFilter('');
            }}
          >
            <option value="">Choisissez un niveau</option>
            {niveauOptions.map((niveau) => (
              <option key={niveau.value} value={niveau.value}>{niveau.label}</option>
            ))}
          </select>
        </div>

        <div className="timetable-filter-group">
          <label>Classe</label>
          <select
            value={selectedClassFilter}
            onChange={(event) => setSelectedClassFilter(event.target.value)}
            disabled={!selectedNiveauFilter}
          >
            <option value="">{selectedNiveauFilter ? 'Choisissez une classe' : 'Choisissez d\'abord un niveau'}</option>
            {classesForSelectedNiveau.map((classe) => (
              <option key={classe.id_classe} value={String(classe.id_classe)}>{`${classe.nom} (${getNiveauLabel(classe.niveau)})`}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="timetable-grid-container">
        <table className="timetable-table">
          <thead>
            <tr>
              <th className="time-col"></th>
              {days.map(day => (
                <th key={day} className={day === 'Mercredi' ? 'current-day-header' : ''}>{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!selectedClassFilter ? (
              <tr>
                <td colSpan={days.length + 1} className="timetable-empty-state">
                  Choisissez une classe pour afficher l'emploi.
                </td>
              </tr>
            ) : (
              tableTimes.map(time => (
                <tr key={time}>
                  <td className="time-cell">{`${time} - ${addOneHourTime(time)}`}</td>
                  {days.map(day => {
                    const cellData = scheduleData[time]?.[day];
                    return (
                      <td key={`${time}-${day}`} className={day === 'Mercredi' ? 'current-day-col' : ''}>
                        {cellData ? (
                          <div className="course-card border-blue">
                            <div className="course-card-actions">
                              <button className="btn-edit-icon" onClick={() => handleEditModal(cellData)}>✎</button>
                              <button className="btn-delete-icon" onClick={() => handleDelete(cellData.id)}>×</button>
                            </div>
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className='emploi-modal-overlay'>
          <div className='emploi-modal'>
            <h2>{editingId !== null ? 'Modifier un Emploi' : 'Ajouter un Emploi'}</h2>
            <form onSubmit={handleSave}>
              <div className="emploi-form-row">
                <div className='emploi-form-group'>
                  <label>Jour</label>
                  <select name='jour' value={formData.jour} onChange={handleChange}>
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className='emploi-form-group'>
                  <label>Créneau horaire</label>
                  <select name='heure_debut' value={formData.heure_debut} onChange={handleChange} required>
                    {tableTimes.map((time) => (
                      <option key={time} value={time} disabled={unavailableTimeSlots.has(time)}>
                        {`${time} - ${addHoursTime(time, selectedDurationHours)}${unavailableTimeSlots.has(time) ? ' (Occupe)' : ''}`}
                      </option>
                    ))}
                  </select>
                  {selectedSlotUnavailable && (
                    <small style={{ marginTop: '0.35rem', color: '#b91c1c', fontWeight: 600 }}>
                      Ce créneau est indisponible pour ce jour.
                    </small>
                  )}
                </div>
                <div className='emploi-form-group'>
                  <label>Durée</label>
                  <select name='duree_heures' value={formData.duree_heures} onChange={handleChange} required>
                    <option value="1">1 heure</option>
                    <option value="2">2 heures</option>
                  </select>
                </div>
              </div>

              <div className="emploi-form-row">
                <div className='emploi-form-group'>
                  <label>Niveau</label>
                  <input type='text' value={selectedNiveauFilter ? getNiveauLabel(selectedNiveauFilter) : '-'} readOnly />
                </div>
                <div className='emploi-form-group'>
                  <label>Classe</label>
                  <input type='text' value={selectedClassObject?.nom || '-'} readOnly />
                </div>
              </div>

              <div className="emploi-form-row">
                <div className='emploi-form-group'>
                  <label>Matière</label>
                  <select name='id_matiere' value={formData.id_matiere} onChange={handleChange} required disabled={!formData.id_classe}>
                    <option value="">{formData.id_classe ? 'Sélectionnez...' : 'Choisissez d\'abord une classe'}</option>
                    {matiereOptions.map((m) => (
                      <option key={m.id_matiere} value={m.id_matiere}>{m.nom}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="emploi-form-row">
                <div className='emploi-form-group'>
                  <label>Professeur assigné automatiquement</label>
                  <input
                    type='text'
                    value={autoAssignedProfesseur?.nom_complet || 'Assignation automatique selon classe + matière'}
                    readOnly
                  />
                </div>
              </div>

              <div className='emploi-modal-actions'>
                <button type='button' className='btn-cancel' onClick={handleCloseModal}>Annuler</button>
                <button type='submit' className='btn-save' disabled={selectedSlotUnavailable}>Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DirectoryTimetable;
