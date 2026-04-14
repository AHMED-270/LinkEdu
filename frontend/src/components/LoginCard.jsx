import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { getHomeRouteByRole } from '../constants/roles';

const AUTH_TOKEN_KEY = 'linkedu_token';
const browserHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://' + browserHost + ':8000';

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

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setIsLoggingIn(true);
    setLoginFeedback('');
    setLoginFeedbackType('');

    try {
      const performLogin = async () => {
        await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', {
          withCredentials: true,
          withXSRFToken: true,
        });

        return axios.post(
          apiBaseUrl + '/api/login',
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
      const authToken = loginRes?.data?.token ?? loginRes?.data?.access_token ?? null;

      if (!connectedUser) {
        throw new Error('Utilisateur introuvable dans la reponse.');
      }

      if (authToken) {
        try {
          localStorage.setItem(AUTH_TOKEN_KEY, authToken);
        } catch {
          // Ignore storage failures in restricted browser modes.
        }
      }

      setAuthenticatedUser(connectedUser);

      if (typeof onLoginSuccess === 'function') {
        onLoginSuccess(connectedUser);
      }

      setLoginFeedback('Authentification reussie.');
      setLoginFeedbackType('success');

      const roleHome = getHomeRouteByRole(connectedUser?.role);
      setTimeout(() => navigate(roleHome, { replace: true }), 400);
    } catch (error) {
      const status = error?.response?.status;
      const backendMessage = error?.response?.data?.message;
      const backendEmailError = error?.response?.data?.errors?.email?.[0];

      if (backendEmailError) {
        setLoginFeedback(backendEmailError);
        setLoginFeedbackType('error');
      } else if (status === 422 || status === 401) {
        setLoginFeedback(backendMessage || 'Email ou mot de passe incorrect.');
        setLoginFeedbackType('error');
      } else if (status === 403) {
        setLoginFeedback(backendMessage || 'Acces refuse.');
        setLoginFeedbackType('error');
      } else if (status === 419) {
        setLoginFeedback('Session expiree. Reessayez.');
        setLoginFeedbackType('error');
      } else {
        setLoginFeedback(backendMessage || 'Erreur de connexion.');
        setLoginFeedbackType('error');
      }
     } finally {
       setIsLoggingIn(false);
     }
   };

   const handleForgotSubmit = (event) => {
     event.preventDefault();
     setIsResetSent(true);
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
             ? "Saisissez l'adresse e-mail associee a votre compte pour recevoir un lien de reinitialisation."
             : "Saisissez vos informations afin d'acceder a la plateforme."}
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
               placeholder="********"
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
               Mot de passe oublie ?
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
               Reinitialiser le mot de passe &rarr;
             </button>

             <button
               type="button"
               className="back-link link-small"
               style={{ marginTop: '0.5rem' }}
               onClick={() => {
                 setIsForgotMode(false);
                 setIsResetSent(false);
               }}
             >
               &larr; Retour a la page de connexion
             </button>

             {isResetSent && (
               <p className="auth-feedback" style={{ fontSize: '0.85rem', color: '#2e7d32', marginTop: '0.5rem' }}>
                 Si cet e-mail existe, un lien de reinitialisation a ete envoye.
               </p>
             )}
           </form>
         )}

         <div className="auth-footer" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #eef2f7', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
           <a href="#" style={{ color: '#667085', fontSize: '0.75rem', textDecoration: 'none' }}>Conditions d'utilisation</a>
           <a href="#" style={{ color: '#667085', fontSize: '0.75rem', textDecoration: 'none' }}>Politique de confidentialite</a>
         </div>
       </div>
     </section>
   );
 }
