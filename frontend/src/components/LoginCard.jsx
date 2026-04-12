import { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AUTH_TOKEN_KEY = 'linkedu_token';
const browserHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
const apiBaseUrl = import.meta.env.VITE_API_URL ?? `http://${browserHost}:8000`;

export default function LoginCard() {
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', msg: '' });
  
  const navigate = useNavigate();
  const { setAuthenticatedUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback({ type: '', msg: '' });

    try {
      const performLogin = async () => {
        await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', {
          withCredentials: true,
          withXSRFToken: true,
        });

        return axios.post(
          apiBaseUrl + '/api/admin/login',
          { email, password: pass },
          {
            withCredentials: true,
            withXSRFToken: true,
            headers: { Accept: 'application/json' },
          }
        );
      };

      let loginRes;
      try {
        loginRes = await performLogin();
      } catch (firstError) {
        if (firstError?.response?.status === 419) {
          loginRes = await performLogin();
        } else {
          throw firstError;
        }
      }

      const connectedUser = loginRes?.data?.user;
      const authToken = loginRes?.data?.token;

      if (authToken) {
        try {
          localStorage.setItem(AUTH_TOKEN_KEY, authToken);
        } catch {
          // Ignore storage failures.
        }
=========
      const role = connectedUser?.role
      const roleHome = role === 'admin' || role === 'directeur'
        ? '/admin'
        : role === 'professeur'
          ? '/dashboard'
          : role === 'secretaire'
            ? '/secretaire/dashboard'
          : '/login'

      navigate(roleHome, { replace: true })
    } catch (error) {
      const status = error?.response?.status
      let message = 'Echec de connexion.'
      const backendMessage = error?.response?.data?.message
      const backendEmailError = error?.response?.data?.errors?.email?.[0]

      if (backendEmailError) {
        message = backendEmailError
      } else if (backendMessage && backendMessage !== 'The given data was invalid.') {
        message = backendMessage
      } else if (status === 422 || status === 401) {
        message = 'Email ou mot de passe incorrect.'
      } else if (status === 419) {
        message = 'Session expiree. Reessayez.'
      } else if (error?.message) {
        message = error.message
>>>>>>>>> Temporary merge branch 2
      }

      if (setAuthenticatedUser) {
        setAuthenticatedUser(connectedUser);
      }
      
      if (onLoginSuccess && typeof onLoginSuccess === 'function') {
        onLoginSuccess(connectedUser);
      }

      setLoginFeedback('Authentification réussie !');
      setLoginFeedbackType('success');

      const roleHome = getHomeRouteByRole(connectedUser?.role);

      setTimeout(() => navigate(roleHome, { replace: true }), 500);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 422 || status === 401) {
        setFeedback({ type: 'error', msg: 'Identifiants invalides.' });
      } else if (status === 419) {
        setFeedback({ type: 'error', msg: 'Session expiree. Reessayez.' });
      } else {
        setFeedback({ type: 'error', msg: err?.response?.data?.message || 'Erreur de connexion.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-card-zone">
      <motion.div 
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="login-glass-card"
      >
        <div className="auth-header">
          <h2>Bon retour !</h2>
          <p>Entrez vos accès pour continuer votre apprentissage.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-field-group">
            <label>Identifiant Académique</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input 
                type="email" 
                placeholder="nom@ecole.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
          </div>

          <div className="input-field-group">
            <div className="flex-between">
              <label>Mot de passe</label>
              <button type="button" className="link-text">Oublié ?</button>
            </div>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input 
                type={showPass ? "text" : "password"} 
                placeholder="••••••••" 
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                required 
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="pass-toggle">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            disabled={loading}
            className="submit-button-academic"
          >
            {loading ? <div className="loader-dots" /> : <><LogIn size={20} /> Se connecter</>}
          </motion.button>

          <AnimatePresence>
            {feedback.msg && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`feedback-msg ${feedback.type}`}
              >
                {feedback.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                {feedback.msg}
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        <div className="card-footer">
          <a href="#">Assistance technique</a>
          <span className="dot" />
          <a href="#">Règlement intérieur</a>
        </div>
      </motion.div>
    </section>
  );
}
