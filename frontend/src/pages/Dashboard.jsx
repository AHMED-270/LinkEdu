import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="dashboard">
      <div className="dash-greeting animate-fade-in">
        <div>
          <h2>Bonjour, {user?.name || 'Professeur'}</h2>
          <p>Le contenu sera chargé depuis la base de données.</p>
        </div>
      </div>

      <div className="dash-row animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="card" style={{ flex: 1.2 }}>
          <div className="card-header">
            <h3>Tableau de bord</h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Indicateur</th>
                  <th>Valeur</th>
                  <th>Détail</th>
                </tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ flex: 1 }}>
          <div className="card-header">
            <h3>Résumé</h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Catégorie</th>
                  <th>Valeur</th>
                </tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
