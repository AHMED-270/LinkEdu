import { useEffect, useMemo, useState } from 'react';
import {
  Megaphone,
  Search,
  Eye,
  Download,
  Calendar,
  User,
  X,
  AlertCircle,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { professorGet } from '../services/professorApi';

export default function Annonces() {
  const [annonces, setAnnonces] = useState([]);
  const [searchTitle, setSearchTitle] = useState('');
  const [selectedAnnonce, setSelectedAnnonce] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnnonces = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await professorGet('/api/professeur/annonces');
      setAnnonces(data.announcements || []);
    } catch {
      setError('Impossible de charger les annonces.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnonces();
  }, []);

  const downloadAttachment = (annonce) => {
    const attachmentUrl = annonce.attachmentUrl || annonce.photoUrl || annonce.attachment_url || annonce.photo_url;
    if (!attachmentUrl) return;

    const link = document.createElement('a');
    link.href = attachmentUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = `annonce-${annonce.id || 'piece-jointe'}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const filteredAnnonces = useMemo(() => {
    const term = searchTitle.trim().toLowerCase();
    if (!term) return annonces;

    return annonces.filter((annonce) =>
      String(annonce.title || '').toLowerCase().includes(term)
    );
  }, [annonces, searchTitle]);

  const hasAttachment = (annonce) => {
    return Boolean(annonce.attachmentUrl || annonce.photoUrl || annonce.attachment_url || annonce.photo_url);
  };

  const formatDateOnly = (value) => {
    if (!value) return '-';

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('fr-FR');
    }

    const raw = String(value);
    if (raw.includes('T')) return raw.split('T')[0];
    if (raw.includes(' ')) return raw.split(' ')[0];
    return raw;
  };

  return (
    <div className="layout-content">
      
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <Megaphone className="text-blue-600" size={28} /> Communication Interne
          </h1>
          <p className="text-slate-500 text-sm mt-1">Affichage en table simple: Voir et Télécharger.</p>
        </div>
      </header>

      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="relative w-full md:w-96">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="form-input pl-9"
              placeholder="Rechercher par titre d'annonce..."
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
            />
          </div>
          <span className="text-sm font-semibold text-slate-500">{filteredAnnonces.length} annonce(s)</span>
        </div>

        {error && (
          <div className="m-4 card p-3 border border-red-100 bg-red-50 text-red-700 text-sm font-medium flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[760px]">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="py-3 px-4 font-bold">Titre</th>
                <th className="py-3 px-4 font-bold">Auteur</th>
                <th className="py-3 px-4 font-bold">Date</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <span className="loading-spinner border-blue-500" />
                  </td>
                </tr>
              ) : filteredAnnonces.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    <Info size={40} className="mx-auto mb-2 opacity-30" />
                    Aucune annonce trouvée.
                  </td>
                </tr>
              ) : (
                filteredAnnonces.map((annonce) => (
                  <tr key={annonce.id} className="border-b border-slate-100 hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{annonce.title}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">{annonce.author || '-'}</td>
                    <td className="py-3 px-4 text-sm text-slate-600 whitespace-nowrap">{formatDateOnly(annonce.date)}</td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedAnnonce(annonce)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white bg-slate-100 text-slate-600 transition-colors hover:bg-slate-600 hover:text-white"
                        >
                          <Eye size={14} /> 
                        </button>
                        <button
                          type="button"
                          disabled={!hasAttachment(annonce)}
                          onClick={() => downloadAttachment(annonce)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white bg-emerald-600 text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Download size={14} /> 
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedAnnonce && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-[1px] p-4 flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">Détails de l'annonce</h3>
                <button
                  type="button"
                  onClick={() => setSelectedAnnonce(null)}
                  className="p-2 rounded-md hover:bg-slate-100 text-slate-500"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Titre</p>
                  <p className="text-slate-800 font-semibold">{selectedAnnonce.title}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Contenu</p>
                  <p className="text-slate-700 whitespace-pre-wrap">{selectedAnnonce.content || '-'}</p>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1"><User size={14} /> {selectedAnnonce.author || '-'}</span>
                  <span className="inline-flex items-center gap-1"><Calendar size={14} /> {selectedAnnonce.date || '-'}</span>
                </div>
              </div>

              <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
               
                <button
                  type="button"
                  disabled={!hasAttachment(selectedAnnonce)}
                  onClick={() => downloadAttachment(selectedAnnonce)}
                  className="inline-flex items-center gap-2 rounded-md border border-white bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={14} /> Télécharger
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

