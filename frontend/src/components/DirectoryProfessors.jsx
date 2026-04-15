import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { BiSearchAlt2, BiUserVoice } from 'react-icons/bi';
import { ROLE, getPortalLabelByRole } from '../constants/roles';

axios.defaults.withCredentials = true;

const CYCLE_ORDER = ['Maternelle', 'Primaire', 'College', 'Lycee'];

function normalizeFilterKey(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function toCycleLabel(level) {
  const key = normalizeFilterKey(level);
  if (!key) return '';

  if (['ms', 'mm', 'gs'].includes(key) || key.includes('maternelle') || key.includes('section')) {
    return 'Maternelle';
  }

  if (
    ['1ap', '2ap', '3ap', '4ap', '5ap', '6ap'].includes(key)
    || key.includes('primaire')
    || /^([1-6])(ap|aep)$/.test(key)
    || /^(cp|ce1|ce2|cm1|cm2)$/.test(key)
  ) {
    return 'Primaire';
  }

  if (['1ac', '2ac', '3ac'].includes(key) || key.includes('college')) {
    return 'College';
  }

  if (
    ['tc', '1bac', '2bac'].includes(key)
    || key.includes('lycee')
    || key.includes('baccalaureat')
    || key.includes('bac')
  ) {
    return 'Lycee';
  }

  return '';
}

function collectCycleLabels(professeur) {
  const cycles = new Set();

  (professeur?.niveaux || []).forEach((niveau) => {
    const cycle = toCycleLabel(niveau);
    if (cycle) cycles.add(cycle);
  });

  (professeur?.classes || []).forEach((classe) => {
    const cycle = toCycleLabel(classe?.niveau);
    if (cycle) cycles.add(cycle);
  });

  return CYCLE_ORDER.filter((cycle) => cycles.has(cycle));
}

function uniqueTrimmed(values) {
  return [...new Set(
    (Array.isArray(values) ? values : [])
      .map((value) => String(value || '').trim())
      .filter(Boolean)
  )];
}

function buildInitials(professeur) {
  const pair = [professeur?.prenom, professeur?.nom]
    .map((part) => String(part || '').trim())
    .filter(Boolean);

  if (pair.length >= 2) {
    return `${pair[0].charAt(0)}${pair[1].charAt(0)}`.toUpperCase();
  }

  const fallback = String(professeur?.name || '')
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (fallback.length >= 2) {
    return `${fallback[0].charAt(0)}${fallback[1].charAt(0)}`.toUpperCase();
  }

  if (fallback.length === 1) {
    return fallback[0].charAt(0).toUpperCase();
  }

  return 'PR';
}

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
      setProfessors(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching professors:", error);
      setProfessors([]);
    } finally {
      setLoading(false);
    }
  };

  const normalizedNiveaux = useMemo(() => {
    const cycles = new Set();

    professors.forEach((professeur) => {
      collectCycleLabels(professeur).forEach((cycle) => cycles.add(cycle));
    });

    return CYCLE_ORDER.filter((cycle) => cycles.has(cycle));
  }, [professors]);

  const normalizedMatieres = useMemo(() => {
    const valuesByKey = new Map();

    professors.forEach((professeur) => {
      uniqueTrimmed(professeur?.matieres || []).forEach((matiere) => {
        const key = normalizeFilterKey(matiere);
        if (key && !valuesByKey.has(key)) {
          valuesByKey.set(key, matiere);
        }
      });
    });

    return [...valuesByKey.values()].sort((a, b) => a.localeCompare(b, 'fr'));
  }, [professors]);

  const filteredProfessors = useMemo(() => {
    const nameTerm = nameFilter.trim().toLowerCase();

    return professors.filter((professeur) => {
      const niveauxCycles = collectCycleLabels(professeur);
      const niveauOk = !niveauFilter || niveauxCycles.includes(niveauFilter);

      const matiereOk = !matiereFilter || uniqueTrimmed(professeur?.matieres || [])
        .some((matiere) => normalizeFilterKey(matiere) === normalizeFilterKey(matiereFilter));

      const fullName = `${professeur?.prenom || ''} ${professeur?.nom || ''} ${professeur?.name || ''}`.toLowerCase();
      const nameOk = !nameTerm || fullName.includes(nameTerm);

      return niveauOk && matiereOk && nameOk;
    });
  }, [professors, niveauFilter, matiereFilter, nameFilter]);

  return (
    <div className="prof-page directory-professeurs-page">
      <div className="prof-breadcrumb">{portalLabel} &gt; <span>Professeurs</span></div>
      <header className="page-dashboard-header">
        <div>
          <h1 className="prof-title-with-icon">
            <BiUserVoice />
            <span>Liste des Professeurs</span>
          </h1>
          <p>Filtrez par nom, matiere et cycle (maternelle, primaire, college, lycee).</p>
        </div>
      </header>

      <section className="prof-filters-section directory-professeurs-filters">
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
        <section className="prof-table-container directory-professeurs-table-wrap">
          <table className="prof-table directory-professeurs-table">
            <thead>
              <tr>
                <th>PROFESSEUR</th>
                <th>MATIERE</th>
                <th>NIVEAU</th>
                <th>FILIERE</th>
                <th>CLASSES</th>
              </tr>
            </thead>
            <tbody>
              {filteredProfessors.length === 0 && (
                <tr>
                  <td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>Aucun professeur trouve pour ces filtres.</td>
                </tr>
              )}
              {filteredProfessors.map((prof) => {
                const displayName = `${String(prof?.prenom || '').trim()} ${String(prof?.nom || '').trim()}`.trim() || prof?.name || 'Professeur';
                const avatarInitials = buildInitials(prof);

                const matieres = uniqueTrimmed(prof?.matieres || []);
                const primaryMatiere = matieres[0] || 'Non renseignee';
                const extraMatieresCount = Math.max(0, matieres.length - 1);

                const cycles = collectCycleLabels(prof);

                const filieres = uniqueTrimmed((prof?.classes || []).map((classe) => classe?.filiere));
                const classes = uniqueTrimmed((prof?.classes || []).map((classe) => {
                  return String(classe?.nom || '').trim();
                }));

                return (
                  <tr key={prof.id}>
                    <td>
                      <div className="prof-user-info">
                        <div className="dir-prof-avatar" aria-hidden="true">{avatarInitials}</div>
                        <div>
                          <strong>{displayName}</strong>
                          <span>{prof?.email || '-'}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="dir-prof-pill-stack">
                        {matieres.length > 0 ? (
                          matieres.map((matiere) => (
                            <span key={matiere} className="dir-prof-pill">{matiere}</span>
                          ))
                        ) : (
                          <span className="dir-prof-pill dir-prof-empty">Non renseignee</span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="dir-prof-pill-stack">
                        {cycles.length > 0 ? (
                          cycles.map((cycle) => (
                            <span key={cycle} className="dir-prof-pill">{cycle}</span>
                          ))
                        ) : (
                          <span className="dir-prof-pill dir-prof-empty">Non assigne</span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="dir-prof-pill-stack">
                        {filieres.length > 0 ? (
                          filieres.map((filiere) => (
                            <span key={filiere} className="dir-prof-pill">{filiere}</span>
                          ))
                        ) : (
                          <span className="dir-prof-pill dir-prof-empty">Non renseignee</span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="dir-prof-pill-stack">
                        {classes.length > 0 ? (
                          classes.map((classeName) => (
                            <span key={classeName} className="dir-prof-pill">{classeName}</span>
                          ))
                        ) : (
                          <span className="dir-prof-pill dir-prof-empty">Aucune classe</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
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
