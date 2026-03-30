import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ArrowLeft, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminUserForm({ mode = 'create', userToEdit = null, onBack, onSuccess, isModal = false }) {
  const isEditing = mode === 'edit' && !!userToEdit;

  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [loadWarning, setLoadWarning] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'etudiant',
    id_classe: '',
    id_parent: '',
    telephone: ''
  });

  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

  const parentUsers = useMemo(() => users.filter((u) => u.role === 'parent'), [users]);
  const selectedParent = parentUsers.find((p) => String(p.id) === String(formData.id_parent));

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setLoadWarning('');

        const [usersResult, classesResult] = await Promise.allSettled([
          axios.get(apiBaseUrl + '/api/admin/users', {
            withCredentials: true,
            headers: { Accept: 'application/json' }
          }),
          axios.get(apiBaseUrl + '/api/admin/classes', {
            withCredentials: true,
            headers: { Accept: 'application/json' }
          })
        ]);

        const usersData = usersResult.status === 'fulfilled' ? (usersResult.value.data || []) : [];
        const classesData = classesResult.status === 'fulfilled' ? (classesResult.value.data || []) : [];

        setUsers(usersData);
        setClasses(classesData);

        if (usersResult.status === 'rejected' || classesResult.status === 'rejected') {
          setLoadWarning("Certaines donnÃ©es du formulaire n'ont pas pu Ãªtre chargÃ©es.");
        }

        if (isEditing) {
          setFormData({
            name: userToEdit.name || '',
            email: userToEdit.email || '',
            password: '',
            role: userToEdit.role || 'etudiant',
            id_classe: userToEdit.id_classe || (classesData[0]?.id_classe ?? ''),
            id_parent: userToEdit.id_parent || '',
            telephone: userToEdit.telephone || ''
          });
        } else {
          const firstParent = usersData.find((u) => u.role === 'parent');
          setFormData((prev) => ({
            ...prev,
            id_classe: classesData[0]?.id_classe ?? '',
            id_parent: firstParent?.id ?? ''
          }));
        }
      } catch (error) {
        setLoadWarning("Erreur lors du chargement des dÃ©pendances.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [apiBaseUrl, isEditing, userToEdit]);

  const ensureCsrfCookie = async () => {
    await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', {
      withCredentials: true,
      withXSRFToken: true,
    });
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);

    try {
      await ensureCsrfCookie();

      if (isEditing) {
        await axios.put(`${apiBaseUrl}/api/admin/users/${userToEdit.id}`, formData, {
          withCredentials: true,
          withXSRFToken: true,
          headers: { Accept: 'application/json' }
        });
      } else {
        await axios.post(`${apiBaseUrl}/api/admin/users`, formData, {
          withCredentials: true,
          withXSRFToken: true,
          headers: { Accept: 'application/json' }
        });
      }

      if (onSuccess) onSuccess();
    } catch (err) {
      setFormError(err.response?.data?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const roles = [
    { value: 'etudiant', label: 'Ã‰tudiant' },
    { value: 'professeur', label: 'Professeur' },
    { value: 'parent', label: 'Parent' },
    { value: 'secretaire', label: 'SecrÃ©tariat' },
    { value: 'admin', label: 'Administrateur' },
    { value: 'directeur', label: 'Directeur' }
  ];

  // Animation variant for expanding/collapsing conditional form sections
  const expandCollapse = {
    hidden: { opacity: 0, height: 0, marginTop: 0, overflow: 'hidden' },
    visible: { 
      opacity: 1, 
      height: 'auto', 
      marginTop: '1.5rem',
      transition: { type: "spring", bounce: 0.3, duration: 0.5 } 
    },
    exit: { opacity: 0, height: 0, marginTop: 0, overflow: 'hidden', transition: { duration: 0.3 } }
  };

  if (loading) {
    return (
      <div className={isModal ? 'p-8' : 'layout-content'}>
        <div className="flex flex-col items-center justify-center py-12">
          <span className="loading-spinner border-blue-500 mb-4"></span>
          <p className="text-slate-500 font-medium">Chargement du formulaire...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={isModal ? 'bg-white rounded-xl' : 'layout-content'}>
      {/* Header - Renders differently if in a modal vs a standalone page */}
      {!isModal ? (
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
              {isEditing ? 'Modifier Utilisateur' : 'Nouvel Utilisateur'}
            </h1>
            <p className="text-slate-500 text-sm mt-1">Formulaire dÃ©diÃ© pour ajouter ou modifier un utilisateur.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onBack}
            className="btn btn-outline"
          >
            <ArrowLeft size={16} />
            Retour Ã  la gestion
          </motion.button>
        </header>
      ) : (
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">
            {isEditing ? 'Modifier Utilisateur' : 'Nouvel Utilisateur'}
          </h2>
          <button onClick={onBack} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
      )}

      <div className={isModal ? 'p-6' : 'card p-8'}>
        {loadWarning && (
          <div className="bg-orange-50 text-orange-700 border border-orange-200 p-4 rounded-lg mb-6 text-sm font-medium">
            {loadWarning}
          </div>
        )}
        
        {formError && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="auth-feedback auth-feedback-error mb-6">
            {formError}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Main Info Grid */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Nom complet</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="form-input"
                placeholder="Ex: Jean Dupont"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="form-input"
                placeholder="nom@ecole.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Mot de passe {isEditing && <span className="text-slate-400 font-normal text-xs ml-1">(Laisser vide pour ne pas modifier)</span>}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required={!isEditing}
                className="form-input"
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">RÃ´le</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="form-select"
              >
                {roles.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Conditional Fields using AnimatePresence for smooth transitions */}
          <AnimatePresence>
            {formData.role === 'etudiant' && (
              <motion.div 
                variants={expandCollapse}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="grid-2 p-5 bg-slate-50 border border-slate-100 rounded-xl"
              >
                <div className="form-group">
                  <label className="form-label">Classe de l'Ã©tudiant</label>
                  <select
                    name="id_classe"
                    value={formData.id_classe}
                    onChange={handleInputChange}
                    required
                    className="form-select"
                  >
                    <option value="">-- SÃ©lectionner une classe --</option>
                    {classes.map((c) => (
                      <option key={c.id_classe} value={c.id_classe}>{c.nom} ({c.niveau})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Parent de l'Ã©tudiant</label>
                  <select
                    name="id_parent"
                    value={formData.id_parent}
                    onChange={handleInputChange}
                    required
                    className="form-select"
                  >
                    <option value="">-- SÃ©lectionner un parent --</option>
                    {parentUsers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.telephone ? `(${p.telephone})` : ''}
                      </option>
                    ))}
                  </select>
                  {selectedParent?.telephone && (
                    <motion.small initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="block mt-1 text-xs text-slate-500 font-medium">
                      ðŸ“ž TÃ©lÃ©phone du parent: {selectedParent.telephone}
                    </motion.small>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {(formData.role === 'parent' || formData.role === 'directeur' || formData.role === 'professeur') && (
              <motion.div 
                variants={expandCollapse}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="form-group md:w-1/2">
                  <label className="form-label">
                    {formData.role === 'directeur' ? 'TÃ©lÃ©phone du directeur' : 
                     formData.role === 'professeur' ? 'TÃ©lÃ©phone du professeur' : 'TÃ©lÃ©phone du parent'}
                  </label>
                  <input
                    type="tel"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                    placeholder="Ex: 06 12 34 56 78"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onBack}
              disabled={saving}
              className="btn btn-outline"
            >
              Annuler
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? (
                <><span className="loading-spinner w-4 h-4 border-white mr-2"></span> Enregistrement...</>
              ) : (
                <><Save size={18} /> {isEditing ? 'Enregistrer les modifications' : 'CrÃ©er l\'utilisateur'}</>
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}
