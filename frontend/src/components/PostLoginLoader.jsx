import logo from '../assets/images/linkedu-logo.png';
import './PostLoginLoader.css';

export default function PostLoginLoader() {
  return (
    <div className="post-login-loader" role="status" aria-live="polite" aria-label="Chargement des donnees">
      <div className="post-login-loader__card">
        <div className="post-login-loader__logo-shell" aria-hidden="true">
          <div className="post-login-loader__logo-core">
            <img src={logo} alt="LinkEdu" className="post-login-loader__logo" />
          </div>
        </div>

        <h1 className="post-login-loader__name">LinkEdu</h1>
        <p className="post-login-loader__subtitle">Preparation de votre espace</p>

        <p className="post-login-loader__status">
          Chargement des donnees
          <span className="post-login-loader__dots" aria-hidden="true" />
        </p>
      </div>
    </div>
  );
}
