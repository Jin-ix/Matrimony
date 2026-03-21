import { motion } from 'framer-motion';

interface WelcomeHubBannerProps {
    userRole?: string | null;
    userGender?: string | null;
}

export default function WelcomeHubBanner({ userRole, userGender }: WelcomeHubBannerProps) {
    const isParent = userRole === 'scout';
    const candidateTerm = userGender === 'female' ? 'daughter' : userGender === 'male' ? 'son' : 'loved one';
    
    return (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-gold-50 via-white to-gold-50 p-8 shadow-sm border border-gold-100 mb-10 text-center">
            {/* Background Animations */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <motion.div
                    animate={{
                        rotate: 360,
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    className="absolute -top-20 -left-20 w-64 h-64 rounded-full border-[1px] border-gold-300 border-dashed"
                />
                <motion.div
                    animate={{
                        rotate: -360,
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: 25,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full border-[1px] border-gold-400 border-dotted"
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10"
            >
                {/* Marriage Theme SVG Icon */}
                <div className="flex justify-center mb-4">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-gold-500">
                        <path
                            d="M8.5 14C10.9853 14 13 11.9853 13 9.5C13 7.01472 10.9853 5 8.5 5C6.01472 5 4 7.01472 4 9.5C4 11.9853 6.01472 14 8.5 14Z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M15.5 19C17.9853 19 20 16.9853 20 14.5C20 12.0147 17.9853 10 15.5 10C13.0147 10 11 12.0147 11 14.5C11 16.9853 13.0147 19 15.5 19Z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M10.74 13.25L13.25 10.74"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>

                <h2 className="font-serif text-3xl font-medium text-sacred-dark md:text-4xl">
                    Welcome to the Hub
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm text-gray-600 md:text-base font-sans">
                    {isParent 
                      ? `A curated space to discover meaningful connections for your ${candidateTerm}. Let faith, tradition, and love guide your family's journey to a beautiful marriage.`
                      : `A curated space to discover meaningful connections. Let faith, tradition, and love guide your journey to a beautiful marriage.`
                    }
                </p>

                {/* Decorative horizontal rule */}
                <div className="mt-6 flex items-center justify-center space-x-4 opacity-70">
                    <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold-400"></div>
                    <div className="h-2 w-2 rotate-45 bg-gold-400"></div>
                    <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold-400"></div>
                </div>
            </motion.div>
        </div>
    );
}
