import './Parametres.css';

export default function Parametres() {
  return (
    <div className="parametres-page">
      <div className="param-header animate-fade-in">
        <h2>Paramètres</h2>
        <p>Les paramètres seront gérés depuis la base de données et les rôles.</p>
      </div>

      <div className="card animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Paramètre</th>
                <th>Valeur</th>
                <th>Rôle</th>
                <th>Dernière mise à jour</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
