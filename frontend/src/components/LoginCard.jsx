import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { getHomeRouteByRole } from '../constants/roles';

const AUTH_TOKEN_KEY = 'linkedu_token';
const browserHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://" + browserHost + ":8000";

export default function LoginCard({ onLoginSuccess }) {
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [isResetSent, setIsResetSent] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginFeedback, setLoginFeedback] = useState('');
  const [loginFeedbackType, setLoginFeedbackType] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const navigate = useNavigate();
  const { setAuthenticatedUser } = useAuth();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginFeedback('');
    setLoginFeedbackType('');

    try {
      const performLogin = async () => {
        await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', {
          withCredentials: true,
          withXSRFToken: true,
        });

        // Use the new unified /api/login endpoint instead of forcing /api/directeur/login
        const endpoint = '/api/login';
        return axios.post(
          apiBaseUrl + endpoint,
          { email: loginEmail.trim().toLowerCase(), password: loginPassword },
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
          // Ignore storage failures
        }
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
        setLoginFeedback('E-mail ou mot de passe incorrect.');
        setLoginFeedbackType('error');
      } else if (status === 403) {
        // Just in case backend somehow returns 403
        setLoginFeedback(err?.response?.data?.message || 'Accès refusé.');
        setLoginFeedbackType('error');
      } else if (status === 419) {
        setLoginFeedback('Session expirée. Réessayez.');
        setLoginFeedbackType('error');
      } else {
        setLoginFeedback(err?.response?.data?.message || 'Erreur de connexion.');
        setLoginFeedbackType('error');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setIsResetSent(true);
  };

  return (
    <section className="auth-panel">
      <div className="auth-card">
        <p className="auth-logo">LinkedU</p>
        <h2 className="auth-heading">
          {isForgotMode ? 'Mot de passe oublié ?' : 'Se connecter'}
        </h2>
        <p className="auth-description">
          {isForgotMode
            ? "Saisissez l'adresse e-mail associée à votre compte pour recevoir un lien de réinitialisation."
            : "Saisissez vos informations afin d'accéder à la plateforme."}
        </p>

        {!isForgotMode && (
          <form className="auth-form" onSubmit={handleLoginSubmit}>

            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              placeholder="nom@ecole.com"
              value={loginEmail}
              onChange={(event) => {
                setLoginEmail(event.target.value);
                setLoginFeedback('');
                setLoginFeedbackType('');
              }}
              required
            />

            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={loginPassword}
              onChange={(event) => {
                setLoginPassword(event.target.value);
                setLoginFeedback('');
                setLoginFeedbackType('');
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
                style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', color: loginFeedbackType === 'error' ? '#d32f2f' : '#2e7d32' }}
              >
                {loginFeedbackType === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
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
              className="back-link link-small"
              style={{marginTop: "0.5rem"}}
              onClick={() => {
                setIsForgotMode(false);
                setIsResetSent(false);
              }}
            >
              &larr; Retour à la page de connexion
            </button>

            {isResetSent && (
              <p className="auth-feedback" style={{ fontSize: '0.85rem', color: '#2e7d32', marginTop: '0.5rem' }}>
                Si cet e-mail existe, un lien de réinitialisation a été envoyé.
              </p>
            )}
          </form>
        )}

        <div className="auth-footer" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #eef2f7', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <a href="#" style={{ color: '#667085', fontSize: '0.75rem', textDecoration: 'none' }}>Conditions d'utilisation</a>
          <a href="#" style={{ color: '#667085', fontSize: '0.75rem', textDecoration: 'none' }}>Politique de confidentialité</a>
        </div>
      </div>
    </section>
  );
}
