import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import usePostLoginReady from '../hooks/usePostLoginReady';
import { 
  FiUsers as Users, 
  FiBookOpen as GraduationCap, 
  FiBookOpen as BookOpen,
  FiUserCheck as UserCheck,
  FiShield as Shield,
  FiBriefcase as Briefcase,
  FiUser as UserIcon,
  FiDollarSign as DollarSign
} from 'react-icons/fi';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

const COLORS = ['#3a7bd5', '#00d2ff', '#11998e', '#38ef7d', '#6a11cb', '#2575fc', '#f2994a'];

const roleCards = [
  { key: 'admin', label: 'ADMINISTRATEURS', badge: 'Admin', Icon: Shield, gradient: 'from-blue-500/10' },
  { key: 'directeur', label: 'DIRECTEURS', badge: 'Directeur', Icon: UserCheck, gradient: 'from-indigo-500/10' },
  { key: 'professeur', label: 'PROFESSEURS', badge: 'Prof', Icon: Briefcase, gradient: 'from-amber-500/10' },
  { key: 'secretaire', label: 'SECRÉTAIRES', badge: 'Staff', Icon: UserIcon, gradient: 'from-emerald-500/10' },
  { key: 'comptable', label: 'COMPTABLES', badge: 'Finance', Icon: DollarSign, gradient: 'from-cyan-500/10' },
  { key: 'etudiant', label: 'ÉLÈVES', badge: 'Étudiant', Icon: Users, gradient: 'from-purple-500/10' },
  { key: 'parent', label: 'PARENTS', badge: 'Famille', Icon: Users, gradient: 'from-orange-500/10', combineKey: 'parent_eleve' },
];

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

  usePostLoginReady(!loading);

  const chartData = stats.classDistribution.map(cls => ({
    name: cls.nom,
    level: cls.niveau,
    total: cls.total
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="premium-stat !p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-brand-navy to-brand-teal bg-clip-text text-transparent tracking-tight flex items-center gap-3">
            <Shield className="text-brand-teal" size={28} />
            Vue d'ensemble
          </h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">État du système LinkEdu en temps réel.</p>
        </div>
        {stats.anneeScolaireActuelle && (
          <div className="bg-gradient-to-tr from-brand-navy to-brand-teal text-white px-6 py-3 rounded-2xl shadow-premium border border-white/20 flex flex-col items-center transition-transform hover:-translate-y-1 duration-300">
            <span className="text-[10px] uppercase font-bold tracking-widest opacity-80">Année Académique</span>
            <span className="text-xl font-black">{stats.anneeScolaireActuelle}</span>
          </div>
        )}
      </div>

      {/* Role Cards */}
      <div>
        <h2 className="text-base font-bold text-brand-navy flex items-center gap-2 mb-5">
          <Shield className="text-brand-teal" size={18} /> Répartition par Rôle
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {roleCards.map((card, i) => {
            const Icon = card.Icon;
            const count = card.combineKey
              ? (stats.roleCounts[card.key] || 0) + (stats.roleCounts[card.combineKey] || 0)
              : (stats.roleCounts[card.key] || 0);
            return (
              <motion.div
                key={card.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="premium-stat group overflow-hidden relative text-center"
              >
                <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${card.gradient} to-transparent rounded-bl-[60px] z-0 transition-transform duration-500 group-hover:scale-125`} />
                <div className="relative z-10">
                  <div className="mx-auto mb-3 h-10 w-10 rounded-2xl bg-white/80 border border-white/60 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                    <Icon size={18} className="text-brand-teal" />
                  </div>
                  <span className="premium-badge-gray text-[9px] mb-2">{card.badge}</span>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-2 mb-1">{card.label}</p>
                  <h3 className="text-2xl font-black text-brand-navy group-hover:text-brand-teal transition-colors">{count}</h3>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Chart + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="premium-stat !p-8 lg:col-span-2"
        >
          <div className="premium-section-header">
            <h2 className="premium-section-title">
              <GraduationCap className="text-brand-teal" size={20} /> Répartition des élèves par Classe
            </h2>
          </div>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  cursor={{ fill: 'rgba(64, 161, 216, 0.06)' }}
                  contentStyle={{
                    borderRadius: '1rem',
                    border: '1px solid rgba(255,255,255,0.6)',
                    boxShadow: '0 10px 40px rgba(20,39,78,0.08)',
                    backdropFilter: 'blur(12px)',
                    background: 'rgba(255,255,255,0.85)',
                    padding: '12px 16px',
                  }}
                  labelFormatter={(name, props) => `${name} (${props[0]?.payload?.level})`}
                />
                <Bar dataKey="total" radius={[8, 8, 0, 0]} barSize={36}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="premium-stat !p-8"
        >
          <div className="premium-section-header">
            <h2 className="premium-section-title">Résumé Académique</h2>
          </div>
          <div className="space-y-5">
            {[
              { label: 'Classes totales', value: stats.totalClasses },
              { label: 'Matières actives', value: stats.totalMatieres },
              { label: 'Élèves / Professeur', value: stats.totalProfesseurs > 0 ? (stats.totalStudents / stats.totalProfesseurs).toFixed(1) : 0 },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-3 border-b border-white/40 last:border-0">
                <span className="text-sm font-semibold text-slate-500">{item.label}</span>
                <span className="text-lg font-black text-brand-navy">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
