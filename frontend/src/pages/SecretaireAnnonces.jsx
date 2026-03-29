import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { 
  Search, 
  Filter, 
  Plus, 
  Zap, 
  Edit2, 
  Trash2, 
  Eye,
  Megaphone,
  AlertTriangle
} from 'lucide-react';

const emptyForm = { titre: '', contenu: '', cible: 'Tous' };

export default function SecretaireAnnonces() {
  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [selectedAnnonce, setSelectedAnnonce] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCible, setFilterCible] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(apiBaseUrl + '/api/secretaire/annonces', {
        withCredentials: true,
        withXSRFToken: true,
      });
      // Keep a simple target field for UI filtering.
      const data = (res.data?.annonces || []).map(a => ({
        ...a,
        cible: a.cible || 'Tous'
      }));
      setAnnonces(data);
    } catch (error) {
      console.error(error);
      setAnnonces([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', { withCredentials: true, withXSRFToken: true });
    
    try {
      if (editingId) {
        await axios.put(`${apiBaseUrl}/api/secretaire/annonces/${editingId}`, form, {
          withCredentials: true,
          withXSRFToken: true,
        });
      } else {
        const response = await axios.post(apiBaseUrl + '/api/secretaire/annonces', form, {
          withCredentials: true,
          withXSRFToken: true,
        });
        console.log("Annonce créée avec succès:", response.data);
      }
      await loadData();
      resetForm();
      alert("Annonce publiée avec succès !");
    } catch (err) {
      console.error("Erreur complète:", err);
      const msg = err.response?.data?.message || "Erreur lors de l'enregistrement";
      const detail = err.response?.data?.error || "";
      alert(`${msg} ${detail}`);
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette annonce ?")) return;
    await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', { withCredentials: true, withXSRFToken: true });
    try {
      await axios.delete(`${apiBaseUrl}/api/secretaire/annonces/${id}`, {
        withCredentials: true,
        withXSRFToken: true,
      });
      await loadData();
    } catch (err) {
      console.error("Erreur lors de la suppression", err);
    }
  };

  const filteredAnnonces = useMemo(() => {
    return annonces.filter(a => {
      const searchMatch = (a.titre?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                          (a.contenu?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const cibleMatch = !filterCible || a.cible === filterCible;
      return searchMatch && cibleMatch;
    });
  }, [annonces, searchTerm, filterCible]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return (
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-gray-800">{d.getDate()}</span>
        <span className="text-xs text-gray-500 uppercase">{d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}</span>
      </div>
    );
  };

  const formatFullDate = (dateStr) => {
    if (!dateStr) return 'Date non disponible';
    const d = new Date(dateStr);
    return d.toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAuthorName = (annonce) => {
    const fullName = `${annonce?.auteur_prenom || ''} ${annonce?.auteur_nom || ''}`.trim();
    return fullName || 'Auteur inconnu';
  };

  const getCibleBadge = (cible) => {
    switch(cible?.toLowerCase()) {
      case 'etudiants':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wider">ÉTUDIANTS</span>;
      case 'professeurs':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 text-cyan-700 uppercase tracking-wider">PROFESSEURS</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wider">TOUS</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 lg:p-8 font-sans text-gray-900">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Gestion des Annonces</h1>
          </div>
      
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Table */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher un titre ou un contenu"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <select
                value={filterCible}
                onChange={(e) => setFilterCible(e.target.value)}
                className="w-full sm:w-40 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-gray-700"
              >
                <option value="">Filtrer par cible</option>
                <option value="Etudiants">Étudiants</option>
                <option value="Professeurs">Professeurs</option>
              </select>
            </div>

            {/* Table Card */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden pb-4">
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-2/5">Titre de l'annonce</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cible</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      [...Array(6)].map((_, i) => (
                        <tr key={`annonce-skeleton-${i}`} className="animate-pulse">
                          <td className="py-4 px-6"><div className="h-4 w-56 rounded bg-gray-100"></div></td>
                          <td className="py-4 px-6"><div className="h-9 w-16 rounded bg-gray-100"></div></td>
                          <td className="py-4 px-6"><div className="h-5 w-20 rounded-full bg-gray-100"></div></td>
                          <td className="py-4 px-6"><div className="h-4 w-16 ml-auto rounded bg-gray-100"></div></td>
                        </tr>
                      ))
                    ) : filteredAnnonces.length > 0 ? filteredAnnonces.map((a) => (
                      <tr key={a.id_annonce} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="py-4 px-6">
                          <div className="pr-4">
                            <div className="font-bold text-gray-900 text-sm mb-1">{a.titre}</div>
                            <div className="text-[11px] text-gray-500 line-clamp-1 overflow-hidden text-ellipsis">
                              {a.contenu}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {formatDate(a.date_publication)}
                        </td>
                        <td className="py-4 px-6">
                          {getCibleBadge(a.cible)}
                        </td>
                        <td className="py-4 px-6 text-right">
                           <div className="flex items-center justify-end gap-1.5 text-gray-400">
                             <button
                               onClick={() => setSelectedAnnonce(a)}
                               className="p-1.5 hover:bg-gray-100 hover:text-indigo-600 rounded-lg transition-colors"
                               title="Afficher les détails"
                             >
                               <Eye className="w-4 h-4" />
                             </button>
                             <button
                               onClick={() => {
                                 setEditingId(a.id_annonce);
                                 setForm({
                                   titre: a.titre || '',
                                   contenu: a.contenu || '',
                                   cible: a.cible || 'Tous'
                                 });
                                 window.scrollTo({ top: 0, behavior: 'smooth' });
                               }}
                               className="p-1.5 hover:bg-gray-100 hover:text-blue-600 rounded-lg transition-colors"
                             >
                                <Edit2 className="w-4 h-4" />
                             </button>
                             <button
                               onClick={() => onDelete(a.id_annonce)}
                               className="p-1.5 hover:bg-gray-100 hover:text-red-600 rounded-lg transition-colors"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                           </div>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="4" className="py-8 text-center text-gray-500">Aucune annonce trouvée</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Forms */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Quick Action Card (Action Rapide) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6 relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-bl-[100px] -z-0"></div>
              
              <div className="flex items-center gap-2 mb-6 relative z-10">
                <Zap className="w-5 h-5 text-blue-600 fill-blue-600/20" />
                <h3 className="font-bold text-gray-900 text-lg">Nouvelle annonce</h3>
              </div>
              
              <form onSubmit={onSubmit} className="flex flex-col gap-4 relative z-10">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Titre </label>
                  <input
                    id="titre_rapide"
                    type="text"
                    placeholder="Tapez le titre de l'annonce..."
                    value={form.titre}
                    onChange={(e) => setForm({ ...form, titre: e.target.value })}
                    required
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Message </label>
                  <textarea
                    rows="4"
                    placeholder="Tapez votre annonce ici..."
                    value={form.contenu}
                    onChange={(e) => setForm({ ...form, contenu: e.target.value })}
                    required
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Cible</label>
                    <select
                      value={form.cible}
                      onChange={(e) => setForm({ ...form, cible: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                    >
                      <option value="Tous">Tous</option>
                      <option value="Etudiants">Étudiants</option>
                      <option value="Professeurs">Professeurs</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors"
                  >
                    {editingId ? 'Mettre à jour' : 'Envoyer l\'annonce'}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition-colors"
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </form>
            </div>

                  
            

          </div>
        </div>
      </div>

      {selectedAnnonce && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Détails de l'annonce</h2>
                <p className="text-xs text-gray-500 mt-1">Consultez toutes les informations de cette annonce.</p>
              </div>
              <button
                onClick={() => setSelectedAnnonce(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Fermer
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Titre</p>
                <p className="text-base font-semibold text-gray-900">{selectedAnnonce.titre || '-'}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Contenu</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedAnnonce.contenu || '-'}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Date de publication</p>
                  <p className="text-sm font-medium text-gray-800">{formatFullDate(selectedAnnonce.date_publication || selectedAnnonce.created_at)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Auteur</p>
                  <p className="text-sm font-medium text-gray-800">{getAuthorName(selectedAnnonce)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Cible</p>
                  <div>{getCibleBadge(selectedAnnonce.cible)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
