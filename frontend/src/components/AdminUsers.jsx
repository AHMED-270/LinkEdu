import { useState, useEffect, useMemo, useCallback } from 'react';
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
import TableSkeletonRows from './TableSkeletonRows';
import LinkEduPopup from './LinkEduPopup';
import GlassModal from './GlassModal';

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
  const [popupNotice, setPopupNotice] = useState({
    open: false,
    title: '',
    message: '',
    tone: 'info',
  });

  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

  const fetchData = useCallback(async () => {
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
  }, [apiBaseUrl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    } catch {
      showNotice('Suppression impossible', 'Erreur lors de la suppression.', 'danger');
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

      showNotice('Compte active', res.data?.message || 'Compte active avec succes.', 'success');
      await fetchData();
    } catch (error) {
      showNotice('Activation impossible', error?.response?.data?.message || 'Erreur lors de l activation du compte.', 'danger');
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
    if (role === 'comptable') return 'bg-violet-50 text-violet-700 border border-violet-200';
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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-brand-navy to-brand-teal bg-clip-text text-transparent tracking-tight flex items-center gap-3">
            <UsersIcon className="text-brand-teal" size={28} />
            Gérer Utilisateurs
          </h1>
        </div>
        <button
          onClick={handleCreateUser}
          className="premium-btn-primary"
        >
          <Plus className="w-4 h-4" />
          Nouvel Utilisateur
        </button>
      </div>

      <div className="premium-stat !p-0 overflow-hidden">
        <div className="px-6 py-5 border-b border-white/40 flex flex-col xl:flex-row xl:items-center gap-3 bg-white/30 backdrop-blur-sm">
          <div className="relative w-full xl:flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher (nom, email, rôle...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="premium-input !pl-11"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="text-gray-400" size={16} />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="premium-select w-auto"
            >
              <option value="tous">Role: Tous</option>
              <option value="admin">Admin</option>
              <option value="directeur">Directeur</option>
              <option value="secretaire">Secretaire</option>
              <option value="comptable">Comptable</option>
              <option value="professeur">Professeur</option>
            </select>

            
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table w-full text-left border-collapse min-w-[980px]">
            <thead>
              <tr className="bg-white/40 border-b border-slate-100/50">
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Utilisateur</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date Inscription</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Statut</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/80">
              {loading ? (
                <TableSkeletonRows rowCount={4} colCount={5} />
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
                  <tr key={user.id} className="transition-colors duration-200 hover:bg-white/60 group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-navy/10 to-brand-teal/10 text-brand-navy flex items-center justify-center font-bold text-sm group-hover:from-brand-navy group-hover:to-brand-teal group-hover:text-white transition-all">
                          {user.name ? user.name.substring(0, 2).toUpperCase() : '?'}
                        </div>
                        <div>
                          <p className="font-bold text-brand-navy text-sm">{user.name}</p>
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
                          className="text-slate-500 hover:text-slate-700 hover:bg-white/20 p-2 rounded-lg transition-colors cursor-pointer"
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

  <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-white/20">
          <p className="text-xs font-medium text-gray-500">
            {filteredUsers.length === 0 ? '0 resultat' : `${firstItem}-${lastItem} sur ${filteredUsers.length}`}
          </p>
          
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

      {viewTarget && (
        <GlassModal open={Boolean(viewTarget)} onClose={() => setViewTarget(null)} panelClassName="max-w-2xl p-0">
          <div className="premium-modal-card !max-w-none !rounded-none !border-0 !bg-transparent !text-left !shadow-none">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-brand-navy">Informations de l'utilisateur</h3>
              <button
                type="button"
                onClick={() => setViewTarget(null)}
                className="premium-btn-secondary premium-btn-sm"
              >
                Fermer
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Nom complet</p>
                <p className="mt-1 text-brand-navy font-bold">{viewTarget.name || '-'}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Email</p>
                <p className="mt-1 text-slate-700">{viewTarget.email || '-'}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Role</p>
                <p className="mt-1 text-slate-700">{viewTarget.role || '-'}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Telephone</p>
                <p className="mt-1 text-slate-700">{viewTarget.telephone || '-'}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Date inscription</p>
                <p className="mt-1 text-slate-700">{formatDate(viewTarget.created_at)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Statut</p>
                <p className="mt-1 text-slate-700">{getStatusUI(viewTarget).label}</p>
              </div>
            </div>
          </div>
        </GlassModal>
      )}

      <LinkEduPopup
        open={Boolean(deleteTarget)}
        title="Confirmer la suppression"
        message={deleteTarget ? `Voulez-vous vraiment supprimer ${deleteTarget.name} ? Cette action est irreversible.` : ''}
        tone="danger"
        confirmText="Oui, supprimer"
        cancelText="Annuler"
        onConfirm={handleDelete}
        onClose={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
        loading={isDeleting}
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

