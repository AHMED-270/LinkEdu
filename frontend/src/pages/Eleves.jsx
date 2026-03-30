import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Search, Mail, Phone, Users, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Eleves() {
  const [selectedClass, setSelectedClass] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [classes, setClasses] = useState([]);
  const [elevesData, setElevesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      setError('');

      try {
        const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';
        const response = await axios.get(apiBaseUrl + '/api/professeur/eleves', {
          withCredentials: true,
          headers: { Accept: 'application/json' },
        });

        setClasses(response.data?.classes || []);
        setElevesData(response.data?.students || []);
      } catch (fetchError) {
        setError('Impossible de charger vos classes et vos Ã©lÃ¨ves.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const filteredEleves = useMemo(() => {
    return elevesData.filter((e) => {
      const classMatch = selectedClass === 'all' || String(e.classId) === selectedClass;
      const fullName = `${e.firstName || ''} ${e.lastName || ''}`.trim().toLowerCase();
      const searchMatch = fullName.includes(searchTerm.toLowerCase());
      return classMatch && searchMatch;
    });
  }, [elevesData, searchTerm, selectedClass]);

  // Framer Motion Variants
  const tableRowVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (i) => ({ opacity: 1, x: 0, transition: { delay: i * 0.05, type: 'spring', stiffness: 100 } })
  };

  return (
    <div className="layout-content relative">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Mes Classes & Ã‰lÃ¨ves</h1>
          <p className="text-slate-500 text-sm mt-1">Consultez l'annuaire et les informations de contact de vos Ã©lÃ¨ves.</p>
        </div>
      </header>

      {/* Main Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className="card p-0 overflow-hidden flex flex-col"
      >
        {/* Filters Toolbar */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="w-full md:w-auto flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Users size={20} />
            </div>
            <select 
              className="form-select min-w-[220px] shadow-sm font-medium" 
              value={selectedClass} 
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="all">Toutes mes classes</option>
              {classes.map((classe) => (
                <option key={classe.id} value={String(classe.id)}>
                  {classe.label || `${classe.nom} - ${classe.niveau}`}
                </option>
              ))}
            </select>
          </div>
          
          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-400" />
            </div>
            <input
              type="text"
              className="form-input w-full pl-10 shadow-sm"
              placeholder="Rechercher un Ã©lÃ¨ve..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-20">
              <span className="loading-spinner border-blue-500 mb-4"></span>
              <p className="text-slate-500 font-medium">Chargement de l'annuaire...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500 font-medium bg-red-50 m-4 rounded-xl border border-red-100">
              {error}
            </div>
          ) : (
            <table className="table w-full">
              <thead>
                <tr className="bg-white">
                  <th className="w-16"></th>
                  <th>IdentitÃ© de l'Ã©lÃ¨ve</th>
                  <th>Classe</th>
                  <th>Informations de contact</th>
                </tr>
              </thead>
              <tbody>
                {filteredEleves.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-16 text-slate-500">
                      <GraduationCap size={48} className="mx-auto mb-3 opacity-20" />
                      <p className="font-medium text-slate-600">Aucun Ã©lÃ¨ve trouvÃ©.</p>
                      <p className="text-sm">Veuillez vÃ©rifier votre recherche ou vos filtres.</p>
                    </td>
                  </tr>
                ) : (
                  filteredEleves.map((e, index) => {
                    const fullName = `${e.firstName || ''} ${e.lastName || ''}`.trim() || 'Ã‰lÃ¨ve';
                    const initial = fullName.charAt(0).toUpperCase();

                    return (
                      <motion.tr 
                        custom={index}
                        variants={tableRowVariants}
                        initial="hidden"
                        animate="visible"
                        key={e.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td>
                          <div className="w-12 h-12 rounded-full border-2 border-white shadow-sm flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 text-indigo-600 font-bold text-lg">
                            {e.avatar ? (
                              <img src={e.avatar} alt={fullName} className="w-full h-full object-cover" />
                            ) : (
                              initial
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-base leading-tight">{fullName}</span>
                            <span className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                              {e.matricule || `#${String(e.id).padStart(5, '0')}`}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-blue bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1">
                            {e.class}
                          </span>
                        </td>
                        <td>
                          <div className="flex flex-col gap-1.5 text-sm">
                            <span className="flex items-center gap-2 text-slate-600 font-medium">
                              <Mail size={14} className="text-slate-400" /> {e.email || 'Non renseignÃ©'}
                            </span>
                            <span className="flex items-center gap-2 text-slate-600 font-medium">
                              <Phone size={14} className="text-slate-400" /> {e.phone || 'Non renseignÃ©'}
                            </span>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 text-sm font-medium text-slate-500 flex justify-between items-center">
          <span>Affichage de {filteredEleves.length} Ã©lÃ¨ve(s)</span>
        </div>
      </motion.div>
    </div>
  );
}
