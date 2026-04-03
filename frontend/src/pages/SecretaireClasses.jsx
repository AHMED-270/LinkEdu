import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import { jsPDF as jsPDFType } from 'jspdf';
import { 
  School,
  Search,
  Filter,
  Eye,
  X,
  Users,
  Download
} from 'lucide-react';

export default function SecretaireClasses() {
  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [selectedClass, setSelectedClass] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [classesRes, studentsRes] = await Promise.all([
        axios.get(apiBaseUrl + '/api/secretaire/classes', {
          withCredentials: true,
          withXSRFToken: true,
        }),
        axios.get(apiBaseUrl + '/api/secretaire/students', {
          withCredentials: true,
          withXSRFToken: true,
        }),
      ]);

      setClasses(classesRes.data?.classes || []);
      setStudents(studentsRes.data?.students || []);
    } catch (err) {
      console.error("Erreur lors du chargement des classes", err);
      setClasses([]);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const levels = useMemo(() => {
    const uniqueLevels = [...new Set(classes.map(c => c.niveau))].filter(Boolean);
    return uniqueLevels.sort();
  }, [classes]);

  const filteredClasses = useMemo(() => {
    return classes.filter(c => {
      const matchesSearch = c.nom.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLevel = levelFilter === 'all' || c.niveau === levelFilter;
      return matchesSearch && matchesLevel;
    });
  }, [classes, searchTerm, levelFilter]);

  const selectedClassStudents = useMemo(() => {
    if (!selectedClass) return [];
    return students.filter((s) => String(s.id_classe || '') === String(selectedClass.id_classe));
  }, [students, selectedClass]);

  const getClassStudents = (classItem) => {
    return students.filter((s) => String(s.id_classe || '') === String(classItem.id_classe));
  };

  const exportClassStudents = (classItem) => {
    const classStudents = getClassStudents(classItem);
    if (classStudents.length === 0) {
      window.alert('Aucun etudiant a telecharger pour cette classe.');
      return;
    }

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    // ----- HEADER (Black & White style) -----
    // Ligne décorative en haut
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, pageWidth, 6, 'F');

    // Titres établissement
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('LinkedU', margin, 25);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Document Officiel', margin, 31);
    
    // Titre document et Infos de la classe (aligné à droite)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`LISTE DES D'ÉLÈVES`, pageWidth - margin, 25, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Classe: ${classItem.nom || 'N/A'}`, pageWidth - margin, 32, { align: 'right' });
    if (classItem.niveau) {
      doc.text(`Niveau: ${classItem.niveau}`, pageWidth - margin, 37, { align: 'right' });
    }
    
    doc.text(`Année: ${new Date().getFullYear()}/${new Date().getFullYear()+1}`, pageWidth - margin, 42, { align: 'right' });

    // Ligne de séparation
    doc.setLineWidth(0.5);
    doc.line(margin, 50, pageWidth - margin, 50);

    // ----- TABLEAU DES ELEVES -----
    let startY = 60;
    
    // Entête du tableau
    doc.setFillColor(240, 240, 240); // Gris très clair pour le fond de l'en-tête
    doc.rect(margin, startY, pageWidth - (margin * 2), 10, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    // Colonnes
    const colId = margin + 5;
    const colNom = margin + 30;
    const colEmail = margin + 105;
    
    doc.text('ID / N°', colId, startY + 7);
    doc.text('NOM & PRÉNOM', colNom, startY + 7);
    doc.text('EMAIL / CONTACT', colEmail, startY + 7);
    
    startY += 12;
    
    // Contenu du tableau
    doc.setFont('helvetica', 'normal');
    
    classStudents.forEach((student, index) => {
      // Nouvelle page si on approche du bas
      if (startY > pageHeight - 30) {
        doc.addPage();
        startY = margin;
        
        doc.setFillColor(0, 0, 0);
        doc.rect(0, 0, pageWidth, 6, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('LinkedU - Suite de la liste', margin, 15);
        doc.text(`Classe: ${classItem.nom || 'N/A'}`, pageWidth - margin, 15, { align: 'right' });
        
        doc.setLineWidth(0.5);
        doc.line(margin, 20, pageWidth - margin, 20);
        
        // Rappel En-tête
        startY = 25;
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, startY, pageWidth - (margin * 2), 10, 'F');
        doc.text('ID / N°', colId, startY + 7);
        doc.text('NOM & PRÉNOM', colNom, startY + 7);
        doc.text('EMAIL / CONTACT', colEmail, startY + 7);
        startY += 12;
        doc.setFont('helvetica', 'normal');
      }
      
      // Ligne zébrée optionnelle (très discrète)
      if (index % 2 === 0) {
        doc.setFillColor(252, 252, 252);
        doc.rect(margin, startY - 5, pageWidth - (margin * 2), 10, 'F');
      }
      
      const numero = (index + 1).toString().padStart(2, '0');
      const nomComplet = `${student.nom || ''} ${student.prenom || ''}`.trim();
      const email = student.email || '-';
      
      doc.text(numero, colId, startY + 2);
      
      // Tronquer le nom si trop long
      if(nomComplet.length > 35) {
        doc.text(nomComplet.substring(0, 32) + '...', colNom, startY + 2);
      } else {
        doc.text(nomComplet, colNom, startY + 2);
      }
      
      doc.text(email, colEmail, startY + 2);
      
      // Ligne pointillée fine
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.1);
      doc.line(margin, startY + 5, pageWidth - margin, startY + 5);
      
      startY += 10;
    });

    // ----- PIED DE PAGE -----
    const bottomY = pageHeight - 15;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const generationDate = new Date().toLocaleString('fr-FR');
    doc.text(`Document généré le ${generationDate} | Total des élèves : ${classStudents.length}`, margin, bottomY);
    
    // Sauvegarder le PDF
    const safeClassName = String(classItem.nom || 'liste').replace(/[^a-zA-Z0-9_-]+/g, '-');
    doc.save(`fiche-presence-${safeClassName}.pdf`);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedClass) return;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSelectedClass(null);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [selectedClass]);

  return (
    <div className="min-h-screen p-6 lg:p-10 bg-gray-50/50">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <School className="w-8 h-8 text-blue-600" />
            Liste des Classes
          </h1>
          
          {/* Barre de recherche et filtre */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative w-full sm:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors sm:text-sm shadow-sm"
                placeholder="Rechercher une classe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative w-full sm:w-48">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
              <select 
                className="block w-full py-2.5 pl-10 pr-3 border border-gray-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors cursor-pointer shadow-sm font-medium text-gray-700" 
                value={levelFilter} 
                onChange={(e) => setLevelFilter(e.target.value)}
              >
                <option value="all">Tous les niveaux</option>
                {levels.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Nom de la Classe
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Niveau d'Étude
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                    Nombre d'Étudiants
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                    Statut
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={`skeleton-${i}`} className="animate-pulse">
                      <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                      <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                      <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-12 ml-auto"></div></td>
                      <td className="py-4 px-6"><div className="h-6 bg-gray-200 rounded-full w-20 mx-auto"></div></td>
                      <td className="py-4 px-6"><div className="h-8 bg-gray-200 rounded-xl w-16 ml-auto"></div></td>
                    </tr>
                  ))
                ) : filteredClasses.length > 0 ? (
                  filteredClasses.map((c) => (
                    <tr 
                      key={c.id_classe} 
                      className="hover:bg-blue-50/50 transition-colors group"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            {(c.nom || '??').substring(0, 2).toUpperCase()}
                          </div>
                          <span className="font-semibold text-gray-900">{c.nom}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600 font-medium">
                        {c.niveau}
                      </td>
                      <td className="py-4 px-6 text-sm font-semibold text-gray-700 text-right">
                        {c.total_etudiants || 0}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedClass(c)}
                            className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 hover:text-black transition-colors"
                            title="Voir la classe"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => exportClassStudents(c)}
                            className="inline-flex items-center justify-center p-2 rounded-lg border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
                            title="Telecharger la liste"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <span className="mb-3 text-gray-200">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
                        </span>
                        <p className="text-base font-medium text-gray-500">Aucune classe trouvée</p>
                        <p className="text-sm mt-1">Ajustez vos filtres ou effectuez une nouvelle recherche.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedClass && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[1px]"
          onClick={() => setSelectedClass(null)}
        >
          <div
            className="w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Etudiants de la classe {selectedClass.nom}</h2>
                <p className="text-xs text-gray-500 mt-1">Niveau: {selectedClass.niveau}</p>
              </div>
              <button
                onClick={() => setSelectedClass(null)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-4 gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Users className="w-4 h-4 text-gray-700" />
                  Total etudiants: {selectedClassStudents.length}
                </div>
                <button
                  type="button"
                  onClick={() => exportClassStudents(selectedClass)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  Telecharger la liste
                </button>
              </div>

              {selectedClassStudents.length === 0 ? (
                <p className="text-sm text-gray-500">Aucun etudiant trouve dans cette classe.</p>
              ) : (
                <div className="max-h-[380px] overflow-y-auto border border-gray-100 rounded-xl">
                  <table className="table w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nom</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Prenom</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedClassStudents.map((student) => (
                        <tr key={student.id_etudiant} className="hover:bg-gray-50/70">
                          <td className="py-3 px-4 text-sm font-medium text-gray-800">{student.nom || '-'}</td>
                          <td className="py-3 px-4 text-sm text-gray-700">{student.prenom || '-'}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{student.email || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
