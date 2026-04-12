import { motion } from 'framer-motion';
import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    // The main wrapper with a soft, modern background color
    <div className="flex flex-col min-h-screen text-slate-800 font-sans" style={{ background: 'var(--bg-main)' }}>
      
      {/* 1. The Header: Slides down with a smooth spring animation */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md h-[64px]"
        style={{ background: 'rgba(255, 255, 255, 0.95)' }}
      >
        <Header />
      </motion.div>

      <div className="flex flex-1 pt-[64px]">
        {/* 2. The Sidebar: Slides in from the left slightly after the header */}
        <motion.aside
          initial={{ x: -260, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
          className="fixed left-0 top-[64px] h-[calc(100vh-64px)] w-[260px] z-40 overflow-y-auto"
          style={{ background: 'var(--bg-card)' }}
        >
          <Sidebar />
        </motion.aside>

        {/* 3. The Main Content: flows directly without card wrapper */}
        <main className="flex-1 ml-[260px] overflow-x-hidden min-h-[calc(100vh-64px)] relative" style={{ padding: '24px 28px' }}>
          {/* Subtle themed glowing orb behind content */}
          <div className="absolute top-[-100px] right-[-100px] w-96 h-96 rounded-full blur-[100px] opacity-10 pointer-events-none" style={{ background: 'var(--primary-color)' }}></div>
          <div className="absolute bottom-[-100px] left-[-100px] w-80 h-80 rounded-full blur-[100px] opacity-5 pointer-events-none" style={{ background: 'var(--secondary-color)' }}></div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="max-w-7xl mx-auto min-h-full relative z-10"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
