import { useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowLeft, Save, X, AlertCircle, Check, Users, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ROLE } from '../constants/roles';

export default function AdminClassForm({ mode = 'create', classToEdit = null, onBack, onSuccess, isModal = false }) {
  const isEditing = mode === 'edit' && !!classToEdit;
  const [professeurs, setProfesseurs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    nom: '',
    niveau: '',
    professeur_ids: []
  });
  const [formMsg, setFormMsg] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);

  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

  useEffect(() => {
    const fetchProfesseurs = async () => {
      try {
        setLoading(true);
        const response = await axios.get(apiBaseUrl + '/api/admin/users', {
          withCredentials: true,
          headers: { Accept: 'application/json' }
        });

        const profs = (response.data || []).filter((u) => u.role === ROLE.PROFESSEUR);
        setProfesseurs(profs);

        if (isEditing) {
          setFormData({
            nom: classToEdit.nom || '',
            niveau: classToEdit.niveau || '',
            professeur_ids: Array.isArray(classToEdit.professeurs_ids)
              ? classToEdit.professeurs_ids.map((id) => String(id))
              : []
          });
        } else {
          setFormData({ nom: '', niveau: '', professeur_ids: [] });
        }
      } catch (error) {
        setFormMsg({ type: 'error', text: 'Impossible de charger la liste des professeurs.' });
      } finally {
        setLoading(false);
      }
    };

    fetchProfesseurs();
  }, [apiBaseUrl, isEditing, classToEdit]);

  const ensureCsrfCookie = async () => {
    await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', {
      withCredentials: true,
      withXSRFToken: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormMsg({ type: '', text: '' });
    setSaving(true);

    if (!formData.professeur_ids || formData.professeur_ids.length === 0) {
      setFormMsg({ type: 'error', text: 'Veuillez sÃ©lectionner au moins un professeur pour cette classe.' });
      setSaving(false);
      return;
    }

    const payload = {
      nom: formData.nom,
      niveau: formData.niveau,
      professeur_ids: formData.professeur_ids.map((id) => Number(id))
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
      setFormMsg({ 
        type: 'error', 
        text: error.response?.data?.message || "Erreur lors de l'enregistrement de la classe." 
      });
    } finally {
      setSaving(false);
    }
  };

  // Toggle Professor Selection
  const toggleProfessor = (profId) => {
    const idStr = String(profId);
    setFormData((prev) => {
      const isSelected = prev.professeur_ids.includes(idStr);
      if (isSelected) {
        return { ...prev, professeur_ids: prev.professeur_ids.filter((id) => id !== idStr) };
      } else {
        return { ...prev, professeur_ids: [...prev.professeur_ids, idStr] };
      }
    });
  };

  // Framer Motion Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
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
      {/* Header */}
      {!isModal ? (
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
              {isEditing ? 'Modifier Classe' : 'Nouvelle Classe'}
            </h1>
            <p className="text-slate-500 text-sm mt-1">GÃ©rez les informations et le corps professoral de cette classe.</p>
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
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap size={24} className="text-blue-600" />
            {isEditing ? 'Modifier Classe' : 'Nouvelle Classe'}
          </h2>
          <button onClick={onBack} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
      )}

      {/* Form Card */}
      <div className={isModal ? 'p-6' : 'card p-8'}>
        <AnimatePresence>
          {formMsg.text && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-xl flex items-center gap-3 font-medium text-sm mb-6 ${
                formMsg.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              }`}
            >
              <AlertCircle size={20} /> {formMsg.text}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.form 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          onSubmit={handleSubmit} 
          className="flex flex-col gap-6"
        >
          {/* Inputs Row */}
          <div className="grid-2">
            <motion.div variants={itemVariants} className="form-group">
              <label className="form-label">Nom de la classe</label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
                className="form-input"
                placeholder="Ex: 1Ã¨re AnnÃ©e Dev"
              />
            </motion.div>
            <motion.div variants={itemVariants} className="form-group">
              <label className="form-label">Niveau</label>
              <input
                type="text"
                value={formData.niveau}
                onChange={(e) => setFormData({ ...formData, niveau: e.target.value })}
                required
                className="form-input"
                placeholder="Ex: Bac+2"
              />
            </motion.div>
          </div>

          {/* Professor Multi-Select Section */}
          <motion.div variants={itemVariants} className="form-group mt-2">
            <div className="flex justify-between items-end mb-2">
              <label className="form-label mb-0 flex items-center gap-2">
                <Users size={16} className="text-slate-400" /> Professeurs AssignÃ©s
              </label>
              <span className="badge badge-blue bg-blue-50 text-blue-600 border border-blue-100">
                {formData.professeur_ids.length} sÃ©lectionnÃ©(s)
              </span>
            </div>
            
            <div className="border border-slate-200 rounded-xl max-h-[260px] overflow-y-auto p-2 bg-slate-50/50 shadow-inner">
              {professeurs.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <Users size={32} className="mx-auto mb-2 opacity-20" />
                  <p>Aucun professeur disponible dans la base de donnÃ©es.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {professeurs.map((p) => {
                    const isChecked = formData.professeur_ids.includes(String(p.id));
                    return (
                      <div
                        key={p.id}
                        onClick={() => toggleProfessor(p.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${
                          isChecked 
                            ? 'bg-blue-50 border-blue-200 shadow-[0_2px_8px_rgba(59,130,246,0.1)]' 
                            : 'bg-white border-transparent hover:border-slate-200 hover:shadow-sm'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors border ${
                          isChecked ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'
                        }`}>
                          {isChecked && <Check size={14} className="text-white" strokeWidth={3} />}
                        </div>
                        <span className={`text-sm ${isChecked ? 'font-bold text-blue-800' : 'font-medium text-slate-700'}`}>
                          {p.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>

          {/* Form Actions */}
          <motion.div variants={itemVariants} className="flex justify-end gap-3 mt-4 pt-6 border-t border-slate-100">
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
              className="btn btn-primary shadow-[0_4px_14px_rgba(59,130,246,0.25)]"
            >
              {saving ? (
                <><span className="loading-spinner w-4 h-4 border-white mr-2"></span> Enregistrement...</>
              ) : (
                <><Save size={18} /> {isEditing ? 'Enregistrer les modifications' : 'CrÃ©er la classe'}</>
              )}
            </motion.button>
          </motion.div>

        </motion.form>
      </div>
    </div>
  );
}
