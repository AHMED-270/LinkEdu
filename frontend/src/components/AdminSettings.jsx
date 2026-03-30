import { useEffect, useState } from 'react';
import { Save, RotateCcw, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [settings, setSettings] = useState(defaultSettings);
  const [subproject, setSubproject] = useState(defaultSubproject);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSettings({ ...defaultSettings, ...parsed });
      }

      const subprojectRaw = localStorage.getItem(SUBPROJECT_STORAGE_KEY);
      if (subprojectRaw) {
        const parsedSubproject = JSON.parse(subprojectRaw);
        setSubproject({ ...defaultSubproject, ...parsedSubproject });
      }
    } catch (error) {
      console.error('Erreur lecture settings local:', error);
    }
  }, []);

  // Helper to show a temporary animated toast message
  const showToast = (message) => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(''), 4000);
  };

  const saveSettings = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      showToast('ParamÃ¨tres de configuration enregistrÃ©s.');
    } catch (error) {
      showToast("Impossible d'enregistrer les paramÃ¨tres.");
    }
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSettings));
    showToast('ParamÃ¨tres rÃ©initialisÃ©s par dÃ©faut.');
  };

  const saveSubproject = () => {
    try {
      localStorage.setItem(SUBPROJECT_STORAGE_KEY, JSON.stringify(subproject));
      window.dispatchEvent(new Event('linkedu-subproject-updated'));
      showToast('ParamÃ¨tres du sous-projet enregistrÃ©s.');
    } catch (error) {
      showToast('Impossible d\'enregistrer les paramÃ¨tres du sous-projet.');
    }
  };

  const resetSubproject = () => {
    setSubproject(defaultSubproject);
    localStorage.setItem(SUBPROJECT_STORAGE_KEY, JSON.stringify(defaultSubproject));
    window.dispatchEvent(new Event('linkedu-subproject-updated'));
    showToast('Sous-projet rÃ©initialisÃ© par dÃ©faut.');
  };

  // Custom Animated Toggle Switch Component
  const AnimatedToggle = ({ isOn, onToggle }) => (
    <motion.div
      onClick={onToggle}
      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
        isOn ? 'bg-blue-600' : 'bg-slate-300'
      }`}
      style={{ justifyContent: isOn ? 'flex-end' : 'flex-start' }}
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 700, damping: 30 }}
        className="bg-white w-4 h-4 rounded-full shadow-sm"
      />
    </motion.div>
  );

  // Animation variants for the layout
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', bounce: 0.3 } }
  };

  return (
    <div className="layout-content relative">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">ParamÃ¨tres</h1>
          <p className="text-slate-500 text-sm mt-1">RÃ©glages simples de la console administrateur et du sous-projet.</p>
        </div>
      </header>

      {/* Floating Status Toast */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-[80px] right-8 z-50 flex items-center gap-3 px-4 py-3 bg-white border border-green-100 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
          >
            <CheckCircle2 size={20} className="text-green-500" />
            <span className="text-sm font-semibold text-slate-700">{statusMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start"
      >
        {/* === CARD 1: CONFIGURATION === */}
        <motion.div variants={cardVariants} className="card p-8">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h2 className="text-xl font-bold text-slate-800">Configuration Globale</h2>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-semibold text-slate-700 block">Mode tableau compact</span>
                <span className="text-xs text-slate-500">RÃ©duit l'espacement dans les tableaux de donnÃ©es</span>
              </div>
              <AnimatedToggle
                isOn={settings.compactTable}
                onToggle={() => setSettings((prev) => ({ ...prev, compactTable: !prev.compactTable }))}
              />
            </div>

            <div className="flex justify-between items-center">
              <div>
                <span className="font-semibold text-slate-700 block">Notifications email</span>
                <span className="text-xs text-slate-500">Recevoir des alertes pour les actions importantes</span>
              </div>
              <AnimatedToggle
                isOn={settings.emailNotifications}
                onToggle={() => setSettings((prev) => ({ ...prev, emailNotifications: !prev.emailNotifications }))}
              />
            </div>

            <div className="form-group mt-2">
              <label className="form-label">DÃ©lai d'expiration de session</label>
              <select
                className="form-select"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings((prev) => ({ ...prev, sessionTimeout: e.target.value }))}
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 heure</option>
                <option value="120">2 heures</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-8 pt-6 border-t border-slate-100">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={resetSettings}
              className="btn btn-outline"
            >
              <RotateCcw size={16} />
              RÃ©initialiser
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={saveSettings}
              className="btn btn-primary ml-auto"
            >
              <Save size={16} />
              Enregistrer
            </motion.button>
          </div>
        </motion.div>

        {/* === CARD 2: SOUS-PROJET === */}
        <motion.div variants={cardVariants} className="card p-8">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h2 className="text-xl font-bold text-slate-800">Sous-projet</h2>
            <p className="text-sm text-slate-500 mt-1">
              Personnalisez les informations visibles dans votre interface.
            </p>
          </div>

          <div className="flex flex-col gap-5">
            <div className="form-group">
              <label className="form-label">Nom affichÃ©</label>
              <input
                type="text"
                className="form-input"
                value={subproject.displayName}
                onChange={(e) => setSubproject((prev) => ({ ...prev, displayName: e.target.value }))}
                placeholder="Ex: LinkedU Admin"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Slogan</label>
              <input
                type="text"
                className="form-input"
                value={subproject.tagline}
                onChange={(e) => setSubproject((prev) => ({ ...prev, tagline: e.target.value }))}
                placeholder="Ex: Gestion du sous-projet"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">AnnÃ©e scolaire</label>
                <input
                  type="text"
                  className="form-input"
                  value={subproject.schoolYear}
                  onChange={(e) => setSubproject((prev) => ({ ...prev, schoolYear: e.target.value }))}
                  placeholder="Ex: 2025-2026"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Responsable</label>
                <input
                  type="text"
                  className="form-input"
                  value={subproject.coordinator}
                  onChange={(e) => setSubproject((prev) => ({ ...prev, coordinator: e.target.value }))}
                  placeholder="Nom du responsable"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-8 pt-6 border-t border-slate-100">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={resetSubproject}
              className="btn btn-outline"
            >
              <RotateCcw size={16} />
              RÃ©initialiser
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={saveSubproject}
              className="btn btn-primary ml-auto"
            >
              <Save size={16} />
              Enregistrer
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
