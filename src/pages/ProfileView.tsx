import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShieldAlert, Heart, Send, CheckCircle2, Video, Upload, Sparkles, MessageCircle } from 'lucide-react';
import { computeIndividualCompatibility, computeFamilyValuesScore, generateAIInsight } from '../utils/scoring';
import type { MatchProfile } from '../components/discovery/MatchCard';
import { supabase } from '../lib/supabase';

export default function ProfileView() {
    const { id: _id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    // The profile data and current user's profile can be passed via router state
    // so we don't have to fetch them again immediately.
    const selectedProfile = location.state?.profile as MatchProfile | undefined;
    const myProfile = location.state?.myProfile as any | undefined;

    const [isExpressingInterest, setIsExpressingInterest] = useState(false);
    const [hasExpressedInterest, setHasExpressedInterest] = useState(false);
    const [mutualMatchData, setMutualMatchData] = useState<{ name: string; conversationId: string } | null>(null);
    const [isRecommending, setIsRecommending] = useState(false);
    const [hasRecommended, setHasRecommended] = useState(false);
    const [isPassing, setIsPassing] = useState(false);
    const [icebreakerSent, setIcebreakerSent] = useState(false);
    const videoInputRef = useRef<HTMLInputElement>(null);

    // If no profile is found in state, try to navigate back or handle graceful fallback
    useEffect(() => {
        if (!selectedProfile) {
            navigate('/discovery', { replace: true });
        }
    }, [selectedProfile, navigate]);

    if (!selectedProfile) return null;

    const handleInterest = async () => {
        setIsExpressingInterest(true);
        try {
            const userId = localStorage.getItem('userId') || '';
            let backendSucceeded = false;
            
            const res = await fetch('http://localhost:3001/api/interactions/interest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
                body: JSON.stringify({ toUserId: selectedProfile.id })
            }).catch(() => null);

            if (res && res.ok) {
                backendSucceeded = true;
                const json = await res.json().catch(() => null);
                const payload = json?.data ?? json;
                if (payload?.mutualMatch && payload?.conversationId) {
                    setTimeout(() => {
                        setIsExpressingInterest(false);
                        setMutualMatchData({
                            name: selectedProfile.name,
                            conversationId: payload.conversationId,
                        });
                    }, 1200);
                    return;
                }
            }

            if (!backendSucceeded && userId) {
                // Supabase fallback
                const { data: existing } = await supabase
                    .from('Interest')
                    .select('*')
                    .eq('fromUserId', userId)
                    .eq('toUserId', selectedProfile.id)
                    .single();
                
                if (!existing) {
                    await supabase.from('Interest').insert({
                        fromUserId: userId,
                        toUserId: selectedProfile.id,
                        type: 'interest'
                    });
                }
            }
        } catch (error) {
            console.error('Failed to express interest', error);
        }
        setTimeout(() => {
            setIsExpressingInterest(false);
            setHasExpressedInterest(true);
        }, 1200);
    };

    const handleRecommend = async () => {
        setIsRecommending(true);
        try {
            const userId = localStorage.getItem('userId') || '';
            let backendSucceeded = false;
            
            const res = await fetch('http://localhost:3001/api/interactions/recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
                body: JSON.stringify({ toUserId: selectedProfile.id, message: 'Recommended for you' })
            }).catch(() => null);
            
            if (res && res.ok) {
                backendSucceeded = true;
            }

            if (!backendSucceeded && userId) {
                const { data: existing } = await supabase
                    .from('Interest')
                    .select('*')
                    .eq('fromUserId', userId)
                    .eq('toUserId', selectedProfile.id)
                    .single();
                
                if (!existing) {
                    await supabase.from('Interest').insert({
                        fromUserId: userId,
                        toUserId: selectedProfile.id,
                        type: 'recommend',
                        recommendedByUserId: userId,
                        message: 'Recommended for you'
                    });
                }
            }
        } catch (error) {
            console.error('Failed to recommend', error);
        }
        setTimeout(() => {
            setIsRecommending(false);
            setHasRecommended(true);
            setTimeout(() => {
                navigate(`/kitchen-table/${selectedProfile.id}`);
            }, 800);
        }, 1500);
    };

    const handlePass = async () => {
        setIsPassing(true);
        try {
            const userId = localStorage.getItem('userId') || '';
            let backendSucceeded = false;
            
            const res = await fetch('http://localhost:3001/api/interactions/pass', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
                body: JSON.stringify({ toUserId: selectedProfile.id })
            }).catch(() => null);
            
            if (res && res.ok) {
                backendSucceeded = true;
            }

            if (!backendSucceeded && userId) {
                const { data: existing } = await supabase
                    .from('Interest')
                    .select('*')
                    .eq('fromUserId', userId)
                    .eq('toUserId', selectedProfile.id)
                    .single();
                
                if (!existing) {
                    await supabase.from('Interest').insert({
                        fromUserId: userId,
                        toUserId: selectedProfile.id,
                        type: 'pass'
                    });
                }
            }
            
        } catch (error) {
            console.error('Failed to pass profile', error);
        }
        setTimeout(() => {
            setTimeout(() => {
                setIsPassing(false);
                navigate(-1);
            }, 300);
        }, 800);
    };

    const handleBack = () => {
        // Option to refresh the feed if status changed, 
        // but simple navigate back works for now.
        navigate(-1);
    };

    return (
        <div className="min-h-screen bg-pearl-50">
            {/* Header / navbar area for back button */}
            <div className="fixed top-0 left-0 w-full p-6 z-50 pointer-events-none flex justify-between items-center">
                 <button
                    onClick={handleBack}
                    className="pointer-events-auto flex items-center justify-center p-3 rounded-full bg-white/60 text-gray-700 backdrop-blur-xl transition-all hover:bg-white hover:text-sacred-dark hover:scale-105 hover:shadow-md border border-gray-200/50"
                 >
                    <ArrowLeft className="h-5 w-5" />
                 </button>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative w-full h-screen bg-white shadow-xl flex flex-col md:flex-row mx-auto"
            >
                {/* Animation Overlays */}
                <AnimatePresence>
                    {isExpressingInterest && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-40 flex items-center justify-center bg-white/70 backdrop-blur-md"
                        >
                            <div className="relative">
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
                                >
                                    <Heart className="w-32 h-32 text-green-500 fill-green-500 opacity-90 drop-shadow-2xl" />
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 2] }}
                                    transition={{ repeat: Infinity, duration: 1.2, ease: "easeOut" }}
                                    className="absolute inset-0 rounded-full border-4 border-green-400"
                                />
                            </div>
                        </motion.div>
                    )}

                    {hasExpressedInterest && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#064E3B]/95 backdrop-blur-xl text-white"
                        >
                            <motion.div
                                initial={{ scale: 0, rotate: -45 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", bounce: 0.6, duration: 0.8 }}
                            >
                                <CheckCircle2 className="w-32 h-32 mb-8 text-green-400 shadow-green-500/50 drop-shadow-[0_0_30px_rgba(74,222,128,0.5)]" />
                            </motion.div>
                            <motion.h3
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-4xl lg:text-5xl font-serif text-white tracking-wide mix-blend-plus-lighter"
                            >
                                Interest Sent
                            </motion.h3>
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="mt-6 font-sans text-green-100/90 text-lg max-w-md text-center"
                            >
                                We'll let <span className="font-semibold text-white">{selectedProfile.name}</span> know you're interested. They will have 48 hours to respond.
                            </motion.p>
                            <motion.button
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                onClick={handleBack}
                                className="mt-8 px-8 py-3 bg-white text-green-900 rounded-full font-medium"
                            >
                                Continue Browsing
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Mutual Match Overlay */}
                    {mutualMatchData && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.92 }}
                            className="absolute inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-xl text-white overflow-hidden"
                            style={{ background: 'radial-gradient(ellipse at center, #92400e 0%, #78350f 40%, #1c1917 100%)' }}
                        >
                            <motion.div
                                animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.7, 0.4] }}
                                transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
                                className="absolute w-64 h-64 rounded-full border border-gold-400/30"
                            />
                            <motion.div
                                animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0.5, 0.2] }}
                                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut', delay: 0.4 }}
                                className="absolute w-96 h-96 rounded-full border border-gold-300/20"
                            />

                            <motion.div
                                initial={{ scale: 0, rotate: -20 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', bounce: 0.55, duration: 0.9 }}
                                className="relative z-10 mb-6"
                            >
                                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-gold-400 to-amber-600 flex items-center justify-center shadow-[0_0_50px_rgba(212,175,55,0.6)]">
                                    <Sparkles className="w-14 h-14 text-white fill-white drop-shadow-xl" />
                                </div>
                            </motion.div>

                            <motion.h3
                                initial={{ y: 24, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.25 }}
                                className="relative z-10 font-serif text-5xl text-white tracking-wide text-center drop-shadow-xl"
                            >
                                It's a Match! 💍
                            </motion.h3>
                            <motion.p
                                initial={{ y: 24, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.35 }}
                                className="relative z-10 mt-4 text-amber-200 text-lg max-w-xs text-center leading-relaxed"
                            >
                                You and <span className="font-semibold text-white">{mutualMatchData.name}</span> are mutually interested. Start your journey together!
                            </motion.p>

                            <motion.button
                                initial={{ y: 24, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                onClick={() => {
                                    navigate(`/messages/${mutualMatchData.conversationId}`);
                                }}
                                className="relative z-10 mt-8 flex items-center gap-3 rounded-2xl bg-white text-sacred-dark px-8 py-4 font-semibold text-lg shadow-2xl hover:shadow-gold-500/30 hover:-translate-y-1 transition-all duration-300 active:scale-95"
                            >
                                <MessageCircle className="h-6 w-6 text-gold-600" />
                                Start Chatting
                            </motion.button>

                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                onClick={handleBack}
                                className="relative z-10 mt-4 text-amber-300/70 text-sm hover:text-amber-200 transition-colors"
                            >
                                Continue Browsing
                            </motion.button>
                        </motion.div>
                    )}

                    {isRecommending && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-40 flex items-center justify-center bg-white/80 backdrop-blur-lg"
                        >
                            <motion.div
                                animate={{ y: [0, -15, 0] }}
                                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                className="flex flex-col items-center"
                            >
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                                >
                                    <Send className="w-28 h-28 text-gold-500 drop-shadow-xl" />
                                </motion.div>
                                <p className="mt-8 text-2xl font-serif text-gold-700 font-medium tracking-wide">Preparing Kitchen Table...</p>
                            </motion.div>
                        </motion.div>
                    )}

                    {isPassing && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-40 flex items-center justify-center bg-gray-900/95 backdrop-blur-xl"
                        >
                            <motion.div
                                initial={{ scale: 0.8, rotate: -15, opacity: 0 }}
                                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                                transition={{ type: "spring", damping: 15, stiffness: 200 }}
                                className="flex flex-col items-center"
                            >
                                <div className="w-24 h-24 rounded-full border-2 border-gray-600 flex items-center justify-center mb-6 bg-gray-800 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                                    <ShieldAlert className="w-12 h-12 text-gray-400 drop-shadow-lg" />
                                </div>
                                <p className="text-2xl font-serif text-gray-300 tracking-[0.2em] uppercase">Passed</p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Left Column: Full Image */}
                <div className="relative h-[40vh] md:h-full md:w-1/2 overflow-hidden shrink-0 group z-10 w-full rounded-b-3xl md:rounded-b-none md:rounded-r-3xl">
                    <motion.img
                        layoutId={`image-${selectedProfile.id}`}
                        src={selectedProfile.image}
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        alt={selectedProfile.name}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10 pointer-events-none opacity-90 transition-opacity duration-700 group-hover:opacity-100" />

                    <div className="absolute bottom-8 left-8 right-8 pointer-events-none z-20">
                        <motion.div layoutId={`info-${selectedProfile.id}`}>
                            <h2 className="font-serif text-5xl lg:text-6xl text-white drop-shadow-xl tracking-tight leading-tight">{selectedProfile.name}, <span className="font-light text-white/90">{selectedProfile.age}</span></h2>
                        </motion.div>
                        <div className="mt-4 flex items-center space-x-2">
                            <div className="inline-flex items-center space-x-2 rounded-full bg-white/20 px-4 py-1.5 backdrop-blur-md border border-white/30 text-white shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-pulse" />
                                <span className="text-sm font-medium tracking-wide">Stage 2 AI Meaning Match</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Detailed Bio */}
                <div className="flex flex-col md:w-1/2 bg-[#FAFAF9] relative flex-1 md:h-full overflow-hidden w-full">
                    <div className="p-6 lg:px-12 lg:py-16 overflow-y-auto flex-1 space-y-8 scrollbar-hide">
                        <section className="bg-white rounded-3xl p-8 shadow-sm border border-pearl-200 transition-all hover:shadow-md">
                            <h3 className="font-serif text-2xl text-sacred-dark mb-4 flex items-center">
                                <span className="w-10 h-[1.5px] bg-gold-400 mr-4"></span>
                                Faith & Heritage
                            </h3>
                            <p className="text-gray-600 leading-relaxed font-sans text-lg">
                                A dedicated member of the <span className="font-medium text-sacred-dark bg-gold-50 px-2 py-0.5 rounded-md">{selectedProfile.rite}</span> community in <span className="font-medium text-sacred-dark border-b border-pearl-300">{selectedProfile.location}</span>. Emphasizes family values and attends Sunday Mass regularly.
                            </p>
                        </section>

                        <section className="bg-gradient-to-br from-gold-50/90 via-white to-gold-50/30 rounded-3xl p-8 shadow-sm border border-gold-200/50 relative overflow-hidden transition-all hover:shadow-md">
                            <h3 className="font-serif text-2xl text-sacred-dark mb-5 flex items-center relative z-10">
                                <span className="w-10 h-[1.5px] bg-gold-500 mr-4"></span>
                                AI Summary of Values
                            </h3>
                            <p className="text-sacred-dark/90 italic font-serif leading-relaxed text-lg lg:text-xl relative z-10 text-justify">
                                {generateAIInsight(
                                    selectedProfile.name,
                                    selectedProfile.rite,
                                    selectedProfile.location,
                                    selectedProfile.hobbies || []
                                )}
                            </p>
                        </section>

                     {selectedProfile.hobbies && selectedProfile.hobbies.length > 0 && (
                            <section className="bg-white rounded-3xl p-8 shadow-sm border border-pearl-200">
                                <h3 className="font-serif text-2xl text-sacred-dark mb-6 flex items-center">
                                    <span className="w-10 h-[1.5px] bg-gold-400 mr-4"></span>
                                    Interests & Hobbies
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    {selectedProfile.hobbies.map((hobby, index) => (
                                        <span
                                            key={index}
                                            className="px-5 py-2.5 bg-gray-50 text-sacred-dark rounded-full text-sm font-medium border border-gray-200 hover:bg-white hover:shadow-sm hover:-translate-y-0.5 transition-all"
                                        >
                                            {hobby}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Diaspora Bridge: Cultural Distance Score */}
                        {selectedProfile.culturalDistance !== undefined && (
                            <section className="bg-gradient-to-br from-blue-950 to-indigo-900 rounded-3xl p-8 shadow-md border border-blue-700/30 text-white relative overflow-hidden">
                                <h3 className="font-serif text-2xl text-white mb-1 flex items-center relative z-10">
                                    <span className="w-10 h-[1.5px] bg-blue-400 mr-4"></span>
                                    Diaspora Bridge™
                                </h3>
                                <p className="text-blue-300 text-xs mb-6 ml-14 uppercase tracking-widest">Cultural Distance Score</p>
                                <div className="flex justify-between items-center mb-3 relative z-10">
                                    <span className="text-sm text-blue-200">Kerala-Rooted</span>
                                    <span className="text-sm text-blue-200">Fully Westernised</span>
                                </div>
                                <div className="w-full bg-blue-900/60 rounded-full h-3 mb-4 relative overflow-hidden">
                                    <div
                                        className="h-3 rounded-full bg-gradient-to-r from-blue-400 to-indigo-300 transition-all duration-1000"
                                        style={{ width: `${selectedProfile.culturalDistance}%` }}
                                    />
                                </div>
                                <div className="flex justify-between items-center relative z-10">
                                    <span className="text-3xl font-bold text-white">{Math.max(0, 100 - selectedProfile.culturalDistance)}%</span>
                                    <span className="text-blue-200 text-sm">Cultural Alignment</span>
                                </div>
                            </section>
                        )}

                        {/* Family Compatibility Report */}
                        <section className="bg-gradient-to-br from-gold-50 via-white to-amber-50/30 rounded-3xl p-8 border border-gold-200/70 relative overflow-hidden">
                            <h3 className="font-serif text-2xl text-sacred-dark mb-1 flex items-center relative z-10">
                                <span className="w-10 h-[1.5px] bg-gold-500 mr-4"></span>
                                Family Compatibility
                            </h3>
                            <p className="text-gold-600/70 text-xs mb-6 ml-14 uppercase tracking-widest">AI-Generated Report</p>
                            {(() => {
                                const indivScore = computeIndividualCompatibility(
                                    myProfile?.rite || '',
                                    selectedProfile.rite,
                                    myProfile?.location || '',
                                    selectedProfile.location,
                                    myProfile?.age || 28,
                                    selectedProfile.age,
                                    myProfile?.hobbies || [],
                                    selectedProfile.hobbies || []
                                );
                                const famScore = computeFamilyValuesScore(
                                    myProfile?.rite || '',
                                    selectedProfile.rite,
                                    myProfile?.location || '',
                                    selectedProfile.location
                                );
                                const finalIndivScore = selectedProfile.matchPercentage ?? indivScore;
                                const overallLabel = finalIndivScore >= 85 ? 'Exceptional' : finalIndivScore >= 70 ? 'Strong' : finalIndivScore >= 55 ? 'Moderate' : 'Developing';
                                const overallColor = finalIndivScore >= 85 ? 'bg-green-100 text-green-800 border-green-200' : finalIndivScore >= 70 ? 'bg-gold-100 text-gold-800 border-gold-200' : 'bg-orange-100 text-orange-800 border-orange-200';
                                return (
                                    <div className="space-y-5 relative z-10">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-semibold text-sacred-dark/80 uppercase tracking-wider">Overall Match</span>
                                            <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide border ${overallColor}`}>
                                                {finalIndivScore}% {overallLabel}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm font-medium text-sacred-dark/80 mb-2">
                                                <span>Weighted Algorithm Match</span>
                                                <span className="font-bold text-sacred-dark">{finalIndivScore}%</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                                <div className="bg-gradient-to-r from-gold-500 to-gold-300 h-2.5 rounded-full transition-all duration-700" style={{ width: `${finalIndivScore}%` }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm font-medium text-sacred-dark/80 mb-2">
                                                <span>Family Values Alignment</span>
                                                <span className="font-bold text-sacred-dark">{famScore}%</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                                <div className="bg-gradient-to-r from-gold-400 to-amber-300 h-2.5 rounded-full transition-all duration-700" style={{ width: `${famScore}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </section>

                        {/* Soul DNA Icebreaker Banner */}
                        <section className="bg-gradient-to-br from-sacred-dark to-gray-900 rounded-3xl p-8 border border-gray-800 relative overflow-hidden">
                            <h3 className="font-serif text-2xl text-white mb-1 flex items-center relative z-10">
                                <span className="w-10 h-[1.5px] bg-gold-400 mr-4"></span>
                                Soul DNA™
                            </h3>
                            <p className="text-gray-400 text-xs mb-5 ml-14 uppercase tracking-widest">60-Second Icebreaker</p>
                            <div className="flex items-center space-x-4 relative z-10">
                                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gold-500/20 border border-gold-400/30 flex items-center justify-center">
                                    <Video className="w-7 h-7 text-gold-300" />
                                </div>
                                <div>
                                    <p className="text-white font-medium">Blurred video icebreaker</p>
                                    <p className="text-gray-400 text-sm mt-1">Hear their voice and energy before seeing their face.</p>
                                </div>
                            </div>
                            {!icebreakerSent ? (
                                <div className="mt-6 relative z-10">
                                    <input
                                        ref={videoInputRef}
                                        type="file"
                                        accept="video/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setIcebreakerSent(true);
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => videoInputRef.current?.click()}
                                        className="w-full py-3 bg-gold-500/20 hover:bg-gold-500/30 text-gold-300 border border-gold-400/30 rounded-2xl font-medium text-sm transition-all tracking-wide flex items-center justify-center space-x-2"
                                    >
                                        <Upload className="w-4 h-4" />
                                        <span>Upload My Icebreaker Video</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="mt-6 flex items-center space-x-3 bg-gold-500/10 border border-gold-400/30 rounded-2xl p-4 relative z-10">
                                    <CheckCircle2 className="w-5 h-5 text-gold-400 flex-shrink-0" />
                                    <div>
                                        <p className="text-gold-300 font-medium text-sm">Icebreaker sent!</p>
                                    </div>
                                </div>
                            )}
                        </section>

                        {selectedProfile.dealbreaker && (
                            <section>
                                <div className="flex items-start space-x-4 rounded-2xl bg-red-50 p-6 text-red-900 border border-red-100">
                                    <div className="bg-white p-2 rounded-full shadow-sm shrink-0 mt-1">
                                        <ShieldAlert className="h-5 w-5 text-red-500" />
                                    </div>
                                    <div>
                                        <p className="font-semibold uppercase tracking-wider text-xs mb-1 text-red-700">Potential Conflict Detected</p>
                                        <p className="text-[15px] font-medium text-red-900/80 leading-relaxed">{selectedProfile.dealbreaker}</p>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="shrink-0 p-6 lg:px-12 lg:py-8 bg-white border-t border-gray-100 flex flex-col sm:flex-row gap-4 z-20">
                            <button
                                onClick={handleInterest}
                                disabled={isExpressingInterest || hasExpressedInterest || isPassing || selectedProfile.status === 'liked' || selectedProfile.status === 'passed'}
                                className={`flex-1 rounded-2xl py-4 flex items-center justify-center text-center font-medium transition-all duration-300 ${
                                    hasExpressedInterest || selectedProfile.status === 'liked'
                                    ? 'bg-green-600 text-white'
                                    : isExpressingInterest
                                        ? 'bg-gray-900 text-white scale-[0.98]'
                                        : 'bg-gray-900 text-white hover:bg-black hover:shadow-lg'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {isExpressingInterest ? (
                                    <div className="h-5 w-5 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                                ) : hasExpressedInterest || selectedProfile.status === 'liked' ? (
                                    <div className="flex items-center space-x-2">
                                        <CheckCircle2 className="h-5 w-5 text-white" />
                                        <span>Liked</span>
                                    </div>
                                ) : (
                                    'Express Interest'
                                )}
                            </button>
                            <button
                                onClick={handleRecommend}
                                disabled={isRecommending || hasRecommended || isPassing}
                                className={`flex-1 rounded-2xl py-4 flex items-center justify-center text-center font-medium transition-all duration-300 ${hasRecommended
                                    ? 'bg-gold-500 text-white'
                                    : isRecommending
                                        ? 'bg-gold-600 border border-gold-600 text-white scale-[0.98]'
                                        : 'bg-gold-600 border border-gold-600 text-white hover:bg-gold-700 hover:shadow-lg'
                                    }`}
                            >
                                {isRecommending ? (
                                    <div className="h-5 w-5 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                                ) : hasRecommended ? (
                                    'Opening Table...'
                                ) : (
                                    'Recommend'
                                )}
                            </button>
                            <button
                                onClick={handlePass}
                                disabled={isExpressingInterest || isRecommending || isPassing || selectedProfile.status === 'passed' || selectedProfile.status === 'liked'}
                                className="w-full sm:w-auto px-8 rounded-2xl bg-pearl-50 border border-gray-200 py-4 text-center font-medium text-gray-500 transition-all duration-300 hover:bg-gray-100 hover:text-gray-900 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {selectedProfile.status === 'passed' ? 'Passed' : 'Pass'}
                            </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
