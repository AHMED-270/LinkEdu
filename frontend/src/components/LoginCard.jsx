import { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

<<<<<<< HEAD
function LoginCard({ onLoginSuccess }) {
  const [isForgotMode, setIsForgotMode] = useState(false)
  const [isResetSent, setIsResetSent] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginRole, setLoginRole] = useState('directeur')
  const [loginFeedback, setLoginFeedback] = useState('')
  const [loginFeedbackType, setLoginFeedbackType] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
=======
const AUTH_TOKEN_KEY = 'linkedu_token';
const browserHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
const apiBaseUrl = import.meta.env.VITE_API_URL ?? `http://${browserHost}:8000`;
>>>>>>> 4389ff52fc7c5d9e3c2a0d8cf7f3e2af58278124

export default function LoginCard() {
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', msg: '' });
  
  const navigate = useNavigate();
  const { setAuthenticatedUser } = useAuth();

<<<<<<< HEAD
    const normalizedEmail = loginEmail.trim().toLowerCase()
    const normalizedPassword = loginPassword

    const host = window.location.hostname;
    const apiBaseUrl = import.meta.env.VITE_API_URL ?? `http://${host}:8000`

    try {
      await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', {
        withCredentials: true,
        withXSRFToken: true,
      })

      const endpoint = loginRole === 'directeur' ? '/api/directeur/login' : '/api/admin/login';
      const loginRes = await axios.post(
        `${apiBaseUrl}${endpoint}`,
        {
          email: normalizedEmail,
          password: normalizedPassword,
        },
        {
=======
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback({ type: '', msg: '' });

    try {
      const performLogin = async () => {
        await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', {
>>>>>>> 4389ff52fc7c5d9e3c2a0d8cf7f3e2af58278124
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
<<<<<<< HEAD
      )

      const userResponse = await axios.get(`${apiBaseUrl}/api/user`, {
        withCredentials: true,
        withXSRFToken: true,
        headers: {
          Accept: 'application/json',
        },
      })

      setLoginFeedback(`Connecte en tant que ${userResponse.data?.email ?? loginEmail}.`)
      setLoginFeedbackType('success')
      
      if (onLoginSuccess) {
        onLoginSuccess(loginRes.data.user);
      }
    } catch (error) {
        console.error("Login Error: ", error);
        const status = error?.response?.status
        let message = 'Echec de connexion.'

        if (!error?.response) {
          message = `Serveur indisponible. Details: ${error.message}`
      } else if (status === 422 || status === 401) {
        message = 'Email ou mot de passe incorrect.'
=======
      }

      const connectedUser = loginRes?.data?.user;
      const authToken = loginRes?.data?.token;

      if (authToken) {
        try {
          localStorage.setItem(AUTH_TOKEN_KEY, authToken);
        } catch {
          // Ignore storage failures.
        }
      }

      setAuthenticatedUser(connectedUser);
      setFeedback({ type: 'success', msg: 'Authentification reussie !' });

      const role = connectedUser?.role;
      const roleHome = role === 'admin' || role === 'directeur'
        ? '/admin'
        : role === 'professeur'
          ? '/dashboard'
          : role === 'etudiant'
            ? '/etudiant'
            : role === 'parent'
              ? '/parent'
              : '/login';

      setTimeout(() => navigate(roleHome, { replace: true }), 500);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 422 || status === 401) {
        setFeedback({ type: 'error', msg: 'Identifiants invalides.' });
>>>>>>> 4389ff52fc7c5d9e3c2a0d8cf7f3e2af58278124
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
<<<<<<< HEAD
    <section className="auth-panel">
      <div className="auth-card">
        <p className="auth-logo">LinkedU</p>
        <h2 className="auth-heading">
          {isForgotMode ? 'Mot de passe oublié ?' : 'Se connecter'}
        </h2>
        <p className="auth-description">
          {isForgotMode
            ? "Saisissez l'adresse e-mail associée à votre compte pour recevoir un lien de réinitialisation."
            : "Saisissez vos informations afin d'acceder a la plateforme."}     
        </p>

        {!isForgotMode && (
          <form className="auth-form" onSubmit={handleLoginSubmit}>
            <label htmlFor="role">Role</label>
            <select
              id="role"
              value={loginRole}
              onChange={(event) => {
                setLoginRole(event.target.value)
                setLoginFeedback('')
                setLoginFeedbackType('')
              }}
            >
              <option value="directeur">Directeur</option>
              <option value="admin">Admin</option>
            </select>

            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              placeholder="nom@ecole.com"
              value={loginEmail}
              onChange={(event) => {
                setLoginEmail(event.target.value)
                setLoginFeedback('')
                setLoginFeedbackType('')
              }}
              required
            />

            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              placeholder="********"
              value={loginPassword}
              onChange={(event) => {
                setLoginPassword(event.target.value)
                setLoginFeedback('')
                setLoginFeedbackType('')
              }}
              required
            />

            <button
              type="button"
              className="link-small link-button"
              onClick={() => setIsForgotMode(true)}
            >
              Mot de passe oublié ?
            </button>

            <button type="submit" className="auth-button" disabled={isLoggingIn}>
              {isLoggingIn ? 'Connexion...' : 'Se connecter'}
            </button>

            {loginFeedback && (
              <p
                className={'auth-feedback ' + (loginFeedbackType === 'error' ? 'auth-feedback-error' : 'auth-feedback-success')}
              >
                {loginFeedback}
              </p>
            )}
          </form>
        )}

        {isForgotMode && (
          <form className="auth-form" onSubmit={handleForgotSubmit}>
            <label htmlFor="forgot-email">E-mail</label>
            <input id="forgot-email" type="email" placeholder="nom@ecole.com" required />

            <button type="submit" className="auth-button">
              Réinitialiser le mot de passe &rarr;
            </button>

            <button
              type="button"
              className="back-link"
              onClick={() => {
                setIsForgotMode(false)
                setIsResetSent(false)
              }}
            >
              &larr; Retour à la page de connexion
            </button>

            {isResetSent && (
              <p className="auth-feedback">
                Si cet e-mail existe, un lien de réinitialisation a été envoyé.   
              </p>
            )}
          </form>
        )}

        <div className="auth-footer">
          <a href="#">Conditions d'utilisation</a>
          <a href="#">Politique de confidentialité</a>
=======
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
>>>>>>> 4389ff52fc7c5d9e3c2a0d8cf7f3e2af58278124
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

export default LoginCard;
