import { useEffect, useState } from 'react';
import { Send, Paperclip, Clock, CheckCircle2, AlertCircle, LifeBuoy, X, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { professorGet, professorPost } from '../services/professorApi';

export default function Reclamation() {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  
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
      // If you need to handle file uploads properly via API, you would use FormData here
      await professorPost('/api/professeur/reclamations', {
        subject,
        category,
        message,
        // file would be appended to FormData in a real implementation
      });
      
      setStatusMsg({ type: 'success', text: 'Votre requÃªte a Ã©tÃ© envoyÃ©e Ã  l\'administration avec succÃ¨s.' });
      setSubject('');
      setCategory('');
      setMessage('');
      setFile(null);
      await loadComplaints();
      
      // Auto-hide success toast after 4 seconds
      setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
    } catch {
      setStatusMsg({ type: 'error', text: 'Ã‰chec de l\'envoi de la rÃ©clamation. Veuillez rÃ©essayer.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to colorize status badges dynamically
  const getStatusBadge = (status) => {
    const s = String(status).toLowerCase();
    if (s.includes('rÃ©solu') || s.includes('traitÃ©')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
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
    hidden: { opacity: 0, x: -10 },
    visible: (i) => ({ opacity: 1, x: 0, transition: { delay: i * 0.1, type: 'spring' } })
  };

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
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">RÃ©clamations & Support</h1>
          <p className="text-slate-500 text-sm mt-1">Contactez l'administration pour tout problÃ¨me technique ou administratif.</p>
        </div>
      </header>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 xl:grid-cols-12 gap-8"
      >
        {/* === LEFT COLUMN: SUBMISSION FORM === */}
        <motion.div variants={itemVariants} className="xl:col-span-7 flex flex-col gap-6">
          <div className="card p-6 md:p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-6 pb-4 border-b border-slate-100 flex items-center gap-2">
              <LifeBuoy className="text-blue-600" size={20} /> Ouvrir un nouveau ticket
            </h3>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="form-group">
                  <label className="form-label">Sujet principal</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ex: Panne du vidÃ©oprojecteur" 
                    value={subject} 
                    onChange={(e) => setSubject(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">CatÃ©gorie</label>
                  <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)} required>
                    <option value="">SÃ©lectionner une catÃ©gorie</option>
                    <option value="Technique">ProblÃ¨me Technique (IT, MatÃ©riel)</option>
                    <option value="PÃ©dagogique">MatÃ©riel PÃ©dagogique manquant</option>
                    <option value="Administratif">Ajustement Administratif (Emploi, etc.)</option>
                    <option value="Discipline">Signalement Disciplinaire</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description dÃ©taillÃ©e</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Veuillez dÃ©crire votre problÃ¨me en dÃ©tail afin que l'administration puisse vous aider rapidement..." 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)} 
                  required 
                  style={{ minHeight: '140px' }}
                />
              </div>

              {/* Improved File Attachment UI */}
              <div className="form-group">
                <label className="form-label">PiÃ¨ce jointe (Optionnel)</label>
                {!file ? (
                  <label className="flex items-center justify-center gap-2 p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-colors text-sm font-medium text-slate-600 group">
                    <Paperclip size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                    <span>Cliquez pour joindre un fichier, une photo ou une capture d'Ã©cran</span>
                    <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                  </label>
                ) : (
                  <div className="flex justify-between items-center p-3 bg-white border border-blue-200 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Paperclip size={16} />
                      </div>
                      <span className="text-sm font-semibold text-slate-700 truncate">{file.name}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setFile(null)} 
                      className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-md transition-colors"
                      title="Retirer le fichier"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                disabled={isSubmitting}
                className="btn btn-primary w-full py-3 mt-2 shadow-[0_4px_14px_rgba(59,130,246,0.25)]"
              >
                {isSubmitting ? (
                  <><span className="loading-spinner w-4 h-4 border-white mr-2"></span> Envoi en cours...</>
                ) : (
                  <><Send size={18} className="mr-2" /> Envoyer la requÃªte</>
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>

        {/* === RIGHT COLUMN: REQUEST HISTORY === */}
        <motion.div variants={itemVariants} className="xl:col-span-5">
          <div className="card p-0 overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-white">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <MessageSquare className="text-slate-400" size={20} /> Historique des requÃªtes
              </h3>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto bg-slate-50/50">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <span className="loading-spinner border-blue-500"></span>
                </div>
              ) : myReclamations.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <CheckCircle2 size={48} className="mx-auto mb-3 opacity-20 text-emerald-500" />
                  <p className="font-medium text-slate-600">Aucune requÃªte en cours.</p>
                  <p className="text-sm mt-1">Tout semble fonctionner parfaitement !</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {myReclamations.map((r, i) => (
                    <motion.div 
                      custom={i}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      key={r.id || i} 
                      className="p-5 border border-slate-200 rounded-xl bg-white hover:shadow-md transition-shadow cursor-default"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-extrabold text-slate-400 tracking-wider">
                          REC-{String(r.id || i + 1).padStart(5, '0')}
                        </span>
                        <span className={`badge border ${getStatusBadge(r.status || 'En attente')}`}>
                          {r.status || 'En attente'}
                        </span>
                      </div>
                      
                      <h4 className="font-bold text-slate-800 text-base mb-3 leading-snug">
                        {r.subject}
                      </h4>
                      
                      <div className="flex justify-between items-center text-xs font-medium text-slate-500 pt-3 border-t border-slate-50">
                        <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-600">
                          {r.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-slate-400" /> 
                          {r.date || 'Aujourd\'hui'}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {myReclamations.length > 0 && (
              <div className="p-4 bg-white border-t border-slate-100">
                <button className="btn btn-outline w-full justify-center bg-slate-50 border-slate-200 hover:bg-slate-100">
                  Voir tout l'historique
                </button>
              </div>
            )}
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
