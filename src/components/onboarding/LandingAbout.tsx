import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function LandingAbout() {
    return (
        <section
            className="relative w-full py-24 px-6 text-sacred-dark overflow-hidden font-sans border-b border-gold-100 bg-cover bg-center bg-fixed"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2669&auto=format&fit=crop')` }}
        >
            {/* Overlay to ensure text readability while letting the wedding background show through subtly */}
            <div className="absolute inset-0 z-0 bg-sacred-offwhite/95 backdrop-blur-sm" />

            {/* Background elements */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-gold-50/50 to-transparent mix-blend-multiply opacity-50" />
            <div className="absolute -left-20 top-20 w-64 h-64 border border-gold-200 rounded-full animate-spin-slow opacity-30 pointer-events-none" />

            <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center gap-16 relative z-10">
                {/* Image Section */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="w-full md:w-1/2"
                >
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-gold-900/10">
                        {/* A warm, premium placeholder image of a couple */}
                        <img
                            src="https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=1470&auto=format&fit=crop"
                            alt="Catholic Couple preparing together"
                            className="w-full h-auto object-cover aspect-[4/3]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-sacred-dark/40 to-transparent pointer-events-none" />

                        {/* Decorative frame overlay */}
                        <div className="absolute inset-4 border border-white/40 rounded-xl pointer-events-none" />
                    </div>
                </motion.div>

                {/* Text Content */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                    className="w-full md:w-1/2 space-y-6"
                >
                    <div>
                        <h2 className="text-sm font-semibold text-gold-600 uppercase tracking-[0.2em] mb-2">
                            About Intimate Matrimony
                        </h2>
                        <h3 className="text-3xl md:text-5xl font-serif text-sacred-dark mb-4">
                            Best matrimonial site for Indian Catholics
                        </h3>
                    </div>

                    <p className="text-gray-600 text-lg leading-relaxed">
                        Intimate Matrimony is a pioneer in matrimonial matchmaking services committed to providing 360-degree solutions to all prospective brides and grooms. We believe in providing a secure and convenient matrimonial matchmaking experience to our customers.
                    </p>

                    <p className="text-gray-600 text-lg leading-relaxed">
                        We expertise with assisted service system of matchmaking. As Intimate believes the same is the best way to fetch a perfect marriage. Hence, your profile will be under the full care and active attention of Intimate's experienced customer relationship executives, using all modern systems of matchmaking.
                    </p>

                    <p className="text-gray-600 text-lg leading-relaxed">
                        Intimate has a wide structure with more than 500 employees operating in 22 branches. In solemnizing the perfect marriage, it is a proven system with years of experience.
                    </p>

                    <div className="pt-4">
                        <button className="flex items-center gap-2 px-8 py-3 bg-white border border-gold-300 rounded-full text-sacred-dark font-medium hover:bg-gold-50 transition-colors duration-300">
                            Know More
                            <ArrowRight className="w-4 h-4 text-gold-600" />
                        </button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
