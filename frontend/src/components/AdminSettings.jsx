import { useState } from 'react';
import { FiSave as Save, FiRotateCcw as RotateCcw } from 'react-icons/fi';
import { BiSolidUserDetail } from 'react-icons/bi';

const STORAGE_KEY = 'linkedu_admin_settings';
const SUBPROJECT_STORAGE_KEY = 'linkedu_subproject_settings';

const defaultSettings = {
  compactTable: false,
  emailNotifications: true,
  sessionTimeout: '30',
};

const defaultSubproject = {
  displayName: 'LinkedU Admin',
  tagline: 'Gestion du sous-projet',
  schoolYear: '2025-2026',
  coordinator: '',
};

export default function AdminSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultSettings;

      const parsed = JSON.parse(raw);
      return { ...defaultSettings, ...parsed };
    } catch (error) {
      console.error('Erreur lecture settings local:', error);
      return defaultSettings;
    }
  });
  const [subproject, setSubproject] = useState(() => {
    try {
      const raw = localStorage.getItem(SUBPROJECT_STORAGE_KEY);
      if (!raw) return defaultSubproject;

      const parsed = JSON.parse(raw);
      return { ...defaultSubproject, ...parsed };
    } catch (error) {
      console.error('Erreur lecture sous-projet local:', error);
      return defaultSubproject;
    }
  });
  const [statusMessage, setStatusMessage] = useState('');

  const saveSettings = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setStatusMessage('Parametres enregistres avec succes.');
    } catch {
      setStatusMessage("Impossible d'enregistrer les parametres.");
    }
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSettings));
    setStatusMessage('Parametres reinitialises.');
  };

  const saveSubproject = () => {
    try {
      localStorage.setItem(SUBPROJECT_STORAGE_KEY, JSON.stringify(subproject));
      window.dispatchEvent(new Event('linkedu-subproject-updated'));
      setStatusMessage('Parametres du sous-projet enregistres.');
    } catch {
      setStatusMessage('Impossible d enregistrer les parametres du sous-projet.');
    }
  };

  const resetSubproject = () => {
    setSubproject(defaultSubproject);
    localStorage.setItem(SUBPROJECT_STORAGE_KEY, JSON.stringify(defaultSubproject));
    window.dispatchEvent(new Event('linkedu-subproject-updated'));
    setStatusMessage('Parametres du sous-projet reinitialises.');
  };

  return (
    <div className="dashboard-content">
      <header className="content-header">
        <h1 className="mt-1 flex items-center gap-2 text-4xl lg:text-5xl font-extrabold italic tracking-tight text-slate-900">
          <BiSolidUserDetail className="text-blue-600" />
          Parametres
        </h1>
        <p>Reglages simples de la console administrateur.</p>
      </header>

      <div className="card-panel" style={{ maxWidth: '700px' }}>
        <h2 style={{ marginTop: 0 }}>Configuration</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Mode tableau compact</span>
            <input
              type="checkbox"
              checked={settings.compactTable}
              onChange={(e) => setSettings((prev) => ({ ...prev, compactTable: e.target.checked }))}
            />
          </label>

          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Notifications email admin</span>
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(e) => setSettings((prev) => ({ ...prev, emailNotifications: e.target.checked }))}
            />
          </label>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
              Delai d'expiration de session
            </label>
            <select
              value={settings.sessionTimeout}
              onChange={(e) => setSettings((prev) => ({ ...prev, sessionTimeout: e.target.value }))}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">60 minutes</option>
              <option value="120">2 heures</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '18px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={saveSettings}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: '#0f62fe', color: '#fff', fontWeight: '500' }}
          >
            <Save size={16} />
            Enregistrer
          </button>
          <button
            type="button"
            onClick={resetSettings}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer', background: '#fff', color: '#334155', fontWeight: '500' }}
          >
            <RotateCcw size={16} />
            Reinitialiser
          </button>
        </div>

        {statusMessage && (
          <p style={{ marginTop: '12px', color: '#166534', fontSize: '0.9rem' }}>{statusMessage}</p>
        )}
      </div>

      <div className="card-panel" style={{ maxWidth: '700px', marginTop: '16px' }}>
        <h2 style={{ marginTop: 0 }}>Sous-projet</h2>
        <p style={{ marginTop: 0, color: '#64748b' }}>
          Personnalisez les informations visibles du sous-projet dans votre interface admin.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Nom affiche du sous-projet</label>
            <input
              type="text"
              value={subproject.displayName}
              onChange={(e) => setSubproject((prev) => ({ ...prev, displayName: e.target.value }))}
              placeholder="Ex: LinkedU Admin"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Slogan</label>
            <input
              type="text"
              value={subproject.tagline}
              onChange={(e) => setSubproject((prev) => ({ ...prev, tagline: e.target.value }))}
              placeholder="Ex: Gestion du sous-projet"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Annee scolaire</label>
              <input
                type="text"
                value={subproject.schoolYear}
                onChange={(e) => setSubproject((prev) => ({ ...prev, schoolYear: e.target.value }))}
                placeholder="Ex: 2025-2026"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ flex: 1, minWidth: '220px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Responsable</label>
              <input
                type="text"
                value={subproject.coordinator}
                onChange={(e) => setSubproject((prev) => ({ ...prev, coordinator: e.target.value }))}
                placeholder="Nom du responsable"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '18px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={saveSubproject}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: '#0f62fe', color: '#fff', fontWeight: '500' }}
          >
            <Save size={16} />
            Enregistrer sous-projet
          </button>
          <button
            type="button"
            onClick={resetSubproject}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer', background: '#fff', color: '#334155', fontWeight: '500' }}
          >
            <RotateCcw size={16} />
            Reinitialiser sous-projet
          </button>
        </div>
      </div>
    </div>
  );
}
