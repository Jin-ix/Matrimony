import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
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
    Volume2,
    VolumeX
} from 'lucide-react';

/* ─────────────────────────── data ─────────────────────────── */

interface PromisePillar {
    id: string;
    number: string;
    badge: string;
    title: string;
    subtitle: string;
    body: string[];
    icon: any;
    accent: string;
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
        accent: 'from-gold-400/10 to-gold-600/5',
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
        accent: 'from-rose-400/10 to-rose-600/5',
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
        accent: 'from-amber-400/10 to-amber-600/5',
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
        accent: 'from-emerald-400/10 to-emerald-600/5',
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
        accent: 'from-violet-400/10 to-violet-600/5',
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
        accent: 'from-sky-400/10 to-sky-600/5',
    },
];

/* ─────────────────────── cinematic features ─────────────────────── */

function AudioToggle() {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // High quality ambient drone/choral music placeholder
        audioRef.current = new Audio('https://assets.mixkit.co/music/preview/mixkit-ethereal-choir-ascension-114.mp3');
        audioRef.current.loop = true;
        audioRef.current.volume = 0.3;
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        };
    }, []);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch((err) => console.log('Audio playback prevented', err));
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2, duration: 1 }}
            onClick={togglePlay}
            className="fixed bottom-8 right-8 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-white/[0.05] backdrop-blur-xl border border-white/[0.1] text-gold-400 hover:bg-white/[0.15] hover:scale-105 transition-all duration-300 group shadow-[0_0_20px_rgba(0,0,0,0.5)]"
            title="Toggle Cinematic Audio"
        >
            {isPlaying ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6 opacity-50" />}
            {/* Pulsing ring if playing */}
            {isPlaying && (
                <span className="absolute inset-0 rounded-full border border-gold-400/30 animate-ping" style={{ animationDuration: '3s' }} />
            )}
        </motion.button>
    );
}

/* ─────────────────────── hero parallax ─────────────────────── */

function HeroSection() {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
    const y = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);
    const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

    return (
        <div ref={ref} className="relative h-screen flex items-center justify-center overflow-hidden bg-sacred-dark sticky top-0 z-0">
            {/* Background ambient orbs */}
            <div className="absolute inset-0 bg-sacred-dark" />
            <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-gold-400/8 rounded-full blur-[160px] animate-divine-glow pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-rose-400/6 rounded-full blur-[140px] animate-float-slow pointer-events-none" />

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
                    Scroll down to explore the sanctuary.
                </motion.p>

                {/* Scroll indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 1 }}
                    className="mt-16 flex flex-col items-center gap-2"
                >
                    <span className="text-pearl-400 text-xs tracking-[0.2em] uppercase">Scroll to uncover</span>
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

/* ─────────────────────── horizontal scroll section ─────────────────────── */

function HorizontalScrollSection() {
    const targetRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: targetRef });

    // The Magic: Spring-dampened physics for buttery smooth scrolling
    // This turns a stepped mouse wheel into a fluid glide.
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 60,
        damping: 20,
        restDelta: 0.001
    });

    // Translate horizontally across the 6 pillars
    // Formula: -(number of gaps / total items) * 100%
    const translateXPct = -((pillars.length - 1) / pillars.length) * 100;
    const x = useTransform(smoothProgress, [0, 1], ["0%", `${translateXPct}%`]);

    return (
        <section ref={targetRef} className="relative h-[600vh] bg-sacred-dark z-10">
            <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center shadow-[-50px_0_100px_rgba(0,0,0,0.8)] border-t border-white/[0.05]">
                
                {/* Dynamic Crossfading Backgrounds */}
                {pillars.map((pillar, idx) => {
                    const center = idx * (1 / (pillars.length - 1));
                    const opacity = useTransform(
                        smoothProgress,
                        [center - 0.2, center, center + 0.2],
                        [0, 1, 0]
                    );

                    return (
                        <motion.div
                            key={`bg-${pillar.id}`}
                            style={{ opacity }}
                            className={`absolute inset-0 bg-gradient-to-br ${pillar.accent}`}
                        />
                    );
                })}

                {/* The Horizontal Track */}
                <motion.div style={{ x }} className="relative z-10 flex w-[600vw] h-full items-center">
                    {pillars.map((pillar, index) => (
                        <PillarSlide key={pillar.id} pillar={pillar} index={index} />
                    ))}
                </motion.div>

                {/* Global Scroll Progress Bar */}
                <div className="absolute bottom-10 md:bottom-16 left-12 right-12 h-[2px] bg-white/[0.1] rounded-full overflow-hidden z-20">
                    <motion.div 
                        className="h-full bg-gradient-to-r from-gold-500 to-rose-400"
                        style={{ scaleX: smoothProgress, transformOrigin: 'left' }}
                    />
                </div>
            </div>
        </section>
    );
}

function PillarSlide({ pillar, index }: { pillar: PromisePillar; index: number }) {
    const Icon = pillar.icon;
    const isEven = index % 2 === 0;

    return (
        <div className="w-[100vw] h-full flex flex-col justify-center px-6 md:px-16 lg:px-32 xl:px-48 relative overflow-hidden">
            
            {/* Massive Typography Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                <span className="text-[50vw] font-serif font-bold text-white opacity-[0.015] leading-none tracking-tighter">
                    {pillar.number}
                </span>
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
                <div className={`${isEven ? 'order-1' : 'order-1 lg:order-2'} flex flex-col justify-center`}>
                    <Icon className="w-16 h-16 md:w-20 md:h-20 text-gold-400 mb-8 drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]" strokeWidth={1} />
                    <span className="block text-gold-400/80 uppercase tracking-[0.35em] text-xs md:text-sm font-semibold mb-4">
                        {pillar.badge}
                    </span>
                    <h2 className="text-4xl md:text-5xl lg:text-7xl font-serif text-pearl-50 leading-[1.1] mb-6 tracking-tight drop-shadow-2xl">
                        {pillar.title}
                    </h2>
                    <p className="text-gold-300/90 text-xl md:text-2xl font-light italic mb-8">
                        {pillar.subtitle}
                    </p>
                    
                    {pillar.scripture && (
                        <div className="mt-8 border-l border-gold-500/30 pl-6">
                            <p className="text-pearl-200/60 text-base italic font-serif leading-relaxed">
                                {pillar.scripture}
                            </p>
                            <p className="text-gold-400/40 text-xs mt-3 tracking-[0.2em] uppercase">
                                {pillar.scriptureRef}
                            </p>
                        </div>
                    )}
                </div>

                <div className={`${isEven ? 'order-2' : 'order-2 lg:order-1'} space-y-6 md:space-y-8 bg-sacred-midnight/30 p-8 md:p-12 rounded-[2rem] backdrop-blur-2xl border border-white/[0.08] shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-transform hover:-translate-y-2 hover:bg-sacred-midnight/40 duration-500`}>
                    {pillar.body.map((paragraph, i) => (
                        <p key={i} className="text-pearl-200/90 text-lg md:text-xl font-light leading-relaxed">
                            {paragraph}
                        </p>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ──────────────────── Hold to Accept Interaction ──────────────────── */

function HoldToAccept() {
    const navigate = useNavigate();
    const [progress, setProgress] = useState(0);
    const intervalRef = useRef<number | null>(null);
    const [isHolding, setIsHolding] = useState(false);

    const handlePointerDown = () => {
        setIsHolding(true);
        intervalRef.current = window.setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    setTimeout(() => navigate('/auth'), 300);
                    return 100;
                }
                return prev + 3; // fills in ~660ms
            });
        }, 20);
    };

    const handlePointerUp = () => {
        setIsHolding(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (progress < 100) {
            setProgress(0); // Reset
        }
    };

    return (
        <div className="flex flex-col items-center select-none">
            <button
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                onContextMenu={(e) => e.preventDefault()}
                className={`relative group w-48 h-48 md:w-56 md:h-56 rounded-full border border-gold-500/20 flex items-center justify-center overflow-hidden touch-none transition-transform duration-300 ${isHolding && progress < 100 ? 'scale-95' : 'scale-100'} ${progress === 100 ? 'scale-110' : ''}`}
            >
                {/* Progress SVG */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle cx="50%" cy="50%" r="48%" fill="none" stroke="currentColor" strokeWidth="1" className="text-white/5" />
                    <circle cx="50%" cy="50%" r="48%" fill="none" stroke="currentColor" strokeWidth="4" 
                        className="text-gold-400 transition-all duration-75"
                        strokeDasharray={2 * Math.PI * 100} // Rough approximation, strokeDasharray is robust enough
                        strokeDashoffset={2 * Math.PI * 100 * (1 - progress / 100)}
                    />
                </svg>

                {/* Inner Button */}
                <div className={`absolute inset-3 rounded-full flex items-center justify-center flex-col transition-all duration-500 ${progress === 100 ? 'bg-gold-500 shadow-[0_0_40px_rgba(212,175,55,0.6)]' : 'bg-white/[0.03] backdrop-blur-md group-hover:bg-white/[0.08]'}`}>
                    <span className={`font-semibold uppercase tracking-[0.2em] text-xs md:text-sm transition-colors duration-300 text-center px-4 ${progress === 100 ? 'text-sacred-dark scale-110' : 'text-gold-400'}`}>
                        {progress === 100 ? 'Promise Accepted' : 'Hold to Accept'}
                    </span>
                </div>
            </button>
            <p className={`mt-8 text-pearl-400/50 text-sm tracking-wide transition-opacity duration-300 ${progress === 100 ? 'opacity-0' : 'opacity-100'}`}>
                Press and hold to seal the promise
            </p>
        </div>
    );
}

/* ──────────────────── closing CTA section ──────────────────── */

function ClosingSection() {
    return (
        <div className="relative h-screen flex items-center justify-center bg-sacred-dark z-20 overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[800px] h-[800px] bg-gold-400/5 rounded-full blur-[200px]" />
            </div>

            <div className="relative z-10 px-6 max-w-3xl mx-auto text-center">
                {/* Ornamental cross */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="flex justify-center mb-8"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-10 h-10 text-gold-400/50">
                        <path d="M12 2v20M7 7h10" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </motion.div>

                <motion.blockquote
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="mb-16"
                >
                    <p className="text-3xl md:text-4xl lg:text-5xl font-serif text-pearl-100 leading-snug italic mb-4">
                        "She was set apart for you before the world was made."
                    </p>
                    <cite className="block text-gold-400/60 text-sm tracking-[0.2em] uppercase not-italic">
                        Tobit 6:18
                    </cite>
                </motion.blockquote>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                >
                    <HoldToAccept />
                </motion.div>
            </div>
        </div>
    );
}

/* ─────────────────────── main page ─────────────────────────── */

export default function Promise() {
    const navigate = useNavigate();

    return (
        <div className="relative w-full bg-sacred-dark text-pearl-50 font-sans selection:bg-gold-500/30 selection:text-gold-200">
            {/* Cinematic Audio Toggle */}
            <AudioToggle />

            {/* Fixed back button */}
            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
                onClick={() => navigate(-1)}
                className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/[0.1] text-pearl-200 text-sm hover:bg-white/[0.15] transition-all duration-300 shadow-md shadow-black/10"
            >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
            </motion.button>

            {/* 1. Static Hero (sticks underneath the horizontal scroll when you scroll down) */}
            <HeroSection />

            {/* 2. Horizontal Gliding Pillars (slides over the Hero) */}
            <HorizontalScrollSection />

            {/* 3. Closing CTA */}
            <ClosingSection />
        </div>
    );
}
