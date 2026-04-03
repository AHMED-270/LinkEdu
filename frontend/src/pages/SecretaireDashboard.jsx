import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

export default function SecretaireDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    etudiants: 0,
    classes: 0,
    absences_aujourdhui: 0,
    reclamations_en_attente: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';
      setLoading(true);
      try {
        const res = await axios.get(apiBaseUrl + '/api/secretaire/dashboard', {
          withCredentials: true,
          withXSRFToken: true,
          headers: { Accept: 'application/json' },
        });
        setStats(res.data?.stats || {
          etudiants: 0,
          classes: 0,
          absences_aujourdhui: 0,
          reclamations_en_attente: 0,
        });
      } catch {
        // Keep default values when API is unavailable.
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="dashboard">
      <div className="dash-greeting animate-fade-in">
        <div>
          <h2>Bonjour, {user?.name || 'Secretaire'}</h2>
          <p>Vue globale des operations administratives.</p>
        </div>
      </div>

      <div className="dash-row animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="card" style={{ flex: 1 }}>
          <div className="card-header"><h3>Indicateurs</h3></div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Metrique</th>
                  <th>Valeur</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(4)].map((_, index) => (
                    <tr key={`dash-skeleton-${index}`} className="animate-pulse">
                      <td><div className="h-3.5 w-36 rounded bg-slate-200"></div></td>
                      <td><div className="h-3.5 w-12 rounded bg-slate-200"></div></td>
                    </tr>
                  ))
                ) : (
                  <>
                    <tr><td>Etudiants</td><td>{stats.etudiants}</td></tr>
                    <tr><td>Classes</td><td>{stats.classes}</td></tr>
                    <tr><td>Absences (aujourd'hui)</td><td>{stats.absences_aujourdhui}</td></tr>
                    <tr><td>Reclamations en attente</td><td>{stats.reclamations_en_attente}</td></tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
