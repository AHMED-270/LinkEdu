import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { CreditCard, PlusCircle, RefreshCw, X, Printer } from 'lucide-react';
import FilterClasse from '../components/FilterClasse';
import PaiementTable from '../components/PaiementTable';
import LinkEduPopup from '../components/LinkEduPopup';
import GlassModal from '../components/GlassModal';

const getDefaultAcademicYear = () => {
  const date = new Date();
  const month = date.getMonth() + 1;
  return month >= 9 ? date.getFullYear() : date.getFullYear() - 1;
};

const emptyForm = {
  id_classe: '',
  id_etudiant: '',
  mois: 9,
  montant: '',
  reste: '0.00',
  type: 'mensuel',
  date_paiement: '',
};

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

export default function Paiements() {
  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [months, setMonths] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyKey, setBusyKey] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [popupNotice, setPopupNotice] = useState({
    open: false,
    title: '',
    message: '',
    tone: 'info',
  });

  const [classFilter, setClassFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [annee, setAnnee] = useState(String(getDefaultAcademicYear()));

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [receiptData, setReceiptData] = useState(null);
  const previousTypeRef = useRef(form.type);
  const previousClassRef = useRef(form.id_classe);
  const csrfReadyRef = useRef(false);

  const ensureCsrfCookie = async () => {
    if (csrfReadyRef.current) return;
    await axios.get(`${apiBaseUrl}/sanctum/csrf-cookie`, {
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

  const studentsForSelect = useMemo(() => {
    return students.map((student) => ({
      id: student.id_etudiant,
      id_classe: student.id_classe,
      label: `${student.nom || ''} ${student.prenom || ''}`.trim(),
      classe: student.classe || '',
    }));
  }, [students]);

  const studentsForSelectedClass = useMemo(() => {
    if (!form.id_classe) return [];

    return studentsForSelect.filter(
      (student) => String(student.id_classe || '') === String(form.id_classe)
    );
  }, [studentsForSelect, form.id_classe]);

  const selectedStudent = useMemo(
    () => students.find((student) => String(student.id_etudiant) === String(form.id_etudiant)) || null,
    [students, form.id_etudiant]
  );

  const selectedClass = useMemo(
    () => classes.find((classe) => String(classe.id_classe) === String(form.id_classe)) || null,
    [classes, form.id_classe]
  );

  const expectedAmount = useMemo(() => {
    if (!selectedClass) return 0;
    const basePrice = Number(selectedClass.pricing || 0);
    if (!Number.isFinite(basePrice) || basePrice <= 0) return 0;
    return form.type === 'annuel' ? basePrice * 10 : basePrice;
  }, [selectedClass, form.type]);

  const availableMonths = useMemo(() => {
    if (form.type !== 'mensuel') {
      return months;
    }

    if (!selectedStudent) {
      return months;
    }

    return months.filter((month) => {
      const payment = selectedStudent.paiements?.[String(month.value)] ?? null;
      if (!payment) return true;
      if (editingId && payment.id_paiement === editingId) return true;
      return payment.statut !== 'paye';
    });
  }, [months, selectedStudent, form.type, editingId]);

  useEffect(() => {
    if (form.type !== 'mensuel') return;
    if (availableMonths.length === 0) return;
    const exists = availableMonths.some((month) => Number(month.value) === Number(form.mois));
    if (!exists) {
      setForm((prev) => ({ ...prev, mois: Number(availableMonths[0].value) }));
    }
  }, [availableMonths, form.type, form.mois]);

  const loadData = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const params = {
        annee: Number(annee),
      };

      if (classFilter !== 'all') {
        params.id_classe = Number(classFilter);
      }

      if (search.trim() !== '') {
        params.q = search.trim();
      }

      const response = await axios.get(`${apiBaseUrl}/api/secretaire/paiements`, {
        params,
        withCredentials: true,
        withXSRFToken: true,
      });

      setStudents(response.data?.students || []);
      setClasses(response.data?.classes || []);
      setMonths(response.data?.months || []);
    } catch (error) {
      console.error('Erreur de chargement des paiements', error);
      setStudents([]);
      setClasses([]);
      setMonths([]);
      setErrorMessage(error?.response?.data?.message || 'Impossible de charger les paiements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [classFilter, search, annee]);

  useEffect(() => {
    ensureCsrfCookie().catch(() => {
      // No-op: csrf setup will retry before mutation calls.
    });
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      id_classe: classFilter !== 'all' ? String(classFilter) : '',
      mois: months[0]?.value ?? 9,
    });
  };

  useEffect(() => {
    if (!form.id_classe) {
      if (form.id_etudiant) {
        setForm((prev) => ({ ...prev, id_etudiant: '' }));
      }
      return;
    }

    const studentExists = studentsForSelectedClass.some(
      (student) => String(student.id) === String(form.id_etudiant)
    );

    if (!studentExists && form.id_etudiant) {
      setForm((prev) => ({ ...prev, id_etudiant: '' }));
    }
  }, [form.id_classe, form.id_etudiant, studentsForSelectedClass]);

  // Auto-calculate amount when class or type changes (monthly <-> annual).
  useEffect(() => {
    if (!form.id_classe || editingId) {
      previousTypeRef.current = form.type;
      previousClassRef.current = form.id_classe;
      return;
    }

    const typeChanged = previousTypeRef.current !== form.type;
    const classChanged = previousClassRef.current !== form.id_classe;
    let autoAmount = null;

    if (typeChanged) {
      if (expectedAmount > 0) {
        autoAmount = expectedAmount;
      } else {
        const currentAmount = Number(form.montant || 0);
        if (Number.isFinite(currentAmount) && currentAmount > 0) {
          if (previousTypeRef.current === 'mensuel' && form.type === 'annuel') {
            autoAmount = currentAmount * 10;
          } else if (previousTypeRef.current === 'annuel' && form.type === 'mensuel') {
            autoAmount = currentAmount / 10;
          }
        }
      }
    } else if (classChanged || form.montant === '') {
      if (expectedAmount > 0) {
        autoAmount = expectedAmount;
      }
    }

    previousTypeRef.current = form.type;
    previousClassRef.current = form.id_classe;

    if (autoAmount === null) {
      return;
    }

    const amountValue = Number(autoAmount).toFixed(2);
    if (amountValue !== form.montant) {
      setForm((prev) => ({ ...prev, montant: amountValue }));
    }
  }, [form.id_classe, form.type, form.montant, expectedAmount, editingId]);

  // Keep remaining balance in sync with the paid amount and selected payment type.
  useEffect(() => {
    if (!form.id_classe) {
      if (form.reste !== '0.00') {
        setForm((prev) => ({ ...prev, reste: '0.00' }));
      }
      return;
    }

    const amountNumber = Number(form.montant || 0);
    const computedReste = Math.max(expectedAmount - amountNumber, 0);
    const resteValue = computedReste.toFixed(2);

    if (resteValue === form.reste) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      reste: resteValue,
    }));
  }, [form.id_classe, form.montant, form.reste, expectedAmount]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.id_etudiant && !editingId) {
      setErrorMessage('Veuillez selectionner un eleve pour enregistrer le paiement.');
      return;
    }

    if (!form.id_classe) {
      setErrorMessage('Veuillez selectionner une classe avant de choisir un eleve.');
      return;
    }

    if (form.montant === '' || Number(form.montant) <= 0) {
      setErrorMessage('Le montant est obligatoire et doit etre superieur a 0.');
      return;
    }

    if (form.type === 'mensuel' && availableMonths.length === 0 && !editingId) {
      setErrorMessage('Tous les mois de cet eleve sont deja marques comme payes.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      await ensureCsrfCookie();

      const payload = {
        annee: Number(annee),
        type: form.type,
        statut: 'paye',
        montant: Number(form.montant),
        reste: Number(form.reste || 0),
        date_paiement: form.date_paiement || null,
      };

      if (form.type === 'mensuel') {
        payload.mois = Number(form.mois);
      }

      if (editingId) {
        await axios.put(`${apiBaseUrl}/api/secretaire/paiements/${editingId}`, payload, {
          withCredentials: true,
          withXSRFToken: true,
        });
      } else {
        payload.id_etudiant = Number(form.id_etudiant);
        await axios.post(`${apiBaseUrl}/api/secretaire/paiements`, payload, {
          withCredentials: true,
          withXSRFToken: true,
        });
      }

      await loadData();
      resetForm();
      showNotice(
        editingId ? 'Paiement mis a jour' : 'Paiement ajoute',
        editingId ? 'Le paiement a ete modifie avec succes.' : 'Le paiement a ete enregistre avec succes.',
        'success'
      );
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Erreur lors de l enregistrement du paiement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (student, month, payment) => {
    const key = `${student.id_etudiant}-${month}`;
    setBusyKey(key);

    try {
      await ensureCsrfCookie();

      if (payment?.id_paiement) {
        await axios.put(`${apiBaseUrl}/api/secretaire/paiements/${payment.id_paiement}/toggle`, {}, {
          withCredentials: true,
          withXSRFToken: true,
        });
      } else {
        setErrorMessage('Montant obligatoire: ajoutez ce paiement via le formulaire avant de le marquer paye.');
        return;
      }

      await loadData();
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Impossible de changer le statut du paiement.');
    } finally {
      setBusyKey('');
    }
  };

  const handleEdit = (student, month, payment) => {
    setEditingId(payment.id_paiement);
    setForm({
      id_classe: student.id_classe ? String(student.id_classe) : '',
      id_etudiant: String(student.id_etudiant),
      mois: month,
      montant: payment.montant ?? '',
      reste: Number(payment.reste || 0).toFixed(2),
      type: payment.type || 'mensuel',
      date_paiement: payment.date_paiement || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleView = (student, month, payment) => {
    const monthMeta = months.find((item) => Number(item.value) === Number(month));
    setReceiptData({
      student,
      payment,
      month,
      monthLabel: monthMeta?.name || monthMeta?.label || String(month),
    });
  };

  const printReceipt = () => {
    if (!receiptData) return;

    const { student, payment, monthLabel } = receiptData;
    const fullName = `${student?.nom || ''} ${student?.prenom || ''}`.trim();
    const group = student?.classe_nom || '-';
    const niveau = student?.classe_niveau || '-';

    const popup = window.open('', '_blank', 'width=820,height=700');
    if (!popup) return;

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Recu Paiement</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
            .header { border-bottom: 2px solid #1d4ed8; padding-bottom: 12px; margin-bottom: 18px; }
            .title { font-size: 24px; font-weight: 700; color: #1d4ed8; }
            .subtitle { font-size: 14px; color: #374151; margin-top: 4px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 24px; margin-top: 16px; }
            .item { padding: 8px 10px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; }
            .label { font-size: 11px; text-transform: uppercase; color: #6b7280; margin-bottom: 4px; }
            .value { font-size: 14px; font-weight: 600; }
            .footer { margin-top: 24px; font-size: 12px; color: #6b7280; }
            .status-ok { color: #065f46; font-weight: 700; }
            .status-ko { color: #991b1b; font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">LinkedU - Recu de Paiement</div>
            <div class="subtitle">Date d impression: ${escapeHtml(new Date().toLocaleString('fr-FR'))}</div>
          </div>

          <div class="grid">
            <div class="item"><div class="label">Nom eleve</div><div class="value">${escapeHtml(fullName || '-')}</div></div>
            <div class="item"><div class="label">Matricule</div><div class="value">${escapeHtml(student?.matricule || '-')}</div></div>
            <div class="item"><div class="label">Groupe</div><div class="value">${escapeHtml(group)}</div></div>
            <div class="item"><div class="label">Niveau</div><div class="value">${escapeHtml(niveau)}</div></div>
            <div class="item"><div class="label">Mois</div><div class="value">${escapeHtml(monthLabel)}</div></div>
            <div class="item"><div class="label">Annee</div><div class="value">${escapeHtml(payment?.annee || '-')}</div></div>
            <div class="item"><div class="label">Type</div><div class="value">${escapeHtml(payment?.type || '-')}</div></div>
            <div class="item"><div class="label">Montant</div><div class="value">${escapeHtml(Number(payment?.montant || 0).toFixed(2))} MAD</div></div>
            <div class="item"><div class="label">Reste</div><div class="value">${escapeHtml(Number(payment?.reste || 0).toFixed(2))} MAD</div></div>
            <div class="item"><div class="label">Statut</div><div class="value ${payment?.statut === 'paye' ? 'status-ok' : 'status-ko'}">${escapeHtml(payment?.statut || '-')}</div></div>
            <div class="item"><div class="label">Date paiement</div><div class="value">${escapeHtml(payment?.date_paiement || '-')}</div></div>
          </div>

          <script>window.onload = function () { window.print(); };</script>
        </body>
      </html>
    `;

    popup.document.open();
    popup.document.write(html);
    popup.document.close();
  };

  const handleDelete = (student, month, payment) => {
    if (!payment?.id_paiement) return;
    setDeleteTarget({ student, month, payment });
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.payment?.id_paiement) return;
    const targetPaymentId = deleteTarget.payment.id_paiement;

    setBusyKey(`delete-${targetPaymentId}`);

    try {
      await ensureCsrfCookie();
      await axios.delete(`${apiBaseUrl}/api/secretaire/paiements/${targetPaymentId}`, {
        withCredentials: true,
        withXSRFToken: true,
      });

      await loadData();
      if (editingId === targetPaymentId) {
        resetForm();
      }
      showNotice('Paiement supprime', 'Le paiement a ete supprime avec succes.', 'success');
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Erreur lors de la suppression du paiement.');
    } finally {
      setDeleteTarget(null);
      setBusyKey('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 lg:p-10 relative overflow-hidden backdrop-saturate-150">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-gray-900">
              <CreditCard className="h-8 w-8 text-brand-teal" />
              Etudiants - Paiements
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Gestion des paiements mensuels (Septembre a Juin) avec suivi en temps reel.
            </p>
          </div>

          
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm backdrop-blur-sm focus:ring-2 focus:ring-blue-600/40 focus:border-blue-600 border-white/60 transition-all duration-300">
          <FilterClasse
            classes={classes}
            classValue={classFilter}
            onClassChange={setClassFilter}
            searchValue={search}
            onSearchChange={setSearch}
            annee={annee}
            onAnneeChange={setAnnee}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-8">
            {errorMessage && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            <PaiementTable
              rows={students}
              months={months}
              loading={loading}
              busyKey={busyKey}
              onToggle={handleToggle}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>

          <div className="xl:col-span-4">
            <div className="sticky top-8 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-xl shadow-blue-900/5">
              <div className="bg-brand-teal p-5 text-white">
                <h3 className="text-lg font-bold">{editingId ? 'Modifier paiement' : 'Ajouter paiement'}</h3>
                <p className="mt-1 text-xs text-blue-100">
                  Le type annuel marque automatiquement tous les mois comme payes.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 p-5">
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Classe
                  </label>
                  <select
                    value={form.id_classe}
                    onChange={(event) => {
                      const value = event.target.value;
                      setForm((prev) => ({ ...prev, id_classe: value, id_etudiant: '' }));
                      setClassFilter(value || 'all');
                    }}
                    disabled={!!editingId}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-brand-teal/20 disabled:cursor-not-allowed disabled:bg-gray-50 backdrop-blur-xl border border-white/80 !shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(41,107,116,0.06)] transition-all duration-300"
                  >
                    <option value="">Selectionner une classe</option>
                    {classes.map((classe) => (
                      <option key={classe.id_classe} value={String(classe.id_classe)}>
                        {classe.nom || 'Classe'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Eleve
                  </label>
                  <select
                    value={form.id_etudiant}
                    onChange={(event) => setForm((prev) => ({ ...prev, id_etudiant: event.target.value }))}
                    disabled={!!editingId || !form.id_classe}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-brand-teal/20 disabled:cursor-not-allowed disabled:bg-gray-50 backdrop-blur-xl border border-white/80 !shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(41,107,116,0.06)] transition-all duration-300"
                  >
                    <option value="">{form.id_classe ? 'Selectionner un eleve' : 'Choisissez d abord une classe'}</option>
                    {studentsForSelectedClass.map((student) => (
                      <option key={student.id} value={String(student.id)}>
                        {student.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Type
                    </label>
                    <select
                      value={form.type}
                      onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-brand-teal/20 backdrop-blur-xl border border-white/80 !shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(41,107,116,0.06)] transition-all duration-300"
                    >
                      <option value="mensuel">Mensuel</option>
                      <option value="annuel">Annuel</option>
                    </select>
                  </div>

                  {form.type === 'mensuel' ? (
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        Mois
                      </label>
                      <select
                        value={form.mois}
                        onChange={(event) => setForm((prev) => ({ ...prev, mois: Number(event.target.value) }))}
                        disabled={availableMonths.length === 0 && !editingId}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-brand-teal/20 backdrop-blur-xl border border-white/80 !shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(41,107,116,0.06)] transition-all duration-300"
                      >
                        {availableMonths.map((month) => (
                          <option key={month.value} value={month.value}>
                            {month.name}
                          </option>
                        ))}
                      </select>
                      {availableMonths.length === 0 && !editingId && (
                        <p className="mt-1 text-xs font-medium text-amber-700">
                          Tous les mois sont deja payes pour cet eleve.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-700 backdrop-blur-sm focus:ring-2 focus:ring-blue-600/40 focus:border-blue-600 border-white/60 transition-all duration-300">
                      Paiement annuel: Septembre a Juin sera marque paye.
                    </div>
                  )}
                </div>

                <div>
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Montant paye par parent (MAD)
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      value={form.montant}
                      onChange={(event) => setForm((prev) => ({ ...prev, montant: event.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-brand-teal/20"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Tarif attendu: {Number(expectedAmount || 0).toFixed(2)} MAD ({form.type === 'mensuel' ? 'pour ce mois' : 'pour toute l annee, calcule depuis le mensuel'}).
                    </p>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Reste (MAD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.reste}
                    readOnly
                    className="w-full rounded-xl border border-gray-200 bg-gray-100 px-3 py-2.5 text-sm font-semibold text-gray-700 outline-none"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Calcul automatique: reste = tarif attendu - montant paye.
                  </p>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Date paiement
                  </label>
                  <input
                    type="date"
                    value={form.date_paiement}
                    onChange={(event) => setForm((prev) => ({ ...prev, date_paiement: event.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-brand-teal/20"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-teal px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                  >
                    {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
                    {editingId ? 'Mettre a jour' : 'Ajouter'}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {receiptData && (
        <GlassModal open={Boolean(receiptData)} onClose={() => setReceiptData(null)} panelClassName="max-w-2xl p-0">
          <div className="linkedu-glass-form rounded-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-lg font-bold text-gray-900">Details du paiement</h3>
              <button
                type="button"
                onClick={() => setReceiptData(null)}
                className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 px-6 py-5 md:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 backdrop-blur-sm focus:ring-2 focus:ring-blue-600/40 focus:border-blue-600 border-white/60 transition-all duration-300">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Nom eleve</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {receiptData.student?.nom} {receiptData.student?.prenom}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 backdrop-blur-sm focus:ring-2 focus:ring-blue-600/40 focus:border-blue-600 border-white/60 transition-all duration-300">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Matricule</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{receiptData.student?.matricule || '-'}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 backdrop-blur-sm focus:ring-2 focus:ring-blue-600/40 focus:border-blue-600 border-white/60 transition-all duration-300">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Groupe</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{receiptData.student?.classe_nom || '-'}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 backdrop-blur-sm focus:ring-2 focus:ring-blue-600/40 focus:border-blue-600 border-white/60 transition-all duration-300">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Niveau</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{receiptData.student?.classe_niveau || '-'}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 backdrop-blur-sm focus:ring-2 focus:ring-blue-600/40 focus:border-blue-600 border-white/60 transition-all duration-300">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Mois</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{receiptData.monthLabel}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 backdrop-blur-sm focus:ring-2 focus:ring-blue-600/40 focus:border-blue-600 border-white/60 transition-all duration-300">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Annee</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{receiptData.payment?.annee}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 backdrop-blur-sm focus:ring-2 focus:ring-blue-600/40 focus:border-blue-600 border-white/60 transition-all duration-300">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Type</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{receiptData.payment?.type}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 backdrop-blur-sm focus:ring-2 focus:ring-blue-600/40 focus:border-blue-600 border-white/60 transition-all duration-300">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Montant</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{Number(receiptData.payment?.montant || 0).toFixed(2)} MAD</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 backdrop-blur-sm focus:ring-2 focus:ring-blue-600/40 focus:border-blue-600 border-white/60 transition-all duration-300">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Reste</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{Number(receiptData.payment?.reste || 0).toFixed(2)} MAD</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 backdrop-blur-sm focus:ring-2 focus:ring-blue-600/40 focus:border-blue-600 border-white/60 transition-all duration-300">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Statut</p>
                <p className={`mt-1 text-sm font-semibold ${receiptData.payment?.statut === 'paye' ? 'text-emerald-700' : 'text-red-700'}`}>
                  {receiptData.payment?.statut}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 backdrop-blur-sm focus:ring-2 focus:ring-blue-600/40 focus:border-blue-600 border-white/60 transition-all duration-300">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Date paiement</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{receiptData.payment?.date_paiement || '-'}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setReceiptData(null)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 backdrop-blur-sm focus:ring-2 focus:ring-blue-600/40 focus:border-blue-600 border-white/60 transition-all duration-300"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={printReceipt}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-teal px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Printer className="h-4 w-4" />
                Imprimer recu
              </button>
            </div>
          </div>
        </GlassModal>
      )}

      <LinkEduPopup
        open={Boolean(deleteTarget)}
        title="Confirmer la suppression"
        message={deleteTarget ? `Voulez-vous supprimer le paiement de ${deleteTarget.student?.nom || ''} ${deleteTarget.student?.prenom || ''} ?` : ''}
        tone="danger"
        confirmText="Oui, supprimer"
        cancelText="Annuler"
        onConfirm={confirmDelete}
        onClose={() => {
          if (!busyKey.startsWith('delete-')) setDeleteTarget(null);
        }}
        loading={busyKey.startsWith('delete-')}
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
  );
}







