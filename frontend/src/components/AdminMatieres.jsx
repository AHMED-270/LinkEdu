import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { FiPlus as Plus, FiEdit2 as Edit, FiTrash2 as Trash2, FiSearch as Search, FiEye as Eye } from 'react-icons/fi';
import { BiSolidUserDetail } from 'react-icons/bi';
import {
  LEVEL_LABELS,
  PROFESSOR_SUBJECTS_BY_LEVEL,
  PROFESSOR_SUBJECT_COEFFICIENTS_BY_LEVEL,
} from '../constants/professorSubjectsByLevel';

const normalizeSubjectToken = (value = '') => {
  const normalized = String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  switch (normalized) {
    case 'math':
      return 'mathematiques';
    case 'pc':
      return 'physiquechimie';
    case 'svt':
      return 'sciencesdelavieetdelaterresvt';
    case 'eps':
    case 'sport':
      return 'educationphysique';
    case 'ei':
      return 'educationislamique';
    case 'hg':
    case 'histoiregeo':
      return 'histoiregeographie';
    case 'info':
      return 'informatique';
    case 'sciencedelingenieur':
      return 'sciencesdingenieur';
    case 'banglais':
      return 'anglais';
    default:
      return normalized;
  }
};

const AUTOMATIC_LEVELS = ['maternelle', 'primaire', 'college', 'lycee'];

const AUTOMATIC_MATIERES = AUTOMATIC_LEVELS.flatMap((niveau) => {
  const subjects = PROFESSOR_SUBJECTS_BY_LEVEL[niveau] || [];
  const coefficientMap = PROFESSOR_SUBJECT_COEFFICIENTS_BY_LEVEL[niveau] || {};
  return subjects.map((nom) => ({
    nom,
    niveau,
    coefficient: Number.isFinite(Number(coefficientMap[nom])) ? Number(coefficientMap[nom]) : 1,
  }));
});

const LEVEL_DISPLAY_ORDER = ['maternelle', 'primaire', 'college', 'lycee', 'general'];

const MATIERE_TYPE_OPTIONS = [
  { value: 'generale', label: 'Generale' },
  { value: 'specifique', label: 'Specifique' },
];

const NIVEAU_CODES_BY_LEVEL = {
  maternelle: ['ms', 'mm', 'gs'],
  primaire: ['1ap', '2ap', '3ap', '4ap', '5ap', '6ap'],
  college: ['1ac', '2ac', '3ac'],
  lycee: ['tc', '1bac', '2bac'],
};

const NIVEAU_CODE_LABELS = {
  ms: 'Petite Section',
  mm: 'Moyenne Section',
  gs: 'Grande Section',
  '1ap': '1AP',
  '2ap': '2AP',
  '3ap': '3AP',
  '4ap': '4AP',
  '5ap': '5AP',
  '6ap': '6AP',
  '1ac': '1AC',
  '2ac': '2AC',
  '3ac': '3AC',
  tc: 'Tronc Commun',
  '1bac': '1ere Bac',
  '2bac': '2eme Bac',
};

const GENERAL_TYPE_NIVEAU_CODES = Object.values(NIVEAU_CODES_BY_LEVEL).flat();
const LYCEE_NIVEAU_CODES = ['tc', '1bac', '2bac'];

const NIVEAU_LEVEL_BY_CODE = Object.entries(NIVEAU_CODES_BY_LEVEL).reduce((acc, [level, codes]) => {
  codes.forEach((code) => {
    acc[code] = level;
  });

  return acc;
}, {});

const SPECIFIC_NIVEAU_OPTIONS = GENERAL_TYPE_NIVEAU_CODES.map((code) => ({
  value: code,
  label: `${NIVEAU_CODE_LABELS[code] || code} (${LEVEL_LABELS[NIVEAU_LEVEL_BY_CODE[code]] || NIVEAU_LEVEL_BY_CODE[code] || '-'})`,
}));

const isLyceeNiveauCode = (code = '') => LYCEE_NIVEAU_CODES.includes(String(code).toLowerCase());
const getLevelForNiveauCode = (code = '') => NIVEAU_LEVEL_BY_CODE[String(code).toLowerCase()] || '';

const buildDefaultGeneralTypeCoefficients = () => (
  GENERAL_TYPE_NIVEAU_CODES.reduce((acc, code) => {
    acc[code] = ['ms', 'mm', 'gs'].includes(code) ? 0 : 1;
    return acc;
  }, {})
);

const normalizeGeneralTypeCoefficients = (rawCoefficients, fallbackCoefficient = 1) => {
  const source = rawCoefficients && typeof rawCoefficients === 'object' ? rawCoefficients : {};
  const parsedFallback = Number.isFinite(Number(fallbackCoefficient)) ? Number(fallbackCoefficient) : 1;

  return GENERAL_TYPE_NIVEAU_CODES.reduce((acc, code) => {
    const rawValue = source[code];
    acc[code] = Number.isFinite(Number(rawValue)) ? Number(rawValue) : parsedFallback;
    return acc;
  }, {});
};

const resolveSpecificNiveauCodeFromMatiere = (matiere = {}) => {
  if (isLyceeNiveauCode(matiere?.lycee_niveau_code)) {
    return String(matiere.lycee_niveau_code).toLowerCase();
  }

  const source = matiere?.coefficients_by_niveau_code && typeof matiere.coefficients_by_niveau_code === 'object'
    ? matiere.coefficients_by_niveau_code
    : {};

  const level = String(matiere?.niveau || '').toLowerCase();
  const preferredCodes = NIVEAU_CODES_BY_LEVEL[level] || GENERAL_TYPE_NIVEAU_CODES;
  const firstPreferred = preferredCodes.find((code) => Number.isFinite(Number(source[code])));
  if (firstPreferred) {
    return firstPreferred;
  }

  return preferredCodes[0] || 'tc';
};

const buildMatiereKey = (nom, niveau) => `${String(niveau || '').toLowerCase()}::${normalizeSubjectToken(nom)}`;

export default function AdminMatieres({ userRole = 'admin' }) {
  const [matieres, setMatieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [formError, setFormError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editFormData, setEditFormData] = useState({
    nom: '',
    type: 'generale',
    niveau: 'general',
    coefficient: 1,
    coefficients_by_niveau_code: buildDefaultGeneralTypeCoefficients(),
    specific_niveau_code: 'tc',
    specific_coefficient: 1,
    lycee_niveau_code: 'tc',
    lycee_filiere: '',
  });
  const [editFormError, setEditFormError] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);
  const [classOptions, setClassOptions] = useState({
    filieres_by_niveau: {},
  });

  const [selectedLevel, setSelectedLevel] = useState('all');
  const levelFilterOptions = [
    { value: 'all', label: 'Tous les niveaux' },
    { value: 'general', label: 'General' },
    { value: 'maternelle', label: 'Maternelle' },
    { value: 'primaire', label: 'Primaire' },
    { value: 'college', label: 'College' },
    { value: 'lycee', label: 'Lycee' },
  ];

  const [formData, setFormData] = useState({
    nom: '',
    type: 'generale',
    niveau: 'general',
    coefficient: 1,
    coefficients_by_niveau_code: buildDefaultGeneralTypeCoefficients(),
    specific_niveau_code: 'tc',
    specific_coefficient: 1,
    lycee_niveau_code: 'tc',
    lycee_filiere: '',
  });

  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

  const ensureCsrfCookie = async () => {
    await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', {
      withCredentials: true,
      withXSRFToken: true,
    });
  };

  const getFilieresForNiveauCode = (niveauCode) => {
    const rows = classOptions?.filieres_by_niveau?.[niveauCode];
    return Array.isArray(rows) ? rows : [];
  };

  const getDefaultFiliereForNiveauCode = (niveauCode) => {
    const list = getFilieresForNiveauCode(niveauCode);
    return list[0] || '';
  };

  const buildGeneralTypeCoefficientsPayload = (source) => {
    const payload = {};

    for (const code of GENERAL_TYPE_NIVEAU_CODES) {
      const rawValue = source?.[code];
      if (rawValue === '' || rawValue === null || rawValue === undefined) {
        return { error: `Le coefficient ${NIVEAU_CODE_LABELS[code] || code} est obligatoire.` };
      }

      const parsed = Number(rawValue);
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 10) {
        return { error: `Le coefficient ${NIVEAU_CODE_LABELS[code] || code} doit etre entre 0 et 10.` };
      }

      payload[code] = parsed;
    }

    return { payload };
  };

  const ensureAutomaticMatieres = async (existingMatieres) => {
    const existingByKey = new Map(
      (existingMatieres || []).map((matiere) => [buildMatiereKey(matiere.nom, matiere.niveau), matiere])
    );

    const missing = AUTOMATIC_MATIERES.filter(
      (matiere) => !existingByKey.has(buildMatiereKey(matiere.nom, matiere.niveau))
    );

    const coefficientUpdates = AUTOMATIC_MATIERES
      .map((matiere) => {
        const key = buildMatiereKey(matiere.nom, matiere.niveau);
        const current = existingByKey.get(key);
        if (!current) {
          return null;
        }

        return Number(current.coefficient) !== Number(matiere.coefficient)
          ? { current, expected: matiere }
          : null;
      })
      .filter(Boolean);

    if (missing.length === 0 && coefficientUpdates.length === 0) {
      return { created: 0, updated: 0 };
    }

    await ensureCsrfCookie();

    let created = 0;
    for (const matiere of missing) {
      try {
        const niveauCodes = NIVEAU_CODES_BY_LEVEL[matiere.niveau] || [];
        const coefficientsByCode = niveauCodes.reduce((acc, code) => {
          acc[code] = Number(matiere.coefficient);
          return acc;
        }, {});
        const defaultLyceeNiveauCode = matiere.niveau === 'lycee' ? 'tc' : null;
        const defaultLyceeFiliere = matiere.niveau === 'lycee' ? 'TC Scientifique' : null;

        await axios.post(apiBaseUrl + '/api/admin/matieres', {
          ...matiere,
          coefficients_by_niveau_code: Object.keys(coefficientsByCode).length > 0 ? coefficientsByCode : null,
          lycee_niveau_code: defaultLyceeNiveauCode,
          lycee_filiere: defaultLyceeFiliere,
        }, {
          withCredentials: true,
          withXSRFToken: true,
          headers: { Accept: 'application/json' },
        });
        created += 1;
      } catch (error) {
        if (error.response?.status !== 422) {
          throw error;
        }
      }
    }

    let updated = 0;
    for (const updateItem of coefficientUpdates) {
      const { current, expected } = updateItem;

      try {
        const currentLevel = String(current.niveau || '').toLowerCase();
        const niveauCodes = NIVEAU_CODES_BY_LEVEL[currentLevel] || [];
        const coefficientsByCode = niveauCodes.reduce((acc, code) => {
          acc[code] = Number(expected.coefficient);
          return acc;
        }, {});
        const lyceeNiveauCode = currentLevel === 'lycee'
          ? (current.lycee_niveau_code || 'tc')
          : null;
        const lyceeFiliere = currentLevel === 'lycee'
          ? (current.lycee_filiere || 'TC Scientifique')
          : null;

        await axios.put(`${apiBaseUrl}/api/admin/matieres/${current.id_matiere}`, {
          nom: current.nom,
          niveau: current.niveau,
          coefficient: Number(expected.coefficient),
          coefficients_by_niveau_code: Object.keys(coefficientsByCode).length > 0 ? coefficientsByCode : null,
          lycee_niveau_code: lyceeNiveauCode,
          lycee_filiere: lyceeFiliere,
        }, {
          withCredentials: true,
          withXSRFToken: true,
          headers: { Accept: 'application/json' },
        });
        updated += 1;
      } catch (error) {
        if (error.response?.status !== 422) {
          throw error;
        }
      }
    }

    return { created, updated };
  };

  const fetchMatieres = async ({ syncDefaults = true } = {}) => {
    setLoading(true);
    try {
      const response = await axios.get(apiBaseUrl + '/api/admin/matieres', {
        withCredentials: true,
        headers: { Accept: 'application/json' },
      });

      const rows = Array.isArray(response.data) ? response.data : [];
      setMatieres(rows);

      if (syncDefaults) {
        const syncResult = await ensureAutomaticMatieres(rows);
        if ((syncResult.created + syncResult.updated) > 0) {
          await fetchMatieres({ syncDefaults: false });
          return;
        }
      }
    } catch (error) {
      console.error('Erreur chargement matieres:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassOptions = async () => {
    try {
      const response = await axios.get(apiBaseUrl + '/api/admin/class-options', {
        withCredentials: true,
        headers: { Accept: 'application/json' },
      });

      const data = response?.data || {};
      setClassOptions({
        filieres_by_niveau: data.filieres_by_niveau || {},
      });
    } catch (error) {
      console.error('Erreur chargement options classes:', error);
    }
  };

  useEffect(() => {
    fetchMatieres();
    fetchClassOptions();
  }, []);

  const openCreateForm = () => {
    const defaultSpecificNiveauCode = 'tc';
    const defaultSpecificFiliere = getDefaultFiliereForNiveauCode(defaultSpecificNiveauCode);

    setFormData({
      nom: '',
      type: 'generale',
      niveau: 'general',
      coefficient: 1,
      coefficients_by_niveau_code: buildDefaultGeneralTypeCoefficients(),
      specific_niveau_code: defaultSpecificNiveauCode,
      specific_coefficient: 1,
      lycee_niveau_code: defaultSpecificNiveauCode,
      lycee_filiere: defaultSpecificFiliere,
    });
    setFormError('');
    setShowForm(true);
  };

  const closeCreateForm = () => {
    setShowForm(false);
    setFormError('');
  };

  const openEditForm = (matiere) => {
    const currentLevel = String(matiere.niveau || 'college').toLowerCase();
    const isSpecificType = currentLevel !== 'general';
    const defaultSpecificNiveauCode = isSpecificType ? resolveSpecificNiveauCodeFromMatiere(matiere) : 'tc';
    const defaultSpecificFiliere = isSpecificType && isLyceeNiveauCode(defaultSpecificNiveauCode)
      ? (matiere.lycee_filiere || getDefaultFiliereForNiveauCode(defaultSpecificNiveauCode))
      : '';
    const defaultSpecificCoefficient = Number(
      (matiere.coefficients_by_niveau_code || {})[defaultSpecificNiveauCode]
      ?? matiere.coefficient
      ?? 1
    );

    setEditTarget(matiere);
    setEditFormData({
      nom: matiere.nom || '',
      type: isSpecificType ? 'specifique' : 'generale',
      niveau: isSpecificType ? getLevelForNiveauCode(defaultSpecificNiveauCode) || currentLevel : 'general',
      coefficient: Number(matiere.coefficient || 1),
      coefficients_by_niveau_code: normalizeGeneralTypeCoefficients(
        matiere.coefficients_by_niveau_code,
        matiere.coefficient || 1,
      ),
      specific_niveau_code: defaultSpecificNiveauCode,
      specific_coefficient: Number.isFinite(defaultSpecificCoefficient) ? defaultSpecificCoefficient : 1,
      lycee_niveau_code: isSpecificType && isLyceeNiveauCode(defaultSpecificNiveauCode) ? defaultSpecificNiveauCode : '',
      lycee_filiere: defaultSpecificFiliere,
    });
    setEditFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSaving(true);

    const payload = {
      nom: formData.nom.trim(),
      niveau: formData.niveau,
      coefficient: Number(formData.coefficient),
    };

    try {
      await ensureCsrfCookie();

      await axios.post(apiBaseUrl + '/api/admin/matieres', payload, {
        withCredentials: true,
        withXSRFToken: true,
        headers: { Accept: 'application/json' },
      });

      setShowForm(false);
      fetchMatieres();
    } catch (error) {
      setFormError(error.response?.data?.message || "Erreur lors de l'enregistrement de la matiere.");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTarget) return;

    setEditFormError('');
    setIsSavingEdit(true);

    const isGeneralType = editFormData.type === 'generale';
    const generalTypeResult = isGeneralType
      ? buildGeneralTypeCoefficientsPayload(editFormData.coefficients_by_niveau_code)
      : null;

    if (generalTypeResult?.error) {
      setEditFormError(generalTypeResult.error);
      setIsSavingEdit(false);
      return;
    }

    const specificCode = String(editFormData.specific_niveau_code || '').toLowerCase();
    const specificLevel = getLevelForNiveauCode(specificCode);
    const isLyceeSpecific = isLyceeNiveauCode(specificCode);

    if (!isGeneralType) {
      if (!specificCode || !specificLevel) {
        setEditFormError('Veuillez choisir un niveau specifique valide.');
        setIsSavingEdit(false);
        return;
      }

      if (isLyceeSpecific) {
        const allowedFilieres = getFilieresForNiveauCode(specificCode);
        if (!editFormData.lycee_filiere || !allowedFilieres.includes(editFormData.lycee_filiere)) {
          setEditFormError('Veuillez choisir une filiere valide pour le niveau specifique selectionne.');
          setIsSavingEdit(false);
          return;
        }
      }

      const parsedSpecificCoefficient = Number(editFormData.specific_coefficient);
      if (!Number.isFinite(parsedSpecificCoefficient) || parsedSpecificCoefficient < 0 || parsedSpecificCoefficient > 10) {
        setEditFormError('Le coefficient specifique doit etre entre 0 et 10.');
        setIsSavingEdit(false);
        return;
      }
    }

    const payload = isGeneralType
      ? {
        nom: editFormData.nom.trim(),
        niveau: 'general',
        coefficient: Number(generalTypeResult?.payload?.['1ac'] ?? 1),
        coefficients_by_niveau_code: generalTypeResult?.payload,
        lycee_niveau_code: null,
        lycee_filiere: null,
      }
      : {
        nom: editFormData.nom.trim(),
        niveau: specificLevel,
        coefficient: Number(editFormData.specific_coefficient),
        coefficients_by_niveau_code: {
          [specificCode]: Number(editFormData.specific_coefficient),
        },
        lycee_niveau_code: isLyceeSpecific ? specificCode : null,
        lycee_filiere: isLyceeSpecific ? editFormData.lycee_filiere : null,
      };

    try {
      await ensureCsrfCookie();

      await axios.put(`${apiBaseUrl}/api/admin/matieres/${editTarget.id_matiere}`, payload, {
        withCredentials: true,
        withXSRFToken: true,
        headers: { Accept: 'application/json' },
      });

      setEditTarget(null);
      fetchMatieres();
    } catch (error) {
      setEditFormError(error.response?.data?.message || "Erreur lors de la modification de la matiere.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const requestDelete = (matiere) => {
    setDeleteTarget(matiere);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);

    try {
      await ensureCsrfCookie();

      await axios.delete(`${apiBaseUrl}/api/admin/matieres/${deleteTarget.id_matiere}`, {
        withCredentials: true,
        withXSRFToken: true,
        headers: { Accept: 'application/json' },
      });

      setDeleteTarget(null);
      fetchMatieres();
    } catch (error) {
      alert(error.response?.data?.message || 'Erreur lors de la suppression de la matiere.');
    } finally {
      setIsDeleting(false);
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const subjectLevelsByToken = useMemo(() => {
    const grouped = new Map();

    matieres.forEach((matiere) => {
      const token = normalizeSubjectToken(matiere.nom || '');
      if (!token) return;

      const level = String(matiere.niveau || '').toLowerCase();
      if (!grouped.has(token)) {
        grouped.set(token, {
          nom: String(matiere.nom || '').trim(),
          levels: new Set(),
        });
      }

      grouped.get(token).levels.add(level);
    });

    return grouped;
  }, [matieres]);

  const filteredMatieres = useMemo(() => {
    const matches = matieres.filter((matiere) => {
      const matiereLevel = String(matiere.niveau || '').toLowerCase();
      if (selectedLevel !== 'all' && matiereLevel !== selectedLevel) {
        return false;
      }

      if (!normalizedSearch) return true;

      return [matiere.nom, matiere.coefficient, matiere.niveau]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch));
    });

    // In "all" mode, display each subject only once regardless of assigned levels.
    if (selectedLevel !== 'all') {
      return matches;
    }

    const uniqueByToken = new Map();
    matches.forEach((matiere) => {
      const token = normalizeSubjectToken(matiere.nom || '');
      if (!token) return;

      if (!uniqueByToken.has(token)) {
        uniqueByToken.set(token, matiere);
        return;
      }

      const current = uniqueByToken.get(token);
      const currentLevel = String(current?.niveau || '').toLowerCase();
      const nextLevel = String(matiere?.niveau || '').toLowerCase();

      if (currentLevel !== 'general' && nextLevel === 'general') {
        uniqueByToken.set(token, matiere);
      }
    });

    return Array.from(uniqueByToken.values());
  }, [matieres, normalizedSearch, selectedLevel]);

  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen p-6 bg-[#f5f7fb]">
        <div className="max-w-4xl mx-auto bg-white border border-gray-100 rounded-2xl shadow-sm p-8 text-gray-600 font-medium">
          Acces reserve a l'administrateur.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 lg:p-8 bg-[#f5f7fb]">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div>
            <h1 className="mt-1 flex items-center gap-2 text-4xl lg:text-5xl font-extrabold italic tracking-tight text-slate-900">
              <BiSolidUserDetail className="text-blue-600" />
              Gestion des Matieres
            </h1>
            <p className="text-slate-500 mt-2">Creer, modifier et supprimer les matieres de l'etablissement.</p>
          </div>
          <button
            type="button"
            onClick={openCreateForm}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#2563eb] text-white font-semibold rounded-xl shadow-sm hover:bg-[#1d4ed8] transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            Ajouter une Matiere
          </button>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-gray-100 flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-gray-50/60">
            <h2 className="text-sm font-semibold text-gray-700">Toutes les matieres ({filteredMatieres.length})</h2>
            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="block w-full sm:w-48 pl-3 pr-10 py-2 border border-gray-200 rounded-xl leading-5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors sm:text-sm"
              >
                {levelFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher nom..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors sm:text-sm"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Matiere</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={`skeleton-${i}`} className="animate-pulse">
                      <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-44"></div></td>
                      <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-16 ml-auto"></div></td>
                    </tr>
                  ))
                ) : filteredMatieres.length === 0 ? (
                  <tr>
                    <td colSpan="2" className="py-12 text-center text-gray-400">
                      <p className="text-base font-medium text-gray-500">Aucune matiere trouvee</p>
                    </td>
                  </tr>
                ) : (
                  filteredMatieres.map((matiere) => (
                    <tr key={matiere.id_matiere} className="hover:bg-blue-50/50 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            {(matiere.nom || '?').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{matiere.nom}</p>
                            {(() => {
                              const token = normalizeSubjectToken(matiere.nom || '');
                              const levels = [
                                ...(
                                  subjectLevelsByToken.get(token)?.levels
                                  || new Set([String(matiere.niveau || '').toLowerCase()])
                                ),
                              ]
                                .filter(Boolean)
                                .sort((a, b) => LEVEL_DISPLAY_ORDER.indexOf(a) - LEVEL_DISPLAY_ORDER.indexOf(b));

                              if (selectedLevel === 'all') {
                                return (
                                  <p className="text-xs text-gray-500">
                                    Niveaux: {levels.map((level) => LEVEL_LABELS[level] || level).join(', ')}
                                  </p>
                                );
                              }

                              return (
                                <p className="text-xs text-gray-500">
                                  Niveau: {LEVEL_LABELS[String(matiere.niveau || '').toLowerCase()] || matiere.niveau || 'Non assigne'}
                                </p>
                              );
                            })()}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setViewTarget(matiere)}
                            className="text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 p-2 rounded-lg transition-colors cursor-pointer"
                            title="Voir"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditForm(matiere)}
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-colors cursor-pointer"
                            title="Modifier"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => requestDelete(matiere)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {viewTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Voir Matiere</h3>
              <button
                type="button"
                onClick={() => setViewTarget(null)}
                className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium"
              >
                Fermer
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nom de la matiere</p>
                <p className="mt-1 text-base font-bold text-gray-900">{viewTarget.nom}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Niveaux</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(() => {
                    const token = normalizeSubjectToken(viewTarget.nom || '');
                    const levels = [
                      ...(
                        subjectLevelsByToken.get(token)?.levels
                          || new Set([String(viewTarget.niveau || '').toLowerCase()])
                      ),
                    ].filter(Boolean);

                    return levels.map((level) => (
                      <span
                        key={`${token}-${level}`}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
                      >
                        {LEVEL_LABELS[level] || level}
                      </span>
                    ));
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Confirmer la suppression</h3>
              <p className="text-gray-500 mb-6">
                Voulez-vous vraiment supprimer la matiere <strong className="text-gray-900">{deleteTarget.nom}</strong> ? Cette action est irréversible.
              </p>

              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="px-5 py-2.5 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-5 py-2.5 rounded-xl font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Modifier Matiere</h3>
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium"
              >
                Fermer
              </button>
            </div>
            <div className="p-6">
              {editFormError && <p className="text-red-600 text-sm mb-4">{editFormError}</p>}

              <form onSubmit={handleEditSubmit} className="grid grid-cols-1 sm:grid-cols-6 gap-4">
                <div className="sm:col-span-3">
                  <label className="text-sm font-medium text-gray-700">Nom de la matiere</label>
                  <input
                    type="text"
                    value={editFormData.nom}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, nom: e.target.value }))}
                    required
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={editFormData.type}
                    onChange={(e) => {
                      const nextType = e.target.value;
                      const nextSpecificNiveauCode = editFormData.specific_niveau_code || 'tc';
                      const isNextLyceeSpecific = isLyceeNiveauCode(nextSpecificNiveauCode);
                      const nextSpecificFiliere = isNextLyceeSpecific
                        ? (
                          getFilieresForNiveauCode(nextSpecificNiveauCode).includes(editFormData.lycee_filiere)
                            ? editFormData.lycee_filiere
                            : getDefaultFiliereForNiveauCode(nextSpecificNiveauCode)
                        )
                        : '';

                      setEditFormData((prev) => ({
                        ...prev,
                        type: nextType,
                        niveau: nextType === 'generale' ? 'general' : (getLevelForNiveauCode(nextSpecificNiveauCode) || prev.niveau),
                        coefficients_by_niveau_code: normalizeGeneralTypeCoefficients(prev.coefficients_by_niveau_code, prev.coefficient),
                        specific_niveau_code: nextSpecificNiveauCode,
                        specific_coefficient: Number(prev.specific_coefficient || prev.coefficient || 1),
                        lycee_niveau_code: nextType === 'specifique' && isNextLyceeSpecific ? nextSpecificNiveauCode : '',
                        lycee_filiere: nextType === 'specifique' && isNextLyceeSpecific ? nextSpecificFiliere : '',
                      }));
                    }}
                    required
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {MATIERE_TYPE_OPTIONS.map((option) => (
                      <option key={`edit-type-${option.value}`} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                {editFormData.type === 'generale' ? (
                  <div className="sm:col-span-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {GENERAL_TYPE_NIVEAU_CODES.map((code) => (
                      <div key={`edit-${code}`}>
                        <label className="text-sm font-medium text-gray-700">Coef. {NIVEAU_CODE_LABELS[code] || code}</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={editFormData.coefficients_by_niveau_code?.[code] ?? ''}
                          onChange={(e) => setEditFormData((prev) => ({
                            ...prev,
                            coefficients_by_niveau_code: {
                              ...normalizeGeneralTypeCoefficients(prev.coefficients_by_niveau_code, prev.coefficient),
                              [code]: e.target.value,
                            },
                          }))}
                          required
                          className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="sm:col-span-3">
                      <label className="text-sm font-medium text-gray-700">Niveau specifique</label>
                      <select
                        value={editFormData.specific_niveau_code || 'tc'}
                        onChange={(e) => {
                          const nextCode = e.target.value;
                          const isNextLyceeSpecific = isLyceeNiveauCode(nextCode);
                          const filieres = getFilieresForNiveauCode(nextCode);
                          const nextFiliere = isNextLyceeSpecific
                            ? (
                              filieres.includes(editFormData.lycee_filiere)
                                ? editFormData.lycee_filiere
                                : (filieres[0] || '')
                            )
                            : '';

                          setEditFormData((prev) => ({
                            ...prev,
                            specific_niveau_code: nextCode,
                            niveau: getLevelForNiveauCode(nextCode) || prev.niveau,
                            lycee_niveau_code: isNextLyceeSpecific ? nextCode : '',
                            lycee_filiere: nextFiliere,
                          }));
                        }}
                        required
                        className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        {SPECIFIC_NIVEAU_OPTIONS.map((option) => (
                          <option key={`edit-specific-code-${option.value}`} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    {isLyceeNiveauCode(editFormData.specific_niveau_code || '') && (
                      <div className="sm:col-span-3">
                        <label className="text-sm font-medium text-gray-700">Filiere</label>
                        <select
                          value={editFormData.lycee_filiere || ''}
                          onChange={(e) => setEditFormData((prev) => ({ ...prev, lycee_filiere: e.target.value }))}
                          required
                          className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        >
                          <option value="">Choisir une filiere</option>
                          {getFilieresForNiveauCode(editFormData.specific_niveau_code || '').map((filiere) => (
                            <option key={`edit-filiere-${filiere}`} value={filiere}>{filiere}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="sm:col-span-2">
                      <label className="text-sm font-medium text-gray-700">Coefficient</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={editFormData.specific_coefficient ?? ''}
                        onChange={(e) => setEditFormData((prev) => ({ ...prev, specific_coefficient: e.target.value }))}
                        required
                        className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </>
                )}

                <div className="sm:col-span-6 flex justify-end gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setEditTarget(null)}
                    disabled={isSavingEdit}
                    className="px-5 py-2.5 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="px-5 py-2.5 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSavingEdit ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Nouvelle Matiere</h3>
              <button
                type="button"
                onClick={closeCreateForm}
                className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium"
              >
                Fermer
              </button>
            </div>
            <div className="p-6">
              {formError && <p className="text-red-600 text-sm mb-4">{formError}</p>}

              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-6 gap-4">
                <div className="sm:col-span-3">
                  <label className="text-sm font-medium text-gray-700">Nom de la matiere</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData((prev) => ({ ...prev, nom: e.target.value }))}
                    required
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      const nextType = e.target.value;
                      const nextSpecificNiveauCode = formData.specific_niveau_code || 'tc';
                      const isNextLyceeSpecific = isLyceeNiveauCode(nextSpecificNiveauCode);
                      const nextSpecificFiliere = isNextLyceeSpecific
                        ? (
                          getFilieresForNiveauCode(nextSpecificNiveauCode).includes(formData.lycee_filiere)
                            ? formData.lycee_filiere
                            : getDefaultFiliereForNiveauCode(nextSpecificNiveauCode)
                        )
                        : '';

                      setFormData((prev) => ({
                        ...prev,
                        type: nextType,
                        niveau: nextType === 'generale' ? 'general' : (getLevelForNiveauCode(nextSpecificNiveauCode) || prev.niveau),
                        coefficients_by_niveau_code: normalizeGeneralTypeCoefficients(prev.coefficients_by_niveau_code, prev.coefficient),
                        specific_niveau_code: nextSpecificNiveauCode,
                        specific_coefficient: Number(prev.specific_coefficient || prev.coefficient || 1),
                        lycee_niveau_code: nextType === 'specifique' && isNextLyceeSpecific ? nextSpecificNiveauCode : '',
                        lycee_filiere: nextType === 'specifique' && isNextLyceeSpecific ? nextSpecificFiliere : '',
                      }));
                    }}
                    required
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {MATIERE_TYPE_OPTIONS.map((option) => (
                      <option key={`create-type-${option.value}`} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-1">
                  <label className="text-sm font-medium text-gray-700">Coefficient</label>
>>>>>>>>> Temporary merge branch 2
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.coefficient}
                    onChange={(e) => setFormData((prev) => ({ ...prev, coefficient: e.target.value }))}
                    required
<<<<<<<<< Temporary merge branch 1
                    className="form-input"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                  <button type="button" onClick={closeCreateForm} className="btn btn-outline" disabled={isSaving}>
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isSaving}>
                    {isSaving ? 'Création...' : 'Créer la matière'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Edit Matiere */}
      <AnimatePresence>
        {editTarget && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            className="logout-modal-backdrop"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", bounce: 0.3 }}
              className="card w-full max-w-lg p-6"
            >
              <h3 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">Modifier Matière</h3>
              
              {editFormError && (
                <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2">
                  <AlertCircle size={16} /> {editFormError}
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
                <div className="form-group">
                  <label className="form-label">Nom de la matière</label>
                  <input
                    type="text"
                    value={editFormData.nom}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, nom: e.target.value }))}
                    required
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Coefficient</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editFormData.coefficient}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, coefficient: e.target.value }))}
                    required
                    className="form-input"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setEditTarget(null)} className="btn btn-outline" disabled={isSavingEdit}>
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isSavingEdit}>
                    {isSavingEdit ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Delete Confirmation */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            className="logout-modal-backdrop"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.4 }}
              className="logout-modal-card card"
            >
              <div className="logout-modal-icon">
                <Trash2 size={36} color="#ef4444" />
              </div>
              <h3 className="text-xl font-bold mb-2">Confirmer la suppression</h3>
              <p className="text-slate-500 mb-6">
                Voulez-vous vraiment supprimer la matière <strong className="text-slate-800">{deleteTarget.nom}</strong> ? Cette action est irréversible.
              </p>

              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="btn btn-outline flex-1"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="btn btn-danger flex-1"
                >
                  {isDeleting ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
=========
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-6 flex justify-end gap-3 mt-2">
                  <button
                    type="button"
                    onClick={closeCreateForm}
                    className="px-5 py-2.5 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
