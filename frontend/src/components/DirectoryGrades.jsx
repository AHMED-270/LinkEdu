import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import { Download, FileText, Search } from 'lucide-react';

const DEFAULT_EVALUATION_TYPES = ['Tous', 'Contrôle', 'TP / Participation', 'Projet / Exposé'];

function toCsvCell(value) {
  const safe = String(value ?? '').replace(/"/g, '""');
  return `"${safe}"`;
}

function normalizeSearchValue(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[^\w\s]/g, '')
    .toLowerCase();
}

function formatAverage(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '-';
  }

  return Number(value).toFixed(2);
}

function getCellTone(status) {
  if (status === 'success') return 'dir-note-success';
  if (status === 'danger') return 'dir-note-danger';
  if (status === 'abs') return 'dir-note-abs';
  if (status === 'aj') return 'dir-note-aj';
  return 'dir-note-empty';
}

function getAverageTone(status) {
  if (status === 'success') return 'dir-average-success';
  if (status === 'danger') return 'dir-average-danger';
  return 'dir-average-empty';
}

function DirectoryGrades() {
  const browserHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
  const apiBaseUrl = import.meta.env.VITE_API_URL ?? `http://${browserHost}:8000`;
  const token = localStorage.getItem('linkedu_token');

  const [classes, setClasses] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [evaluationTypes, setEvaluationTypes] = useState(DEFAULT_EVALUATION_TYPES);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedMatiere, setSelectedMatiere] = useState('');
  const [selectedEvaluationType, setSelectedEvaluationType] = useState('Tous');

  const [columns, setColumns] = useState([]);
  const [students, setStudents] = useState([]);
  const [hasAnyNote, setHasAnyNote] = useState(false);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const pageSize = 10;

  const loadOverview = async ({
    classId = selectedClass,
    matiereId = selectedMatiere,
    evaluationType = selectedEvaluationType,
  } = {}) => {
    setLoading(true);
    setErrorMsg('');

    try {
      const params = {};

      if (classId) params.class_id = classId;
      if (matiereId) params.matiere_id = matiereId;
      if (evaluationType) params.evaluation_type = evaluationType;

      const response = await axios.get(`${apiBaseUrl}/api/directeur/notes`, {
        withCredentials: true,
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        params,
      });

      const payload = response.data ?? {};
      const filters = payload.filters ?? {};

      setClasses(Array.isArray(filters.classes) ? filters.classes : []);
      setMatieres(Array.isArray(filters.matieres) ? filters.matieres : []);
      setEvaluationTypes(Array.isArray(filters.evaluationTypes) && filters.evaluationTypes.length > 0 ? filters.evaluationTypes : DEFAULT_EVALUATION_TYPES);

      setSelectedClass(filters.selectedClassId ? String(filters.selectedClassId) : '');
      setSelectedMatiere(filters.selectedMatiereId ? String(filters.selectedMatiereId) : '');
      setSelectedEvaluationType(String(filters.selectedEvaluationType || 'Tous'));

      setColumns(Array.isArray(payload.columns) ? payload.columns : []);
      setStudents(Array.isArray(payload.students) ? payload.students : []);
      setHasAnyNote(Boolean(payload.hasAnyNote));
      setPage(1);
    } catch (error) {
      setColumns([]);
      setStudents([]);
      setHasAnyNote(false);
      setErrorMsg(error?.response?.data?.message || 'Impossible de charger les notes et examens.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview({});
  }, []);

  const selectedClassLabel = useMemo(() => {
    const current = classes.find((classe) => String(classe.id) === String(selectedClass));
    if (!current) return '-';
    return current.label || `${current.nom || ''} ${current.niveau ? `- ${current.niveau}` : ''}`.trim();
  }, [classes, selectedClass]);

  const selectedMatiereLabel = useMemo(() => {
    if (!selectedMatiere) return 'Toutes';
    const current = matieres.find((matiere) => String(matiere.id) === String(selectedMatiere));
    return current?.nom || 'Toutes';
  }, [matieres, selectedMatiere]);

  const filteredStudents = useMemo(() => {
    const needle = normalizeSearchValue(search.trim());
    if (!needle) return students;

    return students.filter((student) => {
      const fullName = normalizeSearchValue(student.fullName || `${student.firstName || ''} ${student.lastName || ''}`);
      return fullName.includes(needle);
    });
  }, [students, search]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginatedStudents = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, safePage]);

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

  const exportCsv = () => {
    const headers = ['Eleve', ...columns.map((column) => column.label), 'Moyenne', 'Appreciation'];

    const rows = filteredStudents.map((student) => {
      const noteValues = columns.map((column) => student?.cells?.[column.key]?.displayValue || '');
      return [
        student.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim(),
        ...noteValues,
        formatAverage(student.average),
        student.appreciation || '-',
      ];
    });

    const csvRows = [
      headers.map(toCsvCell).join(';'),
      ...rows.map((row) => row.map(toCsvCell).join(';')),
    ];

    const csvContent = `\uFEFF${csvRows.join('\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `notes-examens-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });

    doc.setFontSize(14);
    doc.text('Notes & Examens - Direction', 12, 12);

    doc.setFontSize(9);
    doc.text(
      `Classe: ${selectedClassLabel} | Matiere: ${selectedMatiereLabel} | Type: ${selectedEvaluationType}`,
      12,
      19,
    );

    const printableColumns = columns.slice(0, 5);
    const header = ['Eleve', ...printableColumns.map((column) => column.label), 'Moy', 'App.'];

    let y = 27;
    doc.setFontSize(8);
    doc.text(header.join(' | '), 12, y);
    y += 2;
    doc.line(12, y, 285, y);
    y += 4;

    const printableStudents = filteredStudents.slice(0, 35);

    printableStudents.forEach((student) => {
      if (y > 195) {
        doc.addPage();
        y = 14;
      }

      const row = [
        student.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim(),
        ...printableColumns.map((column) => student?.cells?.[column.key]?.displayValue || '-'),
        formatAverage(student.average),
        student.appreciation || '-',
      ];

      const textRow = row.join(' | ');
      doc.text(textRow.substring(0, 220), 12, y);
      y += 5;
    });

    if (columns.length > printableColumns.length || filteredStudents.length > printableStudents.length) {
      doc.setFontSize(8);
      doc.text('Export PDF simplifie: utilisez CSV pour le detail complet.', 12, 202);
    }

    doc.save(`notes-examens-${Date.now()}.pdf`);
  };

  return (
    <div className="prof-page">
      <header className="page-dashboard-header">
        <div>
          <h1>Notes & Examens</h1>
          <p>Classe - Matiere - Eleves - Notes - Moyenne - Statut.</p>
        </div>
      </header>

      <section className="dir-notes-toolbar">
        <div className="prof-filters-section dir-notes-filters">
          <div className="prof-filter-group">
            <label>CLASSE (OBLIGATOIRE)</label>
            <select
              value={selectedClass}
              onChange={(event) => {
                const nextClass = event.target.value;
                setSelectedClass(nextClass);
                setSelectedMatiere('');
                loadOverview({
                  classId: nextClass,
                  matiereId: '',
                  evaluationType: selectedEvaluationType,
                });
              }}
            >
              {classes.length === 0 && <option value="">Aucune classe</option>}
              {classes.map((classe) => (
                <option key={classe.id} value={String(classe.id)}>{classe.label || `${classe.nom} - ${classe.niveau}`}</option>
              ))}
            </select>
          </div>

          <div className="prof-filter-group">
            <label>MATIERE (OPTIONNEL)</label>
            <select
              value={selectedMatiere}
              onChange={(event) => {
                const nextMatiere = event.target.value;
                setSelectedMatiere(nextMatiere);
                loadOverview({
                  classId: selectedClass,
                  matiereId: nextMatiere,
                  evaluationType: selectedEvaluationType,
                });
              }}
            >
              <option value="">Toutes les matieres</option>
              {matieres.map((matiere) => (
                <option key={matiere.id} value={String(matiere.id)}>{matiere.nom}</option>
              ))}
            </select>
          </div>

          <div className="prof-filter-group">
            <label>TYPE D EVALUATION</label>
            <select
              value={selectedEvaluationType}
              onChange={(event) => {
                const nextType = event.target.value;
                setSelectedEvaluationType(nextType);
                loadOverview({
                  classId: selectedClass,
                  matiereId: selectedMatiere,
                  evaluationType: nextType,
                });
              }}
            >
              {evaluationTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="prof-filter-group">
            <label>RECHERCHE ELEVES</label>
            <div className="dir-notes-search">
              <Search size={16} />
              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Rechercher par nom"
              />
            </div>
          </div>
        </div>

        <div className="dir-notes-actions">
          <button
            type="button"
            className="dir-notes-export-btn"
            onClick={exportCsv}
            disabled={filteredStudents.length === 0}
          >
            <Download size={16} /> Export Excel (CSV)
          </button>
          <button
            type="button"
            className="dir-notes-export-btn"
            onClick={exportPdf}
            disabled={filteredStudents.length === 0}
          >
            <FileText size={16} /> Export PDF
          </button>
        </div>
      </section>

      {errorMsg && (
        <div className="dir-notes-alert-error">
          {errorMsg}
        </div>
      )}

      <section className="prof-table-container" style={{ marginTop: '1rem' }}>
        {loading ? (
          <div style={{ padding: '2rem' }}>Chargement des notes...</div>
        ) : (
          <table className="prof-table dir-notes-table">
            <thead>
              <tr>
                <th>ELEVE</th>
                {columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
                <th>MOYENNE</th>
                <th>APPRECIATION</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 3} style={{ textAlign: 'center', padding: '2rem' }}>
                    {!hasAnyNote ? 'Pas encore de notes.' : 'Aucun eleve correspondant a la recherche.'}
                  </td>
                </tr>
              )}

              {paginatedStudents.map((student) => (
                <tr key={student.id}>
                  <td>
                    <strong>{student.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim() || '-'}</strong>
                  </td>

                  {columns.map((column) => {
                    const cell = student?.cells?.[column.key] || null;
                    return (
                      <td key={`${student.id}-${column.key}`}>
                        <span className={`dir-note-pill ${getCellTone(cell?.status)}`}>
                          {cell?.displayValue || '-'}
                        </span>
                      </td>
                    );
                  })}

                  <td>
                    <span className={`dir-average-pill ${getAverageTone(student.averageStatus)}`}>
                      {formatAverage(student.average)}
                    </span>
                  </td>

                  <td>
                    <span className="dir-notes-appreciation">{student.appreciation || '-'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <footer className="dir-notes-pagination">
        <span>
          Page {safePage} / {totalPages}
        </span>
        <div>
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={safePage <= 1}
          >
            Precedent
          </button>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={safePage >= totalPages}
          >
            Suivant
          </button>
        </div>
      </footer>
    </div>
  );
}

export default DirectoryGrades;