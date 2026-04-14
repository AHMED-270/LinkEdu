import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  ClipboardList,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import TableSkeletonRows from '../components/TableSkeletonRows';

const statusOptions = [
  { value: 'en_attente', label: 'En attente' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'resolue', label: 'Acceptee' },
  { value: 'rejetee', label: 'Refusee' },
];

const getStatusMeta = (rawStatus) => {
  const status = String(rawStatus || '').toLowerCase();

  if (status === 'rejetee') {
    return {
      label: 'Refusee',
      badgeClass: 'bg-rose-50 text-rose-600 border border-rose-100',
    };
  }

  if (status === 'resolue') {
    return {
      label: 'Acceptee',
      badgeClass: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    };
  }

  if (status === 'en_cours') {
    return {
      label: 'En cours',
      badgeClass: 'bg-blue-50 text-blue-600 border border-blue-100',
    };
  }

  return {
    label: 'En attente',
    badgeClass: 'bg-orange-50 text-orange-600 border border-orange-100',
  };
};

export default function SecretaireDemandes() {
  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiBaseUrl}/api/secretaire/demandes`, {
        withCredentials: true,
        withXSRFToken: true,
      });
      setDemandes(res.data?.demandes || []);
    } catch (error) {
      console.error('Erreur lors du chargement des demandes', error);
      setDemandes([]);
      setFeedback({ type: 'error', msg: 'Impossible de charger les demandes.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredDemandes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return demandes;

    return demandes.filter((item) => {
      const parentLabel = `${item.parent_nom || ''} ${item.parent_prenom || ''}`.toLowerCase();
      return (
        String(item.type_demande || '').toLowerCase().includes(term)
        || String(item.message || '').toLowerCase().includes(term)
        || parentLabel.includes(term)
        || String(item.parent_email || '').toLowerCase().includes(term)
        || String(item.eleve_nom || '').toLowerCase().includes(term)
        || String(item.classe || '').toLowerCase().includes(term)
        || String(item.statut || '').toLowerCase().includes(term)
      );
    });
  }, [demandes, searchTerm]);

  const onStatusChange = async (idDemande, statut) => {
    setUpdatingId(idDemande);
    setFeedback({ type: '', msg: '' });

    try {
      await axios.get(`${apiBaseUrl}/sanctum/csrf-cookie`, {
        withCredentials: true,
        withXSRFToken: true,
      });

      await axios.put(
        `${apiBaseUrl}/api/secretaire/demandes/${idDemande}/status`,
        { statut },
        {
          withCredentials: true,
          withXSRFToken: true,
        }
      );

      setDemandes((prev) => prev.map((item) => (
        item.id_demande === idDemande ? { ...item, statut } : item
      )));

      setFeedback({ type: 'success', msg: 'Statut mis a jour avec succes.' });
      setTimeout(() => setFeedback({ type: '', msg: '' }), 3000);
    } catch (error) {
      setFeedback({
        type: 'error',
        msg: error?.response?.data?.message || 'Impossible de mettre a jour le statut.',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
              <ClipboardList className="w-8 h-8 text-blue-600" />
              Traitement des demandes parents
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Suivez et mettez a jour les demandes administratives envoyees par les parents.
            </p>
          </div>

          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par parent, eleve, type..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>

        {feedback.msg && (
          <div className={`p-3 rounded-xl text-sm font-medium flex items-center gap-2 ${feedback.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
            {feedback.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {feedback.msg}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Parent</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Eleve / Classe</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type de demande</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cause</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <TableSkeletonRows rowCount={6} colSpan={6} />
                ) : filteredDemandes.map((item) => {
                  const statusMeta = getStatusMeta(item.statut);
                  const isUpdating = updatingId === item.id_demande;

                  return (
                    <tr key={item.id_demande} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-4 px-6 align-top">
                        <div className="text-xs font-semibold text-gray-600">
                          {item.date_demande ? new Date(item.date_demande).toLocaleDateString('fr-FR') : '-'}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">
                          {item.date_demande
                            ? new Date(item.date_demande).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                            : '-'}
                        </div>
                      </td>

                      <td className="py-4 px-6 align-top">
                        <div className="text-sm font-bold text-gray-900">{item.parent_nom || '-'}</div>
                        <div className="text-xs text-gray-500 mt-1">{item.parent_email || '-'}</div>
                      </td>

                      <td className="py-4 px-6 align-top">
                        <div className="text-sm font-semibold text-gray-800">{item.eleve_nom || '-'}</div>
                        <div className="text-xs text-gray-500 mt-1">{item.classe || '-'}</div>
                      </td>

                      <td className="py-4 px-6 align-top">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {item.type_demande || '-'}
                        </span>
                      </td>

                      <td className="py-4 px-6 align-top">
                        <p className="text-xs text-gray-600 italic max-w-xs line-clamp-3">
                          {item.message || 'Aucune cause.'}
                        </p>
                      </td>

                      <td className="py-4 px-6 align-top">
                        <div className="flex flex-col gap-2 min-w-[170px]">
                          <span className={`inline-flex w-fit px-2.5 py-1 rounded-lg text-xs font-bold ${statusMeta.badgeClass}`}>
                            {statusMeta.label}
                          </span>

                          <div className="relative">
                            <select
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-blue-500/20 outline-none"
                              value={String(item.statut || 'en_attente').toLowerCase()}
                              onChange={(event) => onStatusChange(item.id_demande, event.target.value)}
                              disabled={isUpdating}
                            >
                              {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>

                            {isUpdating && (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600">
                                <Loader2 className="w-4 h-4 animate-spin" />
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!loading && filteredDemandes.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <span className="mb-3 text-gray-200">
                          <ClipboardList className="w-10 h-10" />
                        </span>
                        <p className="text-base font-medium text-gray-500">Aucune demande trouvee</p>
                        <p className="text-sm mt-1">Ajustez votre recherche pour afficher les demandes.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
