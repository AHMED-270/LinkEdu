import { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, X, File, BookOpen, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const existingResources = [
  { id: 1, title: 'Cours - MÃ©canique Newtonienne', type: 'Cours', matiere: 'Physique', class: '2BAC - G1', date: '20 Mars 2026' },
  { id: 2, title: 'Fiche - Tableau pÃ©riodique', type: 'Fiche', matiere: 'Chimie', class: 'Toutes', date: '18 Mars 2026' },
  { id: 3, title: 'Exercices corrigÃ©s - Optique', type: 'Exercice', matiere: 'Physique', class: '1BAC - G3', date: '15 Mars 2026' },
  { id: 4, title: 'TP - Extraction liquide-liquide', type: 'TP', matiere: 'Chimie', class: 'TCS - G2', date: '12 Mars 2026' },
  { id: 5, title: 'RÃ©sumÃ© - CinÃ©matique', type: 'Cours', matiere: 'Physique', class: '2BAC - G2', date: '10 Mars 2026' },
];

export default function Ressources() {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [matiere, setMatiere] = useState('');
  const [classe, setClasse] = useState('');
  const [visibility, setVisibility] = useState('classe');
  const [files, setFiles] = useState([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (indexToRemove) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate network request
    setTimeout(() => {
      setToast('Ressource publiÃ©e avec succÃ¨s !');
      setTitle(''); setType(''); setMatiere(''); setClasse(''); setFiles([]);
      setIsSubmitting(false);
      
      // Clear toast after 3 seconds
      setTimeout(() => setToast(''), 3000);
    }, 800);
  };

  // Type badge color mapping
  const getTypeBadgeClass = (resourceType) => {
    switch (resourceType) {
      case 'Cours': return 'badge-blue bg-blue-50 text-blue-600 border border-blue-100';
      case 'Exercice': return 'badge-green bg-emerald-50 text-emerald-600 border border-emerald-100';
      case 'TP': return 'badge-orange bg-orange-50 text-orange-600 border border-orange-100';
      case 'Fiche': return 'badge-gray bg-purple-50 text-purple-600 border border-purple-100';
      default: return 'badge-gray bg-slate-50 text-slate-600 border border-slate-200';
    }
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

  const tableRowVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (i) => ({ opacity: 1, x: 0, transition: { delay: i * 0.05, type: 'spring' } })
  };

  return (
    <div className="layout-content relative">
      
      {/* Floating Success Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-8 right-8 z-50 flex items-center gap-3 px-4 py-3 bg-white border border-emerald-100 rounded-xl shadow-lg"
          >
            <CheckCircle2 size={20} className="text-emerald-500" />
            <span className="text-sm font-bold text-slate-700">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Ressources PÃ©dagogiques</h1>
          <p className="text-slate-500 text-sm mt-1">Partagez et gÃ©rez les documents pÃ©dagogiques pour vos classes.</p>
        </div>
      </header>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 xl:grid-cols-12 gap-8"
      >
        {/* === LEFT COLUMN: PUBLISH FORM (Takes up 4 cols on large screens) === */}
        <motion.div variants={itemVariants} className="xl:col-span-4 flex flex-col gap-6">
          <div className="card p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6 pb-4 border-b border-slate-100 flex items-center gap-2">
              <UploadCloud className="text-blue-600" size={20} /> Nouvelle ressource
            </h3>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="form-group">
                <label className="form-label">Titre de la ressource</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: Chapitre 4 - Thermodynamique" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-select" value={type} onChange={(e) => setType(e.target.value)} required>
                    <option value="">SÃ©lectionner</option>
                    <option value="cours">Cours</option>
                    <option value="fiche">Fiche de rÃ©vision</option>
                    <option value="exercice">Exercices</option>
                    <option value="tp">Travaux Pratiques</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">MatiÃ¨re</label>
                  <select className="form-select" value={matiere} onChange={(e) => setMatiere(e.target.value)} required>
                    <option value="">SÃ©lectionner</option>
                    <option value="physique">Physique</option>
                    <option value="chimie">Chimie</option>
                    <option value="maths">MathÃ©matiques</option>
                    <option value="svt">SVT</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Classe cible</label>
                  <select className="form-select" value={classe} onChange={(e) => setClasse(e.target.value)} required>
                    <option value="">SÃ©lectionner</option>
                    <option value="2bac-g1">2BAC Sci - G1</option>
                    <option value="2bac-g2">2BAC Sci - G2</option>
                    <option value="1bac-g3">1BAC Sci - G3</option>
                    <option value="tcs-g2">TCS - G2</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">VisibilitÃ©</label>
                  <select className="form-select" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                    <option value="classe">Toute la classe</option>
                    <option value="specific">Ã‰lÃ¨ves spÃ©cifiques</option>
                  </select>
                </div>
              </div>

              {/* Interactive File Dropzone */}
              <div className="form-group mt-2">
                <label className="form-label">Fichier(s) Ã  joindre</label>
                <label className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-colors group">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                    <UploadCloud size={24} className="text-blue-500" />
                  </div>
                  <span className="text-sm font-bold text-slate-700 mb-1">Cliquez pour ajouter des fichiers</span>
                  <span className="text-xs font-medium text-slate-400">PDF, DOC, PPT, Images (Max 10MB)</span>
                  <input type="file" multiple className="hidden" onChange={handleFileChange} />
                </label>

                {/* Display selected files */}
                {files.length > 0 && (
                  <div className="mt-3 flex flex-col gap-2 max-h-[120px] overflow-y-auto pr-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex justify-between items-center p-2 px-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <File size={14} className="text-slate-400 flex-shrink-0" />
                          <span className="text-xs font-semibold text-slate-700 truncate">{file.name}</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => removeFile(index)} 
                          className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-md transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                disabled={isSubmitting || files.length === 0}
                className="btn btn-primary w-full py-3 mt-2 shadow-[0_4px_14px_rgba(59,130,246,0.25)]"
              >
                {isSubmitting ? (
                  <><span className="loading-spinner w-4 h-4 border-white mr-2"></span> Publication...</>
                ) : (
                  <><CheckCircle2 size={18} className="mr-1" /> Publier la ressource</>
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>

        {/* === RIGHT COLUMN: RESOURCES TABLE (Takes up 8 cols) === */}
        <motion.div variants={itemVariants} className="xl:col-span-8">
          <div className="card p-0 overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-white flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="text-slate-400" size={20} /> Ressources existantes
              </h3>
            </div>
            
            <div className="table-wrapper flex-1">
              <table className="table">
                <thead>
                  <tr>
                    <th>Titre du document</th>
                    <th>Type</th>
                    <th>MatiÃ¨re</th>
                    <th>Classe</th>
                    <th style={{ textAlign: 'right' }}>Date d'ajout</th>
                  </tr>
                </thead>
                <tbody>
                  {existingResources.map((r, i) => (
                    <motion.tr 
                      custom={i}
                      variants={tableRowVariants}
                      initial="hidden"
                      animate="visible"
                      key={r.id} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="font-semibold text-slate-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                          <FileText size={16} />
                        </div>
                        {r.title}
                      </td>
                      <td><span className={`badge ${getTypeBadgeClass(r.type)}`}>{r.type}</span></td>
                      <td className="font-medium text-slate-600">{r.matiere}</td>
                      <td>
                        <span className="badge bg-slate-100 text-slate-700 border border-slate-200">
                          {r.class}
                        </span>
                      </td>
                      <td className="text-slate-500 text-sm font-medium" style={{ textAlign: 'right' }}>
                        <div className="flex items-center justify-end gap-1">
                          <Clock size={12} className="text-slate-400"/> {r.date}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
