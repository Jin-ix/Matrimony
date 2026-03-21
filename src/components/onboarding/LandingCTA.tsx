import { motion } from 'framer-motion';

interface LandingCTAProps {
    onStart: () => void;
}

export default function LandingCTA({ onStart }: LandingCTAProps) {
    return (
        <section className="relative w-full py-20 px-6 overflow-hidden flex justify-center">
            {/* Extremely rich Catholic/Wedding colored gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-sacred-dark via-gray-900 to-gold-900" />

            {/* Subtle ornate overlay */}
            <div className="absolute inset-0 border-[16px] border-white/5 pointer-events-none" />
            <div className="absolute inset-x-0 h-px top-1/2 bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />

            <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.8, type: "spring" }}
                >
                    <h2 className="text-4xl md:text-6xl font-serif text-white mb-4 drop-shadow-md leading-tight">
                        Your Happy <span className="text-gold-300">Marriage Story</span> <br className="hidden md:block" /> Can Be Next!
                    </h2>

                    <p className="text-gold-100/80 text-lg md:text-xl font-light mb-10 max-w-2xl mx-auto">
                        Take the first step towards a blessed union. Join thousands of individuals who have found their sacred connection through our assisted matchmaking.
                    </p>

                    <button
                        onClick={onStart}
                        className="group relative px-10 py-4 bg-gradient-to-r from-gold-500 to-gold-400 text-sacred-dark rounded-full font-bold tracking-wide shadow-[0_0_30px_rgba(212,175,55,0.3)] hover:shadow-[0_0_40px_rgba(212,175,55,0.5)] transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            Get Started Now
                            <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </span>
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] skew-x-12" />
                    </button>
                </motion.div>
            </div>
        </section>
    );
}
