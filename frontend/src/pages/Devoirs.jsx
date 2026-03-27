import './Devoirs.css';

export default function Devoirs() {
  return (
    <div className="dvr-page">
      <div className="dvr-header">
        <div className="dvr-title-section">
          <h2>Devoirs & Ressources</h2>
          <p>Les devoirs et ressources seront gérés depuis la base de données.</p>
        </div>
      </div>

      <div className="card" style={{ marginTop: '16px' }}>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Type</th>
                <th>Classe</th>
                <th>Matière</th>
                <th>Date limite</th>
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
