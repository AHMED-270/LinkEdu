import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getHomeRouteByRole } from '../constants/roles'

function LoginCard() {
  const navigate = useNavigate()
  const { setAuthenticatedUser } = useAuth()
  const [isForgotMode, setIsForgotMode] = useState(false)
  const [isResetSent, setIsResetSent] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginFeedback, setLoginFeedback] = useState('')
  const [loginFeedbackType, setLoginFeedbackType] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const handleLoginSubmit = async (event) => {
    event.preventDefault()
    setIsLoggingIn(true)
    setLoginFeedback('')
    setLoginFeedbackType('')

    const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

    const performLogin = async () => {
      await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', {
        withCredentials: true,
        withXSRFToken: true,
      })

      return axios.post(
        apiBaseUrl + '/api/admin/login',
        {
          email: loginEmail,
          password: loginPassword,
        },
        {
          withCredentials: true,
          withXSRFToken: true,
          headers: {
            Accept: 'application/json',
          },
        }
      )
    }

    try {
      let loginRes

      try {
        loginRes = await performLogin()
      } catch (firstError) {
        if (firstError?.response?.status === 419) {
          loginRes = await performLogin()
        } else {
          throw firstError
        }
      }

      const connectedUser = loginRes?.data?.user
      setAuthenticatedUser(connectedUser)
      setLoginFeedback(`Connecte en tant que ${connectedUser?.email ?? loginEmail}.`)
      setLoginFeedbackType('success')

      const roleHome = getHomeRouteByRole(connectedUser?.role)

<<<<<<< HEAD
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
=======
      if (setAuthenticatedUser) {
        setAuthenticatedUser({
          ...connectedUser,
          ...(authToken ? { token: authToken } : {}),
        });
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
        const apiMessage = err?.response?.data?.errors?.email?.[0]
          || err?.response?.data?.message;
        setLoginFeedback(apiMessage || 'E-mail ou mot de passe incorrect.');
        setLoginFeedbackType('error');
      } else if (status === 403) {
        // Just in case backend somehow returns 403
        setLoginFeedback(err?.response?.data?.message || 'Accès refusé.');
        setLoginFeedbackType('error');
>>>>>>> 78db954bb8f9de8159957adfa96a2d298d6c39d8
      } else if (status === 419) {
        message = 'Session expiree. Reessayez.'
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
              Mot de passe oublie ?
            </button>

            <button type="submit" className="auth-button" disabled={isLoggingIn}>
              {isLoggingIn ? 'Connexion...' : 'Se connecter'}
            </button>

            {loginFeedback && (
              <p
                className={`auth-feedback ${
                  loginFeedbackType === 'error' ? 'auth-feedback-error' : 'auth-feedback-success'
                }`}
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
              Reinitialiser le mot de passe -&gt;
            </button>

            <button
              type="button"
              className="back-link"
              onClick={() => {
                setIsForgotMode(false)
                setIsResetSent(false)
              }}
            >
              &lt;- Retour a la page de connexion
            </button>

            {isResetSent && (
              <p className="auth-feedback">
                Si cet e-mail existe, un lien de reinitialisation a ete envoye.
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
  )
}

export default LoginCard
