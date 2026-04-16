import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  FiSearch as Search,
  FiUserCheck as UserCheck,
  FiUserX as UserX,
  FiUsers as Users,
  FiRefreshCw as RefreshCw,
  FiShield as Shield,
} from 'react-icons/fi';
import TableSkeletonRows from './TableSkeletonRows';
import LinkEduPopup from './LinkEduPopup';

export default function AdminAccountActivations() {
  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activatingId, setActivatingId] = useState(null);
  const [deactivatingId, setDeactivatingId] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [popupNotice, setPopupNotice] = useState({
    open: false,
    title: '',
    message: '',
    tone: 'info',
  });

  const fetchData = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [usersRes, classesRes] = await Promise.all([
        axios.get(apiBaseUrl + '/api/admin/users', {
          withCredentials: true,
          withXSRFToken: true,
          headers: { Accept: 'application/json' },
        }),
        axios.get(apiBaseUrl + '/api/admin/classes', {
          withCredentials: true,
          withXSRFToken: true,
          headers: { Accept: 'application/json' },
        })
      ]);

      const allStudents = (usersRes.data || [])
        .filter((u) => String(u.role || '').toLowerCase() === 'etudiant')
        .map((u) => ({
          id_etudiant: u.id,
          nom: u.nom || '',
          prenom: u.prenom || '',
          email: u.email || '',
          account_status: u.account_status || 'pending_activation',
          id_classe: u.id_classe || null,
          classe: u.classe || null,
          parent_email: u.parent_email || '',
        }));

      setStudents(allStudents);
      setClasses(classesRes.data?.classes || []);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      setLoadError(error?.response?.data?.message || 'Impossible de charger les comptes. Verifiez la session admin.');
      setStudents([]);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const ensureCsrfCookie = async () => {
    await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', {
      withCredentials: true,
      withXSRFToken: true,
    });
  };

  const showNotice = (title, message, tone = 'info') => {
    setPopupNotice({
      open: true,
      title,
      message,
      tone,
    });
  };

  const handleActivate = async (student) => {
    setActivatingId(student.id_etudiant);
    try {
      await ensureCsrfCookie();
      const res = await axios.post(`${apiBaseUrl}/api/admin/users/${student.id_etudiant}/activate`, {}, {
        withCredentials: true,
        withXSRFToken: true,
        headers: { Accept: 'application/json' },
      });

      const warnings = res.data?.warnings || [];
      if (warnings.length > 0) {
        showNotice('Compte active', `${res.data?.message || 'Compte active.'}\n${warnings.join('\n')}`, 'success');
      } else {
        showNotice('Compte active', res.data?.message || 'Compte active avec succes.', 'success');
      }

      await fetchData();
    } catch (error) {
      showNotice('Activation impossible', error?.response?.data?.message || 'Erreur lors de l activation du compte.', 'danger');
    } finally {
      setActivatingId(null);
    }
  };

  const handleDeactivate = async (student) => {
    setDeactivatingId(student.id_etudiant);
    try {
      await ensureCsrfCookie();
      const res = await axios.post(`${apiBaseUrl}/api/admin/users/${student.id_etudiant}/deactivate`, {}, {
        withCredentials: true,
        withXSRFToken: true,
        headers: { Accept: 'application/json' },
      });

      showNotice('Compte desactive', res.data?.message || 'Compte desactive avec succes.', 'success');
      await fetchData();
    } catch (error) {
      showNotice('Desactivation impossible', error?.response?.data?.message || 'Erreur lors de la desactivation du compte.', 'danger');
    } finally {
      setDeactivatingId(null);
    }
  };

  const filteredStudents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return students.filter((s) => {
      const classIdMatch = classFilter === 'all' || String(s.id_classe || '') === classFilter;
      if (!classIdMatch) return false;

      const currentStatus = String(s.account_status || 'pending_activation');
      const statusMatch = statusFilter === 'all' || currentStatus === statusFilter;
      if (!statusMatch) return false;

      if (!term) return true;

      const fullName = `${s.nom || ''} ${s.prenom || ''}`.toLowerCase();
      return (
        fullName.includes(term)
        || String(s.email || '').toLowerCase().includes(term)
        || String(s.parent_email || '').toLowerCase().includes(term)
        || String(s.classe || '').toLowerCase().includes(term)
      );
    });
  }, [students, searchTerm, classFilter, statusFilter]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-brand-navy to-brand-teal bg-clip-text text-transparent tracking-tight flex items-center gap-3">
            <Shield className="text-brand-teal" size={28} />
            Activation des Comptes
          </h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">Validation admin des comptes élèves avec envoi des identifiants.</p>
        </div>
        <button
          type="button"
          onClick={fetchData}
          className="premium-btn-secondary"
        >
          <RefreshCw size={16} className="text-brand-teal" />
          Actualiser
        </button>
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="premium-stat !p-0 overflow-hidden"
      >
        {loadError && (
          <div className="mx-6 mt-5 rounded-2xl border border-red-100/50 bg-red-50/60 backdrop-blur-sm px-5 py-4 text-sm font-semibold text-red-600">
            {loadError}
          </div>
        )}

        {/* Filters */}
        <div className="px-6 py-5 border-b border-white/40 flex flex-col xl:flex-row xl:items-center gap-4 bg-white/30 backdrop-blur-sm">
          <div className="relative w-full xl:w-96">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher (élève, parent...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="premium-input !pl-11"
            />
          </div>

          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="premium-select w-full xl:w-64"
          >
            <option value="all">Filtre par classe (Tous)</option>
            {classes.map((c) => (
              <option key={c.id_classe} value={String(c.id_classe)}>
                {c.nom}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="premium-select w-full xl:w-64"
          >
            <option value="all">Statut: Tous</option>
            <option value="pending_activation">Non activés</option>
            <option value="active">Activés</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[980px]">
            <thead>
              <tr className="bg-white/40 border-b border-slate-100/50">
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Élève</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Classe</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Élève</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Parent</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Statut</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/80">
              {loading ? (
                <TableSkeletonRows rowCount={6} colCount={6} />
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center">
                    <div className="premium-empty">
                      <Users size={40} />
                      <p>Aucun compte pour ce filtre</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id_etudiant} className="transition-colors duration-200 hover:bg-white/60">
                    <td className="py-4 px-6">
                      <div className="font-bold text-brand-navy text-sm">{student.nom} {student.prenom}</div>
                      <div className="text-[11px] text-slate-400 font-medium">ID: {student.id_etudiant}</div>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600 font-medium">{student.classe || '-'}</td>
                    <td className="py-4 px-6 text-sm text-slate-500">{student.email || '-'}</td>
                    <td className="py-4 px-6 text-sm text-slate-500">{student.parent_email || '-'}</td>
                    <td className="py-4 px-6">
                      {student.account_status === 'active' ? (
                        <span className="premium-badge-green">Activé</span>
                      ) : (
                        <span className="premium-badge-orange">En attente</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleActivate(student)}
                          disabled={activatingId === student.id_etudiant || student.account_status === 'active'}
                          className="premium-btn premium-btn-sm bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                          <UserCheck size={14} />
                          {activatingId === student.id_etudiant
                            ? '...'
                            : student.account_status === 'active'
                              ? 'Activé'
                              : 'Activer'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeactivate(student)}
                          disabled={deactivatingId === student.id_etudiant || student.account_status !== 'active'}
                          className="premium-btn premium-btn-sm bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                          <UserX size={14} />
                          {deactivatingId === student.id_etudiant
                            ? '...'
                            : student.account_status !== 'active'
                              ? 'Inactif'
                              : 'Désactiver'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

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
