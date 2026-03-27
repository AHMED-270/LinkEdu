import './Annonces.css';

export default function Annonces() {
  return (
    <div className="annonces-page">
      <div className="annonces-header animate-fade-in">
        <div>
          <h2>Annonces de l'Établissement</h2>
          <p>Les annonces seront chargées depuis la base de données.</p>
        </div>
      </div>

      <div className="card animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Contenu</th>
                <th>Auteur</th>
                <th>Date</th>
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
