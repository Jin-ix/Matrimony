import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MatchCard, { type MatchProfile } from './MatchCard';
import { X, ShieldAlert, Heart, Send, CheckCircle2, Video, Upload, Sparkles, MessageCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { computeIndividualCompatibility, computeFamilyValuesScore, generateAIInsight } from '../../utils/scoring';
import type { AdvancedFilters } from './AdvancedFiltersModal';

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
    advancedFilters: AdvancedFilters;
    searchQuery: string;
}

export default function MatchFeedGrid({
    orthodoxBridge,
    strictKnanaya,
    activeRite,
    advancedFilters,
    searchQuery
}: MatchFeedGridProps) {
    const [profiles, setProfiles] = useState<MatchProfile[]>([]);
    const [receivedLikeIds, setReceivedLikeIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [myProfile, setMyProfile] = useState<any>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                const userId = localStorage.getItem('userId');
                let userGender = localStorage.getItem('userGender');

                // ── Step 1: Fetch my own profile (gender + scoring data) ──────
                let myProfileData: any = null;
                if (userId) {
                    const { data: mp } = await supabase.from('Profile').select('*').eq('userId', userId).single();
                    myProfileData = mp;
                    setMyProfile(mp);
                    if (!userGender && mp?.gender) {
                        userGender = mp.gender;
                        localStorage.setItem('userGender', mp.gender);
                    }
                }

                // ── Step 2: Try backend API (4-second timeout) ────────────────
                let backendSucceeded = false;
                try {
                    const params = new URLSearchParams({
                        limit: '50',
                        orthodoxBridge: String(orthodoxBridge),
                        strictKnanaya: String(strictKnanaya),
                    });
                    if (activeRite) params.set('rite', activeRite);
                    if (advancedFilters.ageRange[0] !== 18) params.set('minAge', String(advancedFilters.ageRange[0]));
                    if (advancedFilters.ageRange[1] !== 60) params.set('maxAge', String(advancedFilters.ageRange[1]));
                    if (advancedFilters.location) params.set('location', advancedFilters.location);
                    if (advancedFilters.rite !== 'Any') params.set('rite', advancedFilters.rite);
                    if (advancedFilters.maritalStatus !== 'Any') params.set('maritalStatus', advancedFilters.maritalStatus);
                    if (advancedFilters.education !== 'Any') params.set('education', advancedFilters.education);
                    if (advancedFilters.diet !== 'Any') params.set('diet', advancedFilters.diet);
                    if (advancedFilters.motherTongue !== 'Any') params.set('motherTongue', advancedFilters.motherTongue);
                    if (advancedFilters.smoke !== 'any') params.set('smoke', advancedFilters.smoke === 'yes' ? 'true' : 'false');
                    if (advancedFilters.drink !== 'any') params.set('drink', advancedFilters.drink === 'yes' ? 'true' : 'false');

                    const res = await fetch(`http://localhost:3001/api/discovery/feed?${params.toString()}`, {
                        signal: AbortSignal.timeout(4000),
                        headers: { 'x-user-id': userId ?? '', 'x-user-gender': userGender ?? '' },
                    });
                    if (res.ok) {
                        const resultData = await res.json();
                        if (resultData?.profiles?.length > 0) {
                            const maleImgs = [
                                'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80',
                                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80',
                                'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80',
                                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
                            ];
                            const femaleImgs = [
                                'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80',
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
                                'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80',
                                'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=800&q=80',
                            ];
                            const fbImgs = userGender === 'female' ? maleImgs : femaleImgs;
                            setProfiles(resultData.profiles.map((p: any, i: number) => ({
                                ...p,
                                image: p.image || fbImgs[i % fbImgs.length],
                                culturalDistance: p.culturalDistance ?? undefined,
                            })));
                            backendSucceeded = true;
                        }
                    }
                } catch {
                    // Backend unavailable — continue to Supabase direct
                }
                if (backendSucceeded) return;

                // ── Step 3: Query Supabase directly ───────────────────────────
                console.log('[Discovery] Backend unavailable — querying Supabase directly');

                const targetGender = userGender === 'male' ? 'female' : userGender === 'female' ? 'male' : null;

                let excludeIds = [userId ?? ''];
                if (userId) {
                    const { data: myInteractions } = await supabase
                        .from('Interest')
                        .select('toUserId')
                        .eq('fromUserId', userId);
                    if (myInteractions) {
                        excludeIds = [...excludeIds, ...myInteractions.map((i: any) => i.toUserId)];
                    }
                }

                const RITE_DISPLAY_MAP: Record<string, string> = {
                    SYRO_MALABAR: 'Syro-Malabar', LATIN: 'Latin',
                    KNANAYA_CATHOLIC: 'Knanaya Catholic', MALANKARA_ORTHODOX: 'Malankara Orthodox',
                    SYRO_MALANKARA: 'Syro-Malankara', OTHER: 'Other',
                };
                const RITE_REVERSE: Record<string, string> = {
                    'Syro-Malabar': 'SYRO_MALABAR', 'Latin': 'LATIN',
                    'Knanaya Catholic': 'KNANAYA_CATHOLIC', 'Malankara Orthodox': 'MALANKARA_ORTHODOX',
                    'Syro-Malankara': 'SYRO_MALANKARA',
                };

                let q = supabase
                    .from('Profile')
                    .select('*')
                    .not('userId', 'in', `(${excludeIds.map(id => `"${id}"`).join(',')})`)
                    .limit(50)
                    .order('createdAt', { ascending: false });

                if (targetGender) q = q.eq('gender', targetGender);
                if (strictKnanaya) q = q.eq('rite', 'KNANAYA_CATHOLIC');

                const riteFilterVal = advancedFilters.rite !== 'Any'
                    ? advancedFilters.rite
                    : activeRite ?? null;
                if (riteFilterVal && !strictKnanaya) {
                    q = q.eq('rite', RITE_REVERSE[riteFilterVal] ?? riteFilterVal);
                }
                if (advancedFilters.ageRange[0] !== 18) q = q.gte('age', advancedFilters.ageRange[0]);
                if (advancedFilters.ageRange[1] !== 60) q = q.lte('age', advancedFilters.ageRange[1]);
                if (advancedFilters.location.trim()) q = q.ilike('location', `%${advancedFilters.location.trim()}%`);
                if (advancedFilters.maritalStatus !== 'Any') q = q.eq('maritalStatus', advancedFilters.maritalStatus);
                if (advancedFilters.diet !== 'Any') q = q.eq('dietaryPreference', advancedFilters.diet);

                const { data: dbProfiles, error: dbError } = await q;
                if (dbError) { console.error('Supabase query error:', dbError.message); throw dbError; }

                if (dbProfiles && dbProfiles.length > 0) {
                    // Batch-fetch primary photos
                    const uids = dbProfiles.map((p: any) => p.userId);
                    const { data: photos } = await supabase
                        .from('Photo').select('userId,url').in('userId', uids).eq('isPrimary', true);
                    const photoMap: Record<string, string> = {};
                    (photos ?? []).forEach((ph: any) => { photoMap[ph.userId] = ph.url; });

                    // Ghost-mode check via User table
                    const { data: users } = await supabase
                        .from('User').select('id,ghostMode').in('id', uids);
                    const ghostSet = new Set((users ?? []).filter((u: any) => u.ghostMode).map((u: any) => u.id));

                    const myRite = myProfileData?.rite ?? '';
                    const compatScore = (rite: string): 'green' | 'yellow' | 'red' => {
                        if (!myRite) return 'yellow';
                        if (rite === myRite) return 'green';
                        const eastern = ['SYRO_MALABAR','SYRO_MALANKARA','MALANKARA_ORTHODOX'];
                        if (eastern.includes(rite) && eastern.includes(myRite)) return 'yellow';
                        if (['KNANAYA_CATHOLIC'].includes(rite) || ['KNANAYA_CATHOLIC'].includes(myRite)) return 'red';
                        return 'yellow';
                    };

                    const maleImgs = [
                        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80',
                        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80',
                        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80',
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
                        'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&q=80',
                    ];
                    const femaleImgs = [
                        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80',
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
                        'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80',
                        'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=800&q=80',
                        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80',
                    ];
                    const fbImgs = userGender === 'female' ? maleImgs : femaleImgs;

                    const mapped: MatchProfile[] = dbProfiles
                        .filter((p: any) => !ghostSet.has(p.userId))
                        .map((p: any, i: number) => ({
                            id: p.userId,
                            name: p.firstName || 'Anonymous',
                            age: p.age ?? 25,
                            gender: (p.gender ?? targetGender ?? 'male') as 'male' | 'female',
                            location: p.location ?? '',
                            rite: RITE_DISPLAY_MAP[p.rite] ?? p.rite ?? '',
                            image: photoMap[p.userId] || fbImgs[i % fbImgs.length],
                            compatibility: compatScore(p.rite),
                            hobbies: p.hobbies ?? [],
                            scoutRecommended: false,
                        }));

                    setProfiles(mapped);
                } else {
                    // ── Step 4: Mock fallback ─────────────────────────────────
                    console.log('[Discovery] No profiles in DB — using mock data');
                    setProfiles(MOCK_PROFILES.filter(p =>
                        userGender === 'male' ? p.gender === 'female' : p.gender === 'male'
                    ));
                }
            } catch (e) {
                console.error('[Discovery] Fetch failed:', e);
                const g = localStorage.getItem('userGender') || 'female';
                setProfiles(MOCK_PROFILES.filter(p => g === 'male' ? p.gender === 'female' : p.gender === 'male'));
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



    const filteredProfiles = profiles.filter(profile => {
        // Strict Knanaya Match Boundary
        if (strictKnanaya && profile.rite !== 'Knanaya Catholic') return false;

        // Orthodox Bridge Match Boundary
        if (!orthodoxBridge && profile.rite.includes('Orthodox')) return false;

        // Standard Rite Base filter (from FilterControlBar quick pill)
        if (activeRite && profile.rite !== activeRite) return false;

        // Advanced filter: rite override
        if (advancedFilters.rite !== 'Any' && profile.rite !== advancedFilters.rite) return false;

        // Age filter
        if (profile.age < advancedFilters.ageRange[0] || profile.age > advancedFilters.ageRange[1]) return false;

        // Location filter (partial, case-insensitive)
        if (advancedFilters.location.trim()) {
            const loc = advancedFilters.location.toLowerCase();
            if (!profile.location?.toLowerCase().includes(loc)) return false;
        }

        // Search text matching
        if (searchQuery.trim().length > 0) {
            const query = searchQuery.toLowerCase().trim();
            const matchesName = profile.name.toLowerCase().includes(query);
            const matchesRite = profile.rite.toLowerCase().includes(query);
            const matchesLocation = profile.location?.toLowerCase().includes(query);
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
                                onClick={(p) => navigate(`/profile/${p.id}`, { state: { profile: p, myProfile } })}
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


        </div>
    );
}
