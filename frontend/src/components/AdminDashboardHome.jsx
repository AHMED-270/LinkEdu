import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, GraduationCap, Briefcase, BookOpen, Calendar, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminDashboardHome() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    totalProfesseurs: 0,
    totalMatieres: 0,
    anneeScolaireActuelle: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const browserHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
        const apiBaseUrl = import.meta.env.VITE_API_URL ?? `http://${browserHost}:8000`;
        const token = localStorage.getItem('linkedu_token');
        const response = await axios.get(apiBaseUrl + '/api/admin/dashboard-stats', {
          withCredentials: true,
          headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
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
    
    // Slight artificial delay just to let the animation shine (optional)
    setTimeout(fetchStats, 300);
  }, []);

  // Array of stat cards makes rendering and animating much cleaner
  const statCards = [
    { id: 1, label: 'TOTAL ÉTUDIANTS', value: stats.totalStudents, icon: Users, color: 'blue' },
    { id: 2, label: 'TOTAL CLASSES', value: stats.totalClasses, icon: GraduationCap, color: 'green' },
    { id: 3, label: 'TOTAL PROFESSEURS', value: stats.totalProfesseurs, icon: Briefcase, color: 'orange' },
    { id: 4, label: 'TOTAL MATIÈRES', value: stats.totalMatieres, icon: BookOpen, color: 'red' },
    { id: 5, label: 'ANNÉE SCOLAIRE', value: stats.anneeScolaireActuelle || '-', icon: Calendar, color: 'blue' }
  ];

  // Framer Motion staggered animation configurations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { type: 'spring', stiffness: 100, damping: 15 } 
    }
  };

  return (
    <div className="layout-content">
      {/* Welcome Banner */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8 p-8 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-[0_10px_30px_rgba(37,99,235,0.2)] relative overflow-hidden"
      >
        {/* Background decorative elements for the banner */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-20 w-32 h-32 bg-blue-400 opacity-20 rounded-full blur-2xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold mb-2">Tableau de bord administrateur</h1>
            <p className="text-blue-100 text-lg">
              Bienvenue sur LinkEdu. Voici un aperçu global de votre établissement.
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 self-start md:self-auto">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="font-medium text-sm">Système Opérationnel</span>
          </div>
        </div>
      </motion.div>

      {/* Main Stats Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8"
      >
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div key={card.id} variants={cardVariants} className="stat-card">
              <div className={`stat-icon ${card.color}`}>
                <Icon size={24} />
              </div>
              <div className="stat-info">
                <h4 className="text-2xl font-black text-slate-800 tracking-tight">
                  {loading ? (
                    <div className="h-8 w-16 bg-slate-200 rounded animate-pulse"></div>
                  ) : (
                    card.value
                  )}
                </h4>
                <p className="text-xs font-bold text-slate-500 mt-1 tracking-wider uppercase">
                  {card.label}
                </p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Placeholder for future dashboard widgets (Charts, Recent Activity) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <div className="lg:col-span-2 card p-8 min-h-[300px] flex flex-col items-center justify-center text-slate-400 border-dashed border-2 border-slate-200 bg-slate-50/50">
          <Activity size={48} className="mb-4 text-slate-300" />
          <h3 className="text-lg font-bold text-slate-600">Activité Récente</h3>
          <p className="text-sm">Espace réservé pour le graphique des présences ou des notes.</p>
        </div>
        
        <div className="card p-8 min-h-[300px] flex flex-col items-center justify-center text-slate-400 border-dashed border-2 border-slate-200 bg-slate-50/50">
          <Users size={48} className="mb-4 text-slate-300" />
          <h3 className="text-lg font-bold text-slate-600">Dernières Inscriptions</h3>
          <p className="text-sm text-center mt-2">Espace réservé pour la liste des derniers utilisateurs ajoutés.</p>
        </div>
      </motion.div>
    </div>
  );
}
