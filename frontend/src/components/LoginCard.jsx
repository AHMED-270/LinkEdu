import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { getHomeRouteByRole } from '../constants/roles';
import logo from '../assets/images/linkedu-logo.png';

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

   const [forgotEmail, setForgotEmail] = useState('');
   const [isForgotLoading, setIsForgotLoading] = useState(false);
   const [forgotError, setForgotError] = useState('');

   const handleForgotSubmit = async (event) => {
     event.preventDefault();
     setIsForgotLoading(true);
     setForgotError('');
     setIsResetSent(false);

     try {
       await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', {
         withCredentials: true,
         withXSRFToken: true,
       });

       await axios.post(
         apiBaseUrl + '/api/forgot-password',
         { email: forgotEmail.trim().toLowerCase() },
         {
           withCredentials: true,
           withXSRFToken: true,
           headers: { Accept: 'application/json' },
         }
       );

       setIsResetSent(true);
     } catch (error) {
       setForgotError(error?.response?.data?.message || error?.response?.data?.email?.[0] || 'Erreur lors de l\'envoi du lien.');
     } finally {
       setIsForgotLoading(false);
     }
   };

   return (
     <section className="min-h-screen py-12 flex items-center justify-center bg-transparent relative overflow-hidden backdrop-saturate-150">
       <div className="glass-card w-full max-w-md p-8 md:p-10 mx-4 md:mx-0 shadow-glass rounded-3xl relative overflow-hidden backdrop-saturate-150">
         {/* Decorative internal glow */}
         <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-brand-teal/20 blur-3xl rounded-full pointer-events-none"></div>
         <div className="absolute bottom-[-50px] left-[-50px] w-40 h-40 bg-brand-navy/10 blur-3xl rounded-full pointer-events-none"></div>

         <div className="text-center mb-8 relative z-10 flex flex-col items-center">
           <img 
             src={logo} 
             alt="LinkEdu Logo" 
             className="h-20 w-auto mb-2 drop-shadow-sm transition-transform hover:scale-[1.02] duration-300"
           />
           <h2 className="text-slate-600 font-medium text-lg mt-4 tracking-wide">
             {isForgotMode ? 'Mot de passe oublié ?' : 'Connectez-vous à votre espace'}
           </h2>
           <p className="text-sm text-slate-400 mt-2">
             {isForgotMode
               ? "Saisissez l'adresse e-mail associée à votre compte pour recevoir un lien de réinitialisation."
               : "Saisissez vos informations afin d'accéder à la plateforme."}
           </p>
         </div>

         {!isForgotMode && (
           <form className="relative z-10 flex flex-col gap-4 animate-fade-in" onSubmit={handleLoginSubmit} autoComplete="off">
             <div className="flex flex-col gap-1.5">
               <label htmlFor="login-email" className="text-sm font-semibold text-slate-700 ml-1">E-mail</label>
               <input
                 id="login-email"
                 name="login-email"
                 className="glass-input"
                 type="email"
                 autoComplete="off"
                 placeholder="nom@ecole.com"
                 value={loginEmail}
                 onChange={(event) => {
                   setLoginEmail(event.target.value);
                   setLoginFeedback('');
                   setLoginFeedbackType('');
                 }}
                 required
               />
             </div>

             <div className="flex flex-col gap-1.5">
               <label htmlFor="login-password" className="text-sm font-semibold text-slate-700 ml-1">Mot de passe</label>
               <input
                 id="login-password"
                 name="login-password"
                 className="glass-input"
                 type="password"
                 autoComplete="new-password"
                 placeholder="********"
                 value={loginPassword}
                 onChange={(event) => {
                   setLoginPassword(event.target.value);
                   setLoginFeedback('');
                   setLoginFeedbackType('');
                 }}
                 required
               />
             </div>

             <div className="flex justify-end mt-[-8px]">
               <button
                 type="button"
                 className="text-xs font-semibold text-brand-teal hover:text-brand-navy hover:underline transition-all"
                 onClick={() => setIsForgotMode(true)}
               >
                 Mot de passe oublié ?
               </button>
             </div>

             <button type="submit" className="glass-button w-full mt-2 py-3" disabled={isLoggingIn}>
               {isLoggingIn ? 'Connexion en cours...' : 'Se connecter'}
             </button>

             {loginFeedback && (
               <p
                 className={`flex items-center justify-center gap-2 text-sm font-medium mt-2 p-3 rounded-xl backdrop-blur-md border ${loginFeedbackType === 'error' ? 'bg-red-50/50 border-red-100 text-red-600' : 'bg-emerald-50/50 border-emerald-100 text-emerald-600'}`}
               >
                 {loginFeedbackType === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                 {loginFeedback}
               </p>
             )}
           </form>
         )}

         {isForgotMode && (
           <form className="relative z-10 flex flex-col gap-4 animate-scale-up" onSubmit={handleForgotSubmit}>
             <div className="flex flex-col gap-1.5">
               <label htmlFor="forgot-email" className="text-sm font-semibold text-slate-700 ml-1">E-mail</label>
               <input
                 id="forgot-email"
                 className="glass-input"
                 type="email"
                 placeholder="nom@ecole.com"
                 value={forgotEmail}
                 onChange={(e) => setForgotEmail(e.target.value)}
                 required
               />
             </div>

             <button type="submit" className="glass-button w-full mt-2 py-3" disabled={isForgotLoading}>
               {isForgotLoading ? 'Envoi en cours...' : 'Réinitialiser le mot de passe'}
             </button>

             <button
               type="button"
               className="text-sm font-medium text-slate-500 hover:text-brand-navy mt-3 transition-colors flex items-center justify-center gap-1 group"
               onClick={() => {
                 setIsForgotMode(false);
                 setIsResetSent(false);
                 setForgotError('');
               }}
             >
               <span className="transform group-hover:-translate-x-1 transition-transform">&larr;</span> Retour à la page de connexion
             </button>

             {forgotError && (
               <p className="flex items-center justify-center gap-2 text-sm font-medium mt-2 p-3 rounded-xl bg-red-50/50 border border-red-100 text-red-600 backdrop-blur-md">
                 <AlertCircle size={16} />
                 {forgotError}
               </p>
             )}

             {isResetSent && (
               <p className="flex items-center justify-center gap-2 text-sm font-medium mt-2 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-emerald-600 backdrop-blur-md">
                 <CheckCircle2 size={16} />
                 Lien envoyé si l'e-mail existe.
               </p>
             )}
           </form>
         )}

         <div className="relative z-10 mt-8 pt-4 border-t border-slate-200/50 flex justify-center gap-6">
           <a href="#" className="text-xs font-medium text-slate-400 hover:text-brand-teal transition-colors">Conditions d'utilisation</a>
           <a href="#" className="text-xs font-medium text-slate-400 hover:text-brand-teal transition-colors">Politique de confidentialité</a>
         </div>
       </div>
     </section>
   );
 }


