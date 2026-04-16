import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiCalendar, FiMail, FiPhone, FiMapPin, FiArrowLeft, FiCheckCircle, FiSearch, FiEdit2, FiTrash2, FiPlus, FiUsers, FiDownload, FiEye, FiX, FiUpload } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import TableSkeletonRows from '../components/TableSkeletonRows';
import LinkEduPopup from '../components/LinkEduPopup';
import GlassModal from '../components/GlassModal';
const NIVEAU_LABEL_TO_CODE = {
  'Petite Section': 'ms',
  'Moyenne Section': 'mm',
  'Grande Section': 'gs',
  '1ere Annee Primaire': '1ap',
  '2eme Annee Primaire': '2ap',
  '3eme Annee Primaire': '3ap',
  '4eme Annee Primaire': '4ap',
  '5eme Annee Primaire': '5ap',
  '6eme Annee Primaire': '6ap',
  '1ere Annee College': '1ac',
  '2eme Annee College': '2ac',
  '3eme Annee College': '3ac',
  'Tronc Commun': 'tc',
  '1ere Annee Baccalaureat': '1bac',
  '2eme Annee Baccalaureat': '2bac'
};

const NIVEAU_CODE_TO_LABEL = Object.entries(NIVEAU_LABEL_TO_CODE).reduce((acc, [label, code]) => {
  acc[code] = label;
  return acc;
}, {});

const emptyForm = {
  nom: '',
  prenom: '',
  date_naissance: '',
  date_entree: '',
  genre: 'M',
  cycle: '',
  niveau: '',
  filiere: '',
  id_classe: '',
  email: '',
  parent_nom: '',
  parent_prenom: '',
  parent_cin: '',
  parent_email: '',
  parent_phone: '',
  parent_urgence_phone: '',
  adresse: '',
};

const ACADEMIC_STRUCTURE = {
  'maternelle': {
    niveaux: ['Petite Section', 'Moyenne Section', 'Grande Section'],
    filieres: ['General']
  },
  'primaire': {
    niveaux: [
      '1ere Annee Primaire',
      '2eme Annee Primaire',
      '3eme Annee Primaire',
      '4eme Annee Primaire',
      '5eme Annee Primaire',
      '6eme Annee Primaire'
    ],
    filieres: ['General']
  },
  'college': {
    niveaux: ['1ere Annee College', '2eme Annee College', '3eme Annee College'],
    filieres: ['Francais', 'Arabe']
  },
  'lycee': {
    niveaux: ['Tronc Commun', '1ere Annee Baccalaureat', '2eme Annee Baccalaureat'],
    filieresByNiveau: {
      'Tronc Commun': [
        'TC Scientifique (Francais)',
        'TC Scientifique (Arabe)',
        'TC Technologique',
        'TC Lettres'
      ],
      '1ere Annee Baccalaureat': [
        'Sciences Experimentales (Francais)',
        'Sciences Experimentales (Arabe)',
        'Sciences Mathematiques (Francais)',
        'Sciences Mathematiques (Arabe)',
        'Sciences et Technologies',
        'Lettres et Ressources Humaines',
        'Economie'
      ],
      '2eme Annee Baccalaureat': [
        'Sciences Experimentales - SVT (Francais)',
        'Sciences Experimentales - SVT (Arabe)',
        'Sciences Experimentales - Physique-Chimie (Francais)',
        'Sciences Experimentales - Physique-Chimie (Arabe)',
        'Sciences Mathematiques A (Francais)',
        'Sciences Mathematiques A (Arabe)',
        'Sciences Mathematiques B (Francais)',
        'Sciences Mathematiques B (Arabe)',
        'Sciences et Technologies Electrique',
        'Sciences et Technologies Mecanique',
        'Lettres et Sciences Humaines',
        'Sciences Economiques'
      ]
    }
  }
};

const normalizeTextToken = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

const NIVEAU_CODE_TO_CYCLE = Object.entries(ACADEMIC_STRUCTURE).reduce((acc, [cycle, data]) => {
  (data.niveaux || []).forEach((label) => {
    const code = NIVEAU_LABEL_TO_CODE[label];
    if (code) {
      acc[normalizeTextToken(code)] = cycle;
    }
  });
  return acc;
}, {});

const NIVEAU_LABEL_TO_CYCLE = Object.entries(ACADEMIC_STRUCTURE).reduce((acc, [cycle, data]) => {
  (data.niveaux || []).forEach((label) => {
    acc[normalizeTextToken(label)] = cycle;
  });
  return acc;
}, {});

const resolveCycleFromNiveauValue = (niveauValue) => {
  const normalized = normalizeTextToken(niveauValue);
  if (!normalized) return '';

  if (Object.prototype.hasOwnProperty.call(ACADEMIC_STRUCTURE, normalized)) {
    return normalized;
  }

  if (Object.prototype.hasOwnProperty.call(NIVEAU_CODE_TO_CYCLE, normalized)) {
    return NIVEAU_CODE_TO_CYCLE[normalized];
  }

  if (Object.prototype.hasOwnProperty.call(NIVEAU_LABEL_TO_CYCLE, normalized)) {
    return NIVEAU_LABEL_TO_CYCLE[normalized];
  }

  return '';
};

const normalizeFiliere = (value) => {
  const normalized = normalizeTextToken(value || 'General');

  if (!normalized || normalized === 'general' || normalized === 'generale') {
    return 'general';
  }

  return normalized;
};

export default function SecretaireEtudiants() {
  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [isFormPage, setIsFormPage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedStudentInsight, setSelectedStudentInsight] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [popupNotice, setPopupNotice] = useState({
    open: false,
    title: '',
    message: '',
    tone: 'info',
  });
  const importFileRef = useRef(null);
  const csrfReadyRef = useRef(false);

  const ensureCsrfCookie = async () => {
    if (csrfReadyRef.current) return;
    await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', {
      withCredentials: true,
      withXSRFToken: true,
    });
    csrfReadyRef.current = true;
  };

  const showNotice = (title, message, tone = 'info') => {
    setPopupNotice({
      open: true,
      title,
      message,
      tone,
    });
  };

  const loadData = async () => {
    setLoading(true);
    setLoadErrorMessage('');

    try {
      const requestConfig = {
        withCredentials: true,
        withXSRFToken: true,
        headers: {
          Accept: 'application/json',
        },
      };

      const [studentsRes, classesRes, absencesRes] = await Promise.all([
        axios.get(apiBaseUrl + '/api/secretaire/students', requestConfig),
        axios.get(apiBaseUrl + '/api/secretaire/classes', requestConfig),
        axios.get(apiBaseUrl + '/api/secretaire/absences', requestConfig),
      ]);

      setStudents(studentsRes.data?.students || []);
      setClasses(classesRes.data?.classes || []);
      setAbsences(absencesRes.data?.absences || []);
    } catch (error) {
      const status = error?.response?.status;
      const backendMessage = error?.response?.data?.message;

      if (status === 401 || status === 419) {
        setLoadErrorMessage('Session expirée. Veuillez vous reconnecter.');
        logout();
        navigate('/login', { replace: true });
        return;
      }

      if (status === 403) {
        setLoadErrorMessage(backendMessage || 'Acces refuse. Votre compte doit etre active par un admin.');
      } else {
        setLoadErrorMessage(backendMessage || 'Impossible de charger les donnees. Verifiez l API backend.');
      }

      setStudents([]);
      setClasses([]);
      setAbsences([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [logout, navigate]);

  useEffect(() => {
    ensureCsrfCookie().catch(() => {
      // No-op: csrf setup will be retried before mutations.
    });
  }, []);

  const visibleStudents = useMemo(() => {
    const term = search.trim().toLowerCase();
    return students.filter((s) => {
      const classMatch = classFilter === 'all' || String(s.id_classe || '') === classFilter;
      if (!classMatch) return false;
      if (!term) return true;
      return [s.nom, s.prenom, s.email, s.matricule, s.classe, s.parent_nom, s.parent_prenom, s.parent_email, s.parent_cin, s.parent_phone, s.parent_urgence_phone]
        .some((v) => String(v || '').toLowerCase().includes(term));
    });
  }, [students, search, classFilter]);

  const stats = useMemo(() => {
    const total = students.length;
    const classesCount = classes.length;
    const maleCount = students.filter((s) => String(s.genre || '').toUpperCase() === 'M').length;
    const femaleCount = students.filter((s) => String(s.genre || '').toUpperCase() === 'F').length;

    return {
      total,
      classesCount,
      maleCount,
      femaleCount,
    };
  }, [students, classes]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrorMessage('');
    setIsFormPage(false);
  };

  const openCreateFormPage = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrorMessage('');
    setIsFormPage(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      await ensureCsrfCookie();

      const payload = {
        nom: form.nom,
        prenom: form.prenom,
        date_naissance: form.date_naissance,
        genre: form.genre,
        id_classe: form.id_classe ? Number(form.id_classe) : null,
        email: form.email,
        parent_nom: form.parent_nom,
        parent_prenom: form.parent_prenom,
        parent_cin: form.parent_cin,
        parent_email: form.parent_email || '',
        country_code: '+212',
        parent_phone: form.parent_phone,
        parent_urgence_phone: form.parent_urgence_phone,
        adresse: form.adresse,
      };

      let createdCredentials = null;

      if (editingId) {
        await axios.put(`${apiBaseUrl}/api/secretaire/students/${editingId}`, payload, {
          withCredentials: true,
          withXSRFToken: true,
        });
      } else {
        const createRes = await axios.post(apiBaseUrl + '/api/secretaire/students', payload, {
          withCredentials: true,
          withXSRFToken: true,
        });
        createdCredentials = createRes?.data?.credentials || null;
      }

      await loadData();

      if (createdCredentials) {
        const status = String(createdCredentials.account_status || '').toLowerCase();
        const lines = [
          'Identifiants generes :',
          `Eleve: ${createdCredentials.student_email || '-'}`,
          `Mot de passe eleve: ${createdCredentials.student_password || 'Etudiant@2026'}`,
          `Parent: ${createdCredentials.parent_email || '-'}`,
          `Mot de passe parent: ${createdCredentials.parent_password || 'Parent@2026'}`,
        ];

        if (status === 'pending_activation') {
          lines.push('');
          lines.push("Statut: compte en attente d activation par un admin.");
        }

        showNotice('Identifiants generes', lines.join('\n'), 'success');
      } else {
        showNotice('Etudiant mis a jour', 'Les informations ont ete enregistrees.', 'success');
      }

      resetForm();
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || "Impossible d'enregistrer l'etudiant.");
    }
  };

  const onEdit = (student) => {
    const studentClass = classes.find(c => String(c.id_classe) === String(student.id_classe));

    const niveauLabel = studentClass ? (NIVEAU_CODE_TO_LABEL[studentClass.niveau] || studentClass.niveau) : '';

    // Determine cycle from class niveau
    let foundCycle = '';
    if (niveauLabel) {
      for (const [cyc, data] of Object.entries(ACADEMIC_STRUCTURE)) {
        if (data.niveaux.includes(niveauLabel)) {
          foundCycle = cyc;
          break;
        }
      }
    }

    setEditingId(student.id_etudiant);
    setForm({
      nom: student.nom || '',
      prenom: student.prenom || '',
      date_naissance: student.date_naissance || '',
      date_entree: '',
      genre: student.genre || 'M',
      cycle: foundCycle,
      niveau: niveauLabel,
      filiere: studentClass?.filiere || 'Général',
      id_classe: student.id_classe ? String(student.id_classe) : '',
      email: student.email || '',
      parent_nom: student.parent_nom || '',
      parent_prenom: student.parent_prenom || '',
      parent_cin: student.parent_cin || '',
      parent_email: student.parent_email || '',
      parent_phone: student.parent_phone || '',
      parent_urgence_phone: student.parent_urgence_phone || '',
      adresse: student.adresse || '',
    });
    setErrorMessage('');
    setIsFormPage(true);
  };

  const onDelete = async (id) => {
    const targetId = id ?? deleteTargetId;
    if (!targetId) return;

    setDeletingId(targetId);
    try {
      await ensureCsrfCookie();
      await axios.delete(`${apiBaseUrl}/api/secretaire/students/${targetId}`, {
        withCredentials: true,
        withXSRFToken: true,
      });

      setStudents((prev) => prev.filter((student) => String(student.id_etudiant) !== String(targetId)));
      setAbsences((prev) => prev.filter((absence) => String(absence.id_etudiant) !== String(targetId)));

      if (String(selectedStudentInsight?.student?.id_etudiant) === String(targetId)) {
        setSelectedStudentInsight(null);
      }

      if (String(editingId) === String(targetId)) {
        resetForm();
      }

      showNotice('Etudiant supprime', 'Le dossier de l etudiant a ete supprime.', 'success');
    } catch (error) {
      const message = error?.response?.data?.message || 'Impossible de supprimer cet etudiant.';
      showNotice('Suppression impossible', message, 'danger');
    } finally {
      setDeletingId(null);
      setDeleteTargetId(null);
    }
  };

  const buildFileName = (prefix, ext) => {
    const date = new Date().toISOString().slice(0, 10);
    return `${prefix}-${date}.${ext}`;
  };

  const downloadBlob = (content, type, fileName) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const normalizeHeader = (value) =>
    String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

  const extractByHeader = (row, headerMap, aliases) => {
    const found = aliases.find((alias) => headerMap.has(alias));
    if (!found) return '';
    return String(row[headerMap.get(found)] ?? '').trim();
  };

  const parseStudentCsv = (text) => {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length < 2) {
      throw new Error('Le fichier CSV est vide ou incomplet.');
    }

    const separator = (lines[0].match(/;/g) || []).length >= (lines[0].match(/,/g) || []).length ? ';' : ',';
    const rawHeaders = lines[0].split(separator).map((h) => h.trim());
    const headers = rawHeaders.map(normalizeHeader);
    const headerMap = new Map(headers.map((h, i) => [h, i]));

    const requiredAliases = {
      nom: ['nom'],
      prenom: ['prenom', 'prenom'],
      date_naissance: ['datenaissance', 'date_naissance', 'naissance'],
      genre: ['genre', 'sexe'],
      adresse: ['adresse', 'address'],
      parent_nom: ['parentnom', 'nomparent'],
      parent_prenom: ['parentprenom', 'prenomparent'],
      parent_phone: ['parentphone', 'parenttel', 'telephoneparent'],
      parent_cin: ['parentcin', 'cinparent'],
    };

    const missing = Object.values(requiredAliases)
      .filter((aliases) => !aliases.some((alias) => headerMap.has(alias)))
      .map((aliases) => aliases[0]);

    if (missing.length > 0) {
      throw new Error(`Colonnes obligatoires manquantes: ${missing.join(', ')}`);
    }

    const rows = lines.slice(1).map((line, index) => {
      const cols = line.split(separator).map((c) => c.trim());
      const genreRaw = extractByHeader(cols, headerMap, ['genre', 'sexe']).toUpperCase();
      const genre = genreRaw === 'F' ? 'F' : 'M';

      return {
        _line: index + 2,
        nom: extractByHeader(cols, headerMap, requiredAliases.nom),
        prenom: extractByHeader(cols, headerMap, requiredAliases.prenom),
        date_naissance: extractByHeader(cols, headerMap, requiredAliases.date_naissance),
        genre,
        adresse: extractByHeader(cols, headerMap, requiredAliases.adresse),
        id_classe: (() => {
          const v = extractByHeader(cols, headerMap, ['idclasse', 'id_classe', 'classeid']);
          return v ? Number(v) : null;
        })(),
        email: extractByHeader(cols, headerMap, ['email']),
        parent_nom: extractByHeader(cols, headerMap, requiredAliases.parent_nom),
        parent_prenom: extractByHeader(cols, headerMap, requiredAliases.parent_prenom),
        parent_email: extractByHeader(cols, headerMap, ['parentemail', 'emailparent']),
        parent_phone: extractByHeader(cols, headerMap, requiredAliases.parent_phone),
        parent_cin: extractByHeader(cols, headerMap, requiredAliases.parent_cin),
        parent_urgence_phone: extractByHeader(cols, headerMap, ['parenturgencephone', 'parenturgence', 'urgencephone']),
        country_code: '+212',
      };
    });

    return rows;
  };

  const handleImportStudents = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await ensureCsrfCookie();
      const text = await file.text();
      const parsedRows = parseStudentCsv(text).map(({ _line, ...payload }) => payload);

      const response = await axios.post(
        `${apiBaseUrl}/api/secretaire/students/import`,
        { students: parsedRows },
        { withCredentials: true, withXSRFToken: true }
      );

      const imported = response.data?.imported ?? 0;
      const failed = response.data?.failed ?? 0;
      showNotice('Import termine', `${imported} eleve(s) importe(s), ${failed} echec(s).`, 'success');
      await loadData();
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Erreur lors de l\'import des élèves.';
      showNotice('Import impossible', msg, 'danger');
    } finally {
      if (importFileRef.current) {
        importFileRef.current.value = '';
      }
    }
  };

  const downloadStudentsPdf = () => {
    if (visibleStudents.length === 0) {
      showNotice('Telechargement indisponible', 'Aucun etudiant a telecharger.', 'info');
      return;
    }

    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // ----- HEADER (Black & White style) -----
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, pageWidth, 6, 'F');

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('LinkedU', margin, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Document Officiel', margin, 26);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('LISTE GLOBALE DES ÉLÈVES', pageWidth - margin, 20, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Année: ${new Date().getFullYear()}/${new Date().getFullYear() + 1}`, pageWidth - margin, 26, { align: 'right' });

    doc.setLineWidth(0.5);
    doc.line(margin, 35, pageWidth - margin, 35);

    // ----- TABLEAU DES ELEVES -----
    let startY = 45;

    doc.setFillColor(240, 240, 240);
    doc.rect(margin, startY, pageWidth - (margin * 2), 10, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    // Colonnes
    const colId = margin + 2;
    const colNom = margin + 15;
    const colClasse = margin + 75;
    const colEmail = margin + 115;
    const colParent = margin + 190;
    const colPhone = margin + 240;

    doc.text('N°', colId, startY + 7);
    doc.text('NOM & PRÉNOM', colNom, startY + 7);
    doc.text('CLASSE', colClasse, startY + 7);
    doc.text('EMAIL ÉLÈVE', colEmail, startY + 7);
    doc.text('PARENT / TUTEUR', colParent, startY + 7);
    doc.text('TÉLÉPHONE', colPhone, startY + 7);

    startY += 12;
    doc.setFont('helvetica', 'normal');

    visibleStudents.forEach((student, index) => {
      if (startY > pageHeight - 25) {
        doc.addPage();
        startY = margin;

        doc.setFillColor(0, 0, 0);
        doc.rect(0, 0, pageWidth, 6, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('LinkedU - Suite de la liste globale', margin, 15);

        doc.setLineWidth(0.5);
        doc.line(margin, 20, pageWidth - margin, 20);

        // Rappel En-tête
        startY = 25;
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, startY, pageWidth - (margin * 2), 10, 'F');
        doc.text('N°', colId, startY + 7);
        doc.text('NOM & PRÉNOM', colNom, startY + 7);
        doc.text('CLASSE', colClasse, startY + 7);
        doc.text('EMAIL ÉLÈVE', colEmail, startY + 7);
        doc.text('PARENT / TUTEUR', colParent, startY + 7);
        doc.text('TÉLÉPHONE', colPhone, startY + 7);

        startY += 12;
        doc.setFont('helvetica', 'normal');
      }

      if (index % 2 === 0) {
        doc.setFillColor(252, 252, 252);
        doc.rect(margin, startY - 4, pageWidth - (margin * 2), 8, 'F');
      }

      const numero = (index + 1).toString().padStart(3, '0');
      const nomComplet = `${student.nom || ''} ${student.prenom || ''}`.trim();
      const classeName = classes.find(c => String(c.id_classe) === String(student.id_classe))?.nom || 'N/A';
      const emailObj = student.email || '-';
      const parentName = `${student.parent_nom || ''} ${student.parent_prenom || ''}`.trim() || '-';
      const phone = student.parent_phone || '-';

      doc.setFontSize(8);
      doc.text(numero, colId, startY + 2);
      doc.text(nomComplet.length > 30 ? nomComplet.substring(0, 27) + '...' : nomComplet, colNom, startY + 2);
      doc.text(classeName.length > 20 ? classeName.substring(0, 18) + '...' : classeName, colClasse, startY + 2);
      doc.text(emailObj.length > 35 ? emailObj.substring(0, 32) + '...' : emailObj, colEmail, startY + 2);
      doc.text(parentName.length > 25 ? parentName.substring(0, 22) + '...' : parentName, colParent, startY + 2);
      doc.text(phone, colPhone, startY + 2);

      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.1);
      doc.line(margin, startY + 4, pageWidth - margin, startY + 4);

      startY += 8;
    });

    const bottomY = pageHeight - 10;
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(`Généré le ${new Date().toLocaleString('fr-FR')} | Total : ${visibleStudents.length} élève(s)`, margin, bottomY);

    doc.save(`liste-etudiants-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const openAbsenceInsight = (student) => {
    const studentAbsences = absences.filter(
      (a) => String(a.id_etudiant) === String(student.id_etudiant)
    );

    const totalAbsences = studentAbsences.length;
    const totalHours = totalAbsences * 2;
    const note = Math.max(0, 20 - (totalHours / 2) * 0.25);

    setSelectedStudentInsight({
      student,
      totalAbsences,
      totalHours,
      note,
    });
  };

  const availableNiveaux = useMemo(() => {
    return form.cycle ? ACADEMIC_STRUCTURE[form.cycle].niveaux : [];
  }, [form.cycle]);

  const classesForSelectedNiveau = useMemo(() => {
    if (!form.cycle || !form.niveau) return [];

    const selectedCycle = normalizeTextToken(form.cycle);
    const selectedNiveauLabel = normalizeTextToken(form.niveau);
    const selectedNiveauCode = normalizeTextToken(NIVEAU_LABEL_TO_CODE[form.niveau] || form.niveau);

    return classes.filter((c) => {
      const classNiveauRaw = c?.niveau;
      const classNiveauNormalized = normalizeTextToken(classNiveauRaw);

      if (!classNiveauNormalized) return false;

      if (classNiveauNormalized === selectedNiveauCode || classNiveauNormalized === selectedNiveauLabel) {
        return true;
      }

      const classCycle = resolveCycleFromNiveauValue(classNiveauRaw);
      return classCycle === selectedCycle;
    });
  }, [classes, form.cycle, form.niveau]);

  const availableFilieres = useMemo(() => {
    if (!form.cycle || !form.niveau) return [];

    const classFilieres = [...new Set(
      classesForSelectedNiveau
        .map((c) => String(c?.filiere || 'General').trim())
        .filter(Boolean)
    )];

    if (classFilieres.length > 0) {
      return classFilieres;
    }

    const cycleData = ACADEMIC_STRUCTURE[form.cycle];
    if (cycleData.filieresByNiveau) {
      return cycleData.filieresByNiveau[form.niveau] || ['Général'];
    }
    return cycleData.filieres || ['Général'];
  }, [classesForSelectedNiveau, form.cycle, form.niveau]);

  const availableClasses = useMemo(() => {
    if (!form.filiere) return [];

    const selectedFiliere = normalizeFiliere(form.filiere);

    return classesForSelectedNiveau.filter((c) => {
      return normalizeFiliere(c?.filiere) === selectedFiliere;
    });
  }, [classesForSelectedNiveau, form.filiere]);

  const selectedClassPrice = useMemo(() => {
    if (!form.id_classe) return null;
    const cls = classes.find(c => String(c.id_classe) === String(form.id_classe));
    return cls ? cls.pricing : null;
  }, [classes, form.id_classe]);

  const handleCycleChange = (e) => {
    setForm({ ...form, cycle: e.target.value, niveau: '', filiere: '', id_classe: '' });
  };

  const handleNiveauChange = (e) => {
    setForm({ ...form, niveau: e.target.value, filiere: '', id_classe: '' });
  };

  const handleFiliereChange = (e) => {
    setForm({ ...form, filiere: e.target.value, id_classe: '' });
  };

  return (
    <div className="min-h-screen p-6 lg:p-10 bg-gray-50/50">
      <div className="max-w-7xl mx-auto">
        {!isFormPage && (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                  <FiUsers className="w-8 h-8 text-blue-600" />
                  Liste des étudiants
                </h1>
              </div>
              <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 flex-wrap">
                <div className="relative w-full sm:w-48 xl:w-52">
                  <select
                    className="block w-full pl-3 pr-10 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors sm:text-sm shadow-sm font-medium appearance-none cursor-pointer"
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                  >
                    <option value="all">Toutes les classes</option>
                    {classes.map((c) => (
                      <option key={c.id_classe} value={String(c.id_classe)}>
                        {c.nom}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 text-white font-semibold rounded-xl shadow-sm hover:bg-amber-700 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/20 active:scale-95 text-sm whitespace-nowrap"
                    onClick={() => importFileRef.current?.click()}
                  >
                    <FiUpload className="w-4 h-4" />
                    Importer
                  </button>
                  <input
                    ref={importFileRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={handleImportStudents}
                  />

                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl shadow-sm hover:bg-emerald-700 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 active:scale-95 text-sm whitespace-nowrap"
                    onClick={downloadStudentsPdf}
                  >
                    <FiDownload className="w-4 h-4" />
                    Télécharger
                  </button>

                  <button
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-sm hover:bg-blue-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 active:scale-95 text-sm whitespace-nowrap"
                    onClick={openCreateFormPage}
                  >
                    <FiPlus className="w-5 h-5 stroke-[3]" />
                    Nouvel étudiant
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                {loadErrorMessage && (
                  <div className="mx-4 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {loadErrorMessage}
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="table w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="py-3 px-6 text-left">
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Nom et Prenom</span>
                            <div className="relative w-full max-w-[200px]">
                              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                <FiSearch className="h-3.5 w-3.5 text-gray-400" />
                              </div>
                              <input
                                className="block w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-xs font-normal normal-case shadow-sm"
                                placeholder="Rechercher..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                              />
                            </div>
                          </div>
                        </th>
                        <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Email</th>
                        <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Parent</th>
                        <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loading ? (
                        <TableSkeletonRows rowCount={6} colCount={4} />
                      ) : visibleStudents.map((student) => (
                        <tr key={student.id_etudiant} className="hover:bg-blue-50/50 transition-colors group">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm tracking-tight">
                                {student.nom ? student.nom.substring(0, 1).toUpperCase() : '?'}
                                {student.prenom ? student.prenom.substring(0, 1).toUpperCase() : ''}
                              </div>
                              <span className="font-semibold text-gray-900">{student.nom} {student.prenom}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-500 text-center">{student.email || '-'}</td>
                          <td className="py-4 px-6 text-sm text-gray-600">
                            <div className="font-semibold text-gray-800">{student.parent_nom || '-'} {student.parent_prenom || ''}</div>
                            <div className="text-xs text-gray-500">Parent: {student.parent_phone || '-'}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                className="text-gray-800 hover:text-black hover:bg-gray-100 p-2 rounded-lg transition-colors cursor-pointer"
                                onClick={() => openAbsenceInsight(student)}
                                title="Voir infos absences"
                              >
                                <FiEye size={18} />
                              </button>
                              <button
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-colors cursor-pointer"
                                onClick={() => onEdit(student)}
                                title="Modifier"
                              >
                                <FiEdit2 size={18} />
                              </button>
                              <button
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer"
                                onClick={() => setDeleteTargetId(student.id_etudiant)}
                                disabled={String(deletingId) === String(student.id_etudiant)}
                                title="Supprimer"
                              >
                                <FiTrash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!loading && visibleStudents.length === 0 && (
                        <tr>
                          <td colSpan="4" className="py-12 text-center">
                            <div className="flex flex-col items-center justify-center text-gray-400">
                              <FiUsers className="w-12 h-12 mb-3 text-gray-200" />
                              <p className="text-base font-medium text-gray-500">Aucun étudiant trouvé</p>
                              <p className="text-sm mt-1">Ajustez vos filtres ou ajoutez un nouvel étudiant.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedStudentInsight && (
                <GlassModal open={Boolean(selectedStudentInsight)} onClose={() => setSelectedStudentInsight(null)} panelClassName="max-w-2xl p-0">
                  <div className="linkedu-glass-form overflow-hidden">
                    <div className="flex items-start justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
                      <div>
                        <h3 className="text-lg font-bold text-black">Bilan des absences</h3>
                        <p className="mt-1 text-xs text-gray-700">
                          {selectedStudentInsight.student.nom} {selectedStudentInsight.student.prenom}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedStudentInsight(null)}
                        className="rounded-lg bg-black p-2 text-white hover:bg-gray-800"
                        title="Fermer"
                      >
                        <FiX size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
                      <div className="rounded-xl border border-gray-300 bg-white px-4 py-4">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-700">Nombre d'absences</p>
                        <p className="mt-2 text-3xl font-black text-black">{selectedStudentInsight.totalAbsences}</p>
                      </div>

                      <div className="rounded-xl border border-gray-300 bg-white px-4 py-4">
                        <div className="h-full rounded-[11px] bg-white">
                          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-700">Heures d'absences</p>
                          <p className="mt-2 text-3xl font-black text-black">
                            {selectedStudentInsight.totalHours} h
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-gray-300 bg-white px-4 py-4">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-700">Note d'absence</p>
                        <p className="mt-2 text-3xl font-black text-black">{selectedStudentInsight.note.toFixed(2)} / 20</p>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 text-xs text-gray-700">
                      Initialisation: note = 20, heures = 0. Regle appliquee: -0.25 pour chaque 2h d'absence.
                    </div>
                  </div>
                </GlassModal>
              )}
            </>
        )}

            {isFormPage && (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col p-6 sm:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-gray-100 mb-6 gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{editingId ? 'Modifier Étudiant' : 'Nouvel Étudiant'}</h3>
                    <p className="text-gray-500 text-sm mt-1">Veuillez renseigner les informations pour {editingId ? 'mettre à jour le' : 'créer un nouveau'} dossier académique.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors focus:outline-none"
                      onClick={resetForm}
                    >
                      <FiArrowLeft size={16} /> Retour
                    </button>
                    <button
                      type="submit"
                      form="student-form"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-xl shadow-sm hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 active:scale-95"
                    >
                      <FiCheckCircle size={16} /> {editingId ? 'Enregistrer' : 'Créer l\'inscription'}
                    </button>
                  </div>
                </div>

                <form id="student-form" className="flex flex-col gap-8" onSubmit={onSubmit}>
                  {errorMessage && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
                      {errorMessage}
                    </div>
                  )}

                  {/* Informations Personnelles */}
                  <section className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="bg-white p-1.5 rounded-lg shadow-sm border border-gray-100 text-base">👤</span>
                      Informations Personnelles
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Nom</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <FiUser size={16} />
                          </div>
                          <input
                            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                            value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="ex: Durand" required
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Prénom</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <FiUser size={16} />
                          </div>
                          <input
                            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                            value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} placeholder="ex: Jean-Luc" required
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Date de naissance</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <FiCalendar size={16} />
                          </div>
                          <input
                            type="date"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                            value={form.date_naissance} onChange={(e) => setForm({ ...form, date_naissance: e.target.value })} required
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Genre</label>
                        <div className="flex items-center gap-4 mt-2">
                          <label className="flex items-center gap-2 cursor-pointer text-gray-700">
                            <input type="radio" className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300" name="genre" value="M" checked={form.genre === 'M'} onChange={(e) => setForm({ ...form, genre: e.target.value })} />
                            Masculin
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-gray-700">
                            <input type="radio" className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300" name="genre" value="F" checked={form.genre === 'F'} onChange={(e) => setForm({ ...form, genre: e.target.value })} />
                            Féminin
                          </label>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Informations Académiques */}
                  <section className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="bg-white p-1.5 rounded-lg shadow-sm border border-gray-100 text-base">🎓</span>
                      Informations Académiques
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Niveau scolaire (Cycle)</label>
                        <select
                          className="block w-full py-2 px-3 border border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                          value={form.cycle} onChange={handleCycleChange} required
                        >
                          <option value="">Sélectionner un cycle</option>
                          {Object.keys(ACADEMIC_STRUCTURE).map((cycle) => (
                            <option key={cycle} value={cycle}>{cycle}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Classe / Niveau</label>
                        <select
                          className="block w-full py-2 px-3 border border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                          value={form.niveau} onChange={handleNiveauChange} disabled={!form.cycle} required
                        >
                          <option value="">Sélectionner un niveau</option>
                          {availableNiveaux.map((niv) => (
                            <option key={niv} value={niv}>{niv}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Filière / Série</label>
                        <select
                          className="block w-full py-2 px-3 border border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                          value={form.filiere} onChange={handleFiliereChange} disabled={!form.niveau} required
                        >
                          <option value="">Sélectionner une filière</option>
                          {availableFilieres.map((fil) => (
                            <option key={fil} value={fil}>{fil}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Classe à inscrire</label>
                        <select
                          className="block w-full py-2 px-3 border border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                          value={form.id_classe} onChange={(e) => setForm({ ...form, id_classe: e.target.value })} disabled={!form.filiere} required
                        >
                          <option value="">Sélectionner une classe</option>
                          {availableClasses.map((c) => (
                            <option key={c.id_classe} value={c.id_classe}>{c.nom} ({c.total_etudiants || 0} élèves)</option>
                          ))}
                        </select>
                        {form.filiere && availableClasses.length === 0 && (
                          <span className="text-xs text-amber-600 mt-1">Aucune classe créée pour ce niveau/filière.</span>
                        )}
                        {selectedClassPrice !== null && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
                            <span className="text-xs font-semibold text-blue-700">Frais de scolarité :</span>
                            <span className="text-sm font-bold text-blue-800">{Number(selectedClassPrice).toLocaleString()} DH / mois</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Date d'entrée</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <FiCalendar size={16} />
                          </div>
                          <input
                            type="date"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                            value={form.date_entree} onChange={(e) => setForm({ ...form, date_entree: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Informations Parent / Tuteur */}
                  <section className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="bg-white p-1.5 rounded-lg shadow-sm border border-gray-100 text-base">👨‍👩‍👧</span>
                      Informations Parent / Tuteur
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Nom du parent</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <FiUser size={16} />
                          </div>
                          <input
                            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                            value={form.parent_nom}
                            onChange={(e) => setForm({ ...form, parent_nom: e.target.value })}
                            placeholder="ex: Alami"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Prénom du parent</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <FiUser size={16} />
                          </div>
                          <input
                            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                            value={form.parent_prenom}
                            onChange={(e) => setForm({ ...form, parent_prenom: e.target.value })}
                            placeholder="ex: Fatima"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Numéro CIN du parent</label>
                        <input
                          className="block w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                          value={form.parent_cin}
                          onChange={(e) => setForm({ ...form, parent_cin: e.target.value })}
                          placeholder="ex: AB123456"
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Gmail du parent</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <FiMail size={16} />
                          </div>
                          <input
                            type="email"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                            value={form.parent_email}
                            onChange={(e) => setForm({ ...form, parent_email: e.target.value })}
                            placeholder="parent@gmail.com"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Téléphone parent</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <FiPhone size={16} />
                          </div>
                          <input
                            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                            value={form.parent_phone}
                            onChange={(e) => setForm({ ...form, parent_phone: e.target.value })}
                            placeholder="+212 6 00 00 00 00"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Téléphone urgence (Facultatif)</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <FiPhone size={16} />
                          </div>
                          <input
                            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                            value={form.parent_urgence_phone}
                            onChange={(e) => setForm({ ...form, parent_urgence_phone: e.target.value })}
                            placeholder="+212 6 11 11 11 11"
                          />
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Coordonnées */}
                  <section className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="bg-white p-1.5 rounded-lg shadow-sm border border-gray-100 text-base">📍</span>
                      Coordonnées
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <FiMail size={16} />
                          </div>
                          <input
                            type="email"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Optionnel: etudiant@exemple.com"
                          />
                        </div>
                        <p className="text-xs text-gray-500">Si vide, le systeme generera un email eleve base sur le gmail parent.</p>
                      </div>
                      <div className="flex flex-col gap-1.5 md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">Adresse postale</label>
                        <div className="relative">
                          <div className="absolute top-3 left-3 pointer-events-none text-gray-400">
                            <FiMapPin size={16} />
                          </div>
                          <textarea
                            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-y"
                            value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} rows="3" required placeholder="Numéro, rue, code postal et ville"
                          />
                        </div>
                      </div>
                    </div>
                  </section>
                </form>
              </div>
            )}

            <LinkEduPopup
              open={Boolean(deleteTargetId)}
              title="Confirmer la suppression"
              message="Voulez-vous vraiment supprimer cet etudiant ?"
              tone="danger"
              confirmText="Oui, supprimer"
              cancelText="Annuler"
              onConfirm={() => onDelete()}
              onClose={() => {
                if (!deletingId) setDeleteTargetId(null);
              }}
              loading={Boolean(deletingId)}
            />

            <LinkEduPopup
              open={popupNotice.open}
              title={popupNotice.title}
              message={popupNotice.message}
              tone={popupNotice.tone}
              confirmText="Fermer"
              onClose={() => setPopupNotice((prev) => ({ ...prev, open: false }))}
            />
          </div>
      </div>
      );
}
