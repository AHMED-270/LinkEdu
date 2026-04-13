import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { FiArrowLeft as ArrowLeft } from 'react-icons/fi';
import { BiSolidUserDetail } from 'react-icons/bi';

const SCHOOL_LEVELS = [
  { code: 'maternelle', label: 'Maternelle' },
  { code: 'primaire', label: 'Primaire' },
  { code: 'college', label: 'College' },
  { code: 'lycee', label: 'Lycee' },
];

const levelLabelByCode = SCHOOL_LEVELS.reduce((accumulator, level) => {
  accumulator[level.code] = level.label;
  return accumulator;
}, {});

const inferCycleFromNiveau = (niveauCode = '', niveauMeta = null) => {
  if (niveauMeta?.cycle) return String(niveauMeta.cycle);
  const code = String(niveauCode || '').toLowerCase();

  if (['ms', 'mm', 'gs'].includes(code)) return 'maternelle';
  if (code.endsWith('ap')) return 'primaire';
  if (code.endsWith('ac')) return 'college';
  if (['tc', '1bac', '2bac'].includes(code)) return 'lycee';

  return '';
};

const normalizeMatiereName = (value = '') => {
  const normalized = String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  switch (normalized) {
    case 'math': return 'mathematiques';
    case 'pc': return 'physiquechimie';
    case 'svt': return 'sciencesdelavieetdelaterresvt';
    case 'eps':
    case 'sport': return 'educationphysique';
    case 'ei': return 'educationislamique';
    case 'hg': return 'histoiregeographie';
    case 'histoiregeo': return 'histoiregeographie';
    case 'info': return 'informatique';
    case 'sciencedelingen':
    case 'sciencedelingenieur': return 'sciencesdingenieur';
    case 'comptabilite': return 'economiegeneraleetstatistiques';
    default: return normalized;
  }
};

const extractProfessorSubjects = (professor) => {
  const fromArray = Array.isArray(professor?.matieres_enseignement)
    ? professor.matieres_enseignement
    : [];

  let fromJson = [];
  if (typeof professor?.matieres_enseignement === 'string' && professor.matieres_enseignement.trim() !== '') {
    try {
      const parsed = JSON.parse(professor.matieres_enseignement);
      if (Array.isArray(parsed)) {
        fromJson = parsed;
      }
    } catch {
      fromJson = [];
    }
  }

  const combined = [...fromArray, ...fromJson];
  if (combined.length === 0 && professor?.matiere_enseignement) {
    combined.push(professor.matiere_enseignement);
  }

  return [...new Set(combined.map((value) => String(value || '').trim()).filter(Boolean))];
};

export default function AdminClassForm({ mode = 'create', classToEdit = null, onBack, onSuccess, isModal = false }) {
  const isEditing = mode === 'edit' && !!classToEdit;
  const [professeurs, setProfesseurs] = useState([]);
  const [matieres, setMatieres] = useState([]);


  const [formData, setFormData] = useState({
    nom: '',
    niveau: '',
    filiere: '',
    pricing: 0
  });
  const [classOptions, setClassOptions] = useState({
    niveaux: [],
    filieresByNiveau: {},
    pricingByNiveauFiliere: {},
    matieresByNiveauFiliere: {},
  });
  const [matiereProfesseurs, setMatiereProfesseurs] = useState({});
  const [prefillDone, setPrefillDone] = useState(false);
  const [formMsg, setFormMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [niveauScolaire, setNiveauScolaire] = useState('');

  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [professResponse, matieresResponse, classOptionsResponse] = await Promise.all([
          axios.get(apiBaseUrl + '/api/admin/users', {
            withCredentials: true,
            headers: { Accept: 'application/json' }
          }),
          axios.get(apiBaseUrl + '/api/admin/matieres', {
            withCredentials: true,
            headers: { Accept: 'application/json' }
          }),
          axios.get(apiBaseUrl + '/api/admin/class-options', {
            withCredentials: true,
            headers: { Accept: 'application/json' }
          })
        ]);

        const profs = (professResponse.data || []).filter((u) => u.role === 'professeur');
        setProfesseurs(profs);
        
        const matieresList = Array.isArray(matieresResponse.data) ? matieresResponse.data : [];
        setMatieres(matieresList);

        const optionsData = classOptionsResponse.data || {};
        setClassOptions({
          niveaux: Array.isArray(optionsData.niveaux) ? optionsData.niveaux : [],
          filieresByNiveau: optionsData.filieres_by_niveau && typeof optionsData.filieres_by_niveau === 'object'
            ? optionsData.filieres_by_niveau
            : {},
          pricingByNiveauFiliere: optionsData.pricing_by_niveau_filiere && typeof optionsData.pricing_by_niveau_filiere === 'object'
            ? optionsData.pricing_by_niveau_filiere
            : {},
          matieresByNiveauFiliere:
            optionsData.matieres_by_niveau_filiere && typeof optionsData.matieres_by_niveau_filiere === 'object'
              ? optionsData.matieres_by_niveau_filiere
              : {},
        });

        if (isEditing) {
          const matchedNiveau = (Array.isArray(optionsData.niveaux) ? optionsData.niveaux : [])
            .find((item) => item?.code === classToEdit.niveau);

          setFormData({
            nom: classToEdit.nom || '',
            niveau: classToEdit.niveau || '',
            filiere: classToEdit.filiere || '',
            pricing: Number(classToEdit.pricing) || 0
          });
          setMatiereProfesseurs({});
          setPrefillDone(false);
          setNiveauScolaire(inferCycleFromNiveau(classToEdit.niveau, matchedNiveau));
        } else {
          setFormData({
            nom: '',
            niveau: '',
            filiere: '',
            pricing: 0
          });
          setMatiereProfesseurs({});
          setPrefillDone(false);
          setNiveauScolaire('');
        }
      } catch (error) {
        setFormMsg('Impossible de charger les données.');
      }
    };

    fetchData();
  }, [apiBaseUrl, isEditing, classToEdit]);

  useEffect(() => {
    if (!formData.niveau) {
      if (formData.filiere !== '') {
        setFormData((prev) => ({ ...prev, filiere: '' }));
      }
      return;
    }

    const allowedFilieres = classOptions.filieresByNiveau[formData.niveau] || [];
    if (allowedFilieres.length === 0) {
      if (formData.filiere !== '') {
        setFormData((prev) => ({ ...prev, filiere: '' }));
      }
      return;
    }

    if (!allowedFilieres.includes(formData.filiere)) {
      setFormData((prev) => ({ ...prev, filiere: allowedFilieres[0] }));
    }
  }, [formData.niveau, formData.filiere, classOptions]);

  const niveauxWithCycle = classOptions.niveaux.map((niveau) => ({
    ...niveau,
    cycle: inferCycleFromNiveau(niveau?.code, niveau),
  }));

  const availableNiveaux = niveauScolaire
    ? niveauxWithCycle.filter((niveau) => niveau.cycle === niveauScolaire)
    : [];

  useEffect(() => {
    if (!niveauScolaire) {
      if (formData.niveau || formData.filiere) {
        setFormData((prev) => ({ ...prev, niveau: '', filiere: '' }));
      }
      return;
    }

    const isNiveauStillAllowed = availableNiveaux.some((niveau) => niveau.code === formData.niveau);
    if (!isNiveauStillAllowed && formData.niveau) {
      setFormData((prev) => ({ ...prev, niveau: '', filiere: '' }));
    }
  }, [niveauScolaire, availableNiveaux, formData.niveau, formData.filiere]);

  useEffect(() => {
    if (!formData.niveau) return;
    const selectedNiveau = niveauxWithCycle.find((niveau) => niveau.code === formData.niveau);
    const detectedCycle = inferCycleFromNiveau(formData.niveau, selectedNiveau);
    if (detectedCycle && detectedCycle !== niveauScolaire) {
      setNiveauScolaire(detectedCycle);
    }
  }, [formData.niveau, niveauxWithCycle, niveauScolaire]);

  const ensureCsrfCookie = async () => {
    await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', {
      withCredentials: true,
      withXSRFToken: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormMsg('');
    setSaving(true);

    if (configuredMatiereNames.length === 0) {
      setFormMsg('Aucune matiere pedagogique configuree pour cette filiere.');
      setSaving(false);
      return;
    }

    const undefinedMatieres = configuredMatieres.filter((matiere) => !matiere.matiereId);
    if (undefinedMatieres.length > 0) {
      setFormMsg('Certaines matieres du cadre pedagogique ne sont pas encore creees en base.');
      setSaving(false);
      return;
    }

    const professeurMatieresPayload = {};
    configuredMatieres.forEach((matiere) => {
      const professeurId = String(matiereProfesseurs[matiere.matiereId] || '').trim();
      if (!professeurId) return;

      if (!professeurMatieresPayload[professeurId]) {
        professeurMatieresPayload[professeurId] = [];
      }

      const numericMatiereId = Number(matiere.matiereId);
      if (!professeurMatieresPayload[professeurId].includes(numericMatiereId)) {
        professeurMatieresPayload[professeurId].push(numericMatiereId);
      }
    });

    const professeurIds = Object.keys(professeurMatieresPayload).map((id) => Number(id));
    if (professeurIds.length === 0) {
      setFormMsg('Veuillez assigner au moins un professeur.');
      setSaving(false);
      return;
    }

    const payload = {
      nom: formData.nom,
      niveau: formData.niveau,
      filiere: formData.filiere,
      pricing: Number(formData.pricing),
      professeur_ids: professeurIds,
      professeur_matieres: professeurMatieresPayload,
    };

    try {
      await ensureCsrfCookie();

      if (isEditing) {
        await axios.put(`${apiBaseUrl}/api/admin/classes/${classToEdit.id_classe}`, payload, {
          withCredentials: true,
          withXSRFToken: true,
          headers: { Accept: 'application/json' }
        });
      } else {
        await axios.post(apiBaseUrl + '/api/admin/classes', payload, {
          withCredentials: true,
          withXSRFToken: true,
          headers: { Accept: 'application/json' }
        });
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      setFormMsg(error.response?.data?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const availableFilieres = formData.niveau ? (classOptions.filieresByNiveau[formData.niveau] || []) : [];

  const groupedFilieres = useMemo(() => {
    const groups = {
      francais: [],
      arabe: [],
      ungrouped: [],
    };

    availableFilieres.forEach((filiere) => {
      const value = String(filiere || '');
      if (/\(Francais\)$/i.test(value)) {
        groups.francais.push(value);
        return;
      }

      if (/\(Arabe\)$/i.test(value)) {
        groups.arabe.push(value);
        return;
      }

      groups.ungrouped.push(value);
    });

    return groups;
  }, [availableFilieres]);

  const configuredMatiereNames = useMemo(() => {
    if (!formData.niveau || !formData.filiere) return [];

    const byNiveau = classOptions.matieresByNiveauFiliere?.[formData.niveau] ?? {};
    const list = byNiveau?.[formData.filiere];

    return Array.isArray(list) ? list : [];
  }, [formData.niveau, formData.filiere, classOptions.matieresByNiveauFiliere]);

  const allowedMatiereTokens = useMemo(
    () => new Set(configuredMatiereNames.map((name) => normalizeMatiereName(name))),
    [configuredMatiereNames]
  );

  const configuredMatieres = useMemo(() => {
    if (configuredMatiereNames.length === 0) return [];

    const byToken = {};
    matieres.forEach((matiere) => {
      const token = normalizeMatiereName(matiere?.nom || '');
      if (!token) return;
      if (!byToken[token]) byToken[token] = [];
      byToken[token].push(matiere);
    });

    const selectBestMatiere = (candidates) => {
      const sorted = [...candidates].sort((a, b) => {
        const aLevel = String(a?.niveau || '').toLowerCase();
        const bLevel = String(b?.niveau || '').toLowerCase();

        const score = (niveau) => {
          if (niveauScolaire && niveau === niveauScolaire) return 3;
          if (niveau === 'general') return 2;
          return 1;
        };

        return score(bLevel) - score(aLevel);
      });

      return sorted[0] || null;
    };

    return configuredMatiereNames
      .map((matiereName) => {
        const token = normalizeMatiereName(matiereName);
        const selected = selectBestMatiere(byToken[token] || []);
        const matiereId = selected
          ? String(selected.id_matiere || selected.id || selected.ID || '')
          : '';

        return {
          label: matiereName,
          token,
          matiereId,
          source: selected || null,
        };
      })
      .filter((matiere) => Boolean(matiere.token));
  }, [configuredMatiereNames, matieres, niveauScolaire]);

  const visibleProfesseurs = useMemo(() => {
    return professeurs.filter((professeur) => {
      const matchesLevel = !niveauScolaire
        ? true
        : String(professeur?.niveau_enseignement || '').toLowerCase() === String(niveauScolaire).toLowerCase();

      if (!matchesLevel) {
        return false;
      }

      if (allowedMatiereTokens.size === 0) {
        return true;
      }

      const subjectTokens = extractProfessorSubjects(professeur)
        .map((subject) => normalizeMatiereName(subject))
        .filter(Boolean);

      return subjectTokens.some((token) => allowedMatiereTokens.has(token));
    });
  }, [professeurs, niveauScolaire, allowedMatiereTokens]);

  const professorTokensById = useMemo(() => {
    const map = {};

    visibleProfesseurs.forEach((professeur) => {
      map[String(professeur.id)] = new Set(
        extractProfessorSubjects(professeur)
          .map((subject) => normalizeMatiereName(subject))
          .filter(Boolean)
      );
    });

    return map;
  }, [visibleProfesseurs]);

  const professorChoicesByMatiere = useMemo(() => {
    const choices = {};

    configuredMatieres.forEach((matiere) => {
      if (!matiere.matiereId) {
        choices[matiere.label] = [];
        return;
      }

      const selectableProfs = visibleProfesseurs.filter((professeur) => {
        const tokens = professorTokensById[String(professeur.id)] || new Set();
        return tokens.has(matiere.token);
      });

      choices[matiere.matiereId] = selectableProfs;
    });

    return choices;
  }, [configuredMatieres, visibleProfesseurs, professorTokensById]);

  useEffect(() => {
    const allowedMatiereIds = new Set(configuredMatieres.filter((matiere) => matiere.matiereId).map((matiere) => matiere.matiereId));

    setMatiereProfesseurs((previous) => {
      let changed = false;
      const next = {};

      Object.entries(previous).forEach(([matiereId, professeurId]) => {
        if (!allowedMatiereIds.has(String(matiereId))) {
          changed = true;
          return;
        }

        const allowedProfesseurs = professorChoicesByMatiere[String(matiereId)] || [];
        const isStillAllowed = allowedProfesseurs.some((prof) => String(prof.id) === String(professeurId));
        if (!isStillAllowed) {
          changed = true;
          return;
        }

        next[String(matiereId)] = String(professeurId);
      });

      return changed ? next : previous;
    });
  }, [configuredMatieres, professorChoicesByMatiere]);

  useEffect(() => {
    if (!isEditing || prefillDone || !classToEdit) return;
    if (configuredMatieres.length === 0) return;

    const mappingFromBackend = classToEdit.professeur_matieres;
    if (!mappingFromBackend || typeof mappingFromBackend !== 'object') {
      setPrefillDone(true);
      return;
    }

    const next = {};
    Object.entries(mappingFromBackend).forEach(([professeurId, matiereIds]) => {
      (Array.isArray(matiereIds) ? matiereIds : []).forEach((matiereId) => {
        next[String(matiereId)] = String(professeurId);
      });
    });

    setMatiereProfesseurs((previous) => {
      if (Object.keys(previous).length > 0) return previous;
      return next;
    });
    setPrefillDone(true);
  }, [isEditing, prefillDone, classToEdit, configuredMatieres]);

  const selectedProfessorCount = useMemo(() => {
    const unique = new Set(
      Object.values(matiereProfesseurs)
        .map((id) => String(id || '').trim())
        .filter(Boolean)
    );

    return unique.size;
  }, [matiereProfesseurs]);

  const unassignedMatiereCount = useMemo(() => {
    return configuredMatieres.filter((matiere) => {
      if (!matiere.matiereId) return true;
      return !matiereProfesseurs[matiere.matiereId];
    }).length;
  }, [configuredMatieres, matiereProfesseurs]);

  return (
    <div className={isModal ? 'bg-[#f8fafc]' : 'dashboard-content bg-gray-50/30'}>
      {!isModal && (
        <header className="content-header flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-bold tracking-wider uppercase text-xs mb-1">
              <span className="w-8 h-[2px] bg-blue-600"></span>
              Classes
            </div>
            <h1 className="mt-1 flex items-center gap-3 text-4xl lg:text-5xl font-extrabold italic tracking-tight text-slate-900">
              <BiSolidUserDetail className="text-blue-600" />
              {isEditing ? 'Modifier Classe' : 'Nouvelle Classe'}
            </h1>
            <p className="text-slate-500 mt-2 max-w-2xl">Formulaire de configuration des structures pédagogiques.</p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-slate-200 active:scale-95"
          >
            <ArrowLeft size={18} strokeWidth={3} /> Retour
          </button>
        </header>
      )}

      <div className={isModal ? 'bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden' : 'bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-10'}>
        {isModal && (
          <div className="px-8 pt-8 pb-6 border-b border-slate-100 bg-gradient-to-br from-blue-50/50 to-white">
            <p className="text-[10px] uppercase tracking-[0.2em] text-blue-600 font-black mb-1">Classes / {isEditing ? 'Modifier' : 'Ajouter'}</p>
            <h2 className="text-3xl font-black text-slate-900 mt-1">{isEditing ? 'Éditer la Classe' : 'Créer une Classe'}</h2>
            <p className="text-sm text-slate-500 mt-2 font-medium">Définissez le nom, le niveau et affectez les enseignants responsables.</p>
          </div>
        )}

        <div className={isModal ? 'p-8' : 'p-10'}>
          {formMsg && (
            <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-xs font-black">!</div>
              <p className="text-sm font-bold">{formMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Base Info */}
            <section className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <div className="grid grid-cols-1 md:grid-cols-12">
                <div className="md:col-span-4 bg-gray-50 p-4 border-b md:border-b-0 md:border-r border-gray-200 flex flex-col justify-center">
                  <h3 className="text-sm font-bold text-gray-800">Identite</h3>
                  <p className="text-xs text-gray-500 mt-1">Informations de base pour identifier la classe dans le systeme.</p>
                </div>
                <div className="md:col-span-8 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Nom de la classe</label>
                    <input
                      type="text"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      required
                      placeholder="Ex: 3ème B"
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Niveau scolaire</label>
                    <select
                      value={niveauScolaire}
                      onChange={(e) => setNiveauScolaire(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                    >
                      <option value="">Selectionner</option>
                      {SCHOOL_LEVELS.map((level) => (
                        <option key={level.code} value={level.code}>{level.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Classe / Niveau</label>
                    <select
                      value={formData.niveau}
                      onChange={(e) => setFormData({ ...formData, niveau: e.target.value })}
                      required
                      disabled={!niveauScolaire}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm disabled:bg-gray-50 disabled:text-gray-400"
                    >
                      <option value="">{niveauScolaire ? 'Selectionner une classe...' : 'Choisir d abord un niveau scolaire'}</option>
                      {availableNiveaux.map((niv) => (
                        <option key={niv.code} value={niv.code}>{niv.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {/* Section: Filière & Pricing */}
            <section className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <div className="grid grid-cols-1 md:grid-cols-12">
                <div className="md:col-span-4 bg-gray-50 p-4 border-b md:border-b-0 md:border-r border-gray-200 flex flex-col justify-center">
                  <h3 className="text-sm font-bold text-gray-800">Structure</h3>
                  <p className="text-xs text-gray-500 mt-1">Definissez la filiere et le cout de scolarite pour cette classe.</p>
                </div>
                <div className="md:col-span-8 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Filiere / Serie</label>
                    <select
                      value={formData.filiere}
                      onChange={(e) => setFormData({ ...formData, filiere: e.target.value })}
                      required
                      disabled={!formData.niveau}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm disabled:bg-gray-50 disabled:text-gray-400"
                    >
                      <option value="">Selectionner une filiere...</option>
                      {groupedFilieres.francais.length > 0 && (
                        <optgroup label="Francais">
                          {groupedFilieres.francais.map((fil) => (
                            <option key={fil} value={fil}>{fil}</option>
                          ))}
                        </optgroup>
                      )}
                      {groupedFilieres.arabe.length > 0 && (
                        <optgroup label="Arabe">
                          {groupedFilieres.arabe.map((fil) => (
                            <option key={fil} value={fil}>{fil}</option>
                          ))}
                        </optgroup>
                      )}
                      {groupedFilieres.ungrouped.map((fil) => (
                        <option key={fil} value={fil}>{fil}</option>
                      ))}
                    </select>
                    {!!formData.niveau && availableFilieres.length === 0 && (
                      <p className="mt-1 text-xs text-amber-700">Aucune filiere configuree pour ce niveau.</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Cout de scolarite (DH)</label>
                    <input
                      type="number"
                      value={formData.pricing}
                      onChange={(e) => setFormData({ ...formData, pricing: e.target.value })}
                      min="0"
                      step="0.01"
                      placeholder="Entrer le cout de scolarite"
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">Montant manuel: vous choisissez librement le cout total.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Professeurs */}
            <section className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <div className="grid grid-cols-1 md:grid-cols-12">
                <div className="md:col-span-4 bg-gray-50 p-4 border-b md:border-b-0 md:border-r border-gray-200 flex flex-col justify-center">
                  <h3 className="text-sm font-bold text-gray-800">Enseignants</h3>
                  <p className="text-xs text-gray-500 mt-1">Assignez un professeur pour chaque matiere du cadre pedagogique de la classe.</p>
                  <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    <span className="text-[10px] font-bold text-blue-700 uppercase">{selectedProfessorCount} professeur(s) assigne(s)</span>
                  </div>
                  <p className="mt-2 text-[11px] font-semibold text-amber-700">{unassignedMatiereCount} matiere(s) non assignee(s)</p>
                </div>
                <div className="md:col-span-8 p-4 bg-white">
                  {niveauScolaire && (
                    <p className="mb-2 text-xs text-gray-600">
                      Affichage automatique: professeurs de niveau {levelLabelByCode[niveauScolaire] || niveauScolaire}.
                    </p>
                  )}
                  {configuredMatiereNames.length > 0 && (
                    <p className="mb-3 text-xs text-blue-700">
                      Matieres du cadre pedagogique chargees selon la filiere selectionnee.
                    </p>
                  )}
                  <div className="border border-slate-100 rounded-xl bg-slate-50/30 p-3 max-h-[420px] overflow-y-auto custom-scrollbar shadow-inner">
                    {configuredMatieres.length === 0 ? (
                      <div className="p-10 text-center text-slate-400 italic text-sm">
                        Selectionnez d'abord le niveau et la filiere pour charger les matieres.
                      </div>
                    ) : visibleProfesseurs.length === 0 ? (
                      <div className="p-10 text-center text-slate-400 italic text-sm">
                        {niveauScolaire && configuredMatiereNames.length > 0
                          ? 'Aucun professeur ne correspond a ce niveau et a cette filiere.'
                          : niveauScolaire
                            ? 'Aucun professeur assigne a ce niveau pour le moment.'
                            : 'Chargement ou aucun professeur disponible...'}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {configuredMatieres.map((matiere) => {
                          const choix = matiere.matiereId ? (professorChoicesByMatiere[matiere.matiereId] || []) : [];
                          const selectedProfesseurId = matiere.matiereId ? String(matiereProfesseurs[matiere.matiereId] || '') : '';
                          return (
                            <div key={`${matiere.label}-${matiere.matiereId || 'missing'}`} className="rounded-xl border border-slate-200 bg-white p-3">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <p className="text-sm font-bold text-slate-800">{matiere.label}</p>
                                  {!matiere.matiereId && (
                                    <p className="text-[11px] text-red-600 font-semibold">Matiere absente en base de donnees.</p>
                                  )}
                                </div>
                                <div className="sm:w-[280px]">
                                  <select
                                    value={selectedProfesseurId}
                                    disabled={!matiere.matiereId || choix.length === 0}
                                    onChange={(e) => {
                                      if (!matiere.matiereId) return;
                                      const selectedValue = String(e.target.value || '');
                                      setMatiereProfesseurs((previous) => ({
                                        ...previous,
                                        [matiere.matiereId]: selectedValue,
                                      }));
                                    }}
                                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm disabled:bg-gray-50 disabled:text-gray-400"
                                  >
                                    <option value="">Selectionner un professeur</option>
                                    {choix.map((professeur) => (
                                      <option key={professeur.id} value={professeur.id}>{professeur.name}</option>
                                    ))}
                                  </select>
                                  {matiere.matiereId && choix.length === 0 && (
                                    <p className="mt-1 text-[11px] text-amber-700">Aucun professeur compatible pour cette matiere.</p>
                                  )}
                                </div>
                              </div>
                              {selectedProfesseurId && (
                                <p className="mt-2 text-[11px] text-emerald-700 font-semibold">
                                  Assigne a {choix.find((professeur) => String(professeur.id) === selectedProfesseurId)?.name || 'Professeur'}
                                </p>
                              )}
                              <div className="mt-2 flex flex-wrap gap-1">
                                {choix.slice(0, 3).map((professeur) => (
                                  <span key={`${matiere.label}-${professeur.id}`} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                    {professeur.name}
                                  </span>
                                ))}
                                {choix.length > 3 && (
                                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                    +{choix.length - 3} autres
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-4 border-t border-gray-100 mt-10">
              <button
                type="button"
                onClick={onBack}
                disabled={saving}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-semibold transition-all text-sm active:scale-95 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-sm text-sm active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Enregistrement...
                  </>
                ) : (
                  'Confirmer et enregistrer'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
