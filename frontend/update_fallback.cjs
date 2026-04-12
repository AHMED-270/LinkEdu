const fs = require('fs');

let content = fs.readFileSync('src/components/DirecteurDashboard.jsx', 'utf8');

const regex = /<section className="prof-table-container" style=\{\{.*?\}\}>[\s\S]*?<\/section>/;

const newSection = `<section className="prof-table-container" style={{ padding: '8rem 2rem', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #1118270a', margin: '2rem 0' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#f3f4f6', marginBottom: '1.5rem' }}>
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                       <circle cx="12" cy="12" r="10"></circle>
                       <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827', margin: '0 0 0.75rem 0' }}>Module en développement</h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '0.95rem' }}>La page <strong>{activeMenu}</strong> sera bientôt disponible avec les mêmes styles de tableaux et statistiques.</p>
                </section>`;

content = content.replace(regex, newSection);

fs.writeFileSync('src/components/DirecteurDashboard.jsx', content);
console.log('Fallback style updated');
