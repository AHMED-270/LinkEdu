import { useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import AuthHero from '../components/AuthHero';
import './Auth.css';

const browserHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://' + browserHost + ':8000';

export default function PasswordReset() {
  const { token: tokenFromPath } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const token = tokenFromPath || searchParams.get('token');
  const emailParam = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback('');

    if (password !== passwordConfirmation) {
      setFeedback('Les mots de passe ne correspondent pas.');
      setFeedbackType('error');
      setIsLoading(false);
      return;
    }

    try {
      await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', {
        withCredentials: true,
        withXSRFToken: true,
      });

      await axios.post(
        apiBaseUrl + '/api/reset-password',
        {
          token: token,
          email: emailParam,
          password: password,
          password_confirmation: passwordConfirmation,
        },
        {
          withCredentials: true,
          withXSRFToken: true,
          headers: { Accept: 'application/json' },
        }
      );

      setFeedback('Mot de passe réinitialisé avec succès ! Redirection...');
      setFeedbackType('success');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      setFeedback(error?.response?.data?.message || 'Erreur lors de la réinitialisation.');
      setFeedbackType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="auth-container"
    >
      <AuthHero />
      
      <section className="auth-panel">
        <div className="auth-card">
          <p className="auth-logo">LinkedU</p>
          <h2 className="auth-heading">Nouveau mot de passe</h2>
          <p className="auth-description">
            Veuillez saisir votre nouveau mot de passe pour sécuriser votre compte.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="new-password">Nouveau mot de passe</label>
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <input
                id="new-password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <label htmlFor="confirm-password">Confirmer le mot de passe</label>
            <input
              id="confirm-password"
              type="password"
              placeholder="********"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
            />

            <button type="submit" className="auth-button" disabled={isLoading}>
              {isLoading ? 'Réinitialisation...' : 'Changer le mot de passe'}
            </button>

            {feedback && (
              <p
                style={{ 
                  fontSize: '0.85rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  marginTop: '1rem', 
                  color: feedbackType === 'error' ? '#d32f2f' : '#2e7d32' 
                }}
              >
                {feedbackType === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                {feedback}
              </p>
            )}
          </form>

          <div className="auth-footer" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #eef2f7', display: 'flex', justifyContent: 'center' }}>
            <button 
              className="link-small" 
              onClick={() => navigate('/login')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#667085' }}
            >
              Retour à la connexion
            </button>
          </div>
        </div>
      </section>
    </motion.main>
  );
}
