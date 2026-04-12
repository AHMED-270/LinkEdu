import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { FiArrowLeft as ArrowLeft } from 'react-icons/fi';
import { BiSolidUserDetail } from 'react-icons/bi';
import { PROFESSOR_SUBJECTS_BY_LEVEL } from '../constants/professorSubjectsByLevel';

const SCHOOL_LEVELS = [
  { code: 'maternelle', label: 'Maternelle' },
  { code: 'primaire', label: 'Primaire' },
  { code: 'college', label: 'College' },
  { code: 'lycee', label: 'Lycee' },
];

const normalizeMatieres = (rawValue, fallback = '') => {
  let values = [];

  if (Array.isArray(rawValue)) {
    values = rawValue;
  } else if (typeof rawValue === 'string' && rawValue.trim() !== '') {
    try {
      const decoded = JSON.parse(rawValue);
      if (Array.isArray(decoded)) {
        values = decoded;
      }
    } catch {
      values = [];
    }
  }

  if (values.length === 0 && typeof fallback === 'string' && fallback.trim() !== '') {
    values = [fallback.trim()];
  }

  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))];
};

export default function AdminUserForm({ mode = 'create', userToEdit = null, onBack, onSuccess, isModal = false }) {
  const isEditing = mode === 'edit' && !!userToEdit;

  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [loadWarning, setLoadWarning] = useState('');
  const [showCreationToast, setShowCreationToast] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'secretaire',
    id_classe: '',
    id_parent: '',
    telephone: '',
    matiere_enseignement: '',
    matieres_enseignement: [],
    niveau_enseignement: ''
  });

  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

  const parentUsers = useMemo(() => users.filter((u) => u.role === 'parent'), [users]);
  const selectedParent = parentUsers.find((p) => String(p.id) === String(formData.id_parent));

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setLoadWarning('');

        const [usersResult, classesResult, matieresResult] = await Promise.allSettled([
          axios.get(apiBaseUrl + '/api/admin/users', {
            withCredentials: true,
            headers: { Accept: 'application/json' }
          }),
          axios.get(apiBaseUrl + '/api/admin/classes', {
            withCredentials: true,
            headers: { Accept: 'application/json' }
          }),
          axios.get(apiBaseUrl + '/api/admin/matieres', {
            withCredentials: true,
            headers: { Accept: 'application/json' }
          })
        ]);

        const usersData = usersResult.status === 'fulfilled' ? (usersResult.value.data || []) : [];
        const classesData = classesResult.status === 'fulfilled' ? (classesResult.value.data || []) : [];
        const matieresData = matieresResult.status === 'fulfilled' ? (matieresResult.value.data || []) : [];
        setUsers(usersData);
        setClasses(classesData);
        setMatieres(Array.isArray(matieresData) ? matieresData : []);

        if (
          usersResult.status === 'rejected'
          || classesResult.status === 'rejected'
          || matieresResult.status === 'rejected'
        ) {
          setLoadWarning('Certaines donnees du formulaire n\'ont pas pu etre chargees. Vous pouvez quand meme continuer.');
        }

        if (isEditing) {
          const selectedSubjects = normalizeMatieres(
            userToEdit.matieres_enseignement,
            userToEdit.matiere_enseignement
          );

          setFormData({
            name: userToEdit.name || '',
            email: userToEdit.email || '',
            role: userToEdit.role || 'secretaire',
            id_classe: userToEdit.id_classe || (classesData[0]?.id_classe ?? ''),
            id_parent: userToEdit.id_parent || '',
            telephone: userToEdit.telephone || '',
            matiere_enseignement: selectedSubjects[0] || userToEdit.matiere_enseignement || '',
            matieres_enseignement: selectedSubjects,
            niveau_enseignement: userToEdit.niveau_enseignement || ''
          });
        } else {
          const firstParent = usersData.find((u) => u.role === 'parent');
          setFormData((prev) => ({
            ...prev,
            id_classe: classesData[0]?.id_classe ?? '',
            id_parent: firstParent?.id ?? '',
            matiere_enseignement: '',
            matieres_enseignement: [],
            niveau_enseignement: ''
          }));
        }
      } catch (error) {
        console.error('Erreur fetch:', error);
        setLoadWarning('Certaines donnees du formulaire n\'ont pas pu etre chargees. Vous pouvez quand meme continuer.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [apiBaseUrl, isEditing, userToEdit]);

  const filteredProfessorMatieres = useMemo(() => {
    if (formData.role !== 'professeur') return matieres;
    if (!formData.niveau_enseignement) return [];

    // Include subjects assigned to the selected level + transversal "general" subjects
    const selectedLevel = String(formData.niveau_enseignement).toLowerCase();
    const filteredByLevel = matieres.filter((m) => {
      const matiereLevel = String(m.niveau || '').toLowerCase();
      return matiereLevel === selectedLevel || matiereLevel === 'general';
    });

    const uniqueByName = new Map();
    filteredByLevel.forEach((m) => {
      const key = String(m.nom || '').trim().toLowerCase();
      if (!key) return;

      const existing = uniqueByName.get(key);
      if (!existing) {
        uniqueByName.set(key, m);
        return;
      }

      if (String(m.niveau || '').toLowerCase() === selectedLevel) {
        uniqueByName.set(key, m);
      }
    });

    const uniqueSubjects = [...uniqueByName.values()];

    if (uniqueSubjects.length === 0) {
      const fallbackSubjects = PROFESSOR_SUBJECTS_BY_LEVEL[formData.niveau_enseignement] || [];
      return fallbackSubjects.map((subjectName) => ({
        id_matiere: subjectName,
        nom: subjectName,
        niveau: formData.niveau_enseignement,
        isFallback: true,
      }));
    }

    return uniqueSubjects.map((m) => ({
      id_matiere: String(m.nom).trim(),
      nom: m.nom,
      niveau: m.niveau,
      isFallback: false,
    }));
  }, [formData.role, formData.niveau_enseignement, matieres]);

  useEffect(() => {
    if (formData.role !== 'professeur') return;

    const allowedSubjectNames = new Set(
      filteredProfessorMatieres
        .map((matiere) => String(matiere?.nom || '').trim())
        .filter(Boolean)
    );

    setFormData((previous) => {
      const filteredSelection = previous.matieres_enseignement.filter((name) => allowedSubjectNames.has(String(name || '').trim()));

      if (filteredSelection.length === previous.matieres_enseignement.length) {
        return previous;
      }

      return {
        ...previous,
        matieres_enseignement: filteredSelection,
        matiere_enseignement: filteredSelection[0] || '',
      };
    });
  }, [formData.role, filteredProfessorMatieres]);

  const ensureCsrfCookie = async () => {
    await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', {
      withCredentials: true,
      withXSRFToken: true,
    });
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    if (formData.role !== 'professeur') {
      if (formData.matiere_enseignement || formData.niveau_enseignement || formData.matieres_enseignement.length > 0) {
        setFormData((prev) => ({
          ...prev,
          matiere_enseignement: '',
          matieres_enseignement: [],
          niveau_enseignement: '',
        }));
      }
    }
  }, [formData.role, formData.matiere_enseignement, formData.matieres_enseignement, formData.niveau_enseignement]);

  const handleMatiereToggle = (matiereName) => {
    setFormData((previous) => {
      const name = String(matiereName || '').trim();
      if (!name) return previous;

      const exists = previous.matieres_enseignement.includes(name);
      const updated = exists
        ? previous.matieres_enseignement.filter((item) => item !== name)
        : [...previous.matieres_enseignement, name];

      return {
        ...previous,
        matieres_enseignement: updated,
        matiere_enseignement: updated[0] || '',
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);

    if (formData.role === 'professeur' && formData.matieres_enseignement.length === 0) {
      setFormError('Veuillez selectionner au moins une matiere configuree pour ce niveau.');
      setSaving(false);
      return;
    }
  

    const payload = {
      ...formData,
      matieres_enseignement: [...new Set((formData.matieres_enseignement || []).map((v) => String(v || '').trim()).filter(Boolean))],
      matiere_enseignement: (formData.matieres_enseignement || [])[0] || formData.matiere_enseignement || '',
    };

    try {
      await ensureCsrfCookie();

      if (isEditing) {
        await axios.put(`${apiBaseUrl}/api/admin/users/${userToEdit.id}`, payload, {
          withCredentials: true,
          withXSRFToken: true,
          headers: { Accept: 'application/json' }
        });
      } else {
        await axios.post(`${apiBaseUrl}/api/admin/users`, payload, {
          withCredentials: true,
          withXSRFToken: true,
          headers: { Accept: 'application/json' }
        });

        setShowCreationToast(true);
        setTimeout(() => {
          setShowCreationToast(false);
          if (onSuccess) onSuccess();
        }, 2200);
        return;
      }

      if (onSuccess) onSuccess();
    } catch (err) {
      setFormError(err.response?.data?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const roles = [
    { value: 'professeur', label: 'Professeur' },
    { value: 'secretaire', label: 'Secretariat' },
    { value: 'directeur', label: 'Directeur' }
  ];

  const inputClassName = 'block w-full px-3 py-2.5 border border-black rounded-xl bg-white hover:border-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-0 focus:border-black transition-colors duration-150';
  const selectClassName = 'block w-full py-2.5 px-3 border border-black bg-white rounded-xl hover:border-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-0 focus:border-black transition-colors duration-150';

  if (loading) {
    return (
      <div className={isModal ? '' : 'dashboard-content'}>
        <p>Chargement du formulaire...</p>
      </div>
    );
  }

  return (
    <div className={isModal ? '' : 'dashboard-content'}>
      {showCreationToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[92%] sm:w-auto rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800 shadow-lg">
          Le mot de passe est genere automatiquement et envoye par email a l'utilisateur.
        </div>
      )}

      {!isModal && (
        <header className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="mt-1 flex items-center gap-2 text-4xl lg:text-5xl font-extrabold italic tracking-tight text-slate-900">
              <BiSolidUserDetail className="text-blue-600" />
              {isEditing ? 'Modifier Utilisateur' : 'Nouvel Utilisateur'}
            </h1>
          </div>
          <button
            type="button"
            onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0f172a', color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500' }}
          > 
            <ArrowLeft size={16} />
            Retour 
          </button>
        </header>
      )}

      <div
        className={isModal ? 'bg-white rounded-2xl border border-gray-200 overflow-hidden' : 'bg-white border border-gray-100 rounded-2xl overflow-hidden'}
        style={!isModal ? { marginBottom: '20px' } : undefined}
      >
        {isModal && (
          <div className="px-6 pt-6 pb-4 border-b border-gray-100 bg-gray-50/70">
            <p className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Users / {isEditing ? 'Modifier' : 'Ajouter'}</p>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-1">{isEditing ? 'Modifier un Utilisateur' : 'Ajouter un Utilisateur'}</h2>
            <p className="text-sm text-gray-500 mt-1">Creation manuelle reservee aux cadres: secretaire, professeur, directeur.</p>
          </div>
        )}

        <div className="p-6 sm:p-8">
          {loadWarning && (
            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
              {loadWarning}
            </div>
          )}
          {formError && (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-8 mt-2">
            <section className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BiSolidUserDetail className="text-blue-600" />
                Informations de compte
              </h2>
              <p className="text-sm text-gray-500 mt-1">Identite du compte et role assigne dans la plateforme.</p>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Nom complet</label>
                  <input
                    type="text"
                    name="name"
                    placeholder='Saisir le nom et le prénom'
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className={inputClassName}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">E-mail professionnel</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Saisir l'email de l'utilisateur"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className={inputClassName}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Role assigne</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className={selectClassName}
                  >
                    {roles.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Téléphone</label>
                  <input
                    type="tel"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleInputChange}
                    required
                    placeholder="Ex: 0612345678"
                    className={inputClassName}
                  />
                </div>

                {formData.role === 'professeur' && (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">Niveau enseigne</label>
                      <select
                        name="niveau_enseignement"
                        value={formData.niveau_enseignement}
                        onChange={handleInputChange}
                        required
                        className={selectClassName}
                      >
                        <option value="">Selectionner un niveau</option>
                        {SCHOOL_LEVELS.map((level) => (
                          <option key={level.code} value={level.code}>{level.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2 flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">
                        Matieres enseignees ({formData.matieres_enseignement.length} selectionnee(s))
                      </label>
                      <p className="text-xs text-gray-500">
                        Source: base de donnees (niveau enseigne + matieres General transversales).
                      </p>
                      <div className="max-h-56 overflow-y-auto rounded-xl border border-black bg-white p-3">
                        {!formData.niveau_enseignement ? (
                          <p className="px-2 py-1 text-sm text-gray-500">Choisissez d'abord le niveau enseigne pour afficher les matieres.</p>
                        ) : filteredProfessorMatieres.length === 0 ? (
                          <p className="px-2 py-1 text-sm text-gray-500">Aucune matiere configuree pour ce niveau.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {filteredProfessorMatieres.map((matiere) => {
                              const value = String(matiere.nom || '').trim();
                              if (!value) return null;

                              const isChecked = formData.matieres_enseignement.includes(value);
                              const key = String(matiere.id_matiere || matiere.id || value);

                              return (
                                <label
                                  key={key}
                                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                                    isChecked ? 'bg-blue-50 text-blue-700 border border-black' : 'hover:bg-gray-50 text-gray-700 border border-black'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleMatiereToggle(value)}
                                  />
                                  <span>{value}</span>
                                  {matiere.isFallback ? (
                                    <span className="ml-auto rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                      Mode profil
                                    </span>
                                  ) : (
                                    <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                      BD
                                    </span>
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>

                    </div>
                  </>
                )}
              </div>
            </section>

            <div className="flex flex-wrap gap-3 justify-end pt-1">
              <button
                type="button"
                onClick={onBack}
                disabled={saving}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
