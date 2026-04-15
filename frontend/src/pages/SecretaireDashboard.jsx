import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Users,
  GraduationCap,
  CalendarX2,
  MessageSquare,
  BarChart3,
  AlertCircle,
  CreditCard,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import './SecretaireDashboard.css';

const AUTH_TOKEN_KEY = 'linkedu_token';

const getAuthHeaders = () => {
  let token = null;
  try {
    token = localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    token = null;
  }

  return {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const BAR_COLORS = [
  '#667eea', '#764ba2', '#11998e', '#38ef7d',
  '#f093fb', '#f5576c', '#fa709a', '#fee140',
  '#4facfe', '#00f2fe', '#43e97b', '#f9d423',
];

const NIVEAU_MAP = {
  ms: 'Petite Section',
  mm: 'Moyenne Section',
  gs: 'Grande Section',
  '1ap': '1ere Primaire',
  '2ap': '2eme Primaire',
  '3ap': '3eme Primaire',
  '4ap': '4eme Primaire',
  '5ap': '5eme Primaire',
  '6ap': '6eme Primaire',
  '1ac': '1ere College',
  '2ac': '2eme College',
  '3ac': '3eme College',
  tc: 'Tronc Commun',
  '1bac': '1ere Bac',
  '2bac': '2eme Bac',
};

function AbsTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="sd-tooltip">
      <p className="sd-tooltip-label">{label}</p>
      <p className="sd-tooltip-value">
        <span className="sd-tooltip-dot" />
        Moyenne : <strong>{payload[0].value}</strong> abs / jour
      </p>
      <p className="sd-tooltip-total">
        Total : {payload[0].payload.total} absences
      </p>
    </div>
  );
}

function NiveauTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="sd-tooltip">
      <p className="sd-tooltip-label">{NIVEAU_MAP[payload[0].payload.niveau] || payload[0].payload.niveau}</p>
      <p className="sd-tooltip-value">
        <span className="sd-tooltip-dot" style={{ background: payload[0].payload.fill }} />
        <strong>{payload[0].value}</strong> etudiants
      </p>
    </div>
  );
}

function PaiementTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="sd-tooltip">
      <p className="sd-tooltip-label">{label}</p>
      <p className="sd-tooltip-value">
        <span className="sd-tooltip-dot" style={{ background: payload[0].fill || '#16a34a' }} />
        Total : <strong>{payload[0].value}</strong> eleves
      </p>
    </div>
  );
}

export default function SecretaireDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = String(user?.role || '').toLowerCase();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [mode, setMode] = useState(role === 'comptable' ? 'comptable' : 'secretaire');
  const [stats, setStats] = useState({
    etudiants: 0,
    classes: 0,
    absences_aujourdhui: 0,
    reclamations_envoyees: 0,
    etudiants_total: 0,
    etudiants_payes: 0,
    etudiants_non_payes: 0,
  });
  const [absencesParMois, setAbsencesParMois] = useState([]);
  const [etudiantsParNiveau, setEtudiantsParNiveau] = useState([]);
  const [paiementsParStatut, setPaiementsParStatut] = useState([]);
  const [recentReclamations, setRecentReclamations] = useState([]);
  const [recentDemandes, setRecentDemandes] = useState([]);

  const isComptableMode = mode === 'comptable';

  useEffect(() => {
    const fetchStats = async () => {
      const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';
      setLoading(true);
      setLoadError('');

      try {
        const dashboardPromise = axios.get(apiBaseUrl + '/api/secretaire/dashboard', {
          withCredentials: true,
          withXSRFToken: true,
          headers: getAuthHeaders(),
        });

        const reclamationsPromise = role === 'comptable'
          ? Promise.resolve(null)
          : axios.get(apiBaseUrl + '/api/secretaire/reclamations', {
            withCredentials: true,
            withXSRFToken: true,
            headers: getAuthHeaders(),
          });

        const demandesPromise = role === 'comptable'
          ? Promise.resolve(null)
          : axios.get(apiBaseUrl + '/api/secretaire/demandes', {
            withCredentials: true,
            withXSRFToken: true,
            headers: getAuthHeaders(),
          });

        const [dashboardResult, reclamationsResult, demandesResult] = await Promise.allSettled([
          dashboardPromise,
          reclamationsPromise,
          demandesPromise,
        ]);

        if (dashboardResult.status === 'fulfilled') {
          const dashboardData = dashboardResult.value?.data ?? {};
          const nextMode = String(dashboardData?.mode || (role === 'comptable' ? 'comptable' : 'secretaire')).toLowerCase();
          const resolvedMode = nextMode === 'comptable' ? 'comptable' : 'secretaire';
          setMode(resolvedMode);

          if (resolvedMode === 'comptable') {
            setStats({
              etudiants: 0,
              classes: Number(dashboardData?.stats?.classes ?? 0),
              absences_aujourdhui: 0,
              reclamations_envoyees: 0,
              academic_year: dashboardData?.academic_year || dashboardData?.stats?.academic_year || null,
              etudiants_total: Number(dashboardData?.stats?.etudiants_total ?? 0),
              etudiants_payes: Number(dashboardData?.stats?.etudiants_payes ?? 0),
              etudiants_non_payes: Number(dashboardData?.stats?.etudiants_non_payes ?? 0),
            });

            setPaiementsParStatut(Array.isArray(dashboardData?.paiements_par_statut)
              ? dashboardData.paiements_par_statut.map((item) => ({
                statut: item?.statut || '-',
                total: Number(item?.total ?? 0),
              }))
              : []);

            setAbsencesParMois([]);
            setEtudiantsParNiveau([]);
          } else {
            setStats({
              etudiants: Number(dashboardData?.stats?.etudiants ?? 0),
              classes: Number(dashboardData?.stats?.classes ?? 0),
              absences_aujourdhui: Number(dashboardData?.stats?.absences_aujourdhui ?? 0),
              reclamations_envoyees: Number(dashboardData?.stats?.reclamations_envoyees ?? 0),
              academic_year: dashboardData?.academic_year || dashboardData?.stats?.academic_year || null,
              etudiants_total: 0,
              etudiants_payes: 0,
              etudiants_non_payes: 0,
            });

            setAbsencesParMois(Array.isArray(dashboardData?.absences_par_mois)
              ? dashboardData.absences_par_mois
              : []);

            setEtudiantsParNiveau(Array.isArray(dashboardData?.etudiants_par_niveau)
              ? dashboardData.etudiants_par_niveau.map((item) => ({
                niveau: item?.niveau,
                total: Number(item?.total ?? 0),
              }))
              : []);

            setPaiementsParStatut([]);
          }
        } else {
          setMode(role === 'comptable' ? 'comptable' : 'secretaire');
          setStats({
            etudiants: 0,
            classes: 0,
            absences_aujourdhui: 0,
            reclamations_envoyees: 0,
            etudiants_total: 0,
            etudiants_payes: 0,
            etudiants_non_payes: 0,
          });
          setAbsencesParMois([]);
          setEtudiantsParNiveau([]);
          setPaiementsParStatut([]);
          setLoadError('Impossible de charger les donnees du tableau de bord.');
        }

        if (role !== 'comptable' && reclamationsResult.status === 'fulfilled') {
          const rawData = reclamationsResult.value?.data;
          const items = Array.isArray(rawData)
            ? rawData
            : (rawData?.reclamations || []);
          setRecentReclamations(items.slice(0, 5));
        } else {
          setRecentReclamations([]);
        }

        if (role !== 'comptable' && demandesResult.status === 'fulfilled') {
          const rawDemandes = demandesResult.value?.data;
          const items = Array.isArray(rawDemandes)
            ? rawDemandes
            : (rawDemandes?.demandes || []);
          setRecentDemandes(items.slice(0, 5));
        } else {
          setRecentDemandes([]);
        }
      } catch {
        setMode(role === 'comptable' ? 'comptable' : 'secretaire');
        setStats({
          etudiants: 0,
          classes: 0,
          absences_aujourdhui: 0,
          reclamations_envoyees: 0,
          etudiants_total: 0,
          etudiants_payes: 0,
          etudiants_non_payes: 0,
        });
        setAbsencesParMois([]);
        setEtudiantsParNiveau([]);
        setPaiementsParStatut([]);
        setRecentReclamations([]);
        setRecentDemandes([]);
        setLoadError('Impossible de charger les donnees du tableau de bord.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [role]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon apres-midi' : 'Bonsoir';

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const secrStatCards = [
    {
      id: 'total-etudiants',
      label: 'Total Etudiants',
      value: stats.etudiants,
      icon: <Users size={24} />,
      color: 'blue',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      id: 'total-classes',
      label: 'Total Classes',
      value: stats.classes,
      icon: <GraduationCap size={24} />,
      color: 'emerald',
      gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    },
    {
      id: 'absences-today',
      label: "Absences Aujourd'hui",
      value: stats.absences_aujourdhui,
      icon: <CalendarX2 size={24} />,
      color: 'amber',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
      id: 'reclamations-sent',
      label: 'Reclamations Envoyees',
      value: stats.reclamations_envoyees,
      icon: <MessageSquare size={24} />,
      color: 'rose',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    },
  ];

  const comptableStatCards = [
    {
      id: 'total-etudiants-ecole',
      label: 'Total Etudiants Ecole',
      value: stats.etudiants_total,
      icon: <Users size={24} />,
      color: 'blue',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      id: 'total-classes-comptable',
      label: 'Total Classes',
      value: stats.classes,
      icon: <GraduationCap size={24} />,
      color: 'emerald',
      gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    },
    {
      id: 'etudiants-payes',
      label: 'Etudiants Payes',
      value: stats.etudiants_payes,
      icon: <CreditCard size={24} />,
      color: 'amber',
      gradient: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
    },
    {
      id: 'etudiants-non-payes',
      label: 'Etudiants Non Payes',
      value: stats.etudiants_non_payes,
      icon: <AlertCircle size={24} />,
      color: 'rose',
      gradient: 'linear-gradient(135deg, #f97316 0%, #fb7185 100%)',
    },
  ];

  const statCards = isComptableMode ? comptableStatCards : secrStatCards;

  const lastTwoAbsences = useMemo(() => absencesParMois.slice(-2), [absencesParMois]);
  const trendValue = useMemo(() => {
    if (lastTwoAbsences.length !== 2) return 0;
    return Number(lastTwoAbsences[1]?.moyenne ?? 0) - Number(lastTwoAbsences[0]?.moyenne ?? 0);
  }, [lastTwoAbsences]);

  const formatShortDate = (value) => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleDateString('fr-FR');
  };

  return (
    <div className="sd-dashboard">
      <div className="sd-header animate-fade-in">
        <div className="sd-header-text">
          <h1>
            {greeting},{' '}
            <span className="sd-header-name">
              {user?.prenom || user?.name || (isComptableMode ? 'Comptable' : 'Secretaire')}
            </span>
          </h1>
          <p className="sd-header-date">{today}</p>
        </div>
        <div className="flex items-center gap-3">
          {stats?.academic_year && (
            <div className="bg-blue-600 text-white px-3 py-1.5 rounded-lg shadow-sm flex flex-col items-center mr-2">
                <span className="text-[9px] uppercase font-bold opacity-80 leading-none mb-0.5">Scolaire</span>
                <span className="text-sm font-black leading-none">{stats.academic_year}</span>
            </div>
          )}
          <div className="sd-header-badge">
            <BarChart3 size={20} />
            <span>{isComptableMode ? 'Tableau de bord Comptable' : 'Tableau de bord'}</span>
          </div>
        </div>
      </div>

      {loadError && (
        <div className="card" style={{ marginBottom: '1rem', border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c' }}>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} /> {loadError}
          </div>
        </div>
      )}

      <div className="sd-stats-grid animate-fade-in" style={{ animationDelay: '0.1s' }}>
        {statCards.map((card, index) => (
          <div
            className={`sd-stat-card sd-stat-${card.color}`}
            key={card.id}
            id={card.id}
            style={{ animationDelay: `${0.1 + index * 0.07}s` }}
          >
            <div className="sd-stat-icon" style={{ background: card.gradient }}>
              {card.icon}
            </div>
            <div className="sd-stat-content">
              <span className="sd-stat-value">{loading ? '...' : card.value}</span>
              <span className="sd-stat-label">{card.label}</span>
            </div>
          </div>
        ))}
      </div>

      {isComptableMode ? (
        <div className="sd-charts-row animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="sd-chart-card sd-chart-wide" style={{ width: '100%' }}>
            <div className="sd-chart-header">
              <div>
                <h3 className="sd-chart-title">Paiements eleves (statut)</h3>
                <p className="sd-chart-subtitle">Repartition des eleves payes et non payes</p>
              </div>
            </div>
            <div className="sd-chart-body">
              {loading ? (
                <div className="sd-chart-skeleton" aria-hidden="true">
                  <span className="sd-chart-skeleton-bar" style={{ height: '60%' }} />
                  <span className="sd-chart-skeleton-bar" style={{ height: '35%' }} />
                </div>
              ) : paiementsParStatut.length === 0 ? (
                <div className="sd-chart-empty">
                  <BarChart3 size={28} />
                  <p>Aucune donnee de paiement.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={paiementsParStatut} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                    <XAxis dataKey="statut" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip content={<PaiementTooltip />} cursor={{ fill: 'rgba(102,126,234,0.07)' }} />
                    <Bar dataKey="total" radius={[8, 8, 0, 0]} maxBarSize={80}>
                      {paiementsParStatut.map((entry, idx) => (
                        <Cell key={`${entry.statut}-${idx}`} fill={idx === 0 ? '#16a34a' : '#f97316'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="sd-charts-row animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="sd-chart-card sd-chart-wide">
              <div className="sd-chart-header">
                <div>
                  <h3 className="sd-chart-title">Evolution des absences (12 derniers mois)</h3>
                  <p className="sd-chart-subtitle">Moyenne quotidienne des absences</p>
                </div>
                <div className={`sd-trend-badge ${trendValue > 0 ? 'sd-trend-up' : 'sd-trend-down'}`}>
                  {trendValue > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  <span>
                    {trendValue === 0
                      ? 'Stable'
                      : `${trendValue > 0 ? '+' : ''}${trendValue.toFixed(1)} vs mois precedent`}
                  </span>
                </div>
              </div>
              <div className="sd-chart-body">
                {loading ? (
                  <div className="sd-chart-skeleton" aria-hidden="true">
                    <span className="sd-chart-skeleton-bar" style={{ height: '30%' }} />
                    <span className="sd-chart-skeleton-bar" style={{ height: '45%' }} />
                    <span className="sd-chart-skeleton-bar" style={{ height: '34%' }} />
                    <span className="sd-chart-skeleton-bar" style={{ height: '58%' }} />
                    <span className="sd-chart-skeleton-bar" style={{ height: '52%' }} />
                    <span className="sd-chart-skeleton-bar" style={{ height: '66%' }} />
                  </div>
                ) : absencesParMois.length === 0 ? (
                  <div className="sd-chart-empty">
                    <BarChart3 size={28} />
                    <p>Aucune donnee d absences.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={absencesParMois} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                      <defs>
                        <linearGradient id="absenceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#667eea" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#667eea" stopOpacity={0.03} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                      <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip content={<AbsTooltip />} cursor={{ stroke: '#667eea', strokeWidth: 1 }} />
                      <Area
                        type="monotone"
                        dataKey="moyenne"
                        stroke="#667eea"
                        fill="url(#absenceGradient)"
                        strokeWidth={3}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="sd-chart-card sd-chart-narrow">
              <div className="sd-chart-header">
                <div>
                  <h3 className="sd-chart-title">Repartition des eleves par niveau</h3>
                  <p className="sd-chart-subtitle">Volume eleves pour chaque niveau</p>
                </div>
              </div>
              <div className="sd-chart-body">
                {loading ? (
                  <div className="sd-chart-skeleton-horiz" aria-hidden="true">
                    <span className="sd-chart-skeleton-bar-h" style={{ width: '70%' }} />
                    <span className="sd-chart-skeleton-bar-h" style={{ width: '55%' }} />
                    <span className="sd-chart-skeleton-bar-h" style={{ width: '85%' }} />
                    <span className="sd-chart-skeleton-bar-h" style={{ width: '48%' }} />
                    <span className="sd-chart-skeleton-bar-h" style={{ width: '62%' }} />
                  </div>
                ) : etudiantsParNiveau.length === 0 ? (
                  <div className="sd-chart-empty">
                    <BarChart3 size={28} />
                    <p>Aucune donnee de niveau.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={etudiantsParNiveau} layout="vertical" margin={{ top: 10, right: 10, left: 15, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="niveau"
                        width={112}
                        tick={{ fontSize: 11 }}
                        tickFormatter={(value) => NIVEAU_MAP[value] || value}
                      />
                      <Tooltip content={<NiveauTooltip />} cursor={{ fill: 'rgba(102,126,234,0.07)' }} />
                      <Bar dataKey="total" radius={[0, 8, 8, 0]}>
                        {etudiantsParNiveau.map((entry, idx) => (
                          <Cell key={`${entry.niveau}-${idx}`} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <div className="sd-tables-row animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="card sd-table-card">
              <div className="card-header">
                <h3>Reclamations recentes</h3>
                <button
                  type="button"
                  className="sd-table-link"
                  onClick={() => navigate('/secretaire/reclamations')}
                >
                  Voir tous
                </button>
              </div>
              <div className="card-body" style={{ paddingTop: 0 }}>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Sujet</th>
                        <th>Cible</th>
                        <th>Statut</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', padding: '1rem 0', color: '#64748b' }}>
                            Chargement...
                          </td>
                        </tr>
                      ) : recentReclamations.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', padding: '1rem 0', color: '#64748b' }}>
                            Aucune reclamation recente.
                          </td>
                        </tr>
                      ) : (
                        recentReclamations.map((rec) => (
                          <tr key={rec.id_reclamation}>
                            <td><strong>{rec.sujet || 'Sans sujet'}</strong></td>
                            <td>{rec.cible_label || '-'}</td>
                            <td>{rec.statut || '-'}</td>
                            <td>{formatShortDate(rec.date_reclamation)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="card sd-table-card">
              <div className="card-header">
                <h3>Demandes des parents</h3>
                <button
                  type="button"
                  className="sd-table-link"
                  onClick={() => navigate('/secretaire/demandes')}
                >
                  Voir tous
                </button>
              </div>
              <div className="card-body" style={{ paddingTop: 0 }}>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Parent</th>
                        <th>Type</th>
                        <th>Statut</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', padding: '1rem 0', color: '#64748b' }}>
                            Chargement...
                          </td>
                        </tr>
                      ) : recentDemandes.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', padding: '1rem 0', color: '#64748b' }}>
                            Aucune demande recente.
                          </td>
                        </tr>
                      ) : (
                        recentDemandes.map((demande) => {
                          const parentName = `${demande.parent_nom || ''} ${demande.parent_prenom || ''}`.trim();
                          return (
                            <tr key={demande.id_demande}>
                              <td><strong>{parentName || demande.parent_email || '-'}</strong></td>
                              <td>{demande.type_demande || '-'}</td>
                              <td>{demande.statut || '-'}</td>
                              <td>{formatShortDate(demande.date_demande)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
