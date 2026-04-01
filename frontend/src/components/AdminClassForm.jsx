import { useEffect, useState } from 'react';
import axios from 'axios';
import { FiArrowLeft as ArrowLeft } from 'react-icons/fi';
import { FiPlus as Plus } from 'react-icons/fi';
import { BiSolidUserDetail } from 'react-icons/bi';

export default function AdminClassForm({ mode = 'create', classToEdit = null, onBack, onSuccess, isModal = false }) {
  const isEditing = mode === 'edit' && !!classToEdit;
  const [professeurs, setProfesseurs] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [selectedProfForModal, setSelectedProfForModal] = useState(null);
  const [selectedMatieres, setSelectedMatieres] = useState([]);

  const [formData, setFormData] = useState({
    nom: '',
    niveau: '',
    filiere: '',
    pricing: 0,
    professeur_ids: []
  });
  const [classOptions, setClassOptions] = useState({
    niveaux: [],
    filieresByNiveau: {},
    pricingByNiveauFiliere: {}
  });
  const [professeurMatieres, setProfesseurMatieres] = useState({});
  const [formMsg, setFormMsg] = useState('');
  const [saving, setSaving] = useState(false);

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
        });

        if (isEditing) {
          setFormData({
            nom: classToEdit.nom || '',
            niveau: classToEdit.niveau || '',
            filiere: classToEdit.filiere || '',
            pricing: Number(classToEdit.pricing) || 0,
            professeur_ids: Array.isArray(classToEdit.professeurs_ids)
              ? classToEdit.professeurs_ids.map((id) => String(id))
              : []
          });
        } else {
          setFormData({
            nom: '',
            niveau: '',
            filiere: '',
            pricing: 0,
            professeur_ids: []
          });
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

    if (!formData.professeur_ids || formData.professeur_ids.length === 0) {
      setFormMsg('Veuillez selectionner au moins un professeur.');
      setSaving(false);
      return;
    }

    // Check if all professors have at least one matière assigned
    const missingMatieres = formData.professeur_ids.some(profId => !professeurMatieres[profId] || professeurMatieres[profId].length === 0);
    if (missingMatieres) {
      setFormMsg('Chaque professeur doit avoir au moins une matière assignée.');
      setSaving(false);
      return;
    }

    const payload = {
      nom: formData.nom,
      niveau: formData.niveau,
      filiere: formData.filiere,
      pricing: Number(formData.pricing),
      professeur_ids: formData.professeur_ids.map((id) => Number(id)),
      professeur_matieres: Object.fromEntries(
        Object.entries(professeurMatieres).map(([profId, matIds]) => [
          profId,
          matIds.map(id => Number(id))
        ])
      )
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

  return (
    <div className={isModal ? 'bg-[#f8fafc]' : 'dashboard-content bg-gray-50/30'}>
      {/* Modal for Assigning Matières to Professor */}
      {selectedProfForModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '90%',
            padding: '32px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#0f172a',
              marginBottom: '12px',
            }}>
              Assigner les matières
            </h3>
            <p style={{
              color: '#64748b',
              fontSize: '0.95rem',
              marginBottom: '24px',
              lineHeight: '1.5',
            }}>
              Sélectionnez une ou plusieurs matières pour <strong>{selectedProfForModal.name}</strong>
            </p>

            <div style={{
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px',
              maxHeight: '300px',
              overflowY: 'auto',
              marginBottom: '24px',
            }}>
              {matieres.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', padding: '16px' }}>
                  Aucune matière disponible
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {matieres.map((mat) => {
                    const matId = String(mat.id_matiere || mat.id || mat.ID);
                    const isSelected = selectedMatieres.includes(matId);
                    return (
                    <label key={matId} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#dbeafe' : '#f8fafc',
                      border: '1px solid ' + (isSelected ? '#93c5fd' : '#e2e8f0'),
                    }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMatieres([...selectedMatieres, matId]);
                          } else {
                            setSelectedMatieres(selectedMatieres.filter(id => id !== matId));
                          }
                        }}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span style={{ fontWeight: '500', color: '#1e293b' }}>
                        {mat.nom}
                      </span>
                    </label>
                  );
                  })}
                </div>
              )}
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => {
                  setSelectedProfForModal(null);
                  setSelectedMatieres([]);
                  // Remove professor if no matieres selected
                  if (selectedMatieres.length === 0) {
                    setFormData(prev => ({
                      ...prev,
                      professeur_ids: prev.professeur_ids.filter(id => id !== String(selectedProfForModal.id))
                    }));
                  }
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: 'white',
                  color: '#475569',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (selectedMatieres.length > 0) {
                    setProfesseurMatieres({
                      ...professeurMatieres,
                      [String(selectedProfForModal.id)]: selectedMatieres
                    });
                    setSelectedProfForModal(null);
                    setSelectedMatieres([]);
                  } else {
                    alert('Veuillez sélectionner au moins une matière.');
                  }
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

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
            <section className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-12">
                <div className="md:col-span-4 bg-slate-50 p-6 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col justify-center">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">Identité</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">Informations de base pour identifier la classe dans le système.</p>
                </div>
                <div className="md:col-span-8 p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Nom de la classe</label>
                    <input
                      type="text"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      required
                      placeholder="Ex: 3ème B"
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Niveau scolaire</label>
                    <select
                      value={formData.niveau}
                      onChange={(e) => setFormData({ ...formData, niveau: e.target.value })}
                      required
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                    >
                      <option value="">Sélectionner un niveau...</option>
                      {classOptions.niveaux.map((niv) => (
                        <option key={niv.code} value={niv.code}>{niv.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {/* Section: Filière & Pricing */}
            <section className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-12">
                <div className="md:col-span-4 bg-slate-50 p-6 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col justify-center">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">Structure</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">Définissez la filière et le coût de scolarité pour cette classe.</p>
                </div>
                <div className="md:col-span-8 p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Filière</label>
                    <select
                      value={formData.filiere}
                      onChange={(e) => setFormData({ ...formData, filiere: e.target.value })}
                      required
                      disabled={!formData.niveau}
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                    >
                      <option value="">Sélectionner une filière...</option>
                      {availableFilieres.map((fil) => (
                        <option key={fil} value={fil}>{fil}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Coût de scolarité (DH)</label>
                    <input
                      type="number"
                      value={formData.pricing}
                      onChange={(e) => setFormData({ ...formData, pricing: e.target.value })}
                      min="0"
                      step="100"
                      placeholder="Entrer le coût de scolarité"
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Professeurs */}
            <section className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-12">
                <div className="md:col-span-4 bg-slate-50 p-6 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col justify-center">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">Enseignants</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">Sélectionnez les professeurs habilités à intervenir dans cette classe.</p>
                  <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    <span className="text-[10px] font-bold text-blue-700 uppercase">{formData.professeur_ids.length} Sélectionné(s)</span>
                  </div>
                </div>
                <div className="md:col-span-8 p-6 bg-white">
                  <div className="border border-slate-100 rounded-xl bg-slate-50/30 p-2 max-h-[300px] overflow-y-auto custom-scrollbar shadow-inner">
                    {professeurs.length === 0 ? (
                      <div className="p-10 text-center text-slate-400 italic text-sm">Chargement ou aucun professeur disponible...</div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {professeurs.map((p) => {
                          const checked = formData.professeur_ids.includes(String(p.id));
                          return (
                            <label 
                              key={p.id} 
                              className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group ${
                                checked 
                                  ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500/5' 
                                  : 'bg-white border-slate-100 hover:border-slate-300'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                checked ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 border-slate-200'
                              }`}>
                                {checked && <Plus className="rotate-45" size={14} strokeWidth={4} />}
                              </div>
                              <input
                                type="checkbox"
                                className="hidden"
                                checked={checked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData(prev => ({ ...prev, professeur_ids: [...prev.professeur_ids, String(p.id)] }));
                                    setSelectedProfForModal(p);
                                    setSelectedMatieres(professeurMatieres[String(p.id)] || []);
                                  } else {
                                    setFormData(prev => ({ ...prev, professeur_ids: prev.professeur_ids.filter(id => id !== String(p.id)) }));
                                    const newMatieres = { ...professeurMatieres };
                                    delete newMatieres[String(p.id)];
                                    setProfesseurMatieres(newMatieres);
                                  }
                                }}
                              />
                              <div className="overflow-hidden">
                                <span className={`text-sm font-bold block truncate transition-colors ${checked ? 'text-blue-700' : 'text-slate-600 group-hover:text-slate-900'}`}>{p.name}</span>
                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">PROFESSEUR</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-4 border-t border-slate-100 mt-10">
              <button
                type="button"
                onClick={onBack}
                disabled={saving}
                className="px-8 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-all text-sm active:scale-95 disabled:opacity-50"
              >
                ANNULER
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-10 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black transition-all shadow-lg shadow-blue-200 text-sm active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ENREGISTREMENT...
                  </>
                ) : (
                  'CONFIRMER ET ENREGISTRER'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
