import { motion } from 'framer-motion';

interface LandingHeroProps {
    onStart: () => void;
}

export default function LandingHero({ onStart }: LandingHeroProps) {
    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden font-sans">
            {/* Background Image with Slow Zoom */}
            <motion.div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url('/landing-bg.png')`, height: '100%', width: '100%' }}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 20, ease: 'easeOut' }}
            >
                {/* Gradient overlay for text readability and divine feel */}
                <div className="absolute inset-0 bg-sacred-dark/50" />
                <div className="absolute inset-0 bg-gradient-to-t from-sacred-dark/95 via-sacred-dark/50 to-sacred-dark/80" />
            </motion.div>

            {/* Glowing Orbs / Divine Light */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-200/20 rounded-full blur-[100px] animate-divine-glow mix-blend-overlay pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-pearl-100/30 rounded-full blur-[120px] animate-float-slow mix-blend-overlay pointer-events-none" />

            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 mt-12 w-full max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="mb-6 flex flex-col items-center"
                >
                    {/* Minimalist Cross or Emblem placeholder */}
                    <div className="w-12 h-12 mb-6 text-gold-400 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-full h-full">
                            <path d="M12 2v20M7 7h10" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span className="text-gold-300 uppercase tracking-[0.3em] font-medium text-sm mb-4">
                        Sacred Connections
                    </span>
                    <h1 className="text-5xl md:text-7xl font-serif text-pearl-50 font-medium tracking-tight mb-6 drop-shadow-md">
                        Indian Catholic Matrimony
                    </h1>
                    <p className="text-pearl-200 text-lg md:text-xl font-light max-w-2xl leading-relaxed">
                        Where faith meets forever. An exclusive sanctuary for discovering your soulmate within the traditions of the Catholic church.
                    </p>
                </motion.div>

                <motion.button
                    onClick={onStart}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-12 group relative px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-pearl-50 rounded-full font-medium tracking-wide hover:bg-white/20 transition-all duration-500 overflow-hidden"
                >
                    <span className="relative z-10 flex items-center gap-2">
                        Begin Journey
                        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-gold-400/0 via-gold-400/20 to-gold-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                </motion.button>

            </div>
        </div>
    );
}
