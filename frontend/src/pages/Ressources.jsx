import './Ressources.css';

export default function Ressources() {
  return (
    <div className="ressources-page">
      <div className="ressources-header animate-fade-in">
        <h2>Publier une Ressource</h2>
        <p>Les ressources seront gérées depuis la base de données.</p>
      </div>

      <div className="card animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Type</th>
                <th>Matière</th>
                <th>Classe</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
