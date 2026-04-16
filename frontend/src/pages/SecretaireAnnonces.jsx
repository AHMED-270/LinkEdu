import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { 
  Search, 
  Filter, 
  Zap, 
  Edit2, 
  Trash2, 
  Eye,
  ImagePlus,
  Download,
  Inbox
} from 'lucide-react';
import TableSkeletonRows from '../components/TableSkeletonRows';
import LinkEduPopup from '../components/LinkEduPopup';
import GlassModal from '../components/GlassModal';

const emptyForm = { titre: '', contenu: '', cible: 'Tous' };

export default function SecretaireAnnonces() {
  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [selectedAnnonce, setSelectedAnnonce] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCible, setFilterCible] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [popupNotice, setPopupNotice] = useState({
    open: false,
    title: '',
    message: '',
    tone: 'info',
  });

  const csrfReadyRef = useRef(false);

  const ensureCsrfCookie = async () => {
    if (csrfReadyRef.current) return;
    await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', {
      withCredentials: true,
      withXSRFToken: true,
    });
    csrfReadyRef.current = true;
  };

  const showNotice = (title, message, tone = 'info') => {
    setPopupNotice({
      open: true,
      title,
      message,
      tone,
    });
  };

  useEffect(() => {
    if (!selectedAnnonce) return;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSelectedAnnonce(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [selectedAnnonce]);

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

  useEffect(() => {
    ensureCsrfCookie().catch(() => {
      // No-op: requests will retry csrf setup before mutation actions.
    });
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setPhotoFile(null);
    setPhotoPreview('');
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    setPhotoFile(file);
    if (!file) {
      setPhotoPreview('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const downloadRemoteFile = async (url, suggestedName) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = suggestedName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Erreur de telechargement image', error);
      window.open(url, '_blank');
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await ensureCsrfCookie();

      const isEditMode = Boolean(editingId);
      const payload = new FormData();
      payload.append('titre', form.titre);
      payload.append('contenu', form.contenu);
      payload.append('cible', form.cible || 'Tous');
      if (photoFile) {
        payload.append('photo', photoFile);
      }

      if (isEditMode) {
        await axios.post(`${apiBaseUrl}/api/secretaire/annonces/${editingId}`, payload, {
          withCredentials: true,
          withXSRFToken: true,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        const response = await axios.post(apiBaseUrl + '/api/secretaire/annonces', payload, {
          withCredentials: true,
          withXSRFToken: true,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        console.log("Annonce créée avec succès:", response.data);
      }

      await loadData();
      resetForm();
      showNotice(
        isEditMode ? 'Annonce mise a jour' : 'Annonce publiee',
        isEditMode ? 'Les modifications ont ete enregistrees.' : 'Votre annonce a ete envoyee avec succes.',
        'success'
      );
    } catch (err) {
      console.error("Erreur complète:", err);
      const msg = err.response?.data?.message || "Erreur lors de l'enregistrement";
      const detail = err.response?.data?.error || "";
      showNotice('Echec de l enregistrement', `${msg} ${detail}`.trim(), 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!deleteTargetId) return;
    setDeletingId(deleteTargetId);

    try {
      await ensureCsrfCookie();
      await axios.delete(`${apiBaseUrl}/api/secretaire/annonces/${deleteTargetId}`, {
        withCredentials: true,
        withXSRFToken: true,
      });

      setAnnonces((prev) => prev.filter((item) => String(item.id_annonce) !== String(deleteTargetId)));
      if (String(selectedAnnonce?.id_annonce) === String(deleteTargetId)) {
        setSelectedAnnonce(null);
      }
      showNotice('Annonce supprimee', 'L annonce a ete retiree.', 'success');
    } catch (err) {
      console.error("Erreur lors de la suppression", err);
      showNotice('Suppression impossible', 'Une erreur est survenue pendant la suppression.', 'danger');
    } finally {
      setDeletingId(null);
      setDeleteTargetId(null);
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
      case 'parents':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wider">PARENTS</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wider">TOUS</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 lg:p-8 font-sans text-gray-900 relative overflow-hidden backdrop-saturate-150">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
              <Inbox className="w-8 h-8 text-indigo-600" />
              Gestion des Annonces
            </h1>
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
                  className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal"
                />
              </div>
              <select
                value={filterCible}
                onChange={(e) => setFilterCible(e.target.value)}
                className="w-full sm:w-40 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal font-medium text-gray-700"
              >
                <option value="">Filtrer par cible</option>
                <option value="Etudiants">Étudiants</option>
                <option value="Professeurs">Professeurs</option>
                <option value="Parents">Parents</option>
              </select>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden pb-4 backdrop-blur-xl border border-white/80 !shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(41,107,116,0.06)] transition-all duration-300">
              <div className="overflow-x-auto">
                <table className="table w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider w-2/5">Titre de l'annonce</th>
                      <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cible</th>
                      <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <TableSkeletonRows rowCount={6} colCount={4} />
                    ) : filteredAnnonces.length > 0 ? filteredAnnonces.map((a) => (
                      <tr key={a.id_annonce} className="hover:bg-blue-50/50 transition-colors group">
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
                               className="p-1.5 text-gray-700 hover:bg-gray-100 hover:text-black rounded-lg transition-colors"
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
                                 setPhotoFile(null);
                                 setPhotoPreview(a.photo_url || '');
                                 window.scrollTo({ top: 0, behavior: 'smooth' });
                               }}
                               className="p-1.5 text-brand-teal hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors"
                             >
                                <Edit2 className="w-4 h-4" />
                             </button>
                             <button
                               onClick={() => setDeleteTargetId(a.id_annonce)}
                               disabled={deletingId === a.id_annonce}
                               className="p-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                           </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="4" className="py-12 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-400">
                            <span className="mb-3 text-gray-200">
                              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.2 0 4 1.8 4 4v8Z"></path><polyline points="15,9 18,9 22,13"></polyline><line x1="8" y1="13" x2="16" y2="13"></line></svg>
                            </span>
                            <p className="text-base font-medium text-gray-500">Aucune annonce trouvée</p>
                            <p className="text-sm mt-1">Ajustez vos filtres ou effectuez une nouvelle recherche.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Forms */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Quick Action Card (Action Rapide) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6 relative backdrop-blur-xl border border-white/80 !shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(41,107,116,0.06)] transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-bl-[100px] -z-0"></div>
              
              <div className="flex items-center gap-2 mb-6 relative z-10">
                <Zap className="w-5 h-5 text-brand-teal fill-blue-600/20" />
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
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:bg-white transition-all"
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
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:bg-white transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Cible</label>
                    <select
                      value={form.cible}
                      onChange={(e) => setForm({ ...form, cible: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:bg-white backdrop-blur-xl border border-white/80 !shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(41,107,116,0.06)] transition-all duration-300"
                    >
                      <option value="Tous">Tous</option>
                      <option value="Etudiants">Étudiants</option>
                      <option value="Professeurs">Professeurs</option>
                      <option value="Parents">Parents</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Photo de l'annonce</label>
                  <label className="flex items-center justify-center gap-2 w-full px-3 py-3 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors">
                    <ImagePlus className="w-4 h-4" />
                    {photoFile ? photoFile.name : 'Importer une image (JPG, PNG, WEBP)'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </label>

                  {(photoPreview || (editingId && form.titre)) && (
                    <div className="mt-2 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Prévisualisation" className="h-32 w-full object-cover" />
                      ) : (
                        <div className="h-32 w-full flex items-center justify-center text-xs text-gray-400">Aucune photo selectionnee</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-brand-teal hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors"
                  >
                    {isSubmitting ? 'Traitement...' : (editingId ? 'Mettre a jour' : 'Envoyer l\'annonce')}
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
        <GlassModal open={Boolean(selectedAnnonce)} onClose={() => setSelectedAnnonce(null)} panelClassName="max-w-2xl p-0">
          <div className="linkedu-glass-form max-h-[90vh] overflow-y-auto">
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

              {selectedAnnonce.photo_url && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Photo</p>
                    <button
                      type="button"
                      onClick={() => downloadRemoteFile(selectedAnnonce.photo_url, `annonce-${selectedAnnonce.id_annonce || 'image'}.jpg`)}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                      <Download className="w-3.5 h-3.5" /> Télécharger
                    </button>
                  </div>
                  <img src={selectedAnnonce.photo_url} alt="Illustration de l'annonce" className="max-h-60 w-full rounded-xl border border-gray-200 object-cover" />
                </div>
              )}

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
        </GlassModal>
      )}

      <LinkEduPopup
        open={Boolean(deleteTargetId)}
        title="Confirmer la suppression"
        message="Voulez-vous vraiment supprimer cette annonce ?"
        tone="danger"
        confirmText="Oui, supprimer"
        cancelText="Annuler"
        onConfirm={onDelete}
        onClose={() => {
          if (!deletingId) setDeleteTargetId(null);
        }}
        loading={Boolean(deletingId)}
      />

      <LinkEduPopup
        open={popupNotice.open}
        title={popupNotice.title}
        message={popupNotice.message}
        tone={popupNotice.tone}
        confirmText="Fermer"
        onClose={() => setPopupNotice((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}







