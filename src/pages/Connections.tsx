import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, ArrowLeft, Loader2, Link, Sparkles, CheckCircle2, X } from 'lucide-react';
import TopNavigation from '../components/discovery/TopNavigation';
import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProfileSummary {
    id: string;
    name: string;
    avatar: string;
    location?: string;
    rite?: string;
    age?: number;
}

interface MatchItem {
    conversationId: string;
    matchUser: ProfileSummary;
    lastMessage?: string;
    lastMessageTime?: string;
}

interface ReceivedItem {
    interestId: string;
    userId: string;       // the person who liked you
    user: ProfileSummary;
    createdAt: string;
    isMutual: boolean;    // true if YOU also liked them back
    conversationId?: string;
}

interface SentItem {
    interestId: string;
    userId: string;
    user: ProfileSummary;
    createdAt: string;
    isMutual: boolean;
    conversationId?: string;
}

// ─── Rite display map ─────────────────────────────────────────────────────────
const RITE_DISPLAY: Record<string, string> = {
    SYRO_MALABAR: 'Syro-Malabar', LATIN: 'Latin',
    KNANAYA_CATHOLIC: 'Knanaya Catholic', MALANKARA_ORTHODOX: 'Malankara Orthodox',
    SYRO_MALANKARA: 'Syro-Malankara', OTHER: 'Other',
};

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ type, message }: { type: 'success' | 'error' | 'match'; message: string }) {
    const styles = {
        success: 'bg-emerald-900 text-white',
        error: 'bg-rose-900 text-white',
        match: 'bg-gradient-to-r from-amber-800 to-yellow-700 text-white',
    };
    return (
        <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 rounded-2xl px-5 py-3.5 shadow-2xl text-sm font-medium pointer-events-none ${styles[type]}`}
        >
            {type === 'match' ? <Sparkles className="w-4 h-4 fill-current" /> : type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {message}
        </motion.div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Connections() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'matches' | 'shortlisted' | 'received'>('matches');
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ type: 'success' | 'error' | 'match'; message: string } | null>(null);

    const [matches, setMatches] = useState<MatchItem[]>([]);
    const [shortlisted, setShortlisted] = useState<SentItem[]>([]);
    const [received, setReceived] = useState<ReceivedItem[]>([]);

    const showToast = useCallback((type: 'success' | 'error' | 'match', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    }, []);

    // ── Helper: fetch a user's display info from Supabase ─────────────────────
    const fetchUserInfo = useCallback(async (uid: string): Promise<ProfileSummary> => {
        const [{ data: profile }, { data: photo }] = await Promise.all([
            supabase.from('Profile').select('firstName,location,rite,age').eq('userId', uid).single(),
            supabase.from('Photo').select('url').eq('userId', uid).eq('isPrimary', true).single(),
        ]);
        return {
            id: uid,
            name: profile?.firstName || 'Unknown',
            location: profile?.location || undefined,
            rite: RITE_DISPLAY[profile?.rite || ''] || profile?.rite || undefined,
            age: profile?.age || undefined,
            avatar: photo?.url || (profile?.rite === 'male'
                ? 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80'
                : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80'),
        };
    }, []);

    // ── Main fetch: Supabase direct (no backend required) ─────────────────────
    const fetchAll = useCallback(async () => {
        setLoading(true);
        const userId = localStorage.getItem('userId');
        if (!userId) { navigate('/auth'); return; }

        try {
            // 1) Interests sent BY me
            const { data: sentRaw } = await supabase
                .from('Interest')
                .select('id,toUserId,createdAt')
                .eq('fromUserId', userId)
                .eq('type', 'interest')
                .order('createdAt', { ascending: false });

            // 2) Interests sent TO me
            const { data: receivedRaw } = await supabase
                .from('Interest')
                .select('id,fromUserId,createdAt')
                .eq('toUserId', userId)
                .eq('type', 'interest')
                .order('createdAt', { ascending: false });

            // 3) Conversations (mutual matches)
            const { data: convParticipants } = await supabase
                .from('ConversationParticipant')
                .select('conversationId,conversation:conversationId(id,createdAt)')
                .eq('userId', userId);

            const convIds = (convParticipants ?? []).map((cp: any) => cp.conversationId);

            // Get the OTHER participant for reach conversation
            const { data: otherParticipants } = convIds.length > 0 ? await supabase
                .from('ConversationParticipant')
                .select('conversationId,userId')
                .in('conversationId', convIds)
                .neq('userId', userId) : { data: [] };

            // Get last messages
            const { data: lastMessages } = convIds.length > 0 ? await supabase
                .from('Message')
                .select('conversationId,text,createdAt')
                .in('conversationId', convIds)
                .order('createdAt', { ascending: false }) : { data: [] };

            const lastMsgMap: Record<string, { text: string; createdAt: string }> = {};
            (lastMessages ?? []).forEach((m: any) => {
                if (!lastMsgMap[m.conversationId]) lastMsgMap[m.conversationId] = { text: m.text, createdAt: m.createdAt };
            });

            // Build a map: otherUserId → conversationId (for mutual match detection)
            const otherToConvMap: Record<string, string> = {};
            (otherParticipants ?? []).forEach((op: any) => {
                otherToConvMap[op.userId] = op.conversationId;
            });

            // Build sets for quick lookup
            const sentToIds = new Set((sentRaw ?? []).map((r: any) => r.toUserId));
            const receivedFromIds = new Set((receivedRaw ?? []).map((r: any) => r.fromUserId));
            const mutualUserIds = new Set([...sentToIds].filter(id => receivedFromIds.has(id)));

            // 4) Fetch user info in parallel for all unique user IDs we need
            const allUids = new Set([
                ...(sentRaw ?? []).map((r: any) => r.toUserId),
                ...(receivedRaw ?? []).map((r: any) => r.fromUserId),
                ...(otherParticipants ?? []).map((op: any) => op.userId),
            ]);
            const userInfoMap: Record<string, ProfileSummary> = {};
            await Promise.all([...allUids].map(async uid => {
                userInfoMap[uid] = await fetchUserInfo(uid);
            }));

            // 5) Build MATCHES (conversations)
            const builtMatches: MatchItem[] = (otherParticipants ?? []).map((op: any) => ({
                conversationId: op.conversationId,
                matchUser: userInfoMap[op.userId] || { id: op.userId, name: 'Unknown', avatar: '' },
                lastMessage: lastMsgMap[op.conversationId]?.text,
                lastMessageTime: lastMsgMap[op.conversationId]?.createdAt,
            }));

            // 6) Build RECEIVED (people who liked me)
            const builtReceived: ReceivedItem[] = (receivedRaw ?? []).map((r: any) => ({
                interestId: r.id,
                userId: r.fromUserId,
                user: userInfoMap[r.fromUserId] || { id: r.fromUserId, name: 'Unknown', avatar: '' },
                createdAt: r.createdAt,
                isMutual: mutualUserIds.has(r.fromUserId),
                conversationId: otherToConvMap[r.fromUserId],
            }));

            // 7) Build SHORTLISTED (interests I sent that haven't mutually matched yet)
            const builtSent: SentItem[] = (sentRaw ?? [])
                .filter((r: any) => !mutualUserIds.has(r.toUserId))   // exclude those already in matches
                .map((r: any) => ({
                    interestId: r.id,
                    userId: r.toUserId,
                    user: userInfoMap[r.toUserId] || { id: r.toUserId, name: 'Unknown', avatar: '' },
                    createdAt: r.createdAt,
                    isMutual: false,
                    conversationId: undefined,
                }));

            setMatches(builtMatches);
            setReceived(builtReceived);
            setShortlisted(builtSent);
        } catch (err) {
            console.error('[Connections] fetch failed', err);
        } finally {
            setLoading(false);
        }
    }, [navigate, fetchUserInfo]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // ── Like back action ──────────────────────────────────────────────────────
    const handleLikeBack = async (item: ReceivedItem) => {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        try {
            // Try backend first
            const res = await fetch('http://localhost:3001/api/interactions/interest', {
                method: 'POST',
                signal: AbortSignal.timeout(4000),
                headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
                body: JSON.stringify({ toUserId: item.userId }),
            }).catch(() => null);

            let conversationId: string | undefined;

            if (res?.ok) {
                const json = await res.json().catch(() => null);
                conversationId = json?.conversationId;
            } else {
                // Helper for ID generation
                const genId = () => typeof crypto.randomUUID === 'function' 
                    ? crypto.randomUUID() 
                    : Math.random().toString(36).substring(2) + Date.now().toString(36);

                // Supabase direct fallback
                const { error: insertError } = await supabase.from('Interest').insert([{
                    id: genId(),
                    fromUserId: userId,
                    toUserId: item.userId,
                    type: 'interest',
                    createdAt: new Date().toISOString(),
                }]);
                if (insertError && !insertError.message.includes('duplicate')) {
                    throw insertError;
                }

                // Create conversation for mutual match
                const newConvId = genId();
                const { data: conv, error: convError } = await supabase
                    .from('Conversation')
                    .insert([{ 
                        id: newConvId,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    }])
                    .select('id')
                    .single();

                if (convError) throw convError;

                if (conv?.id) {
                    await supabase.from('ConversationParticipant').insert([
                        { id: genId(), conversationId: conv.id, userId, joinedAt: new Date().toISOString() },
                        { id: genId(), conversationId: conv.id, userId: item.userId, joinedAt: new Date().toISOString() },
                    ]);
                    conversationId = conv.id;
                }
            }

            showToast('match', `It's a Match with ${item.user.name}! 💍`);

            // Update local state: move from received to matches
            setReceived(prev => prev.map(r =>
                r.userId === item.userId ? { ...r, isMutual: true, conversationId } : r
            ));
            if (conversationId) {
                setMatches(prev => [{
                    conversationId,
                    matchUser: item.user,
                }, ...prev]);
            }

            // Offer to navigate to chat
            setTimeout(() => {
                if (conversationId) navigate(`/messages/${conversationId}`);
            }, 1800);
        } catch (e) {
            console.error('[LikeBack] error:', e);
            showToast('error', 'Something went wrong. Please try again.');
        }
    };

    // ── Time formatting ───────────────────────────────────────────────────────
    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const m = Math.floor(diff / 60000);
        if (m < 1) return 'just now';
        if (m < 60) return `${m}m ago`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}h ago`;
        return `${Math.floor(h / 24)}d ago`;
    };

    const tabs = [
        { id: 'matches' as const, label: 'Matched Profiles', count: matches.length },
        { id: 'shortlisted' as const, label: 'Shortlisted', count: shortlisted.length },
        { id: 'received' as const, label: 'Received Likes', count: received.length },
    ];

    return (
        <div className="min-h-screen bg-sacred-offwhite text-sacred-dark font-sans selection:bg-gold-200 flex flex-col">
            <AnimatePresence>{toast && <Toast type={toast.type} message={toast.message} />}</AnimatePresence>
            <TopNavigation />

            <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 md:px-8">
                {/* Header */}
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
                <div className="flex space-x-1 border-b border-pearl-200 mb-8 overflow-x-auto scrollbar-hide">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center whitespace-nowrap px-5 py-4 text-sm font-semibold transition-all duration-300 border-b-2 ${
                                activeTab === tab.id
                                    ? 'border-gold-500 text-gold-700 bg-gold-50/50'
                                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50/50'
                            }`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                                    activeTab === tab.id ? 'bg-gold-200 text-gold-800' : 'bg-gray-100 text-gray-500'
                                }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <div className="relative min-h-[400px]">
                    {loading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-400">
                            <Loader2 className="w-8 h-8 animate-spin text-gold-400" />
                            <p className="text-sm">Loading connections…</p>
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
                                {/* ── MATCHES ── */}
                                {activeTab === 'matches' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {matches.length === 0 ? (
                                            <EmptyState icon={<Link className="h-10 w-10 text-gray-300" />} title="No Matches Yet" desc="Keep expressing interest — mutual likes create matches with chat access." />
                                        ) : matches.map(m => (
                                            <motion.div
                                                key={m.conversationId}
                                                whileHover={{ y: -4 }}
                                                onClick={() => navigate(`/messages/${m.conversationId}`)}
                                                className="bg-white rounded-[24px] border border-pearl-200 p-5 flex items-center cursor-pointer hover:border-gold-300 hover:shadow-xl transition-all duration-300 group"
                                            >
                                                <div className="relative mr-4 shrink-0">
                                                    <img src={m.matchUser.avatar} alt={m.matchUser.name} className="w-16 h-16 rounded-full object-cover border-2 border-transparent group-hover:border-gold-300 transition-colors" />
                                                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-serif text-lg font-medium text-sacred-dark truncate group-hover:text-gold-700 transition-colors">{m.matchUser.name}</h3>
                                                    <p className="text-xs text-gray-500 mt-0.5 truncate">{m.matchUser.location || 'Location Unknown'}{m.matchUser.rite ? ` · ${m.matchUser.rite}` : ''}</p>
                                                    <p className="text-sm text-gray-400 mt-1.5 truncate">{m.lastMessage || 'Say hi to start the conversation!'}</p>
                                                </div>
                                                <div className="shrink-0 w-10 h-10 ml-4 rounded-full bg-gold-50 flex items-center justify-center group-hover:bg-gold-500 transition-colors">
                                                    <MessageCircle className="w-5 h-5 text-gold-600 group-hover:text-white transition-colors" />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}

                                {/* ── SHORTLISTED ── */}
                                {activeTab === 'shortlisted' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {shortlisted.length === 0 ? (
                                            <EmptyState icon={<Heart className="h-10 w-10 text-gray-300" />} title="No Shortlisted Profiles" desc="Profiles you express interest in will appear here until they match back." />
                                        ) : shortlisted.map(s => (
                                            <motion.div key={s.interestId} whileHover={{ y: -3 }} className="bg-white rounded-[24px] border border-pearl-200 p-5 flex items-center shadow-sm transition-all">
                                                <img src={s.user.avatar} alt={s.user.name} className="w-14 h-14 rounded-full object-cover shrink-0 mr-4 border border-gray-100" />
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-serif text-lg font-medium text-sacred-dark truncate">{s.user.name}</h3>
                                                    <p className="text-xs text-gray-500 mt-0.5">{s.user.location || 'Location Unknown'}</p>
                                                    <p className="text-[10px] text-gray-400 mt-1">{timeAgo(s.createdAt)}</p>
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 shrink-0 ml-3">Pending</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}

                                {/* ── RECEIVED LIKES ── */}
                                {activeTab === 'received' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {received.length === 0 ? (
                                            <EmptyState icon={<Heart className="h-10 w-10 text-gray-300" />} title="No Received Likes" desc="When someone expresses interest in your profile, it will appear here." />
                                        ) : received.map(r => (
                                            <ReceivedCard
                                                key={r.interestId}
                                                item={r}
                                                onLikeBack={handleLikeBack}
                                                onChat={id => navigate(`/messages/${id}`)}
                                                timeAgo={timeAgo}
                                            />
                                        ))}
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

// ─── ReceivedCard ─────────────────────────────────────────────────────────────
function ReceivedCard({ item, onLikeBack, onChat, timeAgo }: {
    item: ReceivedItem;
    onLikeBack: (item: ReceivedItem) => void;
    onChat: (conversationId: string) => void;
    timeAgo: (d: string) => string;
}) {
    const [liking, setLiking] = useState(false);

    const handleLike = async () => {
        setLiking(true);
        await onLikeBack(item);
        setLiking(false);
    };

    return (
        <motion.div
            whileHover={{ y: -4 }}
            className={`bg-white rounded-[24px] border p-5 shadow-sm transition-all duration-300 ${
                item.isMutual
                    ? 'border-gold-300 shadow-[0_4px_20px_-4px_rgba(212,175,55,0.25)]'
                    : 'border-rose-100 shadow-[0_4px_20px_-4px_rgba(225,29,72,0.1)] hover:border-rose-200'
            }`}
        >
            <div className="flex items-center">
                <div className="relative mr-4 shrink-0">
                    <img src={item.user.avatar} alt={item.user.name} className="w-14 h-14 rounded-full object-cover border-2 border-rose-100" />
                    {item.isMutual && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gold-500 rounded-full flex items-center justify-center border-2 border-white">
                            <Sparkles className="w-2.5 h-2.5 text-white fill-white" />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-serif text-lg font-medium text-sacred-dark truncate">{item.user.name}</h3>
                        {item.user.age && <span className="text-sm text-gray-400">{item.user.age}</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{item.user.location || 'Location Unknown'}{item.user.rite ? ` · ${item.user.rite}` : ''}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{timeAgo(item.createdAt)}</p>
                </div>
            </div>

            {/* Action row */}
            <div className="mt-4 flex gap-2">
                {item.isMutual && item.conversationId ? (
                    // Mutual match — show chat button
                    <button
                        onClick={() => onChat(item.conversationId!)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-white rounded-xl text-sm font-semibold shadow-md transition-all active:scale-95"
                    >
                        <MessageCircle className="w-4 h-4" />
                        Start Chatting
                    </button>
                ) : (
                    <>
                        {/* Like back */}
                        <button
                            onClick={handleLike}
                            disabled={liking}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-200 hover:border-rose-500 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-60"
                        >
                            {liking
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <Heart className="w-4 h-4 fill-current" />}
                            {liking ? 'Matching…' : 'Like Back'}
                        </button>
                        {/* Pill badge */}
                        <div className="shrink-0 flex items-center px-3 py-2 bg-rose-500 rounded-xl">
                            <Heart className="w-4 h-4 text-white fill-white" />
                        </div>
                    </>
                )}
            </div>

            {item.isMutual && (
                <div className="mt-2 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gold-600">✦ It's a Match!</span>
                </div>
            )}
        </motion.div>
    );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
    return (
        <div className="col-span-full py-20 text-center flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto">{icon}</div>
            <h3 className="font-serif text-2xl text-gray-400">{title}</h3>
            <p className="text-gray-500 max-w-sm">{desc}</p>
        </div>
    );
}
