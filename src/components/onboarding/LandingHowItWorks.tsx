import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BookOpen, Users, HeartHandshake } from 'lucide-react';

export default function LandingHowItWorks() {
    return (
        <section
            className="relative w-full py-24 px-6 overflow-hidden text-sacred-dark font-sans border-b border-gray-200 bg-gradient-to-b from-gray-50 to-gray-200/60 flex flex-col items-center"
        >

            <div className="mx-auto max-w-7xl relative z-10 flex flex-col gap-24">

                {/* Top Section: Split Layout */}
                <div className="flex flex-col md:flex-row items-center gap-16">
                    {/* Left Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8 }}
                        className="w-full md:w-1/2 flex flex-col items-start text-left"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-sm tracking-[0.2em] flex gap-[0.4rem]">
                                <span className="text-gray-800 uppercase">How It</span>
                                <span className="font-bold text-black uppercase">Works</span>
                            </span>
                            <div className="h-[1px] w-12 bg-gold-400"></div>
                            {/* Simple inline logo representation */}
                            <div className="w-8 h-8 rounded-full border border-gold-300 flex items-center justify-center bg-white shadow-sm">
                                <span className="text-gold-600 font-serif text-xs italic font-bold">IM</span>
                            </div>
                        </div>

                        <h2 className="text-6xl md:text-7xl font-sans font-extrabold text-[#333] tracking-tight leading-none">
                            Assisted
                        </h2>
                        <h3 className="text-3xl md:text-4xl text-gray-700 mb-8 mt-2 font-light">
                            service is our cup of tea
                        </h3>

                        <p className="text-base text-gray-700 leading-relaxed max-w-lg mb-10 font-medium">
                            We believe the same is the best way to fetch a perfect marriage. Hence, your profile will be under the full care and active attention of Intimate's experienced customer relationship executives, using all modern systems of matchmaking. Intimate assisted service is the most efficient system of matchmaking. It has a wide structure with more than 500 employees operating in 20 branches. In solemnizing the perfect marriage, It is a proven system with years of experience.
                        </p>

                        <button className="px-12 py-3 bg-[#027bce] text-white font-bold rounded shadow-md hover:bg-[#0268ab] transition-colors tracking-wide text-lg mb-12">
                            Branches
                        </button>

                        <div className="flex items-center gap-6 text-gray-800">
                            <button className="hover:text-gold-600 transition-colors">
                                <ArrowLeft className="w-5 h-5 flex-shrink-0" />
                            </button>
                            <button className="hover:text-gold-600 transition-colors">
                                <ArrowRight className="w-5 h-5 flex-shrink-0" />
                            </button>
                        </div>
                    </motion.div>

                    {/* Right Content: Circular Illustration */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="w-full md:w-1/2 relative flex justify-center items-center min-h-[500px]"
                    >
                        {/* The large white circle */}
                        <div className="absolute w-[450px] h-[450px] bg-white rounded-full shadow-xl flex items-center justify-center overflow-hidden">
                            {/* Instead of graphic, using a placeholder image that fits the theme if graphic isn't available. */}
                            <img src="https://images.unsplash.com/photo-1529636798458-92182e662485?q=80&w=1469&auto=format&fit=crop" alt="Assisted Service" className="w-full h-full object-cover opacity-90 mix-blend-multiply" />
                            <div className="absolute inset-0 bg-blue-900/10 mix-blend-overlay"></div>
                        </div>

                        {/* Orbit Lines & Avatars */}
                        <svg className="absolute w-[600px] h-[600px] pointer-events-none" viewBox="0 0 600 600">
                            <circle cx="300" cy="300" r="280" fill="none" stroke="#aac4e6" strokeWidth="1.5" />
                        </svg>

                        <div className="absolute top-0 right-16 w-12 h-12 rounded-full bg-white shadow-lg p-1 overflow-hidden z-20">
                            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" className="rounded-full w-full h-full object-cover" alt="Avatar" />
                        </div>
                        <div className="absolute bottom-4 right-32 w-12 h-12 rounded-full bg-white shadow-lg p-1 overflow-hidden z-20">
                            <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop" className="rounded-full w-full h-full object-cover" alt="Avatar" />
                        </div>
                    </motion.div>
                </div>

                {/* Bottom Section: 3 Steps */}
                <div className="w-full max-w-6xl mx-auto mt-16 relative">
                    {/* Connecting Line perfectly aligned with the center of the icons on desktop */}
                    <div className="hidden md:block absolute top-[88px] left-[15%] w-[70%] h-[2px] bg-gold-200 -z-10 opacity-70" />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                        {/* Step 1 */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="flex flex-col items-center text-center px-6 py-14 rounded-[1.5rem] bg-white shadow-[0_10px_40px_rgba(0,0,0,0.06)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.1)] transition-shadow duration-300"
                        >
                            <div className="w-20 h-20 bg-white rounded-full border border-gold-300 flex items-center justify-center mb-8 z-10">
                                <BookOpen className="w-7 h-7 text-gold-700" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-2xl font-serif text-sacred-dark mb-4 tracking-wide">Create Profile</h3>
                            <p className="text-gray-500 text-[15px] leading-relaxed max-w-[260px]">
                                Register and tell us about yourself, your faith, and what you're looking for in a partner.
                            </p>
                        </motion.div>

                        {/* Step 2 */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="flex flex-col items-center text-center px-6 py-14 rounded-[1.5rem] bg-white shadow-[0_10px_40px_rgba(0,0,0,0.06)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.1)] transition-shadow duration-300"
                        >
                            <div className="w-20 h-20 bg-white rounded-full border border-gold-300 flex items-center justify-center mb-8 z-10">
                                <Users className="w-7 h-7 text-[#8b5a2b]" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-2xl font-serif text-[#8b5a2b] mb-4 tracking-wide">Assisted Search</h3>
                            <p className="text-gray-500 text-[15px] leading-relaxed max-w-[260px]">
                                Our relationship executives manually review and assist in finding the perfect Catholic match.
                            </p>
                        </motion.div>

                        {/* Step 3 */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.6 }}
                            className="flex flex-col items-center text-center px-6 py-14 rounded-[1.5rem] bg-white shadow-[0_10px_40px_rgba(0,0,0,0.06)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.1)] transition-shadow duration-300 relative"
                        >
                            <div className="w-20 h-20 bg-white rounded-full border border-gold-300 flex items-center justify-center mb-8 z-10 p-1">
                                <HeartHandshake className="w-7 h-7 text-sacred-dark" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-2xl font-serif text-sacred-dark mb-4 tracking-wide">Holy Matrimony</h3>
                            <p className="text-gray-500 text-[15px] leading-relaxed max-w-[260px]">
                                Connect, communicate safely, and take the sacred step towards a lifelong commitment.
                            </p>
                        </motion.div>
                    </div>
                </div>

            </div>
        </section>
    );
}
