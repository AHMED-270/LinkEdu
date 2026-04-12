import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

function DirectoryStudents() {
  const browserHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
  const apiBaseUrl = import.meta.env.VITE_API_URL ?? `http://${browserHost}:8000`;
  const token = localStorage.getItem('linkedu_token');

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [absenceDetails, setAbsenceDetails] = useState([]);
  const [absenceSummary, setAbsenceSummary] = useState(null);
  const [loadingAbsences, setLoadingAbsences] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await axios.get(`${apiBaseUrl}/api/directeur/etudiants`, {
        withCredentials: true,
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      setStudents(response.data?.students || []);
    } catch (error) {
      setStudents([]);
      setErrorMsg(error?.response?.data?.message || 'Impossible de charger la liste des etudiants.');
    } finally {
      setLoading(false);
    }
  };

  const uniqueClasses = useMemo(() => {
    const values = students
      .map((student) => ({ id: student.id_classe, label: student.classe_nom }))
      .filter((entry) => entry.id && entry.label);

    const seen = new Map();
    values.forEach((entry) => {
      if (!seen.has(String(entry.id))) {
        seen.set(String(entry.id), entry);
      }
    });

    return [...seen.values()];
  }, [students]);

  const uniqueLevels = useMemo(() => {
    return [...new Set(students.map((student) => String(student.classe_niveau || '').trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'fr'));
  }, [students]);

  const filteredStudents = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return students.filter((student) => {
      const fullName = `${student.nom || ''} ${student.prenom || ''}`.toLowerCase();
      const email = String(student.email || '').toLowerCase();
      const matricule = String(student.matricule || '').toLowerCase();

      const searchOk = !needle
        || fullName.includes(needle)
        || email.includes(needle)
        || matricule.includes(needle);

      const classOk = !classFilter || String(student.id_classe || '') === classFilter;
      const levelOk = !levelFilter || String(student.classe_niveau || '') === levelFilter;

      return searchOk && classOk && levelOk;
    });
  }, [students, search, classFilter, levelFilter]);

  const openAbsenceModal = async (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
    setLoadingAbsences(true);
    setAbsenceDetails([]);
    setAbsenceSummary(null);

    try {
      const response = await axios.get(`${apiBaseUrl}/api/directeur/etudiants/${student.id_etudiant}/absences`, {
        withCredentials: true,
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      setAbsenceSummary(response.data?.summary || null);
      setAbsenceDetails(response.data?.absences || []);
    } catch (error) {
      setAbsenceSummary(null);
      setAbsenceDetails([]);
      setErrorMsg(error?.response?.data?.message || 'Impossible de charger le detail des absences.');
    } finally {
      setLoadingAbsences(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
    setAbsenceSummary(null);
    setAbsenceDetails([]);
  };

  const noteDisplay = useMemo(() => {
    if (!absenceSummary) return '-';
    if (absenceSummary.all_justifiees) return '20/20';
    const note = Number(absenceSummary.note ?? 0);
    return `${note.toFixed(2)}/20`;
  }, [absenceSummary]);

  const statusBadgeStyle = (justifiee) => {
    if (justifiee) {
      return {
        backgroundColor: '#dcfce7',
        border: '1px solid #86efac',
        color: '#166534',
        borderRadius: 999,
        padding: '0.2rem 0.65rem',
        fontWeight: 700,
        fontSize: '0.78rem',
      };
    }

    return {
      backgroundColor: '#fee2e2',
      border: '1px solid #fca5a5',
      color: '#991b1b',
      borderRadius: 999,
      padding: '0.2rem 0.65rem',
      fontWeight: 700,
      fontSize: '0.78rem',
    };
  };

  return (
    <div className="prof-page">
      <header className="page-dashboard-header">
        <div>
          <h1>Liste des Etudiants</h1>
          <p>Recherche, filtres par classe/niveau et consultation des absences.</p>
        </div>
      </header>

      <section className="prof-filters-section" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
        <div className="prof-filter-group">
          <label>RECHERCHE</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, prenom, email ou matricule"
          />
        </div>

        <div className="prof-filter-group">
          <label>CLASSE</label>
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
            <option value="">Toutes les classes</option>
            {uniqueClasses.map((classe) => (
              <option key={classe.id} value={String(classe.id)}>{classe.label}</option>
            ))}
          </select>
        </div>

        <div className="prof-filter-group">
          <label>NIVEAU</label>
          <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
            <option value="">Tous les niveaux</option>
            {uniqueLevels.map((niveau) => (
              <option key={niveau} value={niveau}>{niveau}</option>
            ))}
          </select>
        </div>
      </section>

      {errorMsg && (
        <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: 8, backgroundColor: '#fee2e2', color: '#991b1b' }}>
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '2rem' }}>Chargement des etudiants...</div>
      ) : (
        <section className="prof-table-container" style={{ marginTop: '1rem' }}>
          <table className="prof-table">
            <thead>
              <tr>
                <th>NOM COMPLET</th>
                <th>MATRICULE</th>
                <th>CLASSE</th>
                <th>NIVEAU</th>
                <th>PARENT</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Aucun etudiant trouve.</td>
                </tr>
              )}

              {filteredStudents.map((student) => (
                <tr key={student.id_etudiant}>
                  <td>
                    <strong>{`${student.nom || ''} ${student.prenom || ''}`.trim() || '-'}</strong>
                    <div style={{ color: '#6b7280', fontSize: '0.82rem' }}>{student.email || '-'}</div>
                  </td>
                  <td>{student.matricule || '-'}</td>
                  <td>{student.classe_nom || '-'}</td>
                  <td>{student.classe_niveau || '-'}</td>
                  <td>{`${student.parent_nom || ''} ${student.parent_prenom || ''}`.trim() || '-'}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => openAbsenceModal(student)}
                      style={{
                        backgroundColor: '#1d4ed8',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '0.4rem 0.75rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Voir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {isModalOpen && (
        <div className="add-claim-modal" role="dialog" aria-modal="true">
          <div className="add-claim-backdrop" onClick={closeModal}></div>
          <div className="add-claim-panel" style={{ maxWidth: 760 }}>
            <div className="add-claim-header">
              <h3>Dossier d'absence etudiant</h3>
              <button type="button" className="add-claim-back" onClick={closeModal}>Fermer</button>
            </div>

            <div className="add-claim-body">
              <div style={{ marginBottom: '1rem' }}>
                <strong>{selectedStudent ? `${selectedStudent.nom || ''} ${selectedStudent.prenom || ''}`.trim() : '-'}</strong>
                <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                  Classe: {selectedStudent?.classe_nom || '-'} ({selectedStudent?.classe_niveau || '-'})
                </div>
              </div>

              {loadingAbsences ? (
                <p>Chargement des absences...</p>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 10, padding: '0.85rem' }}>
                      <div style={{ color: '#1d4ed8', fontSize: '0.8rem' }}>Nombre d'absences</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{absenceSummary?.total_absences ?? 0}</div>
                    </div>
                    <div style={{ background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 10, padding: '0.85rem' }}>
                      <div style={{ color: '#1d4ed8', fontSize: '0.8rem' }}>Nombre d'heures</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{absenceSummary?.total_heures ?? 0}h</div>
                    </div>
                    <div style={{ background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 10, padding: '0.85rem' }}>
                      <div style={{ color: '#0f766e', fontSize: '0.8rem' }}>Note d'assiduite</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f766e' }}>{noteDisplay}</div>
                    </div>
                  </div>

                  <div className="prof-table-container" style={{ marginTop: '0.5rem' }}>
                    <table className="prof-table">
                      <thead>
                        <tr>
                          <th>DATE D'ABSENCE</th>
                          <th>STATUT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {absenceDetails.length === 0 && (
                          <tr>
                            <td colSpan="2" style={{ textAlign: 'center', padding: '1.2rem' }}>Aucune absence enregistrée.</td>
                          </tr>
                        )}
                        {absenceDetails.map((absence) => (
                          <tr key={absence.id_absence}>
                            <td>{absence.date_abs ? new Date(absence.date_abs).toLocaleDateString('fr-FR') : '-'}</td>
                            <td>
                              <span style={statusBadgeStyle(Boolean(absence.justifiee))}>
                                {absence.justifiee ? 'Justifié' : 'Non justifié'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DirectoryStudents;