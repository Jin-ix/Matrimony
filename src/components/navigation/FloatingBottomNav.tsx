import { motion, AnimatePresence } from 'framer-motion';
import { Compass, MessageCircle, Utensils, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { 
    id: 'discovery', 
    label: 'Discovery', 
    icon: Compass, 
    path: '/discovery',
    matchPath: '/discovery'
  },
  { 
    id: 'kitchen-table', 
    label: 'Kitchen Table', 
    icon: Utensils, 
    path: '/kitchen-table/1', // Using mock ID 1
    matchPath: '/kitchen-table' 
  },
  { 
    id: 'messages', 
    label: 'Messages', 
    icon: MessageCircle, 
    path: '/messages/1', // Using mock ID 1
    matchPath: '/messages'
  },
  { 
    id: 'settings', 
    label: 'Settings', 
    icon: Settings, 
    path: '/settings',
    matchPath: '/settings'
  },
];

export default function FloatingBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-fit px-4">
      <motion.nav 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="flex items-center gap-1.5 p-2 bg-white/70 backdrop-blur-2xl border border-white/40 rounded-[2rem] shadow-[0_20px_50px_rgba(213,168,75,0.15),0_1px_2px_rgba(0,0,0,0.05)] ring-1 ring-gold-200/20"
      >
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.matchPath);
          const Icon = item.icon;

          return (
            <motion.button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`relative flex items-center h-12 gap-2 px-4 rounded-full transition-all duration-500 overflow-hidden ${
                isActive 
                  ? 'bg-gradient-to-br from-gold-500 to-gold-600 text-white shadow-lg shadow-gold-500/30' 
                  : 'text-sacred-dark/50 hover:bg-gold-50 hover:text-gold-600'
              }`}
              whileHover={{ scale: isActive ? 1 : 1.05 }}
              whileTap={{ scale: 0.95 }}
              layout
              transition={{
                layout: { type: 'spring', stiffness: 300, damping: 30 },
                duration: 0.3
              }}
            >
              <Icon className={`w-5 h-5 transition-transform duration-500 ${isActive ? 'rotate-[360deg]' : ''}`} />
              
              <AnimatePresence mode="popLayout" initial={false}>
                {isActive && (
                  <motion.span
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 10, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="whitespace-nowrap font-sans text-[13px] font-bold tracking-wide"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              
              {isActive && (
                <motion.div
                  layoutId="nav-glow"
                  className="absolute inset-0 bg-white/10 blur-sm pointer-events-none"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </motion.nav>
    </div>
  );
}
