import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { BiSearchAlt2, BiUserVoice } from 'react-icons/bi';
import { ROLE, getPortalLabelByRole } from '../constants/roles';

axios.defaults.withCredentials = true;

function DirectoryProfessors({ userRole = ROLE.DIRECTEUR }) {
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [niveauFilter, setNiveauFilter] = useState('');
  const [matiereFilter, setMatiereFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const portalLabel = getPortalLabelByRole(userRole);
  const token = localStorage.getItem('linkedu_token');

  useEffect(() => {
    fetchProfessors();
  }, []);

  const fetchProfessors = async () => {
    try {
      setLoading(true);
      const host = window.location.hostname;
      const response = await axios.get(`http://${host}:8000/api/directeur/professeurs`, {
        withCredentials: true,
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      setProfessors(response.data);
    } catch (error) {
      console.error("Error fetching professors:", error);
      setProfessors([]);
    } finally {
      setLoading(false);
    }
  };

  const normalizedNiveaux = useMemo(() => {
    return [...new Set(
      professors
        .flatMap((prof) => prof?.niveaux || [])
        .map((niveau) => String(niveau || '').trim())
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, 'fr'));
  }, [professors]);

  const normalizedMatieres = useMemo(() => {
    return [...new Set(
      professors
        .flatMap((prof) => prof?.matieres || [])
        .map((matiere) => {
          const lower = String(matiere || '').trim().toLowerCase();
          if (['mathématique', 'mathematique', 'maths', 'math'].includes(lower)) {
            return 'math';
          }
          return String(matiere || '').trim();
        })
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, 'fr'));
  }, [professors]);

  const filteredProfessors = useMemo(() => {
    const nameTerm = nameFilter.trim().toLowerCase();

    return professors.filter((professeur) => {
      const niveauOk = !niveauFilter || (professeur?.niveaux || []).includes(niveauFilter);
      const matiereOk = !matiereFilter || (professeur?.matieres || []).map((matiere) => {
        const lower = String(matiere || '').trim().toLowerCase();
        return ['mathématique', 'mathematique', 'maths', 'math'].includes(lower) ? 'math' : String(matiere || '').trim();
      }).includes(matiereFilter);
      const fullName = `${professeur?.prenom || ''} ${professeur?.nom || ''} ${professeur?.name || ''}`.toLowerCase();
      const nameOk = !nameTerm || fullName.includes(nameTerm);
      return niveauOk && matiereOk && nameOk;
    });
  }, [professors, niveauFilter, matiereFilter, nameFilter]);

  return (
    <div className="prof-page">
      <div className="prof-breadcrumb">{portalLabel} &gt; <span>Professeurs</span></div>
      <header className="page-dashboard-header">
        <div>
          <h1 className="prof-title-with-icon">
            <BiUserVoice />
            <span>Liste des Professeurs</span>
          </h1>
          <p>Filtrez par niveau et par matiere, avec affichage des matieres multiples.</p>
        </div>
      </header>

      <section className="prof-filters-section" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: 12 }}>
        <div className="prof-filter-group">
          <label>RECHERCHER PAR NOM</label>
          <div className="prof-name-search-wrap">
            <BiSearchAlt2 />
            <input
              type="text"
              placeholder="Nom du professeur"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
            />
          </div>
        </div>
        <div className="prof-filter-group">
          <label>FILTRER PAR MATIÈRE</label>
          <select value={matiereFilter} onChange={(e) => setMatiereFilter(e.target.value)}>
            <option value="">Toutes les matières</option>
            {normalizedMatieres.map((matiere) => (
              <option key={matiere} value={matiere}>{matiere}</option>
            ))}
          </select>
        </div>
        <div className="prof-filter-group">
          <label>FILTRER PAR NIVEAU</label>
          <select value={niveauFilter} onChange={(e) => setNiveauFilter(e.target.value)}>
            <option value="">Tous les niveaux</option>
            {normalizedNiveaux.map((niveau) => (
              <option key={niveau} value={niveau}>{niveau}</option>
            ))}
          </select>
        </div>
      </section>

      {loading ? (
        <div style={{padding: '2rem'}}>Chargement des professeurs...</div>
      ) : (
        <section className="prof-table-container">
          <table className="prof-table">
            <thead>
              <tr>
                <th>AVATAR & NOM</th>
                <th>MATIÈRES ENSEIGNÉES</th>
                <th>NIVEAU</th>
                <th>CLASSES ENSEIGNÉES</th>
              </tr>
            </thead>
            <tbody>
              {filteredProfessors.length === 0 && (
                <tr>
                  <td colSpan="4" style={{textAlign: 'center', padding: '2rem'}}>Aucun professeur trouvé pour ces filtres.</td>
                </tr>
              )}
              {filteredProfessors.map((prof) => (
                <tr key={prof.id}>
                  <td>
                    <div className="prof-user-info">
                      <img src={prof.avatar} alt="Avatar" className="prof-avatar" />
                      <div>
                        <strong>{prof.name}</strong>
                        <span>{prof.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="prof-classes">
                      {(prof.matieres || []).length > 0 ? (
                        (prof.matieres || []).map((matiere, i) => {
                          const lower = String(matiere || '').trim().toLowerCase();
                          const displayMatiere = ['mathématique', 'mathematique', 'maths', 'math'].includes(lower) ? 'math' : matiere;
                          return <span key={i} className="prof-class-tag">{displayMatiere}</span>;
                        })
                      ) : (
                        <span className="prof-class-tag" style={{backgroundColor: '#e2e8f0', color: '#4a5568'}}>Non renseigné</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="prof-classes">
                      {(prof.niveaux || []).length > 0 ? (
                        (prof.niveaux || []).map((niveau, i) => <span key={i} className="prof-class-tag">{niveau}</span>)
                      ) : (
                        <span className="prof-class-tag" style={{backgroundColor: '#e2e8f0', color: '#4a5568'}}>Non assigné</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="prof-classes">
                      {(prof.classes || []).length > 0 ? (
                        [...new Map((prof.classes || []).map((cls) => [String(cls.id_classe || cls.nom || ''), cls])).values()].map((cls, i) => (
                          <span key={i} className="prof-class-tag">{`${cls.nom || ''} ${cls.niveau ? `(${cls.niveau})` : ''}`.trim()}</span>
                        ))
                      ) : (
                        <span className="prof-class-tag" style={{backgroundColor: '#e2e8f0', color: '#4a5568'}}>Aucune classe</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="prof-pagination">
            <span>Affichage de <strong>{filteredProfessors.length}</strong> professeur(s)</span>
          </div>
        </section>
      )}
    </div>
  );
}

export default DirectoryProfessors;
