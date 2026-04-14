import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, BookOpen, GraduationCap, Search, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { professorGet } from '../services/professorApi';

export default function Eleves() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedClassId, setSelectedClassId] = useState(null);
  const [classStudents, setClassStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState('');
  const [studentsSearch, setStudentsSearch] = useState('');

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await professorGet('/api/professeur/eleves');
        setClasses(data?.classes || []);
      } catch {
        setError('Impossible de charger la liste de vos classes.');
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  const openClassStudents = async (classId) => {
    setSelectedClassId(classId);
    setStudentsLoading(true);
    setStudentsError('');
    setStudentsSearch('');

    try {
      const data = await professorGet(`/api/professeur/classes/${classId}/eleves`);
      setClassStudents(data?.students || []);
    } catch (fetchError) {
      if (fetchError?.response?.status === 403) {
        setStudentsError('Acces refuse a cette classe.');
      } else {
        setStudentsError('Impossible de charger les eleves de cette classe.');
      }
      setClassStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  const backToClasses = () => {
    setSelectedClassId(null);
    setClassStudents([]);
    setStudentsSearch('');
    setStudentsError('');
  };

  const selectedClass = useMemo(
    () => classes.find((classe) => String(classe.id) === String(selectedClassId)) || null,
    [classes, selectedClassId],
  );

  const classStats = useMemo(() => {
    const totalClasses = classes.length;
    const totalStudents = classes.reduce((sum, classe) => sum + Number(classe.students_count || 0), 0);
    const totalAbsences = classes.reduce((sum, classe) => sum + Number(classe.absences_count || 0), 0);
    const averageAbsences = totalClasses > 0
      ? (totalAbsences / totalClasses).toFixed(1)
      : '0.0';

    const sortedByAbsence = [...classes]
      .sort((a, b) => Number(b.absences_count || 0) - Number(a.absences_count || 0));

    const maxAbsence = Math.max(...classes.map((classe) => Number(classe.absences_count || 0)), 1);

    return {
      totalClasses,
      totalStudents,
      totalAbsences,
      averageAbsences,
      sortedByAbsence,
      maxAbsence,
    };
  }, [classes]);

  const filteredStudents = useMemo(() => {
    const search = studentsSearch.trim().toLowerCase();
    if (!search) return classStudents;

    return classStudents.filter((student) => {
      const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim().toLowerCase();
      const matricule = String(student.matricule || '').toLowerCase();
      return fullName.includes(search) || matricule.includes(search);
    });
  }, [classStudents, studentsSearch]);

  return (
    <div className="layout-content relative !pt-2 pb-4">
      <div className="mx-auto w-full max-w-6xl space-y-4">
      <header className="flex flex-col gap-1 -mt-2">
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
          {selectedClass ? 'Liste des eleves' : 'Mes Classes'}
        </h1>
        {selectedClass ? (
          <p className="text-slate-500 text-sm leading-6">
            Classe: {selectedClass.label || `${selectedClass.nom} - ${selectedClass.niveau}`}
          </p>
        ) : (
          <p className="text-slate-500 text-sm leading-6 max-w-3xl">
            Cette vue affiche uniquement les classes que vous enseignez avec le total des absences enregistrees.
          </p>
        )}
      </header>

      {!selectedClass ? (
        <>
          

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 120 }}
            className="card p-0 overflow-hidden"
          >
            <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50/70 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <BookOpen size={20} />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-800">Liste de classes</h2>
                <p className="text-xs text-slate-500">Selectionnez une classe pour afficher ses eleves et leurs absences.</p>
              </div>
            </div>

            <div className="overflow-x-auto min-h-[150px]">
              {loading ? (
                <div className="flex flex-col justify-center items-center py-10">
                  <span className="loading-spinner border-blue-500 mb-3"></span>
                  <p className="text-slate-500 font-medium">Chargement des classes...</p>
                </div>
              ) : error ? (
                <div className="m-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-red-600 font-medium flex items-center gap-2">
                  <AlertCircle size={16} /> {error}
                </div>
              ) : classes.length === 0 ? (
                <div className="text-center text-slate-500 py-10">
                  <GraduationCap size={40} className="mx-auto mb-2 opacity-30" />
                  <p className="font-semibold text-slate-600">Aucune classe assignee.</p>
                </div>
              ) : (
                <table className="table w-full table-fixed">
                  <colgroup>
                    <col className="w-[34%]" />
                    <col className="w-[16%]" />
                    <col className="w-[16%]" />
                    <col className="w-[16%]" />
                    <col className="w-[18%]" />
                  </colgroup>
                  <thead>
                    <tr className="bg-white">
                      <th className="!py-3 !px-4">Classe</th>
                      <th className="!py-3 !px-4">Niveau</th>
                      <th className="!py-3 !px-4 text-center">Eleves</th>
                      <th className="!py-3 !px-4 text-center">Absences</th>
                      <th className="!py-3 !px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map((classe) => (
                      <tr key={classe.id} className="hover:bg-slate-50/60">
                        <td className="!py-3 !px-4 font-semibold text-slate-800 truncate">{classe.nom || '-'}</td>
                        <td className="!py-3 !px-4 text-slate-600">{classe.niveau || '-'}</td>
                        <td className="!py-3 !px-4 text-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                            <Users size={13} /> {classe.students_count || 0}
                          </span>
                        </td>
                        <td className="!py-3 !px-4 text-center">
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-100">
                            {classe.absences_count || 0}
                          </span>
                        </td>
                        <td className="!py-3 !px-4 text-right">
                          <button
                            type="button"
                            onClick={() => openClassStudents(classe.id)}
                            className="btn btn-secondary !px-3 !py-2 text-xs"
                          >
                            Voir les eleves
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {!loading && !error && (
              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500">
                {classes.length} classe(s) enseignee(s)
              </div>
            )}
          </motion.section>
        </>
      ) : (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 120 }}
          className="card p-0 overflow-hidden"
        >
          <div className="p-4 md:p-5 border-b border-slate-100 bg-white flex flex-col gap-2">
            <button
              type="button"
              onClick={backToClasses}
              className="inline-flex items-center gap-2 text-xs md:text-sm font-semibold text-blue-700 hover:text-blue-800 w-fit"
            >
              <ArrowLeft size={16} /> Retour a la liste des classes
            </button>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3">
              <div>
              <h3 className="text-lg font-extrabold text-slate-800">
                Eleves de {selectedClass.label || `${selectedClass.nom} - ${selectedClass.niveau}`}
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Nombre total d absences de la classe: <span className="font-bold text-amber-700">{selectedClass.absences_count || 0}</span>
              </p>
              </div>

              <div className="relative w-full md:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  className="form-input w-full pl-10"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Rechercher un eleve..."
                  value={studentsSearch}
                  onChange={(e) => setStudentsSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto min-h-[150px]">
            {studentsLoading ? (
              <div className="flex flex-col justify-center items-center py-10">
                <span className="loading-spinner border-blue-500 mb-3"></span>
                <p className="text-slate-500 font-medium">Chargement des eleves...</p>
              </div>
            ) : studentsError ? (
              <div className="m-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-red-600 font-medium flex items-center gap-2">
                <AlertCircle size={16} /> {studentsError}
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center text-slate-500 py-10">Aucun eleve trouve pour cette classe.</div>
            ) : (
              <table className="table w-full table-fixed">
                <colgroup>
                  <col className="w-[36%]" />
                  <col className="w-[20%]" />
                  <col className="w-[28%]" />
                  <col className="w-[16%]" />
                </colgroup>
                <thead>
                  <tr className="bg-white">
                    <th className="!py-3 !px-4">Eleve</th>
                    <th className="!py-3 !px-4">Matricule</th>
                    <th className="!py-3 !px-4">Email</th>
                    <th className="!py-3 !px-4 text-right">Nombre d absences</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => {
                    const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Eleve';
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/60">
                        <td className="!py-3 !px-4 font-semibold text-slate-800 truncate">{fullName}</td>
                        <td className="!py-3 !px-4 text-slate-600">{student.matricule || `#${String(student.id).padStart(5, '0')}`}</td>
                        <td className="!py-3 !px-4 text-slate-600 truncate">{student.email || '-'}</td>
                        <td className="!py-3 !px-4 text-right">
                          <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700 border border-red-100">
                            {student.absenceCount || 0}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {!studentsLoading && !studentsError && (
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500">
              Affichage de {filteredStudents.length} eleve(s)
            </div>
          )}
        </motion.section>
      )}
      </div>
    </div>
  );
}

