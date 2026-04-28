import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ShieldAlert, Heart, Info } from 'lucide-react';

export interface MatchProfile {
    id: string;
    name: string;
    age: number;
    gender: 'male' | 'female';
    location: string;
    rite: string;
    image: string;
    compatibility: 'green' | 'yellow' | 'red';
    matchPercentage?: number;
    dealbreaker?: string;
    scoutRecommended?: boolean;
    hobbies?: string[];
    status?: 'liked' | 'passed';
    culturalDistance?: number;
}

interface MatchCardProps {
    profile: MatchProfile;
    onClick: (profile: MatchProfile) => void;
}

const compatibilityColors = {
    green: 'shadow-[0_10px_40px_rgba(212,175,55,0.15)] ring-2 ring-green-400/40 border-gold-200',
    yellow: 'shadow-[0_10px_40px_rgba(212,175,55,0.15)] ring-2 ring-yellow-400/40 border-gold-200',
    red: 'shadow-[0_10px_40px_rgba(212,175,55,0.15)] ring-2 ring-red-400/40 border-gold-200',
};

export default function MatchCard({ profile, onClick }: MatchCardProps) {
    const ref = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
    const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['15deg', '-15deg']);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-15deg', '15deg']);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            layoutId={`card-${profile.id}`}
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
            whileHover={{ scale: 1.03 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={() => onClick(profile)}
            className={`relative h-[480px] w-full cursor-pointer rounded-3xl bg-white dark:bg-sacred-midnight transition-all duration-500 ease-out border-2 ${compatibilityColors[profile.compatibility]} overflow-hidden group ${profile.status === 'passed' ? 'opacity-60 grayscale-[0.5]' : ''}`}
        >
            {/* Elegant Inner Ring */}
            <div className="absolute inset-2 border border-gold-400/30 rounded-2xl pointer-events-none z-10 scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-700" style={{ transform: 'translateZ(20px)' }} />

            {/* Background Image */}
            <motion.img
                layoutId={`image-${profile.id}`}
                src={profile.image}
                alt={profile.name}
                className={`absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${profile.status === 'liked' ? 'scale-105' : ''}`}
                style={{ translateZ: -50 }}
            />

            {/* Gradient Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-t pointer-events-none transition-colors duration-700 ${profile.status === 'liked' ? 'from-green-900/90 via-sacred-dark/50 to-green-900/10' : profile.compatibility === 'green' ? 'from-gold-900/90 via-sacred-dark/50 to-transparent' : 'from-sacred-dark/95 via-sacred-dark/40 to-transparent'}`} />

            {/* Status Overlays */}
            {profile.status === 'liked' && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-green-500/20 backdrop-blur-sm">
                    <Heart className="w-20 h-20 text-white fill-white drop-shadow-lg mb-2" />
                    <span className="text-2xl font-serif text-white tracking-widest drop-shadow-md">LIKED</span>
                </div>
            )}
            
            {profile.status === 'passed' && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-900/40 backdrop-blur-sm">
                    <span className="text-2xl font-serif text-gray-200 tracking-widest uppercase drop-shadow-md">Passed</span>
                </div>
            )}

            {/* Scout Recommendation Tag */}
            {profile.scoutRecommended && (
                <div
                    className="absolute top-4 left-4 z-10 flex items-center space-x-1 rounded-full bg-sacred-white/90 backdrop-blur-md px-3 py-1 shadow-lg border border-gold-200"
                    style={{ transform: 'translateZ(30px)' }}
                >
                    <Heart className="h-4 w-4 text-red-500 fill-current" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-sacred-dark">Aleyamma Recommended</span>
                </div>
            )}

            {/* Match Percentage Badge */}
            {profile.matchPercentage !== undefined && (
                <div
                    className="absolute top-4 right-4 z-10 flex items-center justify-center rounded-full bg-sacred-dark/90 backdrop-blur-md px-4 py-2 shadow-lg border border-gold-400"
                    style={{ transform: 'translateZ(30px)' }}
                >
                    <span className="text-sm font-bold text-gold-400">{profile.matchPercentage}% Match</span>
                </div>
            )}

            {/* Deep Match Info */}
            <motion.div
                layoutId={`info-${profile.id}`}
                className="absolute bottom-0 left-0 w-full p-6"
                style={{ transform: 'translateZ(50px)' }}
            >
                <div className="flex items-end justify-between">
                    <div>
                        <h3 className="font-serif text-3xl font-medium text-white drop-shadow-md">
                            {profile.name}, {profile.age}
                        </h3>
                        <p className="mt-1 text-sm font-medium text-gray-200">
                            {profile.rite} • {profile.location}
                        </p>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white border border-white/50">
                        <Info className="h-5 w-5" />
                    </div>
                </div>

                {/* Dealbreaker Warning Tooltip */}
                {profile.dealbreaker && (
                    <div className="mt-4 flex items-start space-x-2 rounded-xl bg-white/10 backdrop-blur-xl border border-red-400/50 p-3 text-red-100 shadow-xl">
                        <ShieldAlert className="h-5 w-5 flex-shrink-0 text-red-400" />
                        <p className="text-xs font-medium uppercase tracking-wide">
                            Conflict: {profile.dealbreaker}
                        </p>
                    </div>
                )}
                
                {/* Diaspora Bridge Cultural Indicator */}
                {profile.culturalDistance !== undefined && (
                    <div className="mt-3 flex items-center justify-between rounded-xl bg-blue-900/40 backdrop-blur-md border border-blue-400/30 p-2 overflow-hidden relative">
                         <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent" />
                         <span className="text-xs font-medium text-blue-100 uppercase tracking-widest relative z-10">Diaspora Bridge</span>
                         <span className="text-sm font-bold text-white relative z-10">{Math.max(0, 100 - profile.culturalDistance)}% Cultural Match</span>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
