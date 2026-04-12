import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  FiSearch as Search,
  FiPlus as Plus,
  FiEdit2 as Edit,
  FiTrash2 as Trash2,
  FiUsers as UsersIcon,
  FiFilter as Filter,
  FiUserCheck as UserCheck,
  FiBriefcase as Briefcase,
  FiBook as Book,
  FiEye as Eye,
  FiChevronLeft as ChevronLeft,
  FiChevronRight as ChevronRight,
} from 'react-icons/fi';
import { BiSolidUserDetail } from 'react-icons/bi';

export default function AdminUsers({ onCreateUser, onEditUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('tous');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activatingUserId, setActivatingUserId] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);

  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

  const fetchData = async () => {
    try {
      setLoading(true);
      const resUsers = await axios.get(apiBaseUrl + '/api/admin/users', {
        withCredentials: true,
        headers: { Accept: 'application/json' }
      });
      const visibleUsers = (resUsers.data || []).filter(
        (u) => u.role !== 'parent' && u.role !== 'parent_eleve' && u.role !== 'etudiant'
      );
      setUsers(visibleUsers);
    } catch (error) {
      console.error('Erreur fetch:', error);
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

  const requestDelete = (user) => {
    setDeleteTarget(user);
  };

  const handleCreateUser = () => {
    if (typeof onCreateUser === 'function') {
      onCreateUser();
    }
  };

  const handleEditUser = (user) => {
    if (typeof onEditUser === 'function') {
      onEditUser(user);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await ensureCsrfCookie();

      await axios.delete(`${apiBaseUrl}/api/admin/users/${deleteTarget.id}`, {
        withCredentials: true,
        withXSRFToken: true,
        headers: { Accept: 'application/json' }
      });

      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      alert('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleActivate = async (user) => {
    setActivatingUserId(user.id);
    try {
      await ensureCsrfCookie();
      const res = await axios.post(`${apiBaseUrl}/api/admin/users/${user.id}/activate`, {}, {
        withCredentials: true,
        withXSRFToken: true,
        headers: { Accept: 'application/json' }
      });

      alert(res.data?.message || 'Compte active avec succes.');
      await fetchData();
    } catch (error) {
      alert(error?.response?.data?.message || 'Erreur lors de l activation du compte.');
    } finally {
      setActivatingUserId(null);
    }
  };

  const USERS_PER_PAGE = 8;

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchMatch = !normalizedSearch || [
        user.name,
        user.email,
        user.role,
        user.telephone,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch));

      const roleMatch = roleFilter === 'tous' || user.role === roleFilter;

      return searchMatch && roleMatch;
    });
  }, [users, normalizedSearch, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));

  useEffect(() => {
    setPage(1);
  }, [searchTerm, roleFilter]);

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(start, start + USERS_PER_PAGE);
  }, [filteredUsers, page]);

  const formatDate = (value) => {
    if (!value) return '-';
    const d = new Date(value);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getRoleChipClass = (role) => {
    if (role === 'admin' || role === 'directeur') return 'bg-amber-50 text-amber-700 border border-amber-200';
    if (role === 'professeur') return 'bg-blue-50 text-blue-700 border border-blue-200';
    if (role === 'etudiant') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    if (role === 'secretaire') return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
    return 'bg-gray-100 text-gray-700 border border-gray-200';
  };

  const getStatusUI = (user) => {
    const active = user.account_status !== 'pending_activation';
    return active
      ? { label: 'Actif', dot: 'bg-emerald-500', text: 'text-emerald-700' }
      : { label: 'En attente activation', dot: 'bg-amber-500', text: 'text-amber-700' };
  };

  const firstItem = filteredUsers.length === 0 ? 0 : (page - 1) * USERS_PER_PAGE + 1;
  const lastItem = Math.min(page * USERS_PER_PAGE, filteredUsers.length);

  return (
    <div className="min-h-screen p-4 lg:p-8 bg-[#f5f7fb]">
      <div className="max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div>
          <h1 className="mt-1 flex items-center gap-2 text-4xl lg:text-5xl font-extrabold italic tracking-tight text-slate-900">
            <BiSolidUserDetail className="text-blue-600" />
            Gerer Utilisateurs
          </h1>
         
        </div>
        <button
          onClick={handleCreateUser}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2563eb] text-white font-semibold rounded-xl shadow-sm hover:bg-[#1d4ed8] transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          Nouvel Utilisateur
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100 flex flex-col xl:flex-row xl:items-center gap-3 bg-gray-50/60">
          <div className="relative w-full xl:flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher (nom, email, rôle...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors sm:text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="text-gray-400" size={16} />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="tous">Role: Tous</option>
              <option value="admin">Admin</option>
              <option value="directeur">Directeur</option>
              <option value="secretaire">Secretaire</option>
              <option value="professeur">Professeur</option>
            </select>

            
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table w-full text-left border-collapse min-w-[980px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Utilisateur</th>
                <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Role</th>
                <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date Inscription</th>
                <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Statut</th>
                <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse">
                    <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-44"></div></td>
                    <td className="py-4 px-6"><div className="h-6 bg-gray-200 rounded-full w-20"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                   <td colSpan="5" className="py-12 text-center text-gray-400">
                     <UsersIcon className="w-12 h-12 mb-3 text-gray-200 mx-auto" />
                     <p className="text-base font-medium text-gray-500">Aucun utilisateur trouvé</p>
                   </td>
                </tr>
              ) : (
                paginatedUsers.map(user => {
                  const statusUi = getStatusUI(user);
                  const canActivate = user.role === 'etudiant' && user.account_status === 'pending_activation';
                  return (
                  <tr key={user.id} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          {user.name ? user.name.substring(0, 2).toUpperCase() : '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        getRoleChipClass(user.role)
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">{formatDate(user.created_at)}</td>
                    <td className="py-4 px-6">
                      <div className={`inline-flex items-center gap-1.5 ${statusUi.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusUi.dot}`}></span>
                        <span className="text-xs font-semibold">{statusUi.label}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewTarget(user)}
                          className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-lg transition-colors cursor-pointer"
                          title="Afficher"
                        >
                          <Eye size={18} />
                        </button>
                        {canActivate && (
                          <button
                            onClick={() => handleActivate(user)}
                            disabled={activatingUserId === user.id}
                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 p-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            title="Activer le compte"
                          >
                            <UserCheck size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleEditUser(user)} 
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => requestDelete(user)} 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-white">
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-semibold text-gray-600 px-2">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
      </div>

      {viewTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Informations de l'utilisateur</h3>
              <button
                type="button"
                onClick={() => setViewTarget(null)}
                className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium"
              >
                Fermer
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Nom complet</p>
                <p className="mt-1 text-gray-900 font-semibold">{viewTarget.name || '-'}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Email</p>
                <p className="mt-1 text-gray-800">{viewTarget.email || '-'}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Role</p>
                <p className="mt-1 text-gray-800">{viewTarget.role || '-'}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Telephone</p>
                <p className="mt-1 text-gray-800">{viewTarget.telephone || '-'}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Date inscription</p>
                <p className="mt-1 text-gray-800">{formatDate(viewTarget.created_at)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Statut</p>
                <p className="mt-1 text-gray-800">{getStatusUI(viewTarget).label}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Confirmer la suppression</h3>
              <p className="text-gray-500 mb-6">
                Voulez-vous vraiment supprimer l&apos;utilisateur <strong className="text-gray-900">{deleteTarget.name}</strong> ? Cette action est irréversible.
              </p>
              
              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="px-5 py-2.5 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-5 py-2.5 rounded-xl font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
