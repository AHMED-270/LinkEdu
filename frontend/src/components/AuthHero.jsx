import { motion } from 'framer-motion';
import { GraduationCap, BookOpen, Compass } from 'lucide-react';

export default function AuthHero() {
  const words = ["Connecter.", "Apprendre.", "Grandir."];

  return (
    <section className="auth-hero">
      {/* Dynamic Background Elements */}
      <div className="hero-aura aura-1" />
      <div className="hero-aura aura-2" />
      <div className="studying-grid-pattern" />

      <motion.div 
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="hero-inner"
      >
        <div className="hero-logo-wrap">
          <div className="logo-box">
            <GraduationCap size={32} />
          </div>
          <span className="logo-text">LinkedU</span>
        </div>

        <div className="hero-motto">
          {words.map((word, i) => (
            <motion.h1 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + (i * 0.15), duration: 0.8 }}
              className={i === 1 ? "text-accent" : ""}
            >
              {word}
            </motion.h1>
          ))}
        </div>

        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: "100px" }}
          transition={{ delay: 1, duration: 1 }}
          className="motto-divider"
        />

        <p className="hero-description">
          L'excellence acadÃ©mique simplifiÃ©e. AccÃ©dez Ã  vos ressources, 
          suivez vos progrÃ¨s et atteignez vos sommets.
        </p>

        <div className="hero-badges">
          <div className="badge-item"><BookOpen size={16} /> Savoir</div>
          <div className="badge-item"><Compass size={16} /> Direction</div>
        </div>
      </motion.div>

      <div className="hero-copyright">
        Â© 2026 LinkedU Platform â€¢ Excellence Ã‰ducative au Maroc
      </div>
    </section>
  );
} 
