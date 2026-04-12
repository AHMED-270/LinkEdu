const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'DirectoryStudents.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const regex = /<button\s+onClick=\{\(\) => alert\([\s\S]*?'Aucune absence'\}\`\)\}/g;

const replacement = `<button\n                      onClick={() => setSelectedStudent(student)}`;

content = content.replace(regex, replacement);

const modalCode = `
          <div className="prof-pagination">
            <span>Affichage de <strong>{filteredStudents.length}</strong> étudiants</span>
          </div>
        </section>
      )}

      {selectedStudent && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', padding: '30px', borderRadius: '10px', maxWidth: '500px', width: '100%',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>Bilan d\\'absence</h2>
              <button 
                onClick={() => setSelectedStudent(null)} 
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }}
              >&times;</button>
            </div>
            
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '25px', paddingBottom: '15px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#1d4ed8', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>
                {getInitials(selectedStudent)}
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '16px', color: '#0f172a' }}>{selectedStudent.name}</strong>
                <span style={{ fontSize: '14px', color: '#64748b' }}>{selectedStudent.classe_nom} • {selectedStudent.matricule}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '25px' }}>
              <div style={{ backgroundColor: '#f1f5f9', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>{selectedStudent.total_absences}</div>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>SÉANCES</div>
              </div>
              <div style={{ backgroundColor: '#f1f5f9', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{selectedStudent.heures_absence}</div>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>HEURES</div>
              </div>
              <div style={{ backgroundColor: '#f1f5f9', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: selectedStudent.note_assiduite >= 10 ? '#10b981' : '#ef4444' }}>{selectedStudent.note_assiduite}/20</div>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>NOTE</div>
              </div>
            </div>

            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '8px', color: '#64748b', fontSize: '13px' }}>Date</th>
                    <th style={{ padding: '8px', color: '#64748b', fontSize: '13px' }}>Heure</th>
                    <th style={{ padding: '8px', color: '#64748b', fontSize: '13px' }}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedStudent.absences_details && selectedStudent.absences_details.length > 0 ? (
                    selectedStudent.absences_details.map((abs, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 8px', fontSize: '14px' }}>{abs.date ? abs.date.slice(0, 10) : '-'}</td>
                        <td style={{ padding: '10px 8px', fontSize: '14px' }}>{abs.heure ? abs.heure.slice(0, 5) : '-'}</td>
                        <td style={{ padding: '10px 8px' }}>
                          <span style={{ 
                            fontSize: '12px', padding: '3px 8px', borderRadius: '12px', 
                            backgroundColor: abs.justifiee ? '#dcfce7' : '#fee2e2', 
                            color: abs.justifiee ? '#166534' : '#991b1b',
                            fontWeight: 'bold'
                          }}>
                            {abs.justifiee ? 'Justifiée' : 'Non justifiée'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                        Aucun historique d\\'absence
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '25px', textAlign: 'right' }}>
              <button 
                onClick={() => setSelectedStudent(null)}
                style={{ padding: '8px 20px', backgroundColor: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
`;

// Replace the end of the file with the modal
const endRegex = /<\div className="prof-pagination">[\s\S]*?<\/div>\s*<\/section>\s*\)}[\s\S]*?<\/div>/;
if (content.match(endRegex)) {
  content = content.replace(endRegex, modalCode);
} else {
  console.log("Could not match the end of file for modal injection. Replacing pagination string instead.");
  // Alternate replacement
  const endRegexBackup = /<div className="prof-pagination">[\s\S]*?<\/div>\s*<\/section>\s*\)}\s*<\/div>/;
  content = content.replace(endRegexBackup, modalCode);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Script completed successfully.');
