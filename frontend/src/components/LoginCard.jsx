import { useState } from 'react'
import axios from 'axios'

function LoginCard() {
  const [isForgotMode, setIsForgotMode] = useState(false)
  const [isResetSent, setIsResetSent] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginRole, setLoginRole] = useState('directeur')
  const [loginFeedback, setLoginFeedback] = useState('')
  const [loginFeedbackType, setLoginFeedbackType] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const applyDemoCredentials = (role) => {
    if (role === 'admin') {
      setLoginRole('admin')
      setLoginEmail('admin@linkedu.com')
      setLoginPassword('Admin@2026')
    } else {
      setLoginRole('directeur')
      setLoginEmail('directeur@linkedu.com')
      setLoginPassword('Directeur@2026')
    }

    setLoginFeedback('')
    setLoginFeedbackType('')
  }

  const handleLoginSubmit = async (event) => {
    event.preventDefault()
    setIsLoggingIn(true)
    setLoginFeedback('')
    setLoginFeedbackType('')

    const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

    try {
      await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', {
        withCredentials: true,
        withXSRFToken: true,
      })

      await axios.post(
        `${apiBaseUrl}/api/admin/login`,
        {
          email: normalizedEmail,
          password: normalizedPassword,
        },
        {
          withCredentials: true,
          withXSRFToken: true,
          headers: {
            Accept: 'application/json',
          },
        }
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
      const status = error?.response?.status
      let message = 'Echec de connexion.'

      if (!error?.response) {
        message = 'Serveur indisponible. Verifiez que le backend Laravel tourne sur http://127.0.0.1:8000.'
      } else if (status === 422 || status === 401) {
        message = 'Email ou mot de passe incorrect.'
      } else if (status === 419) {
        message = 'Session expirée. Réessayez.'
      } else if (error?.response?.data?.message) {
        message = error.response.data.message
      } else if (error?.message) {
        message = error.message
      }

      setLoginFeedback(message)
      setLoginFeedbackType('error')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleForgotSubmit = (event) => {
    event.preventDefault()
    setIsResetSent(true)
  }

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

            <div className="demo-actions">
              <button
                type="button"
                className="demo-button"
                onClick={() => applyDemoCredentials('directeur')}
              >
                Compte demo Directeur
              </button>
              <button
                type="button"
                className="demo-button"
                onClick={() => applyDemoCredentials('admin')}
              >
                Compte demo Admin
              </button>
            </div>

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
        </div>
      </div>
    </section>
  )
}
