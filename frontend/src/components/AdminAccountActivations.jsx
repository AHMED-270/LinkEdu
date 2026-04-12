import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  FiSearch as Search,
  FiUserCheck as UserCheck,
  FiUserX as UserX,
  FiUsers as Users,
  FiRefreshCw as RefreshCw,
} from 'react-icons/fi';
import { BiSolidUserDetail } from 'react-icons/bi';

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
        alert(`${res.data?.message || 'Compte active.'}\n${warnings.join('\n')}`);
      } else {
        alert(res.data?.message || 'Compte active avec succes.');
      }

      await fetchData();
    } catch (error) {
      alert(error?.response?.data?.message || 'Erreur lors de l activation du compte.');
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

      alert(res.data?.message || 'Compte desactive avec succes.');
      await fetchData();
    } catch (error) {
      alert(error?.response?.data?.message || 'Erreur lors de la desactivation du compte.');
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
    <div className="min-h-screen p-4 lg:p-8 bg-[#f5f7fb]">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div>
            <h1 className="mt-1 flex items-center gap-2 text-4xl lg:text-5xl font-extrabold italic tracking-tight text-slate-900">
              <BiSolidUserDetail className="text-blue-600" />
              Activation des Comptes
            </h1>
            <p className="text-slate-500 mt-2 text-sm">Validation admin des comptes eleves avec envoi des identifiants aux eleves et parents.</p>
          </div>

          <button
            type="button"
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4 text-blue-600" />
            Actualiser
          </button>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          {loadError && (
            <div className="mx-6 mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {loadError}
            </div>
          )}
          <div className="px-6 py-5 border-b border-gray-100 flex flex-col xl:flex-row xl:items-center gap-4 bg-gray-50/60">
            <div className="relative w-full xl:w-96">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher (eleve, parent...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors sm:text-sm font-medium"
              />
            </div>

            <div className="relative w-full xl:w-64">
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors sm:text-sm font-medium appearance-none cursor-pointer"
              >
                <option value="all">Filtre par classe (Tous)</option>
                {classes.map((c) => (
                  <option key={c.id_classe} value={String(c.id_classe)}>
                    {c.nom}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <div className="relative w-full xl:w-64">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors sm:text-sm font-medium appearance-none cursor-pointer"
              >
                <option value="all">Statut: Tous</option>
                <option value="pending_activation">Non actives</option>
                <option value="active">Actives</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table w-full text-left border-collapse min-w-[980px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Eleve</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Classe</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Eleve</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Parent</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Statut</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={`activation-skeleton-${i}`} className="animate-pulse">
                      <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-44"></div></td>
                      <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-28"></div></td>
                      <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-52"></div></td>
                      <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-52"></div></td>
                      <td className="py-4 px-6"><div className="h-6 bg-gray-200 rounded-full w-32"></div></td>
                      <td className="py-4 px-6"><div className="h-8 bg-gray-200 rounded w-28 ml-auto"></div></td>
                    </tr>
                  ))
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-14 text-center text-gray-400">
                      <Users className="w-12 h-12 mb-3 text-gray-200 mx-auto" />
                      <p className="text-base font-medium text-gray-500">Aucun compte pour ce filtre</p>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id_etudiant} className="hover:bg-blue-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-gray-900 text-sm">{student.nom} {student.prenom}</div>
                        <div className="text-xs text-gray-500">ID: {student.id_etudiant}</div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700">{student.classe || '-'}</td>
                      <td className="py-4 px-6 text-sm text-gray-600">{student.email || '-'}</td>
                      <td className="py-4 px-6 text-sm text-gray-600">{student.parent_email || '-'}</td>
                      <td className="py-4 px-6">
                        {student.account_status === 'active' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            En attente activation
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleActivate(student)}
                            disabled={activatingId === student.id_etudiant || student.account_status === 'active'}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            {activatingId === student.id_etudiant
                              ? 'Activation...'
                              : student.account_status === 'active'
                                ? 'Deja active'
                                : 'Activer'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeactivate(student)}
                            disabled={deactivatingId === student.id_etudiant || student.account_status !== 'active'}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            {deactivatingId === student.id_etudiant
                              ? 'Desactivation...'
                              : student.account_status !== 'active'
                                ? 'Non active'
                                : 'Desactiver'}
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
      </div>
    </div>
  );
}
