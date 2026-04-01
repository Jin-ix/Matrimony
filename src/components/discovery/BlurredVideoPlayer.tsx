import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Eye, EyeOff, Lock } from 'lucide-react';

interface BlurredVideoPlayerProps {
    videoUrl: string;
    revealedAt?: string | null;
    createdAt: string; // the time the match/conversation was created
    onRevealConsent: () => void;
}

export default function BlurredVideoPlayer({ videoUrl, revealedAt, onRevealConsent }: BlurredVideoPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isRevealed, setIsRevealed] = useState(!!revealedAt);

    // Soul DNA: photos and videos are blurred for 3 days or until mutual consent
    useEffect(() => {
        setIsRevealed(!!revealedAt);
    }, [revealedAt]);

    const isLocked = !isRevealed;

    return (
        <div className="relative w-full aspect-[9/16] max-h-[400px] overflow-hidden rounded-3xl bg-sacred-dark/90 shadow-2xl border border-gold-200">
            {/* The actual video */}
            <video 
                src={videoUrl} 
                className={`w-full h-full object-cover transition-all duration-[2000ms] ${isLocked ? 'blur-[30px] scale-110 grayscale-[0.3]' : 'blur-0 scale-100'}`}
                loop
                onClick={() => isPlaying ? setIsPlaying(false) : setIsPlaying(true)}
                ref={el => {
                    if (el) {
                        isPlaying ? el.play() : el.pause();
                    }
                }}
            />

            {/* Premium Overlay for locked state */}
            {isLocked && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/80 flex flex-col items-center justify-center pointer-events-none p-6 text-center">
                    <div className="bg-gold-500/20 p-4 rounded-full backdrop-blur-md border border-gold-300/50 mb-4 animate-pulse">
                        <Lock className="w-8 h-8 text-gold-300" />
                    </div>
                    <h3 className="font-serif text-2xl text-sacred-white drop-shadow-md tracking-wider">Soul DNA™</h3>
                    <p className="text-sm text-gray-300 mt-2 max-w-[200px]">
                        Hear their voice and energy. Face reveals upon mutual consent or after 3 days.
                    </p>
                </div>
            )}

            {/* Play/Pause Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <AnimatePresence>
                    {!isPlaying && (
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.2, opacity: 0 }}
                            className="bg-white/20 p-5 rounded-full backdrop-blur-xl border border-white/40 shadow-xl pointer-events-auto cursor-pointer"
                            onClick={() => setIsPlaying(true)}
                        >
                            <Play className="w-8 h-8 text-white ml-1" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Reveal Action Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
               {isLocked ? (
                   <button 
                       onClick={onRevealConsent}
                       className="w-full flex items-center justify-center space-x-2 py-3 bg-gold-500/90 hover:bg-gold-400 text-sacred-dark font-medium rounded-xl transition-all shadow-lg backdrop-blur-md"
                   >
                       <Eye className="w-5 h-5" />
                       <span>Consent to Reveal</span>
                   </button>
               ) : (
                   <div className="w-full flex items-center justify-center space-x-2 py-3 bg-white/10 text-white font-medium rounded-xl border border-white/20 backdrop-blur-md">
                       <EyeOff className="w-5 h-5" />
                       <span>Video Revealed</span>
                   </div>
               )}
            </div>
        </div>
    );
}
