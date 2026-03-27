import './Notes.css';

export default function Notes() {
  return (
    <div className="notes-page">
      <div className="notes-header animate-fade-in">
        <div>
          <h2>Saisie des Notes</h2>
          <p>Les notes seront gérées depuis la base de données.</p>
        </div>
      </div>

      <div className="card notes-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="notes-table-wrapper card-body" style={{ padding: 0 }}>
          <table className="table notes-table">
            <thead>
              <tr>
                <th>Élève</th>
                <th>Classe</th>
                <th>Matière</th>
                <th>Type d'évaluation</th>
                <th>Note / 20</th>
                <th>Appréciation</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
