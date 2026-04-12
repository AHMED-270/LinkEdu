import { useEffect, useMemo, useState } from 'react';
import { Send, Clock, CheckCircle2, AlertCircle, MessageSquare, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { professorGet, professorPost } from '../services/professorApi';

export default function Reclamation() {
  const [title, setTitle] = useState('');
  const [cible, setCible] = useState('directeur');
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [myReclamations, setMyReclamations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const data = await professorGet('/api/professeur/reclamations');
      setMyReclamations(data.complaints || []);
    } catch {
      // Graceful fallback if API fails
      setMyReclamations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMsg({ type: '', text: '' });

    try {
      if (!title.trim() || !message.trim()) {
        setStatusMsg({ type: 'error', text: 'Le titre et la description sont obligatoires.' });
        setIsSubmitting(false);
        return;
      }

      await professorPost('/api/professeur/reclamations', {
        subject: title.trim(),
        category: 'General',
        cible,
        message: message.trim(),
      });
      
      setStatusMsg({ type: 'success', text: 'Votre requête a été envoyée à l\'administration avec succès.' });
      setTitle('');
      setCible('directeur');
      setMessage('');
      await loadComplaints();
      
      // Auto-hide success toast after 4 seconds
      setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
    } catch {
      setStatusMsg({ type: 'error', text: 'Échec de l\'envoi de la réclamation. Veuillez réessayer.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to colorize status badges dynamically
  const getStatusBadge = (status) => {
    const s = String(status).toLowerCase();
    if (s.includes('résolu') || s.includes('traité')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (s.includes('en cours')) return 'bg-blue-50 text-blue-600 border-blue-100';
    return 'bg-orange-50 text-orange-600 border-orange-100'; // En attente
  };

  // Framer Motion Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, type: 'spring' } })
  };

  const targetLabel = (target) => {
    if (target === 'secretaire') return 'Secrétaire';
    if (target === 'les_deux') return 'Directeur + Secrétaire';
    return 'Directeur';
  };

  const filteredReclamations = useMemo(() => {
    const key = searchTerm.trim().toLowerCase();
    if (!key) return myReclamations;

    return myReclamations.filter((item) =>
      String(item.subject || '').toLowerCase().includes(key) ||
      String(item.message || '').toLowerCase().includes(key)
    );
  }, [myReclamations, searchTerm]);

  return (
    <div className="layout-content relative">
      
      {/* Floating Success/Error Toast */}
      <AnimatePresence>
        {statusMsg.text && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-8 right-8 z-50 flex items-center gap-3 px-4 py-3 bg-white border rounded-xl shadow-lg ${
              statusMsg.type === 'error' ? 'border-red-100' : 'border-emerald-100'
            }`}
          >
            {statusMsg.type === 'error' ? (
              <AlertCircle size={20} className="text-red-500" />
            ) : (
              <CheckCircle2 size={20} className="text-emerald-500" />
            )}
            <span className="text-sm font-bold text-slate-700">{statusMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Gestion des Réclamations</h1>
          <p className="text-slate-500 text-sm mt-1">Suivez vos réclamations et envoyez un nouveau message.</p>
        </div>
      </header>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 xl:grid-cols-12 gap-8"
      >
        {/* === LEFT COLUMN: HISTORY TABLE === */}
        <motion.div variants={itemVariants} className="xl:col-span-8">
          <div className="card p-0 overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-white">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <MessageSquare className="text-slate-400" size={20} /> Publications des réclamations
                </h3>
                <div className="relative w-full md:w-80">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    className="form-input pl-9 w-full"
                    placeholder="Rechercher une réclamation..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto bg-slate-50/50">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <span className="loading-spinner border-blue-500"></span>
                </div>
              ) : filteredReclamations.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <CheckCircle2 size={48} className="mx-auto mb-3 opacity-20 text-emerald-500" />
                  <p className="font-medium text-slate-600">Aucune réclamation trouvée.</p>
                  <p className="text-sm mt-1">Essayez avec un autre mot-clé.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[680px]">
                    <thead>
                      <tr className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                        <th className="py-3 px-3 font-bold">Date</th>
                        <th className="py-3 px-3 font-bold">Titre</th>
                        <th className="py-3 px-3 font-bold">Description</th>
                        <th className="py-3 px-3 font-bold">Public cible</th>
                        <th className="py-3 px-3 font-bold">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReclamations.map((r, i) => (
                        <motion.tr
                          custom={i}
                          variants={cardVariants}
                          initial="hidden"
                          animate="visible"
                          key={r.id || i}
                          className="border-b border-slate-100 bg-white hover:bg-slate-50/70"
                        >
                          <td className="py-3 px-3 text-sm text-slate-600 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1">
                              <Clock size={12} className="text-slate-400" />
                              {r.date || 'Aujourd\'hui'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-sm font-semibold text-slate-800">{r.subject}</td>
                          <td className="py-3 px-3 text-sm text-slate-600 max-w-[320px] truncate">{r.message}</td>
                          <td className="py-3 px-3 text-sm">
                            <span className="bg-blue-50 px-2 py-1 rounded-md text-blue-700 border border-blue-100">
                              {targetLabel(r.cible)}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-sm">
                            <span className={`badge border ${getStatusBadge(r.status || 'En attente')}`}>
                              {r.status || 'En attente'}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* === RIGHT COLUMN: SIMPLE FORM === */}
        <motion.div variants={itemVariants} className="xl:col-span-4 flex flex-col gap-6">
          <div className="card p-0 overflow-hidden">
            <div className="bg-blue-600 text-white p-6">
              <h3 className="text-lg font-bold">Nouvelle Réclamation</h3>
              <p className="text-blue-100 text-sm mt-1">Envoyez votre réclamation à la bonne personne.</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Titre</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Sujet de votre réclamation"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  placeholder="Saisissez votre réclamation ici..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  style={{ minHeight: '140px',  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Public cible</label>
                <select className="form-select" value={cible} onChange={(e) => setCible(e.target.value)} required>
                  <option value="directeur">Directeur</option>
                  <option value="secretaire">Secrétaire</option>
                  <option value="les_deux">Les deux</option>
                </select>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary w-full py-3 mt-2"
              >
                {isSubmitting ? (
                  <><span className="loading-spinner w-4 h-4 border-white mr-2"></span> Envoi...</>
                ) : (
                  <><Send size={16} className="mr-2" /> Envoyer</>
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}

