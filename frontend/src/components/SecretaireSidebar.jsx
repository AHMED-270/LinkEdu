import { NavLink } from 'react-router-dom';
import { FiGrid, FiUsers, FiCreditCard, FiBookOpen, FiCalendar, FiMessageCircle, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/secretaire/dashboard', label: 'Tableau de bord', icon: FiGrid },
  { path: '/secretaire/etudiants', label: 'Etudiants', icon: FiUsers },
  { path: '/secretaire/paiements', label: 'Paiements', icon: FiCreditCard },
  { path: '/secretaire/classes', label: 'Classes', icon: FiBookOpen },
  { path: '/secretaire/absences', label: 'Absences', icon: FiCalendar },
  { path: '/secretaire/annonces', label: 'Annonces', icon: FiMessageCircle },   
  { path: '/secretaire/reclamations', label: 'Reclamations', icon: FiAlertCircle },
];

export default function SecretaireSidebar() {
  const { user } = useAuth();
  const initials = (user?.name || 'S').trim().charAt(0).toUpperCase();

  return (
      <aside className="fixed bottom-0 left-0 top-16 z-[90] w-[260px] border-r border-slate-200 bg-white">
        <div className="flex h-full flex-col px-3 py-4">
          

          <div className="mx-2 mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-3">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt="Profil" className="h-11 w-11 rounded-full object-cover ring-2 ring-blue-100" />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white ring-2 ring-blue-100">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-slate-900">{user?.name || 'Secretaire'}</div>
                <span className="mt-1 inline-flex rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                  {user?.role || 'secretaire'}
                </span>
              </div>
            </div>
          </div>

          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Navigation</div>

          <nav className="flex flex-col gap-1 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-xl border-l-2 px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={18}
                        className={isActive ? 'text-blue-600' : 'text-slate-400 transition-colors group-hover:text-blue-600'}
                      />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </aside>
  );
}
