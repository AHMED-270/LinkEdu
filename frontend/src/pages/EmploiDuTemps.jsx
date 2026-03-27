import './EmploiDuTemps.css';

export default function EmploiDuTemps() {
  return (
    <div className="edt-page">
      <div className="edt-header animate-fade-in">
        <div>
          <h2>Emploi du Temps</h2>
          <p>Les créneaux seront chargés depuis la base de données.</p>
        </div>
      </div>

      <div className="card animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Jour</th>
                <th>Début</th>
                <th>Fin</th>
                <th>Matière</th>
                <th>Classe</th>
                <th>Salle</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
