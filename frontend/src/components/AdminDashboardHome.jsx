import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiUsers as Users, 
  FiBookOpen as GraduationCap, 
  FiAlertCircle as AlertCircle, 
  FiFileText as FileText, 
  FiBookOpen as BookOpen,
  FiUserCheck as UserCheck,
  FiShield as Shield,
  FiBriefcase as Briefcase,
  FiUser as UserIcon,
  FiDollarSign as DollarSign
} from 'react-icons/fi';
import { BiSolidUserDetail } from 'react-icons/bi';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

export default function AdminDashboardHome() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    totalProfesseurs: 0,
    totalMatieres: 0,
    roleCounts: {},
    classDistribution: [],
    anneeScolaireActuelle: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
        const response = await axios.get(apiBaseUrl + '/api/admin/dashboard-stats', {
          withCredentials: true,
          headers: { Accept: 'application/json' }
        });
        if (response.data) {
          setStats(response.data);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des statistiques:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#a4de6c'];

  const chartData = stats.classDistribution.map(cls => ({
    name: cls.nom,
    level: cls.niveau,
    total: cls.total
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="text-xl text-slate-500 font-medium animate-pulse">Chargement des statistiques...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <header className="content-header mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="mt-1 flex items-center gap-3 text-3xl lg:text-4xl font-extrabold italic tracking-tight text-slate-900">
            <BiSolidUserDetail className="text-blue-600" />
            Vue d'ensemble
          </h1>
          <p className="text-slate-600">État du système LinkEdu en temps réel.</p>
        </div>
        <div className="bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-indigo-200 flex flex-col items-center justify-center">
           <span className="text-[10px] uppercase font-bold tracking-widest opacity-80">Année Académique</span>
           <span className="text-xl font-black">{stats.anneeScolaireActuelle}</span>
        </div>
      </header>

      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
           <Shield className="text-blue-600" size={20} /> Répartition par Rôle
        </h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon-wrapper bg-blue-light">
                <Shield size={20} className="text-blue" />
              </div>
              <span className="stat-badge badge-gray">Admin</span>
            </div>
            <p className="stat-label">ADMINISTRATEURS</p>
            <h3 className="stat-value">{stats.roleCounts.admin || 0}</h3>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon-wrapper bg-indigo-light">
                <UserCheck size={20} className="text-indigo" />
              </div>
              <span className="stat-badge badge-gray">Directeur</span>
            </div>
            <p className="stat-label">DIRECTEURS</p>
            <h3 className="stat-value">{stats.roleCounts.directeur || 0}</h3>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon-wrapper bg-orange-light">
                <Briefcase size={20} className="text-orange" />
              </div>
              <span className="stat-badge badge-gray">Prof</span>
            </div>
            <p className="stat-label">PROFESSEURS</p>
            <h3 className="stat-value">{stats.roleCounts.professeur || 0}</h3>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon-wrapper bg-emerald-light">
                <UserIcon size={20} className="text-emerald" />
              </div>
              <span className="stat-badge badge-gray">Staff</span>
            </div>
            <p className="stat-label">SECRÉTAIRES</p>
            <h3 className="stat-value">{stats.roleCounts.secretaire || 0}</h3>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon-wrapper bg-blue-light">
                <DollarSign size={20} className="text-blue" />
              </div>
              <span className="stat-badge badge-gray">Finance</span>
            </div>
            <p className="stat-label">COMPTABLES</p>
            <h3 className="stat-value">{stats.roleCounts.comptable || 0}</h3>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon-wrapper bg-indigo-light">
                <Users size={20} className="text-indigo" />
              </div>
              <span className="stat-badge badge-green">Étudiant</span>
            </div>
            <p className="stat-label">ÉLÈVES</p>
            <h3 className="stat-value">{stats.roleCounts.etudiant || 0}</h3>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon-wrapper bg-orange-light">
                <Users size={20} className="text-orange" />
              </div>
              <span className="stat-badge badge-gray">Famille</span>
            </div>
            <p className="stat-label">PARENTS</p>
            <h3 className="stat-value">{(stats.roleCounts.parent || 0) + (stats.roleCounts.parent_eleve || 0)}</h3>
          </div>
        </div>
      </div>

      <div className="main-grid">
        <div className="recent-activities">
          <div className="section-header">
            <h2 className="flex items-center gap-2">
              <GraduationCap className="text-indigo-600" size={20} /> Répartition des élèves par Classe
            </h2>
          </div>
          
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip 
                  cursor={{ fill: '#F1F5F9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelFormatter={(name, props) => `${name} (${props[0]?.payload?.level})`}
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="right-panel">
          <div className="panel-card mb-4">
            <h2 className="text-lg font-bold mb-4">Résumé Académique</h2>
            <div className="health-list space-y-4">
              <div className="health-item flex justify-between">
                <span className="health-label text-slate-600">Classes totales</span>
                <span className="font-bold text-slate-800">{stats.totalClasses}</span>
              </div>
              <div className="health-item flex justify-between">
                <span className="health-label text-slate-600">Matières actives</span>
                <span className="font-bold text-slate-800">{stats.totalMatieres}</span>
              </div>
              <div className="health-item flex justify-between">
                <span className="health-label text-slate-600">Élèves / Professeur</span>
                <span className="font-bold text-slate-800">
                  {stats.totalProfesseurs > 0 ? (stats.totalStudents / stats.totalProfesseurs).toFixed(1) : 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
