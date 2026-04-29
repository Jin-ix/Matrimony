import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, MapPin, Loader2, ChevronRight } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function MatchBrowser({ onClose }: { onClose: () => void }) {
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                const userId = localStorage.getItem('userId');
                if (!userId) {
                    setError('User ID not found.');
                    return;
                }
                
                const userGender = localStorage.getItem('userGender') || '';
                const userRole = localStorage.getItem('userRole') || 'candidate';

                try {
                    const res = await fetch(`${API}/discovery/feed`, {
                        headers: { 
                            'x-user-id': userId,
                            'x-user-gender': userGender,
                            'x-user-role': userRole
                        }
                    });
                    
                    if (res.ok) {
                        const data = await res.json();
                        setMatches(data.profiles || []);
                        return; // exit early if backend success
                    }
                } catch (apiErr) {
                    console.log('Backend feed failed, using Supabase fallback', apiErr);
                }

                // Fallback direct to Supabase
                import('../../lib/supabase').then(async ({ supabase }) => {
                    const targetGender = userGender === 'male' ? 'female' : 'male';
                    const { data: fallbackProfiles, error: supaErr } = await supabase
                        .from('Profile')
                        .select('*')
                        .neq('userId', userId)
                        .eq('gender', targetGender)
                        .limit(20);

                    if (supaErr) throw new Error(`Supabase Error: ${supaErr.message}`);

                    if (fallbackProfiles) {
                        const profileIds = fallbackProfiles.map(p => p.userId);
                        const { data: photos } = await supabase.from('Photo').select('userId,url').in('userId', profileIds).eq('isPrimary', true);
                        const photoMap = new Map((photos || []).map(ph => [ph.userId, ph.url]));

                        const fallbackMatches = fallbackProfiles.map(p => ({
                            id: p.userId,
                            name: p.firstName || 'Candidate',
                            age: p.age || 25,
                            gender: p.gender,
                            location: p.location || '',
                            rite: p.rite || '',
                            image: photoMap.get(p.userId) || (targetGender === 'male' 
                                ? 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80'
                                : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80'),
                            compatibility: 'yellow' as const,
                            hobbies: p.hobbies || []
                        }));
                        setMatches(fallbackMatches);
                    }
                }).finally(() => {
                    setLoading(false);
                });
            } catch (err: any) {
                setError(err.message || 'Error loading matches');
                setLoading(false);
            }
        };

        fetchMatches();
    }, []);

    const handleSelectMatch = (candidateId: string) => {
        onClose();
        navigate(`/kitchen-table/${candidateId}`);
    };

    if (loading) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center p-6 text-sacred-dark/60">
                <Loader2 className="h-8 w-8 animate-spin text-gold-500 mb-4" />
                <p>Finding potential matches...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full flex items-center justify-center p-6 text-red-500">
                <p>{error}</p>
            </div>
        );
    }

    if (matches.length === 0) {
        return (
            <div className="h-full flex items-center justify-center p-6 text-sacred-dark/60 text-center">
                <p>No matches available right now. Please check your discovery preferences.</p>
            </div>
        );
    }

    return (
        <div className="h-full w-full overflow-y-auto p-4 space-y-3 no-scrollbar bg-sacred-offwhite">
            {matches.map((match, i) => (
                <motion.button
                    key={match.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleSelectMatch(match.id)}
                    className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gold-100 hover:shadow-md hover:border-gold-300 transition-all flex items-center gap-4 text-left group"
                >
                    <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden shadow-inner">
                        <img 
                            src={match.image || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80'} 
                            alt={match.name}
                            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <h4 className="font-serif text-lg text-sacred-dark truncate border-b border-transparent group-hover:border-gold-200 w-fit transition-colors">
                            {match.name}, {match.age}
                        </h4>
                        <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3 text-gold-400" /> {match.location}
                        </p>
                        <p className="text-[11px] text-gold-700 font-medium bg-gold-50 w-fit px-2 py-0.5 rounded-full mt-1.5 truncate">
                            {match.rite}
                        </p>
                    </div>

                    <div className="flex flex-col items-center justify-center shrink-0 w-12 border-l border-gray-100 pl-2">
                        {match.compatibility === 'green' && <ShieldCheck className="h-5 w-5 text-green-500 mb-1" />}
                        {match.compatibility === 'yellow' && <ShieldCheck className="h-5 w-5 text-yellow-500 mb-1" />}
                        {match.compatibility === 'red' && <ShieldCheck className="h-5 w-5 text-red-400 mb-1" />}
                        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gold-500 transition-colors" />
                    </div>
                </motion.button>
            ))}
        </div>
    );
}
