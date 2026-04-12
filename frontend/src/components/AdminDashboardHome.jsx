import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiUsers as Users, FiBookOpen as GraduationCap, FiAlertCircle as AlertCircle, FiFileText as FileText, FiBookOpen as BookOpen } from 'react-icons/fi';
import { BiSolidUserDetail } from 'react-icons/bi';

export default function AdminDashboardHome() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    totalProfesseurs: 0,
    totalMatieres: 0,
    anneeScolaireActuelle: ''
  });

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
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="dashboard-content">
      <header className="content-header">
        <h1 className="mt-1 flex items-center gap-2 text-4xl lg:text-5xl font-extrabold italic tracking-tight text-slate-900">
          <BiSolidUserDetail className="text-blue-600" />
          Tableau de bord de l'Administrateur
        </h1>
        <p>Statut global : Le système est opérationnel. {stats.totalStudents} étudiants actifs répartis sur {stats.totalClasses} classes.</p>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon bg-blue-light">
            <Users size={24} className="text-blue" />
          </div>
          <div className="stat-info">
            <p className="stat-label">TOTAL ETUDIANTS</p>
            <h3 className="stat-value">{stats.totalStudents}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-indigo-light">
            <GraduationCap size={24} className="text-indigo" />
          </div>
          <div className="stat-info">
            <p className="stat-label">TOTAL CLASSES</p>
            <h3 className="stat-value">{stats.totalClasses}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-orange-light">
            <AlertCircle size={24} className="text-orange" />
          </div>
          <div className="stat-info">
            <p className="stat-label">TOTAL PROFESSEURS</p>
            <h3 className="stat-value">{stats.totalProfesseurs}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-indigo-light">
            <BookOpen size={24} className="text-indigo" />
          </div>
          <div className="stat-info">
            <p className="stat-label">TOTAL MATIERES</p>
            <h3 className="stat-value">{stats.totalMatieres}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-emerald-light">
            <FileText size={24} className="text-emerald" />
          </div>
          <div className="stat-info">
            <p className="stat-label">ANNEE SCOLAIRE ACTUELLE</p>
            <h3 className="stat-value">{stats.anneeScolaireActuelle || '-'}</h3>
          </div>
        </div>
      </div>


    </div>
  );
}
