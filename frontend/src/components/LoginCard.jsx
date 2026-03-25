import { useState } from 'react'

function LoginCard() {
  const [isForgotMode, setIsForgotMode] = useState(false)
  const [isResetSent, setIsResetSent] = useState(false)

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
            ? 'Saisissez votre e-mail pour recevoir un lien de réinitialisation.'
            : 'Saisissez vos informations afin d&apos;accéder à la plateforme.'}
        </p>

        {!isForgotMode && (
          <form className="auth-form">
            <label htmlFor="email">E-mail</label>
            <input id="email" type="email" placeholder="nom@ecole.com" />

            <label htmlFor="password">Mot de passe</label>
            <input id="password" type="password" placeholder="********" />

            <button
              type="button"
              className="link-small link-button"
              onClick={() => setIsForgotMode(true)}
            >
              Mot de passe oublié ?
            </button>

            <button type="button" className="auth-button">
              Se connecter
            </button>
          </form>
        )}

        {isForgotMode && (
          <form className="auth-form" onSubmit={handleForgotSubmit}>
            <label htmlFor="forgot-email">E-mail</label>
            <input id="forgot-email" type="email" placeholder="nom@ecole.com" required />

            <button type="submit" className="auth-button">
              Envoyer le lien
            </button>

            <button
              type="button"
              className="auth-button auth-button-secondary"
              onClick={() => {
                setIsForgotMode(false)
                setIsResetSent(false)
              }}
            >
              Retour à la connexion
            </button>

            {isResetSent && (
              <p className="auth-feedback">
                Si cet e-mail existe, un lien de réinitialisation a été envoyé.
              </p>
            )}
          </form>
        )}

        <div className="auth-footer">
          <a href="#">Conditions d&apos;utilisation</a>
          <a href="#">Politique de confidentialité</a>
        </div>
      </div>
    </section>
  )
}

export default LoginCard
