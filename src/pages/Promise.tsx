import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShieldCheck,
    Clock,
    Heart,
    EyeOff,
    Sparkles,
    SlidersHorizontal,
    ArrowLeft,
    ChevronDown,
} from 'lucide-react';

/* ─────────────────────────── data ─────────────────────────── */

interface PromisePillar {
    id: string;
    number: string;
    badge: string;
    title: string;
    subtitle: string;
    body: string[];
    icon: React.ElementType;
    accent: string;       // gradient tailwind classes
    scripture?: string;
    scriptureRef?: string;
}

const pillars: PromisePillar[] = [
    {
        id: 'curated-sanctuary',
        number: '01',
        badge: 'Our Foundation',
        title: 'A Curated Sanctuary, Not a Marketplace',
        subtitle: 'You are a unique person, not a commodity.',
        body: [
            'Our portal is an invite-only, strictly verified community. Access is restricted to active candidates only — preventing "window shopping" by those not serious about the journey.',
            'This ensures that everyone you meet is as invested as you are. Every profile is real, every intention is genuine, and every connection is meaningful.',
        ],
        icon: ShieldCheck,
        accent: 'from-gold-400/20 to-gold-600/5',
    },
    {
        id: 'pace-of-grace',
        number: '02',
        badge: 'Your Timeline',
        title: 'The Pace of Grace',
        subtitle: 'Removing the "Age Pressure" common in Indian culture.',
        body: [
            'Whether you are in your 20s or 50s, starting your career or established in your profession, there is no "ticking clock" here.',
            'We encourage an organic connection. You are free to wait for the person who truly complements your soul, without the pressure of arbitrary deadlines. Your journey unfolds in God\'s perfect timing.',
        ],
        icon: Clock,
        accent: 'from-rose-400/20 to-rose-600/5',
    },
    {
        id: 'guardian-angel',
        number: '03',
        badge: 'Human-Centric Concierge',
        title: 'Your Personal Guardian Angel',
        subtitle: 'Not "mere Algorithms" but "Human Empathy."',
        body: [
            'You aren\'t navigating this alone. Your "Guardian Angel" uses the sophistication of cutting-edge AI technology as well as a dedicated human guide who understands the nuances of the Indian American Christian experience — the balance of Eastern heritage and Western lifestyle.',
            'She learns your "heart\'s desires" — even those you find hard to articulate — and adapts as you grow. She is your confidante, filter, and coach.',
        ],
        icon: Heart,
        accent: 'from-amber-400/20 to-amber-600/5',
    },
    {
        id: 'selective-disclosure',
        number: '04',
        badge: 'Total Privacy Control',
        title: 'Selective Disclosure',
        subtitle: 'Protecting you from "community gossip" or unwanted exposure.',
        body: [
            'In a tight-knit diaspora, privacy is paramount. You have "Veto Power" over your information.',
            'Share your full profile only with those who have earned your trust. You have full control over who sees your photos, your family background, and other details. Your story is told on your terms.',
        ],
        icon: EyeOff,
        accent: 'from-emerald-400/20 to-emerald-600/5',
    },
    {
        id: 'divinely-appointed',
        number: '05',
        badge: 'Faith & Destiny',
        title: 'Divinely Appointed Connections',
        subtitle: '"She was set apart for you before the world was made."',
        body: [
            'We believe marriage is a sacrament. Grounded in the promise of Tobit 6:18, we facilitate a space where faith is the foundation.',
            'We focus on spiritual compatibility, ensuring your partner shares your values and your walk with Christ. Every match is a step toward a covenant ordained in heaven.',
        ],
        icon: Sparkles,
        accent: 'from-violet-400/20 to-violet-600/5',
        scripture: '"She was set apart for you before the world was made."',
        scriptureRef: '— Tobit 6:18',
    },
    {
        id: 'lifestyle-compatibility',
        number: '06',
        badge: 'Beyond Denomination',
        title: 'Lifestyle Compatibility',
        subtitle: 'Moving beyond "Denomination" to who you truly are.',
        body: [
            'Whether you want to specify your requirements down to the smallest detail — cultural traditions, specific ministry involvement, career goals — or prefer to keep it broad and see where the Spirit leads, the platform adapts to you.',
            'We accommodate the complexity of your identity, because you are more than a checklist.',
        ],
        icon: SlidersHorizontal,
        accent: 'from-sky-400/20 to-sky-600/5',
    },
];

/* ─────────────────────── hero parallax ─────────────────────── */

function HeroSection() {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
    const y = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);
    const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

    return (
        <div ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Background ambient orbs */}
            <div className="absolute inset-0 bg-sacred-dark" />
            <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-gold-400/8 rounded-full blur-[160px] animate-divine-glow pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-rose-400/6 rounded-full blur-[140px] animate-float-slow pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-pearl-100/3 rounded-full blur-[200px] pointer-events-none" />

            {/* Decorative cross watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                <svg viewBox="0 0 100 100" className="w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] text-gold-300" fill="none" stroke="currentColor" strokeWidth="0.3">
                    <line x1="50" y1="5" x2="50" y2="95" />
                    <line x1="20" y1="30" x2="80" y2="30" />
                </svg>
            </div>

            <motion.div style={{ y, opacity }} className="relative z-10 text-center px-6 max-w-4xl mx-auto">
                {/* Ornamental divider */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center justify-center gap-3 mb-8"
                >
                    <div className="w-12 h-px bg-gradient-to-r from-transparent to-gold-400/60" />
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-6 h-6 text-gold-400">
                        <path d="M12 2v20M7 7h10" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="w-12 h-px bg-gradient-to-l from-transparent to-gold-400/60" />
                </motion.div>

                <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="inline-block text-gold-400 uppercase tracking-[0.35em] font-semibold text-xs mb-6"
                >
                    MyGuardianAngel.com
                </motion.span>

                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="text-5xl md:text-7xl lg:text-8xl font-serif text-pearl-50 font-medium tracking-tight mb-8 leading-[1.05]"
                >
                    Our Promise
                    <span className="block text-gold-400 mt-2 text-3xl md:text-4xl lg:text-5xl font-light tracking-wide">
                        to You
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="text-pearl-300 text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto"
                >
                    Six sacred pillars that form the foundation of everything we do.
                    Not a marketplace — a sanctuary for souls seeking their
                    divinely appointed companion.
                </motion.p>

                {/* Scroll indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 1 }}
                    className="mt-16 flex flex-col items-center gap-2"
                >
                    <span className="text-pearl-400 text-xs tracking-[0.2em] uppercase">Discover</span>
                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <ChevronDown className="w-5 h-5 text-gold-400/60" />
                    </motion.div>
                </motion.div>
            </motion.div>
        </div>
    );
}

/* ─────────────────── pillar card component ─────────────────── */

function PillarCard({ pillar, index }: { pillar: PromisePillar; index: number }) {
    const isEven = index % 2 === 0;
    const Icon = pillar.icon;

    return (
        <motion.section
            id={pillar.id}
            initial={{ opacity: 0, y: 80 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
        >
            <div className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-stretch gap-0 lg:gap-0`}>
                {/* Accent side panel */}
                <div className={`relative w-full lg:w-2/5 min-h-[320px] lg:min-h-[480px] bg-gradient-to-br ${pillar.accent} flex items-center justify-center overflow-hidden ${isEven ? 'lg:rounded-l-3xl' : 'lg:rounded-r-3xl'} rounded-t-3xl lg:rounded-t-none`}>
                    {/* Background pattern */}
                    <div className="absolute inset-0 opacity-[0.04]">
                        <div className="absolute inset-0" style={{
                            backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
                            backgroundSize: '32px 32px',
                        }} />
                    </div>

                    {/* Glow */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-64 h-64 bg-gold-400/10 rounded-full blur-[80px]" />
                    </div>

                    <div className="relative z-10 text-center p-8 lg:p-12">
                        {/* Number */}
                        <motion.span
                            initial={{ opacity: 0, scale: 0.5 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="block text-8xl lg:text-9xl font-serif text-gold-400/15 font-bold mb-4 leading-none select-none"
                        >
                            {pillar.number}
                        </motion.span>

                        {/* Icon */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg shadow-black/10"
                        >
                            <Icon className="w-9 h-9 text-gold-400" strokeWidth={1.5} />
                        </motion.div>

                        {/* Badge */}
                        <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.5 }}
                            className="block mt-6 text-gold-300/80 text-xs uppercase tracking-[0.25em] font-semibold"
                        >
                            {pillar.badge}
                        </motion.span>

                        {/* Scripture quote if present */}
                        {pillar.scripture && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: 0.6 }}
                                className="mt-8 px-4"
                            >
                                <p className="text-pearl-200/70 text-sm italic font-serif leading-relaxed">
                                    {pillar.scripture}
                                </p>
                                <p className="text-gold-400/50 text-xs mt-2 tracking-wider">
                                    {pillar.scriptureRef}
                                </p>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Content side */}
                <div className={`relative w-full lg:w-3/5 bg-sacred-midnight/40 backdrop-blur-sm border border-white/[0.06] p-8 md:p-12 lg:p-16 flex flex-col justify-center ${isEven ? 'lg:rounded-r-3xl' : 'lg:rounded-l-3xl'} rounded-b-3xl lg:rounded-b-none`}>
                    {/* Subtle top accent line */}
                    <div className={`absolute top-0 ${isEven ? 'right-0' : 'left-0'} w-1/3 h-px bg-gradient-to-${isEven ? 'l' : 'r'} from-gold-400/30 to-transparent`} />

                    <motion.div
                        initial={{ opacity: 0, x: isEven ? 30 : -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    >
                        <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-serif text-pearl-50 font-medium tracking-tight mb-4 leading-tight">
                            {pillar.title}
                        </h2>

                        <p className="text-gold-400/90 text-base md:text-lg font-medium mb-8 tracking-wide">
                            {pillar.subtitle}
                        </p>

                        <div className="w-10 h-[2px] bg-gold-400/40 rounded-full mb-8" />

                        <div className="space-y-5">
                            {pillar.body.map((paragraph, i) => (
                                <p key={i} className="text-pearl-200/80 text-base md:text-lg leading-relaxed font-light">
                                    {paragraph}
                                </p>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.section>
    );
}

/* ──────────────────── closing CTA section ──────────────────── */

function ClosingSection() {
    const navigate = useNavigate();

    return (
        <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="relative py-32 text-center overflow-hidden"
        >
            {/* Background glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[600px] h-[600px] bg-gold-400/6 rounded-full blur-[180px]" />
            </div>

            <div className="relative z-10 px-6 max-w-3xl mx-auto">
                {/* Ornamental cross */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="flex justify-center mb-8"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-8 h-8 text-gold-400/50">
                        <path d="M12 2v20M7 7h10" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </motion.div>

                <motion.blockquote
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="mb-12"
                >
                    <p className="text-2xl md:text-3xl lg:text-4xl font-serif text-pearl-100 leading-snug italic">
                        "She was set apart for you before the world was made."
                    </p>
                    <cite className="block mt-4 text-gold-400/60 text-sm tracking-[0.2em] uppercase not-italic">
                        Tobit 6:18
                    </cite>
                </motion.blockquote>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="space-y-6"
                >
                    <p className="text-pearl-300/80 text-lg font-light leading-relaxed max-w-xl mx-auto">
                        Your journey to a sacred union begins with a single step. Let us walk beside you — with faith, empathy, and unwavering respect for who you are.
                    </p>

                    <button
                        onClick={() => navigate('/auth')}
                        className="group relative inline-flex items-center gap-3 px-10 py-4 mt-4 bg-white/[0.06] backdrop-blur-md border border-white/[0.12] text-pearl-50 rounded-full font-medium tracking-wide hover:bg-white/[0.12] transition-all duration-500 overflow-hidden"
                    >
                        <span className="relative z-10">Begin Your Journey</span>
                        <svg className="relative z-10 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                        <div className="absolute inset-0 bg-gradient-to-r from-gold-400/0 via-gold-400/15 to-gold-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                    </button>
                </motion.div>
            </div>
        </motion.section>
    );
}

/* ─────────────────────── main page ─────────────────────────── */

export default function Promise() {
    const navigate = useNavigate();

    return (
        <div className="relative min-h-screen w-full bg-sacred-dark text-pearl-50 font-sans overflow-x-hidden scroll-smooth">
            {/* Fixed back button */}
            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
                onClick={() => navigate(-1)}
                className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/[0.1] text-pearl-200 text-sm hover:bg-white/[0.12] transition-all duration-300"
            >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
            </motion.button>

            {/* Hero */}
            <HeroSection />

            {/* Pillar Cards */}
            <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 space-y-8 md:space-y-12 py-16 md:py-24">
                {/* Section intro */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-8 md:mb-16"
                >
                    <span className="text-gold-400/70 uppercase tracking-[0.3em] text-xs font-semibold">Our Six Pillars</span>
                    <h2 className="text-3xl md:text-4xl font-serif text-pearl-50 mt-4 mb-4">The Promises That Define Us</h2>
                    <div className="w-16 h-[2px] bg-gold-400/40 mx-auto rounded-full" />
                </motion.div>

                {pillars.map((pillar, index) => (
                    <PillarCard key={pillar.id} pillar={pillar} index={index} />
                ))}
            </div>

            {/* Closing CTA */}
            <ClosingSection />

            {/* Bottom decorative gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/20 to-transparent" />
        </div>
    );
}
