import './Appel.css';

export default function Appel() {
  return (
    <div className="appel-page">
      <div className="appel-header animate-fade-in">
        <div>
          <h2>Feuille d'Appel</h2>
          <p>Les absences seront gérées depuis la base de données.</p>
        </div>
      </div>

      <div className="card appel-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="appel-table-wrapper card-body" style={{ padding: 0 }}>
          <table className="table appel-table">
            <thead>
              <tr>
                <th>Élève</th>
                <th>Classe</th>
                <th>Date</th>
                <th>Heure</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
