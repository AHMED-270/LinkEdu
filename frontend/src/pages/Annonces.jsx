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
  Paperclip,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { professorGet } from '../services/professorApi';

const formatDate = (value) => {
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

const formatDateTime = (value) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleString('fr-FR');
  }
  return String(value);
};

const hasAttachment = (annonce) => Boolean(annonce?.attachmentUrl || annonce?.photoUrl);

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
      setAnnonces(data?.announcements || []);
    } catch {
      setError('Impossible de charger les annonces.');
      setAnnonces([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnonces();
  }, []);

  const downloadAttachment = (annonce) => {
    const attachmentUrl = annonce?.attachmentUrl || annonce?.photoUrl;
    if (!attachmentUrl) return;

    const link = document.createElement('a');
    link.href = attachmentUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = `annonce-${annonce?.id || 'piece-jointe'}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const filteredAnnonces = useMemo(() => {
    const term = searchTitle.trim().toLowerCase();
    if (!term) return annonces;

    return annonces.filter((annonce) => (
      String(annonce?.title || '').toLowerCase().includes(term)
      || String(annonce?.content || '').toLowerCase().includes(term)
      || String(annonce?.author || '').toLowerCase().includes(term)
    ));
  }, [annonces, searchTitle]);

  return (
    <div className="relative">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <Megaphone className="text-brand-teal" size={28} /> Communication Interne
          </h1>
          <p className="text-slate-500 text-sm mt-1">Affichage des annonces avec consultation et telechargement des pieces jointes.</p>
        </div>
      </header>

      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="relative w-full md:w-96">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="form-input backdrop-blur-sm focus:ring-2 focus:ring-blue-600/40 focus:border-blue-600 border-white/60 transition-all duration-300"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Rechercher par titre, contenu ou auteur..."
              value={searchTitle}
              onChange={(event) => setSearchTitle(event.target.value)}
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
                <th className="py-3 px-4 font-bold">Piece</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <span className="loading-spinner border-brand-teal" />
                  </td>
                </tr>
              ) : filteredAnnonces.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Info size={40} className="mx-auto mb-2 opacity-30" />
                    Aucune annonce trouvee.
                  </td>
                </tr>
              ) : (
                filteredAnnonces.map((annonce) => (
                  <tr key={annonce.id} className="border-b border-slate-100 hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{annonce.title}</p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{annonce.content || '-'}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 whitespace-nowrap">{annonce.author || '-'}</td>
                    <td className="py-3 px-4 text-sm text-slate-600 whitespace-nowrap">{formatDate(annonce.date)}</td>
                    <td className="py-3 px-4 text-sm text-slate-600 whitespace-nowrap">
                      {hasAttachment(annonce) ? <span className="inline-flex items-center gap-1"><Paperclip size={14} /> Jointe</span> : 'Aucune'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedAnnonce(annonce)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white bg-slate-100 text-slate-600 transition-colors hover:bg-slate-600 hover:text-white"
                          title="Voir"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={!hasAttachment(annonce)}
                          onClick={() => downloadAttachment(annonce)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white bg-emerald-600 text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Telecharger"
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
        {selectedAnnonce && typeof document !== 'undefined' && createPortal(
          <motion.div
            className="linkedu-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedAnnonce(null)}
          >
            <div className="linkedu-modal-backdrop" />
            <motion.div
              className="linkedu-modal-shell w-full max-w-2xl !overflow-hidden !p-0"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{selectedAnnonce.title}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1"><User size={12} /> {selectedAnnonce.author || '-'}</span>
                    <span className="inline-flex items-center gap-1"><Calendar size={12} /> {formatDateTime(selectedAnnonce.date)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAnnonce(null)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  title="Fermer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="px-5 py-4">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedAnnonce.content || 'Aucun contenu.'}</p>
              </div>

              <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedAnnonce(null)}
                >
                  Fermer
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => downloadAttachment(selectedAnnonce)}
                  disabled={!hasAttachment(selectedAnnonce)}
                >
                  <Download size={14} /> Telecharger
                </button>
              </div>
            </motion.div>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>
    </div>
  );
}



