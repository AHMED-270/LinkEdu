function LoginCard() {
  return (
    <section className="auth-panel">
      <div className="auth-card">
        <p className="auth-logo">LinkedU</p>
        <h2 className="auth-heading">Se connecter</h2>
        <p className="auth-description">
          Saisissez vos informations afin d&apos;accéder à la plateforme.
        </p>

        <form className="auth-form">
          <label htmlFor="email">E-mail</label>
          <input id="email" type="email" placeholder="nom@ecole.com" />

          <label htmlFor="password">Mot de passe</label>
          <input id="password" type="password" placeholder="********" />

          <a href="#" className="link-small">
            Mot de passe oublié ?
          </a>

          <button type="button" className="auth-button">
            Se connecter
          </button>
        </form>

        <div className="auth-footer">
          <a href="#">Conditions d&apos;utilisation</a>
          <a href="#">Politique de confidentialité</a>
        </div>
      </div>
    </section>
  )
}

export default LoginCard
