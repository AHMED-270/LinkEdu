import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, GraduationCap, FileText, Calendar, BookOpen, FolderOpen, Bell, LogOut } from 'lucide-react';
import './RolePortal.css';

const tabs = [
  { key: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { key: 'notes', label: 'Notes', icon: GraduationCap },
  { key: 'devoirs', label: 'Devoirs', icon: FileText },
  { key: 'emploi', label: 'Emploi du temps', icon: Calendar },
  { key: 'lecons', label: 'Lecons', icon: BookOpen },
  { key: 'ressources', label: 'Ressources', icon: FolderOpen },
  { key: 'annonces', label: 'Annonces', icon: Bell },
];

const browserHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
const apiBaseUrl = import.meta.env.VITE_API_URL ?? `http://${browserHost}:8000`;
const AUTH_TOKEN_KEY = 'linkedu_token';

const getStoredToken = () => {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
};

export default function StudentPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [dashboard, setDashboard] = useState(null);
  const [notes, setNotes] = useState([]);
  const [devoirs, setDevoirs] = useState([]);
  const [emploi, setEmploi] = useState([]);
  const [lecons, setLecons] = useState([]);
  const [ressources, setRessources] = useState([]);
  const [annonces, setAnnonces] = useState([]);

  const [selectedFiles, setSelectedFiles] = useState({});
  const [submitFeedback, setSubmitFeedback] = useState({});

  const studentName = useMemo(() => {
    const prenom = user?.prenom || '';
    const nom = user?.nom || '';
    return `${prenom} ${nom}`.trim() || user?.name || 'Etudiant';
  }, [user]);

  const fetchWithAuth = async (path, method = 'get', payload = null) => {
    const token = getStoredToken();
    const isGet = method.toLowerCase() === 'get';

    if (!isGet && !token) {
      await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', {
        withCredentials: true,
        withXSRFToken: true,
      });
    }

    return axios({
      method,
      url: apiBaseUrl + path,
      data: payload,
      withCredentials: true,
      withXSRFToken: true,
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        if (activeTab === 'dashboard') {
          const res = await fetchWithAuth('/api/etudiant/dashboard');
          setDashboard(res.data);
        }

        if (activeTab === 'notes') {
          const res = await fetchWithAuth('/api/etudiant/notes');
          setNotes(res.data.notes ?? []);
        }

        if (activeTab === 'devoirs') {
          const res = await fetchWithAuth('/api/etudiant/devoirs');
          setDevoirs(res.data.devoirs ?? []);
        }

        if (activeTab === 'emploi') {
          const res = await fetchWithAuth('/api/etudiant/emploi-du-temps');
          setEmploi(res.data.emploi_du_temps ?? []);
        }

        if (activeTab === 'lecons') {
          const res = await fetchWithAuth('/api/etudiant/lecons');
          setLecons(res.data.lecons ?? []);
        }

        if (activeTab === 'ressources') {
          const res = await fetchWithAuth('/api/etudiant/ressources');
          setRessources(res.data.ressources ?? []);
        }

        if (activeTab === 'annonces') {
          const res = await fetchWithAuth('/api/etudiant/annonces');
          setAnnonces(res.data.annonces ?? []);
        }
      } catch (err) {
        setError(err?.response?.data?.message || 'Chargement impossible pour le moment.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [activeTab]);

  const handleLogout = async () => {
    try {
      await fetchWithAuth('/api/admin/logout', 'post');
    } catch {
      // Continue local logout even if backend logout fails.
    } finally {
      logout();
      navigate('/login', { replace: true });
    }
  };

  const handleSubmitDevoir = async (devoirId) => {
    const file = selectedFiles[devoirId];

    if (!file) {
      setSubmitFeedback((prev) => ({ ...prev, [devoirId]: 'Veuillez choisir un fichier.' }));
      return;
    }

    const formData = new FormData();
    formData.append('fichier', file);
    const token = getStoredToken();

    try {
      if (!token) {
        await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', {
          withCredentials: true,
          withXSRFToken: true,
        });
      }

      await axios.post(apiBaseUrl + `/api/etudiant/devoirs/${devoirId}/soumettre`, formData, {
        withCredentials: true,
        withXSRFToken: true,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      setSubmitFeedback((prev) => ({ ...prev, [devoirId]: 'Soumission reussie.' }));
      const refresh = await fetchWithAuth('/api/etudiant/devoirs');
      setDevoirs(refresh.data.devoirs ?? []);
    } catch (err) {
      setSubmitFeedback((prev) => ({
        ...prev,
        [devoirId]: err?.response?.data?.message || 'Echec de soumission.',
      }));
    }
  };

  return (
    <div className="portal-shell">
      <header className="portal-header">
        <div>
          <p className="portal-kicker">LinkEdu - Espace Etudiant</p>
          <h1>Bienvenue {studentName}</h1>
        </div>
        <button className="portal-logout" onClick={handleLogout}>Se deconnecter</button>
      </header>

      <div className="portal-body">
        <aside className="portal-sidebar">
          <div className="portal-sidebar-brand">
            <h2>LinkEdu Etudiant</h2>
          </div>

          <div className="portal-profile-card">
            <strong>{studentName}</strong>
            <p>Espace etudiant</p>
          </div>

          <nav className="portal-sidebar-nav">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  className={activeTab === tab.key ? 'portal-side-link active' : 'portal-side-link'}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="portal-sidebar-footer">
            <button className="portal-sidebar-logout" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Se deconnecter</span>
            </button>
          </div>
        </aside>

        <main className="portal-content">
          {loading && <p className="portal-state">Chargement...</p>}
          {error && <p className="portal-state portal-error">{error}</p>}

          {!loading && !error && activeTab === 'dashboard' && dashboard && (
        <section className="portal-grid portal-grid-4">
          <article className="portal-card"><h3>Moyenne generale</h3><p>{dashboard.stats?.moyenne_generale ?? '-'}</p></article>
          <article className="portal-card"><h3>Absences</h3><p>{dashboard.stats?.nombre_absences ?? 0}</p></article>
          <article className="portal-card"><h3>Devoirs a venir</h3><p>{dashboard.stats?.devoirs_a_venir ?? 0}</p></article>
          <article className="portal-card"><h3>Annonces recentes</h3><p>{dashboard.stats?.annonces_recentes ?? 0}</p></article>
        </section>
      )}

      {!loading && !error && activeTab === 'notes' && (
        <section className="portal-list">
          {notes.map((note) => (
            <article key={note.id_note} className="portal-list-item">
              <h3>{note.matiere}</h3>
              <p>Note: {note.valeur} - Coef: {note.coefficient ?? 1}</p>
              <p>{note.appreciation || 'Aucune appreciation.'}</p>
            </article>
          ))}
          {notes.length === 0 && <p className="portal-state">Aucune note disponible.</p>}
        </section>
      )}

      {!loading && !error && activeTab === 'devoirs' && (
        <section className="portal-list">
          {devoirs.map((devoir) => (
            <article key={devoir.id_devoir} className="portal-list-item">
              <h3>{devoir.titre}</h3>
              <p>{devoir.description || 'Aucune description.'}</p>
              <p>Matiere: {devoir.matiere || '-'} | Date limite: {devoir.date_limite || '-'}</p>
              {devoir.soumission ? (
                <p className="portal-success">Devoir deja soumis ({devoir.soumission.statut}).</p>
              ) : (
                <div className="portal-upload-row">
                  <input
                    type="file"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setSelectedFiles((prev) => ({ ...prev, [devoir.id_devoir]: file }));
                    }}
                  />
                  <button className="portal-action" onClick={() => handleSubmitDevoir(devoir.id_devoir)}>
                    Soumettre
                  </button>
                </div>
              )}
              {submitFeedback[devoir.id_devoir] && <p className="portal-info">{submitFeedback[devoir.id_devoir]}</p>}
            </article>
          ))}
          {devoirs.length === 0 && <p className="portal-state">Aucun devoir disponible.</p>}
        </section>
      )}

      {!loading && !error && activeTab === 'emploi' && (
        <section className="portal-list">
          {emploi.map((item) => (
            <article key={item.id_edt} className="portal-list-item">
              <h3>{item.jour}</h3>
              <p>{item.heure_debut} - {item.heure_fin}</p>
              <p>{item.matiere} | {item.professeur || '-'}</p>
            </article>
          ))}
          {emploi.length === 0 && <p className="portal-state">Aucune seance planifiee.</p>}
        </section>
      )}

      {!loading && !error && activeTab === 'lecons' && (
        <section className="portal-list">
          {lecons.map((item) => (
            <article key={item.id_lecon} className="portal-list-item">
              <h3>{item.titre}</h3>
              <p>{item.description || 'Aucune description.'}</p>
              <p>Matiere: {item.matiere || '-'}</p>
            </article>
          ))}
          {lecons.length === 0 && <p className="portal-state">Aucune lecon disponible.</p>}
        </section>
      )}

      {!loading && !error && activeTab === 'ressources' && (
        <section className="portal-list">
          {ressources.map((item) => (
            <article key={item.id_ressource} className="portal-list-item">
              <h3>{item.fichier}</h3>
              <p>Type: {item.type_ressource || '-'}</p>
              <p>Date: {item.date || '-'}</p>
            </article>
          ))}
          {ressources.length === 0 && <p className="portal-state">Aucune ressource disponible.</p>}
        </section>
      )}

      {!loading && !error && activeTab === 'annonces' && (
        <section className="portal-list">
          {annonces.map((annonce) => (
            <article key={annonce.id_annonce} className="portal-list-item">
              <h3>{annonce.titre}</h3>
              <p>{annonce.contenu}</p>
              <p>Publiee le: {annonce.date_publication || '-'}</p>
            </article>
          ))}
          {annonces.length === 0 && <p className="portal-state">Aucune annonce disponible.</p>}
        </section>
      )}
        </main>
      </div>
    </div>
  );
}
