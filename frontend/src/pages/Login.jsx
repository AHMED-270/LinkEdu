import AuthHero from '../components/AuthHero';
import LoginCard from '../components/LoginCard';
import { motion } from 'framer-motion';
import './Auth.css';

export default function Login() {
  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="auth-container"
    >
      <AuthHero />
      <LoginCard />
    </motion.main>
  );
}
