import { motion } from 'framer-motion';

interface RoleSelectionProps {
    onSelectRole: (role: 'candidate' | 'scout') => void;
}

export default function RoleSelection({ onSelectRole }: RoleSelectionProps) {
    return (
        <div className="w-full max-w-5xl mx-auto px-4 mt-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="mb-12 flex flex-col items-center space-y-4 text-center"
            >
                <div className="w-8 h-8 mb-2 text-gold-500">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                        <path d="M12 2v20M7 7h10" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <h2 className="text-4xl md:text-5xl font-serif text-sacred-dark drop-shadow-sm">Choose Your Path</h2>
                <p className="text-lg text-gray-600 px-4 leading-relaxed max-w-2xl font-light">
                    Are you here to find a divine connection for yourself, or are you scouting for a family member?
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Candidate Selection */}
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    onClick={() => onSelectRole('candidate')}
                    className="relative group overflow-hidden rounded-[2.5rem] w-full text-left transition-all duration-700 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)] hover:-translate-y-2 border border-pearl-200/50 cursor-pointer min-h-[400px] md:min-h-[480px]"
                >
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
                        style={{ backgroundImage: "url('/role-candidate.png')" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-sacred-dark via-sacred-dark/40 to-transparent opacity-80 transition-opacity duration-700 group-hover:opacity-95 backdrop-blur-[2px]" />

                    <div className="absolute bottom-0 left-0 right-0 p-8 transform transition-transform duration-700">
                        <span className="text-gold-300 uppercase tracking-[0.2em] font-medium text-xs mb-3 block opacity-80 group-hover:opacity-100 transition-all duration-500">
                            The Seeker
                        </span>
                        <h3 className="font-serif text-3xl md:text-4xl font-medium text-pearl-50 mb-3 drop-shadow-md">For Myself</h3>
                        <p className="text-sm md:text-base text-pearl-100 font-light leading-relaxed opacity-90 group-hover:opacity-100 transition-opacity duration-500">
                            I am the candidate looking for my profound connection.
                        </p>
                    </div>
                </motion.button>

                {/* Parent/Scout Selection */}
                <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    onClick={() => onSelectRole('scout')}
                    className="relative group overflow-hidden rounded-[2.5rem] w-full text-left transition-all duration-700 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)] hover:-translate-y-2 border border-pearl-200/50 cursor-pointer min-h-[400px] md:min-h-[480px]"
                >
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
                        style={{ backgroundImage: "url('/role-scout.png')" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-sacred-dark via-sacred-dark/40 to-transparent opacity-80 transition-opacity duration-700 group-hover:opacity-95 backdrop-blur-[2px]" />

                    <div className="absolute bottom-0 left-0 right-0 p-8 transform transition-transform duration-700">
                        <span className="text-gold-300 uppercase tracking-[0.2em] font-medium text-xs mb-3 block opacity-80 group-hover:opacity-100 transition-all duration-500">
                            The Guide
                        </span>
                        <h3 className="font-serif text-3xl md:text-4xl font-medium text-pearl-50 mb-3 drop-shadow-md">As a Parent / Scout</h3>
                        <p className="text-sm md:text-base text-pearl-100 font-light leading-relaxed opacity-90 group-hover:opacity-100 transition-opacity duration-500">
                            I am helping a family member find their eternal match.
                        </p>
                    </div>
                </motion.button>
            </div>
        </div>
    );
}
