import AuthHero from '../components/AuthHero';
import LoginCard from '../components/LoginCard';
import './LoginLegacyTest.css';

export default function Login() {
  return (
    <main className="auth-page">
      <AuthHero />
      <LoginCard />
    </main>
  );
}
