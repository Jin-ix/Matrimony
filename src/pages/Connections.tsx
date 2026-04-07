import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, ArrowLeft, Loader2, Link } from 'lucide-react';
import TopNavigation from '../components/discovery/TopNavigation';

interface ProfileSummary {
    id: string; // the actual profile user id
    name: string;
    avatar: string;
    location?: string;
    rite?: string;
}

interface ConversationItem {
    conversationId: string;
    matchUser: ProfileSummary;
    lastMessage?: string;
    lastMessageTime?: string;
}

interface InterestItem {
    id: string; // interest record id
    userId: string; // the other person's user id
    user: ProfileSummary;
    createdAt: string;
}

export default function Connections() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'matches' | 'shortlisted' | 'received'>('matches');
    const [loading, setLoading] = useState(true);
    
    const [matches, setMatches] = useState<ConversationItem[]>([]);
    const [shortlisted, setShortlisted] = useState<InterestItem[]>([]);
    const [received, setReceived] = useState<InterestItem[]>([]);

    useEffect(() => {
        const fetchConnections = async () => {
            setLoading(true);
            try {
                const userId = localStorage.getItem('userId');
                if (!userId) {
                    navigate('/auth');
                    return;
                }

                // Parallel fetch
                const [convRes, sentRes, receivedRes] = await Promise.all([
                    fetch('http://localhost:3001/api/conversations', { headers: { 'x-user-id': userId } }),
                    fetch('http://localhost:3001/api/interactions/sent', { headers: { 'x-user-id': userId } }),
                    fetch('http://localhost:3001/api/interactions/received', { headers: { 'x-user-id': userId } })
                ]);

                let fetchedMatches: ConversationItem[] = [];
                let fetchedSent: InterestItem[] = [];
                let fetchedReceived: InterestItem[] = [];

                if (convRes.ok) {
                    const data = await convRes.json();
                    if (data.conversations && Array.isArray(data.conversations)) {
                        fetchedMatches = data.conversations.map((c: any) => {
                            const other = c.participants?.find((p: any) => p.userId !== userId)?.user;
                            return {
                                conversationId: c.id,
                                matchUser: {
                                    id: other?.id,
                                    name: other?.profile?.firstName || 'Unknown',
                                    avatar: other?.photos?.[0]?.url || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80',
                                    location: other?.profile?.location,
                                    rite: other?.profile?.rite
                                },
                                lastMessage: c.messages?.[0]?.text,
                                lastMessageTime: c.messages?.[0]?.createdAt
                            };
                        });
                    }
                }

                if (sentRes.ok) {
                    const data = await sentRes.json();
                    const records = data.data ?? data;
                    if (Array.isArray(records)) {
                        fetchedSent = records.map((r: any) => ({
                            id: r.id,
                            userId: r.toUser?.id,
                            user: {
                                id: r.toUser?.id,
                                name: r.toUser?.profile?.firstName || 'Unknown',
                                avatar: r.toUser?.photos?.[0]?.url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80',
                                location: r.toUser?.profile?.location,
                                rite: r.toUser?.profile?.rite
                            },
                            createdAt: r.createdAt
                        }));
                    }
                }

                if (receivedRes.ok) {
                    const data = await receivedRes.json();
                    const records = data.data ?? data;
                    if (Array.isArray(records)) {
                        fetchedReceived = records.map((r: any) => ({
                            id: r.id,
                            userId: r.fromUser?.id,
                            user: {
                                id: r.fromUser?.id,
                                name: r.fromUser?.profile?.firstName || 'Unknown',
                                avatar: r.fromUser?.photos?.[0]?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
                                location: r.fromUser?.profile?.location,
                                rite: r.fromUser?.profile?.rite
                            },
                            createdAt: r.createdAt
                        }));
                    }
                }

                // Deduplicate logic: remove those from shortlisted/received who are already in our matches
                const matchUserIds = new Set(fetchedMatches.map(m => m.matchUser.id));
                const finalShortlisted = fetchedSent.filter(s => !matchUserIds.has(s.userId));
                // Only show active interests in received (not mutual)
                const finalReceived = fetchedReceived.filter(r => !matchUserIds.has(r.userId));

                setMatches(fetchedMatches);
                setShortlisted(finalShortlisted);
                setReceived(finalReceived);

            } catch (err) {
                console.error("Failed to fetch connections", err);
            } finally {
                setLoading(false);
            }
        };

        fetchConnections();
    }, [navigate]);

    return (
        <div className="min-h-screen bg-sacred-offwhite text-sacred-dark font-sans selection:bg-gold-200 flex flex-col">
            <TopNavigation />

            <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 md:px-8">
                <div className="mb-8">
                    <button 
                        onClick={() => navigate('/discovery')}
                        className="flex items-center text-gray-500 hover:text-gold-600 transition-colors mb-4 text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1.5" />
                        Back to Discovery
                    </button>
                    <h1 className="text-4xl font-serif text-sacred-dark">Your Connections</h1>
                    <p className="text-gray-500 mt-2 font-medium">Keep track of your mutual matches and expressed interests.</p>
                </div>

                {/* Tabs */}
                <div className="flex space-x-2 border-b border-pearl-200 mb-8 overflow-x-auto scrollbar-hide">
                    {[
                        { id: 'matches', label: 'Matched Profiles', count: matches.length },
                        { id: 'shortlisted', label: 'Shortlisted', count: shortlisted.length },
                        { id: 'received', label: 'Received Likes', count: received.length }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center whitespace-nowrap px-6 py-4 text-sm font-semibold transition-all duration-300 border-b-2 ${
                                activeTab === tab.id 
                                ? 'border-gold-500 text-gold-700 bg-gold-50/50' 
                                : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50/50'
                            }`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                                    activeTab === tab.id ? 'bg-gold-200 text-gold-800' : 'bg-gray-100 text-gray-500'
                                }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="relative min-h-[400px]">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-gold-400" />
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {activeTab === 'matches' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {matches.length === 0 ? (
                                            <div className="col-span-full py-20 text-center">
                                                <Link className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                                <h3 className="font-serif text-2xl text-gray-400 mb-2">No Matches Yet</h3>
                                                <p className="text-gray-500">Keep exploring and expressing interest to find your match.</p>
                                            </div>
                                        ) : (
                                            matches.map((m) => (
                                                <div 
                                                    key={m.conversationId}
                                                    onClick={() => navigate(`/messages/${m.conversationId}`)}
                                                    className="bg-white rounded-[24px] border border-pearl-200 p-5 flex items-center cursor-pointer hover:border-gold-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                                                >
                                                    <div className="relative mr-5 shrink-0">
                                                        <img src={m.matchUser.avatar} alt={m.matchUser.name} className="w-16 h-16 rounded-full object-cover border-2 border-transparent group-hover:border-gold-300 transition-colors" />
                                                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-serif text-lg font-medium text-sacred-dark truncate group-hover:text-gold-700 transition-colors">{m.matchUser.name}</h3>
                                                        <div className="flex items-center text-xs text-gray-500 mt-1 truncate">
                                                            <span>{m.matchUser.location || 'Location Unknown'}</span>
                                                            {m.matchUser.rite && <><span className="mx-1">•</span><span>{m.matchUser.rite}</span></>}
                                                        </div>
                                                        <p className="text-sm text-gray-400 mt-2 truncate max-w-full">
                                                            {m.lastMessage || 'Say hi to start the conversation!'}
                                                        </p>
                                                    </div>
                                                    <div className="shrink-0 w-10 h-10 ml-4 rounded-full bg-gold-50 flex items-center justify-center group-hover:bg-gold-500 transition-colors">
                                                        <MessageCircle className="w-5 h-5 text-gold-600 group-hover:text-white transition-colors" />
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {activeTab === 'shortlisted' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {shortlisted.length === 0 ? (
                                            <div className="col-span-full py-20 text-center">
                                                <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                                <h3 className="font-serif text-2xl text-gray-400 mb-2">No Shortlisted Profiles</h3>
                                                <p className="text-gray-500">Profiles you express interest in will appear here until they match back.</p>
                                            </div>
                                        ) : (
                                            shortlisted.map((s) => (
                                                <div 
                                                    key={s.id}
                                                    className="bg-white rounded-[24px] border border-pearl-200 p-5 flex items-center shadow-sm"
                                                >
                                                    <img src={s.user.avatar} alt={s.user.name} className="w-14 h-14 rounded-full object-cover shrink-0 mr-4 border border-gray-100" />
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-serif text-lg font-medium text-sacred-dark truncate">{s.user.name}</h3>
                                                        <div className="text-xs text-gray-500 truncate mt-0.5">
                                                            {s.user.location || 'Location Unknown'}
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0 ml-4">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">Pending</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {activeTab === 'received' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {received.length === 0 ? (
                                            <div className="col-span-full py-20 text-center">
                                                <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                                <h3 className="font-serif text-2xl text-gray-400 mb-2">No Received Likes</h3>
                                                <p className="text-gray-500">When someone expresses interest in your profile, it will appear here.</p>
                                            </div>
                                        ) : (
                                            received.map((r) => (
                                                <div 
                                                    key={r.id}
                                                    className="bg-white rounded-[24px] border border-pearl-200 p-5 flex items-center shadow-[0_4px_20px_-4px_rgba(225,29,72,0.1)] border-rose-100 hover:border-rose-300 transition-colors cursor-pointer"
                                                >
                                                    <img src={r.user.avatar} alt={r.user.name} className="w-14 h-14 rounded-full object-cover shrink-0 mr-4 border-2 border-rose-100" />
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-serif text-lg font-medium text-sacred-dark truncate">{r.user.name}</h3>
                                                        <div className="text-xs text-gray-500 truncate mt-0.5">
                                                            {r.user.location || 'Location Unknown'}
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0 bg-rose-500 w-8 h-8 rounded-full flex items-center justify-center shadow-md ml-3 hover:bg-rose-600 transition-colors">
                                                        <Heart className="w-4 h-4 text-white fill-white" />
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>
            </main>
        </div>
    );
}
