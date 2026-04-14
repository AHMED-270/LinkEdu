import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import TableSkeletonRows from '../components/TableSkeletonRows';
import './Dashboard.css';

export default function SecretaireDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recentReclamations, setRecentReclamations] = useState([]);
  const [stats, setStats] = useState({
    etudiants: 0,
    classes: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';
      setLoading(true);
      try {
        const [dashboardRes, reclamationsRes] = await Promise.all([
          axios.get(apiBaseUrl + '/api/secretaire/dashboard', {
            withCredentials: true,
            withXSRFToken: true,
            headers: { Accept: 'application/json' },
          }),
          axios.get(apiBaseUrl + '/api/secretaire/reclamations', {
            withCredentials: true,
            withXSRFToken: true,
            headers: { Accept: 'application/json' },
          }),
        ]);

        setStats(dashboardRes.data?.stats || {
          etudiants: 0,
          classes: 0,
        });

        const items = Array.isArray(reclamationsRes.data)
          ? reclamationsRes.data
          : (reclamationsRes.data?.reclamations || []);

        setRecentReclamations(items.slice(0, 5));
      } catch {
        // Keep default values when API is unavailable.
        setRecentReclamations([]);
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
                  <TableSkeletonRows rowCount={2} colCount={2} />
                ) : (
                  <>
                    <tr><td>Etudiants</td><td>{stats.etudiants}</td></tr>
                    <tr><td>Classes</td><td>{stats.classes}</td></tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="dash-row animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="card" style={{ flex: 1 }}>
          <div className="card-header"><h3>Reclamations recentes</h3></div>
          <div className="card-body" style={{ paddingTop: 0 }}>
            {loading ? (
              <p>Chargement...</p>
            ) : recentReclamations.length === 0 ? (
              <p>Aucune reclamation recente.</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                {recentReclamations.map((rec) => (
                  <li key={rec.id_reclamation} style={{ marginBottom: '0.7rem' }}>
                    <strong>{rec.sujet || 'Sans sujet'}</strong> - {rec.cible_label || 'Destinataire'}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
