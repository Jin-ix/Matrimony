import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MatchCard, { type MatchProfile } from './MatchCard';
import { X, ShieldAlert, Heart, Send, CheckCircle2, Video, Upload, Sparkles, MessageCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { computeIndividualCompatibility, computeFamilyValuesScore, generateAIInsight } from '../../utils/scoring';

export const MOCK_PROFILES: MatchProfile[] = [
    {
        id: '1',
        name: 'Johan',
        age: 28,
        gender: 'male',
        location: 'Chicago, IL',
        rite: 'Syro-Malabar',
        image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80',
        compatibility: 'green',
        scoutRecommended: true,
        hobbies: ['Photography', 'Hiking', 'Cooking Traditional Malayalam Food'],
        culturalDistance: 12,
    },
    {
        id: '2',
        name: 'Alexander',
        age: 30,
        gender: 'male',
        location: 'Houston, TX',
        rite: 'Knanaya Catholic',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80',
        compatibility: 'yellow',
        hobbies: ['Basketball', 'Reading Theology', 'Travel'],
        culturalDistance: 48,
    },
    {
        id: '3',
        name: 'Kevin',
        age: 29,
        gender: 'male',
        location: 'New York, NY',
        rite: 'Syro-Malankara',
        image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80',
        compatibility: 'red',
        dealbreaker: 'Different views on Sunday Mass frequency',
        hobbies: ['Investing', 'Coffee Roasting', 'Marathons'],
        culturalDistance: 71,
    },
    {
        id: '4',
        name: 'Mathew',
        age: 31,
        gender: 'male',
        location: 'Dallas, TX',
        rite: 'Knanaya Catholic',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
        compatibility: 'green',
        hobbies: ['Tennis', 'Architecture', 'Volunteering'],
    },
    {
        id: '5',
        name: 'Isaac',
        age: 27,
        gender: 'male',
        location: 'Miami, FL',
        rite: 'Syro-Malabar',
        image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&q=80',
        compatibility: 'yellow',
        hobbies: ['Surfing', 'Music Production', 'Baking'],
    },
    {
        id: '6',
        name: 'Thomas',
        age: 33,
        gender: 'male',
        location: 'Boston, MA',
        rite: 'Latin Catholic',
        image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80', // Fixed URL
        compatibility: 'green',
        scoutRecommended: true,
        hobbies: ['History Books', 'Classical Guitar', 'Museums'],
    },
    {
        id: '7',
        name: 'Ruth',
        age: 26,
        gender: 'female',
        location: 'Atlanta, GA',
        rite: 'Malankara Orthodox',
        image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80',
        compatibility: 'yellow',
        hobbies: ['Painting', 'Yoga', 'Community Outreach'],
    },
    {
        id: '8',
        name: 'Sarah',
        age: 27,
        gender: 'female',
        location: 'Seattle, WA',
        rite: 'Syro-Malabar',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
        compatibility: 'green',
        hobbies: ['Rock Climbing', 'Pottery', 'Choir'],
    },
    {
        id: '9',
        name: 'Mary',
        age: 25,
        gender: 'female',
        location: 'Austin, TX',
        rite: 'Syro-Malankara',
        image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80',
        compatibility: 'green',
        scoutRecommended: true,
        hobbies: ['Bouldering', 'Live Music', 'Board Games'],
    },
    {
        id: '10',
        name: 'Elizabeth',
        age: 29,
        gender: 'female',
        location: 'San Francisco, CA',
        rite: 'Latin Catholic',
        image: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=800&q=80',
        compatibility: 'yellow',
        hobbies: ['Tech Meetups', 'Cycling', 'Origami'],
    },
    {
        id: '11',
        name: 'Teresa',
        age: 28,
        gender: 'female',
        location: 'Chicago, IL',
        rite: 'Knanaya Catholic',
        image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80',
        compatibility: 'green',
        hobbies: ['Gardening', 'Interior Design', 'Reading'],
    }
];

interface MatchFeedGridProps {
    orthodoxBridge: boolean;
    strictKnanaya: boolean;
    activeRite: string | null;
    ageRange: number[];
    searchQuery: string;
}

export default function MatchFeedGrid({
    orthodoxBridge,
    strictKnanaya,
    activeRite,
    ageRange,
    searchQuery
}: MatchFeedGridProps) {
    const [selectedProfile, setSelectedProfile] = useState<MatchProfile | null>(null);
    const [isExpressingInterest, setIsExpressingInterest] = useState(false);
    const [hasExpressedInterest, setHasExpressedInterest] = useState(false);
    const [mutualMatchData, setMutualMatchData] = useState<{ name: string; conversationId: string } | null>(null);
    const [isRecommending, setIsRecommending] = useState(false);
    const [hasRecommended, setHasRecommended] = useState(false);
    const [isPassing, setIsPassing] = useState(false);
    const [profiles, setProfiles] = useState<MatchProfile[]>([]);
    const [receivedLikeIds, setReceivedLikeIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [icebreakerSent, setIcebreakerSent] = useState(false);
    const [myProfile, setMyProfile] = useState<any>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                let userGender = localStorage.getItem('userGender');
                const userId = localStorage.getItem('userId');

                // Fetch my profile for dynamic scoring
                let myProfileData: any = null;
                if (userId) {
                    const { data: mp } = await supabase.from('Profile').select('*').eq('userId', userId).single();
                    myProfileData = mp;
                    setMyProfile(mp);
                }

                // Fallback to fetch gender if missing
                if (!userGender && userId) {
                    if (myProfileData?.gender) {
                        userGender = myProfileData.gender;
                        localStorage.setItem('userGender', myProfileData.gender);
                    }
                }

                const res = await fetch(`http://localhost:3001/api/discovery/feed?limit=50&orthodoxBridge=${orthodoxBridge}&strictKnanaya=${strictKnanaya}${activeRite ? '&rite='+activeRite : ''}`, {
                    headers: { 'x-user-id': userId ?? '' }
                });

                if (!res.ok) throw new Error('Failed to fetch discovery feed');
                const resultData = await res.json();
                
                const randomImages = [
                    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80',
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
                    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80',
                    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80'
                ];

                if (resultData && resultData.profiles && resultData.profiles.length > 0) {
                    const mappedProfiles: MatchProfile[] = resultData.profiles.map((p: any, i: number) => {
                        return {
                            ...p,
                            image: p.image || randomImages[i % randomImages.length]
                        };
                    });
                    setProfiles(mappedProfiles);
                } else {
                    console.log('No profiles found in DB, falling back to MOCK_PROFILES');
                    const filteredMock = MOCK_PROFILES.filter(p => 
                        userGender === 'male' ? p.gender === 'female' : p.gender === 'male'
                    );
                    setProfiles(filteredMock);
                }
            } catch (e) {
                console.error('Error fetching profiles', e);
                console.log('Falling back to MOCK_PROFILES due to error');
                const userGender = localStorage.getItem('userGender') || 'female';
                const filteredMock = MOCK_PROFILES.filter(p => 
                    userGender === 'male' ? p.gender === 'female' : p.gender === 'male'
                );
                setProfiles(filteredMock);
            } finally {
                setLoading(false);
            }
        };
        fetchProfiles();

        // Fetch received likes so we can badge cards
        const fetchReceivedLikes = async () => {
            try {
                const uid = localStorage.getItem('userId') || '';
                if (!uid) return;
                const res = await fetch('http://localhost:3001/api/interactions/received', {
                    headers: { 'x-user-id': uid },
                }).catch(() => null);
                if (!res || !res.ok) return;
                const data = await res.json();
                const ids: string[] = (data.data ?? data).map((item: any) => item.fromUserId ?? item.fromUser?.id ?? '');
                setReceivedLikeIds(new Set(ids.filter(Boolean)));
            } catch (e) {
                console.error('Failed to fetch received likes', e);
            }
        };
        fetchReceivedLikes();
    }, []);

    const handleInterest = async () => {
        if (!selectedProfile) return;
        setIsExpressingInterest(true);
        try {
            const userId = localStorage.getItem('userId') || '';
            const res = await fetch('http://localhost:3001/api/interactions/interest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
                body: JSON.stringify({ toUserId: selectedProfile.id })
            }).catch((e) => { console.error('Fetch error, ignoring for UI', e); return null; });

            setProfiles(prev => prev.map(p => p.id === selectedProfile.id ? { ...p, status: 'liked' } : p));
            setSelectedProfile(prev => prev ? { ...prev, status: 'liked' } : null);

            // Check for mutual match in response
            if (res && res.ok) {
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
        } catch (error) {
            console.error('Failed to express interest', error);
        }
        setTimeout(() => {
            setIsExpressingInterest(false);
            setHasExpressedInterest(true);
        }, 1200);
    };

    const handleRecommend = async (profileId: string) => {
        setIsRecommending(true);
        try {
            const userId = localStorage.getItem('userId') || '';
            await fetch('http://localhost:3001/api/interactions/recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
                body: JSON.stringify({ toUserId: profileId, message: 'Recommended for you' })
            }).catch(e => console.error(e));
        } catch (error) {
            console.error('Failed to recommend', error);
        }
        setTimeout(() => {
            setIsRecommending(false);
            setHasRecommended(true);
            setTimeout(() => {
                navigate(`/kitchen-table/${profileId}`);
            }, 800);
        }, 1500);
    };

    const handlePass = async () => {
        if (!selectedProfile) return;
        setIsPassing(true);
        try {
            const userId = localStorage.getItem('userId') || '';
            await fetch('http://localhost:3001/api/interactions/pass', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
                body: JSON.stringify({ toUserId: selectedProfile.id })
            }).catch(e => console.error(e));
            
            setProfiles(prev => prev.map(p => p.id === selectedProfile.id ? { ...p, status: 'passed' } : p));
            setSelectedProfile(prev => prev ? { ...prev, status: 'passed' } : null);
        } catch (error) {
            console.error('Failed to pass profile', error);
        }
        setTimeout(() => {
            setSelectedProfile(null);
            setTimeout(() => {
                setIsPassing(false);
            }, 300);
        }, 800);
    };

    // Reset states when dialog closes
    const closeDialog = () => {
        setSelectedProfile(null);
        setTimeout(() => {
            setHasExpressedInterest(false);
            setMutualMatchData(null);
            setHasRecommended(false);
            setIsPassing(false);
            setIcebreakerSent(false);
        }, 300);
    };

    const filteredProfiles = profiles.filter(profile => {
        // Strict Knanaya Match Boundary
        if (strictKnanaya && profile.rite !== 'Knanaya Catholic') return false;

        // Orthodox Bridge Match Boundary
        if (!orthodoxBridge && profile.rite.includes('Orthodox')) return false;

        // Standard Rite Base filter
        if (activeRite && profile.rite !== activeRite) return false;

        // Age filter
        if (profile.age < ageRange[0] || profile.age > ageRange[1]) return false;

        // Search text matching
        if (searchQuery.trim().length > 0) {
            const query = searchQuery.toLowerCase().trim();
            const matchesName = profile.name.toLowerCase().includes(query);
            const matchesRite = profile.rite.toLowerCase().includes(query);
            const matchesLocation = profile.location.toLowerCase().includes(query);
            const matchesHobbies = profile.hobbies && profile.hobbies.some(h => h.toLowerCase().includes(query));
            
            if (!matchesName && !matchesRite && !matchesLocation && !matchesHobbies) return false;
        }

        return true;
    });

    if (loading) {
        return (
            <div className="flex w-full items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold-200 border-t-gold-600"></div>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-7xl px-6 py-10" style={{ perspective: '1200px' }}>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {filteredProfiles.length > 0 ? (
                    filteredProfiles.map((profile) => (
                        <div key={profile.id} className="relative">
                            {receivedLikeIds.has(profile.id) && (
                                <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-rose-500/90 backdrop-blur-sm px-3 py-1 text-white text-xs font-semibold shadow-lg border border-rose-400/50 pointer-events-none">
                                    <Heart className="h-3 w-3 fill-current" />
                                    <span>Liked You</span>
                                </div>
                            )}
                            <MatchCard
                                profile={profile}
                                onClick={setSelectedProfile}
                            />
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center">
                        <p className="text-xl font-serif text-gray-500 mb-2">No remaining matches found</p>
                        <p className="text-sm font-sans text-gray-400">Try adjusting your filters to expand the search.</p>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {selectedProfile && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
                    >
                        <div className="absolute inset-0 bg-pearl-50/40 backdrop-blur-[32px]" onClick={closeDialog} />

                        <motion.div
                            layoutId={`card-${selectedProfile.id}`}
                            className="relative w-full max-w-[1150px] overflow-hidden rounded-[2.5rem] bg-white h-[90vh] md:h-[85vh] max-h-[850px] shadow-[0_20px_80px_-20px_rgba(0,0,0,0.2)] flex flex-col md:flex-row mx-auto ring-1 ring-white/50 z-10"
                        >
                            <button
                                onClick={closeDialog}
                                className="absolute right-6 top-6 z-50 flex h-[42px] w-[42px] items-center justify-center rounded-full bg-white/60 text-gray-700 backdrop-blur-xl transition-all hover:bg-white hover:text-sacred-dark hover:scale-105 hover:shadow-md border border-gray-200/50"
                            >
                                <X className="h-5 w-5" />
                            </button>

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
                                    </motion.div>
                                )}

                                {/* ✨ Mutual Match Overlay */}
                                {mutualMatchData && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.92 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.92 }}
                                        className="absolute inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-xl text-white overflow-hidden"
                                        style={{ background: 'radial-gradient(ellipse at center, #92400e 0%, #78350f 40%, #1c1917 100%)' }}
                                    >
                                        {/* Sparkle rings */}
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

                                        {/* Icon */}
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

                                        {/* Text */}
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

                                        {/* Chat Button */}
                                        <motion.button
                                            initial={{ y: 24, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.5 }}
                                            onClick={() => {
                                                closeDialog();
                                                navigate(`/messages/${mutualMatchData.conversationId}`);
                                            }}
                                            className="relative z-10 mt-8 flex items-center gap-3 rounded-2xl bg-white text-sacred-dark px-8 py-4 font-semibold text-lg shadow-2xl hover:shadow-gold-500/30 hover:-translate-y-1 transition-all duration-300 active:scale-95"
                                        >
                                            <MessageCircle className="h-6 w-6 text-gold-600" />
                                            Start Chatting
                                        </motion.button>

                                        {/* Keep browsing */}
                                        <motion.button
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.7 }}
                                            onClick={closeDialog}
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
                                                <X className="w-12 h-12 text-gray-400 drop-shadow-lg" />
                                            </div>
                                            <p className="text-2xl font-serif text-gray-300 tracking-[0.2em] uppercase">Passed</p>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Left Column: Full Image */}
                            <div className="relative h-[40%] md:h-full md:w-1/2 overflow-hidden shrink-0 group z-10">
                                <motion.img
                                    layoutId={`image-${selectedProfile.id}`}
                                    src={selectedProfile.image}
                                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                    alt={selectedProfile.name}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none opacity-90 transition-opacity duration-700 group-hover:opacity-100" />

                                <div className="absolute bottom-8 left-8 right-8 pointer-events-none z-20">
                                    <motion.div layoutId={`info-${selectedProfile.id}`}>
                                        <h2 className="font-serif text-4xl lg:text-5xl text-white drop-shadow-xl tracking-tight leading-tight">{selectedProfile.name}, <span className="font-light text-white/90">{selectedProfile.age}</span></h2>
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
                            <div className="flex flex-col md:w-1/2 bg-[#FAFAF9]/90 backdrop-blur-xl relative flex-1 md:h-full overflow-hidden">
                                {/* Scrollable content area */}
                                <div className="p-6 lg:p-10 overflow-y-auto flex-1 space-y-6 scrollbar-hide pb-6">
                                    <section className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-pearl-200/50 transition-all hover:shadow-xl hover:-translate-y-1">
                                        <h3 className="font-serif text-2xl text-sacred-dark mb-4 flex items-center">
                                            <span className="w-10 h-[1.5px] bg-gold-400 mr-4"></span>
                                            Faith & Heritage
                                        </h3>
                                        <p className="text-gray-600 leading-relaxed font-sans text-lg">
                                            A dedicated member of the <span className="font-medium text-sacred-dark bg-gold-50 px-2 py-0.5 rounded-md">{selectedProfile.rite}</span> community in <span className="font-medium text-sacred-dark border-b border-pearl-300">{selectedProfile.location}</span>. Emphasizes family values and attends Sunday Mass regularly.
                                        </p>
                                    </section>

                                    <section className="bg-gradient-to-br from-gold-50/90 via-white to-gold-50/30 backdrop-blur-xl rounded-3xl p-8 shadow-[0_4px_20px_-4px_rgba(212,175,55,0.1)] border border-gold-200/50 relative overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1">
                                        <div className="absolute -right-4 -top-8 text-[140px] text-gold-500/10 font-serif leading-none select-none pointer-events-none">"</div>
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
                                        <section className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-pearl-200/50 transition-all hover:shadow-xl hover:-translate-y-1">
                                            <h3 className="font-serif text-2xl text-sacred-dark mb-6 flex items-center">
                                                <span className="w-10 h-[1.5px] bg-gold-400 mr-4"></span>
                                                Interests & Hobbies
                                            </h3>
                                            <div className="flex flex-wrap gap-3">
                                                {selectedProfile.hobbies.map((hobby, index) => (
                                                    <span
                                                        key={index}
                                                        className="px-5 py-2.5 bg-gray-50/80 text-sacred-dark rounded-full text-sm font-medium border border-gray-200/80 hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all shadow-sm"
                                                    >
                                                        {hobby}
                                                    </span>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* Diaspora Bridge: Cultural Distance Score */}
                                    {selectedProfile.culturalDistance !== undefined && (
                                        <section className="bg-gradient-to-br from-blue-950 to-indigo-900 rounded-3xl p-8 shadow-xl border border-blue-700/30 text-white relative overflow-hidden">
                                            <div className="absolute -right-6 -top-6 w-36 h-36 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                                            <div className="absolute -left-4 bottom-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
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
                                                    className="h-3 rounded-full bg-gradient-to-r from-blue-400 to-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.6)] transition-all duration-1000"
                                                    style={{ width: `${selectedProfile.culturalDistance}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between items-center relative z-10">
                                                <span className="text-3xl font-bold text-white">{Math.max(0, 100 - selectedProfile.culturalDistance)}%</span>
                                                <span className="text-blue-200 text-sm">Cultural Alignment</span>
                                            </div>
                                            {selectedProfile.culturalDistance < 30 && (
                                                <p className="mt-4 text-blue-200 text-xs italic">✦ Strong Kerala roots — ideal match for back-home families.</p>
                                            )}
                                            {selectedProfile.culturalDistance >= 50 && (
                                                <p className="mt-4 text-blue-200 text-xs italic">✦ NRI profile — likely requires bridging cultural expectations.</p>
                                            )}
                                        </section>
                                    )}

                                    {/* Family Compatibility Report */}
                                    <section className="bg-gradient-to-br from-gold-50 via-white to-amber-50/30 rounded-3xl p-8 shadow-[0_4px_20px_-4px_rgba(212,175,55,0.15)] border border-gold-200/70 relative overflow-hidden">
                                        <div className="absolute -right-8 -top-8 w-40 h-40 bg-gold-300/10 rounded-full blur-3xl pointer-events-none"></div>
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
                                            const overallLabel = indivScore >= 85 ? 'Exceptional' : indivScore >= 70 ? 'Strong' : indivScore >= 55 ? 'Moderate' : 'Developing';
                                            const overallColor = indivScore >= 85 ? 'bg-green-100 text-green-800 border-green-200' : indivScore >= 70 ? 'bg-gold-100 text-gold-800 border-gold-200' : 'bg-orange-100 text-orange-800 border-orange-200';
                                            return (
                                                <div className="space-y-4 relative z-10">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-sm font-semibold text-sacred-dark/80 uppercase tracking-wider">Overall Match</span>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide border ${overallColor}`}>
                                                            {indivScore}% {overallLabel}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="flex justify-between text-sm font-medium text-sacred-dark/80 mb-2">
                                                            <span>Individual Compatibility</span>
                                                            <span className="font-bold text-sacred-dark">{indivScore}%</span>
                                                        </div>
                                                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                                            <div className="bg-gradient-to-r from-gold-500 to-gold-300 h-2.5 rounded-full shadow-[0_0_8px_rgba(212,175,55,0.3)] transition-all duration-700" style={{ width: `${indivScore}%` }}></div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="flex justify-between text-sm font-medium text-sacred-dark/80 mb-2">
                                                            <span>Family Values Alignment</span>
                                                            <span className="font-bold text-sacred-dark">{famScore}%</span>
                                                        </div>
                                                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                                            <div className="bg-gradient-to-r from-gold-400 to-amber-300 h-2.5 rounded-full shadow-[0_0_8px_rgba(212,175,55,0.2)] transition-all duration-700" style={{ width: `${famScore}%` }}></div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 pt-4 border-t border-gold-100/60">
                                                        <p className="text-sm text-sacred-dark/60 italic leading-relaxed">
                                                            {famScore >= 80 ? `Both families share strong synergies — very low friction expected on faith, traditions, and values.` :
                                                             famScore >= 65 ? `Good alignment on core values with minor differences in cultural expectations that are easily bridged.` :
                                                             `Some differences in rite or cultural background require open conversation to align expectations.`}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </section>

                                    {/* Soul DNA Icebreaker Banner */}
                                    <section className="bg-gradient-to-br from-sacred-dark to-gray-900 rounded-3xl p-8 shadow-xl border border-white/10 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.08),transparent_60%)] pointer-events-none"></div>
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
                                                <p className="text-gray-400 text-sm mt-1">Hear their voice and energy before seeing their face. Face reveals after 3 days or mutual consent.</p>
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
                                                <p className="text-gray-500 text-xs text-center mt-2">Max 60 seconds · Will be blurred until mutual consent</p>
                                            </div>
                                        ) : (
                                            <div className="mt-6 flex items-center space-x-3 bg-gold-500/10 border border-gold-400/30 rounded-2xl p-4 relative z-10">
                                                <CheckCircle2 className="w-5 h-5 text-gold-400 flex-shrink-0" />
                                                <div>
                                                    <p className="text-gold-300 font-medium text-sm">Icebreaker sent!</p>
                                                    <p className="text-gray-400 text-xs mt-0.5">{selectedProfile.name} will receive it blurred. You both must consent to reveal.</p>
                                                </div>
                                            </div>
                                        )}
                                    </section>

                                    {selectedProfile.dealbreaker && (
                                        <section>
                                            <div className="flex items-start space-x-4 rounded-2xl bg-red-50/80 p-6 text-red-900 border border-red-100 shadow-[0_2px_10px_-4px_rgba(239,68,68,0.1)] transition-all hover:shadow-md">
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
                                <div className="shrink-0 p-6 lg:px-10 lg:py-8 bg-[#FAFAF9]/95 backdrop-blur-xl border-t border-gray-200/50 flex flex-col sm:flex-row gap-4 z-20 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.05)]">
                                        <button
                                            onClick={handleInterest}
                                            disabled={isExpressingInterest || hasExpressedInterest || isPassing || selectedProfile.status === 'liked' || selectedProfile.status === 'passed'}
                                            className={`flex-1 rounded-xl py-3.5 flex items-center justify-center text-center font-medium transition-all duration-300 shadow-lg ${
                                                hasExpressedInterest || selectedProfile.status === 'liked'
                                                ? 'bg-green-600 text-white shadow-green-600/20'
                                                : isExpressingInterest
                                                    ? 'bg-gray-900 text-white scale-[0.98]'
                                                    : 'bg-gray-900 text-white hover:bg-black hover:shadow-xl hover:-translate-y-0.5'
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
                                            onClick={() => handleRecommend(selectedProfile.id)}
                                            disabled={isRecommending || hasRecommended || isPassing}
                                            className={`flex-1 rounded-xl py-3.5 flex items-center justify-center text-center font-medium transition-all duration-300 shadow-lg ${hasRecommended
                                                ? 'bg-gold-500 text-white shadow-gold-500/20'
                                                : isRecommending
                                                    ? 'bg-gold-600 border border-gold-600 text-white scale-[0.98]'
                                                    : 'bg-gold-600 border border-gold-600 text-white hover:bg-gold-700 hover:shadow-xl hover:-translate-y-0.5'
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
                                            className="w-full sm:w-auto px-8 rounded-2xl bg-white/80 backdrop-blur-md border border-gray-200/80 py-4 text-center font-medium text-gray-500 transition-all duration-300 hover:bg-white hover:text-gray-900 hover:shadow-lg hover:-translate-y-0.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {selectedProfile.status === 'passed' ? 'Passed' : 'Pass'}
                                        </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
