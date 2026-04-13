import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHomeRouteByRole } from '../constants/roles';

const AUTH_TOKEN_KEY = 'linkedu_token';
const browserHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
const apiBaseUrl = import.meta.env.VITE_API_URL ?? `http://${browserHost}:8000`;

export default function LoginCard() {
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [isResetSent, setIsResetSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const navigate = useNavigate();
  const { setAuthenticatedUser } = useAuth();

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setIsLoggingIn(true);
    setFeedback('');
    setFeedbackType('');

    try {
      await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', {
        withCredentials: true,
        withXSRFToken: true,
      });

      const loginRes = await axios.post(
        apiBaseUrl + '/api/login',
        { email, password },
        {
          withCredentials: true,
          withXSRFToken: true,
          headers: { Accept: 'application/json' },
        }
      );

      const connectedUser = loginRes?.data?.user;
      const authToken = loginRes?.data?.token;

      if (!connectedUser) {
        throw new Error('Utilisateur introuvable dans la reponse.');
      }

      if (authToken) {
        try {
          localStorage.setItem(AUTH_TOKEN_KEY, authToken);
        } catch {
          // Ignore storage failures.
        }
      }

      setAuthenticatedUser(connectedUser);
      setFeedback(`Connecte en tant que ${connectedUser?.email ?? email}.`);
      setFeedbackType('success');

      const roleHome = getHomeRouteByRole(connectedUser?.role);
      setTimeout(() => navigate(roleHome, { replace: true }), 250);
    } catch (error) {
      const status = error?.response?.status;
      let message = 'Echec de connexion.';

      if (status === 422 || status === 401) {
        message = 'Email ou mot de passe incorrect.';
      } else if (status === 419) {
        message = 'Session expiree. Reessayez.';
      } else if (error?.response?.data?.message) {
        message = error.response.data.message;
      } else if (error?.message) {
        message = error.message;
      }

      setFeedback(message);
      setFeedbackType('error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleForgotSubmit = async (event) => {
    event.preventDefault();
    setIsSendingReset(true);
    setFeedback('');
    setFeedbackType('');

    try {
      await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', {
        withCredentials: true,
        withXSRFToken: true,
      });

      const response = await axios.post(
        apiBaseUrl + '/api/forgot-password',
        { email: forgotEmail },
        {
          withCredentials: true,
          withXSRFToken: true,
          headers: { Accept: 'application/json' },
        }
      );

      setFeedback(response?.data?.message || 'Requête envoyée avec succès.');
      setFeedbackType('success');
      setIsResetSent(true);
      setForgotEmail('');
    } catch (error) {
      const status = error?.response?.status;
      let message = 'Erreur lors de la demande.';

      if (status === 404) {
        message = 'Cet email n\'existe pas dans le système.';
      } else if (status === 422) {
        message = 'Email invalide.';
      } else if (status === 500) {
        message = 'Erreur serveur. Veuillez réessayer plus tard.';
      } else if (error?.response?.data?.message) {
        message = error.response.data.message;
      }

      setFeedback(message);
      setFeedbackType('error');
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <section className="auth-panel">
      <div className="auth-card">
        <p className="auth-logo">LinkedU</p>
        <h2 className="auth-heading">
          {isForgotMode ? 'Mot de passe oublie ?' : 'Se connecter'}
        </h2>
        <p className="auth-description">
          {isForgotMode
            ? 'Saisissez votre e-mail pour recevoir un lien de reinitialisation.'
            : "Saisissez vos informations afin d'acceder a la plateforme."}
        </p>

        {!isForgotMode && (
          <form className="auth-form" onSubmit={handleLoginSubmit}>
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              placeholder="nom@ecole.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setFeedback('');
                setFeedbackType('');
              }}
              required
            />

            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              placeholder="********"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setFeedback('');
                setFeedbackType('');
              }}
              required
            />

            <button
              type="button"
              className="link-small link-button"
              onClick={() => setIsForgotMode(true)}
            >
              Mot de passe oublie ?
            </button>

            <button type="submit" className="auth-button" disabled={isLoggingIn}>
              {isLoggingIn ? 'Connexion...' : 'Se connecter'}
            </button>

            {feedback && (
              <p className={`auth-feedback ${feedbackType === 'error' ? 'auth-feedback-error' : 'auth-feedback-success'}`}>
                {feedback}
              </p>
            )}
          </form>
        )}

        {isForgotMode && (
          <form className="auth-form" onSubmit={handleForgotSubmit}>
            <label htmlFor="forgot-email">E-mail</label>
            <input
              id="forgot-email"
              type="email"
              placeholder="nom@ecole.com"
              value={forgotEmail}
              onChange={(event) => {
                setForgotEmail(event.target.value);
                setFeedback('');
                setFeedbackType('');
              }}
              required
            />

            <button type="submit" className="auth-button" disabled={isSendingReset}>
              {isSendingReset ? 'Envoi en cours...' : 'Envoyer le lien'}
            </button>

            <button
              type="button"
              className="auth-button auth-button-secondary"
              onClick={() => {
                setIsForgotMode(false);
                setIsResetSent(false);
                setForgotEmail('');
                setFeedback('');
                setFeedbackType('');
              }}
            >
              Retour a la connexion
            </button>

            {isResetSent && (
              <p className="auth-feedback">
                Si cet e-mail existe, un lien de reinitialisation a ete envoye.
              </p>
            )}

            {feedback && (
              <p className={`auth-feedback ${feedbackType === 'error' ? 'auth-feedback-error' : 'auth-feedback-success'}`}>
                {feedback}
              </p>
            )}
          </form>
        )}

        <div className="auth-footer">
          <a href="#">Conditions d&apos;utilisation</a>
          <a href="#">Politique de confidentialite</a>
        </div>
      </div>
    </section>
  );
}