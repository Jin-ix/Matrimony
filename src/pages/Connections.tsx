import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, ArrowLeft, Loader2, Link, Sparkles, CheckCircle2, X, MoreVertical } from 'lucide-react';
import TopNavigation from '../components/discovery/TopNavigation';
// ─── Types ────────────────────────────────────────────────────────────────────
interface ProfileSummary {
    id: string;
    name: string;
    avatar: string;
    location?: string;
    rite?: string;
    age?: number;
    photoVisibilityOptIn?: boolean;
    isVerified?: boolean;
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

    const [selectedUser, setSelectedUser] = useState<ProfileSummary | null>(null);
    const [showOptionsSheet, setShowOptionsSheet] = useState(false);
    const [showBlockConfirm, setShowBlockConfirm] = useState(false);
    const [showReportForm, setShowReportForm] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const showToast = useCallback((type: 'success' | 'error' | 'match', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    }, []);

    // ── Main fetch: Backend REST API ─────────────────────────────────────────
    const fetchAll = useCallback(async () => {
        setLoading(true);
        const userId = localStorage.getItem('userId');
        const userRole = localStorage.getItem('userRole');
        const token = localStorage.getItem('token');
        
        if (!userId) { navigate('/auth'); return; }
        if (userRole === 'scout') { navigate('/kitchen-table'); return; }

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (userId) headers['x-user-id'] = userId;
        if (userRole) headers['x-user-role'] = userRole;

        const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

        try {
            const [convRes, sentRes, receivedRes] = await Promise.all([
                fetch(`${API}/conversations`, { headers }),
                fetch(`${API}/interactions/sent`, { headers }),
                fetch(`${API}/interactions/received`, { headers }),
            ]);

            if (!convRes.ok || !sentRes.ok || !receivedRes.ok) {
                throw new Error('Failed to fetch connections from backend');
            }

            const [convsData, sentData, receivedData] = await Promise.all([
                convRes.json(),
                sentRes.json(),
                receivedRes.json(),
            ]);

            const mutualUserIds = new Set<string>();
            const otherToConvMap: Record<string, string> = {};

            convsData.forEach((conv: any) => {
                if (conv.matchUser?.id) {
                    mutualUserIds.add(conv.matchUser.id);
                    otherToConvMap[conv.matchUser.id] = conv.id;
                }
            });

            const getAvatar = (photoUrl?: string, gender?: string) => {
                if (photoUrl) return photoUrl;
                return gender === 'female'
                    ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80'
                    : 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80';
            };

            // 1) Build MATCHES
            const builtMatches: MatchItem[] = convsData.map((conv: any) => ({
                conversationId: conv.id,
                matchUser: {
                    id: conv.matchUser?.id || '',
                    name: conv.matchUser?.name || 'Unknown',
                    avatar: getAvatar(conv.matchUser?.avatar, conv.matchUser?.gender),
                    location: conv.matchUser?.location || undefined,
                    rite: RITE_DISPLAY[conv.matchUser?.rite || ''] || conv.matchUser?.rite || undefined,
                    age: conv.matchUser?.age || undefined,
                    photoVisibilityOptIn: conv.matchUser?.photoVisibilityOptIn ?? false,
                    isVerified: conv.matchUser?.isVerified ?? false,
                },
                lastMessage: conv.lastMessage?.text,
                lastMessageTime: conv.lastMessage?.timestamp,
            }));

            // 2) Build RECEIVED
            const builtReceived: ReceivedItem[] = receivedData.map((r: any) => {
                const sender = r.fromUser;
                const profile = sender?.profile;
                const photo = sender?.photos?.[0];
                const isMutual = mutualUserIds.has(r.fromUserId);

                return {
                    interestId: r.id,
                    userId: r.fromUserId,
                    user: {
                        id: r.fromUserId,
                        name: profile ? `${profile.firstName} ${profile.lastName || ''}`.trim() : 'Unknown',
                        location: profile?.location || undefined,
                        rite: RITE_DISPLAY[profile?.rite || ''] || profile?.rite || undefined,
                        age: profile?.age || undefined,
                        avatar: getAvatar(photo?.url, profile?.gender),
                        photoVisibilityOptIn: sender?.photoVisibilityOptIn ?? false,
                        isVerified: sender?.isVerified ?? false,
                    },
                    createdAt: r.createdAt,
                    isMutual,
                    conversationId: otherToConvMap[r.fromUserId],
                };
            });

            // 3) Build SHORTLISTED
            const builtSent: SentItem[] = sentData
                .filter((r: any) => !mutualUserIds.has(r.toUserId))
                .map((r: any) => {
                    const recipient = r.toUser;
                    const profile = recipient?.profile;
                    const photo = recipient?.photos?.[0];

                    return {
                        interestId: r.id,
                        userId: r.toUserId,
                        user: {
                            id: r.toUserId,
                            name: profile ? `${profile.firstName} ${profile.lastName || ''}`.trim() : 'Unknown',
                            location: profile?.location || undefined,
                            rite: RITE_DISPLAY[profile?.rite || ''] || profile?.rite || undefined,
                            age: profile?.age || undefined,
                            avatar: getAvatar(photo?.url, profile?.gender),
                            photoVisibilityOptIn: recipient?.photoVisibilityOptIn ?? false,
                            isVerified: recipient?.isVerified ?? false,
                        },
                        createdAt: r.createdAt,
                        isMutual: false,
                        conversationId: undefined,
                    };
                });

            setMatches(builtMatches);
            setReceived(builtReceived);
            setShortlisted(builtSent);
        } catch (err) {
            console.error('[Connections] fetch failed', err);
            showToast('error', 'Failed to retrieve connections from server.');
        } finally {
            setLoading(false);
        }
    }, [navigate, showToast]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // ── Like back action ──────────────────────────────────────────────────────
    const handleLikeBack = async (item: ReceivedItem) => {
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');
        if (!userId) return;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        headers['x-user-id'] = userId;

        const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

        try {
            const res = await fetch(`${API}/interactions/interest`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ toUserId: item.userId }),
            });

            if (!res.ok) throw new Error('Like back request failed');

            const json = await res.json();
            const conversationId = json?.conversationId;

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

    // ── Block / Report API Handlers ───────────────────────────────────────────
    const handleBlockConfirm = async () => {
        if (!selectedUser) return;
        setActionLoading(true);
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (userId) headers['x-user-id'] = userId;

        const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

        try {
            const res = await fetch(`${API}/users/block`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ blockedId: selectedUser.id }),
            });

            if (res.ok) {
                showToast('success', `${selectedUser.name} has been blocked.`);
                // Remove from local lists
                setMatches(prev => prev.filter(m => m.matchUser.id !== selectedUser.id));
                setShortlisted(prev => prev.filter(s => s.userId !== selectedUser.id));
                setReceived(prev => prev.filter(r => r.userId !== selectedUser.id));
                
                setShowBlockConfirm(false);
                setShowOptionsSheet(false);
                setSelectedUser(null);
            } else {
                showToast('error', 'Failed to block user. Please try again.');
            }
        } catch (e) {
            console.error('Error blocking user:', e);
            showToast('error', 'Something went wrong.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReportSubmit = async () => {
        if (!selectedUser || !reportReason.trim()) return;
        setActionLoading(true);
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (userId) headers['x-user-id'] = userId;

        const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

        try {
            const res = await fetch(`${API}/users/report`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ reportedId: selectedUser.id, reason: reportReason }),
            });

            if (res.ok) {
                showToast('success', `${selectedUser.name} has been reported and blocked.`);
                // Remove from local lists
                setMatches(prev => prev.filter(m => m.matchUser.id !== selectedUser.id));
                setShortlisted(prev => prev.filter(s => s.userId !== selectedUser.id));
                setReceived(prev => prev.filter(r => r.userId !== selectedUser.id));

                setShowReportForm(false);
                setShowOptionsSheet(false);
                setReportReason('');
                setSelectedUser(null);
            } else {
                showToast('error', 'Failed to report user. Please try again.');
            }
        } catch (e) {
            console.error('Error reporting user:', e);
            showToast('error', 'Something went wrong.');
        } finally {
            setActionLoading(false);
        }
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
                                }}`}>
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
                                                    <h3 className="font-serif text-lg font-medium text-sacred-dark truncate group-hover:text-gold-700 transition-colors flex items-center gap-1.5">
                                                        {m.matchUser.name}
                                                        {m.matchUser.isVerified && (
                                                            <span className="inline-flex items-center text-gold-500 shrink-0" title="Verified Catholic">
                                                                <CheckCircle2 className="w-4 h-4 fill-gold-50" />
                                                            </span>
                                                        )}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 mt-0.5 truncate">{m.matchUser.location || 'Location Unknown'}{m.matchUser.rite ? ` · ${m.matchUser.rite}` : ''}</p>
                                                    <p className="text-sm text-gray-400 mt-1.5 truncate">{m.lastMessage || 'Say hi to start the conversation!'}</p>
                                                </div>
                                                <div className="flex items-center space-x-2 shrink-0 ml-4">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedUser(m.matchUser);
                                                            setShowOptionsSheet(true);
                                                        }}
                                                        className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                                                    >
                                                        <MoreVertical className="w-5 h-5" />
                                                    </button>
                                                    <div className="w-10 h-10 rounded-full bg-gold-50 flex items-center justify-center group-hover:bg-gold-500 transition-colors">
                                                        <MessageCircle className="w-5 h-5 text-gold-600 group-hover:text-white transition-colors" />
                                                    </div>
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
                                        ) : shortlisted.map(s => {
                                            const showActual = s.user.photoVisibilityOptIn || s.isMutual;
                                            return (
                                                <motion.div key={s.interestId} whileHover={{ y: -3 }} className="bg-white rounded-[24px] border border-pearl-200 p-5 flex items-center shadow-sm transition-all relative group">
                                                    <img src={s.user.avatar} alt={showActual ? s.user.name : "Candidate"} className={`w-14 h-14 rounded-full object-cover shrink-0 mr-4 border border-gray-100 ${showActual ? '' : 'blur-md'}`} />
                                                    <div className="flex-1 min-w-0 mr-2">
                                                        <h3 className="font-serif text-lg font-medium text-sacred-dark truncate flex items-center gap-1.5">
                                                            {showActual ? s.user.name : '••••••'}
                                                            {showActual && s.user.isVerified && (
                                                                <span className="inline-flex items-center text-gold-500 shrink-0" title="Verified Catholic">
                                                                    <CheckCircle2 className="w-4 h-4 fill-gold-50" />
                                                                </span>
                                                            )}
                                                        </h3>
                                                        <p className="text-xs text-gray-500 mt-0.5">{s.user.location || 'Location Unknown'}{s.user.rite ? ` · ${s.user.rite}` : ''}</p>
                                                        <p className="text-[10px] text-gray-400 mt-1">{timeAgo(s.createdAt)}</p>
                                                    </div>
                                                    <div className="flex items-center space-x-1.5 shrink-0">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedUser(s.user);
                                                                setShowOptionsSheet(true);
                                                            }}
                                                            className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                                                        >
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">Pending</span>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
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
                                                onOptions={(user) => {
                                                    setSelectedUser(user);
                                                    setShowOptionsSheet(true);
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>
            </main>

            {/* Options Sheet for Connections */}
            <AnimatePresence>
                {showOptionsSheet && selectedUser && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[150] flex items-end justify-center bg-black/40 backdrop-blur-sm p-4 sm:items-center"
                        onClick={() => setShowOptionsSheet(false)}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="w-full max-w-sm overflow-hidden rounded-[2rem] bg-white shadow-2xl z-[150] pt-2"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-gray-300 sm:hidden"></div>
                            <div className="p-6">
                                <h3 className="mb-6 text-center font-serif text-xl text-sacred-dark">Options for {selectedUser.name}</h3>

                                <div className="space-y-3">
                                    <button
                                        onClick={() => {
                                            setShowBlockConfirm(true);
                                            setShowOptionsSheet(false);
                                        }}
                                        className="w-full rounded-2xl bg-red-600 py-4 text-sm font-semibold text-white transition-colors hover:bg-red-700 shadow-sm"
                                    >
                                        Block Profile
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowReportForm(true);
                                            setShowOptionsSheet(false);
                                        }}
                                        className="w-full rounded-2xl border border-red-200 bg-red-50 py-4 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
                                    >
                                        Report User
                                    </button>
                                </div>

                                <button
                                    onClick={() => setShowOptionsSheet(false)}
                                    className="mt-6 w-full text-center text-sm font-medium text-gray-500 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Block Confirmation Modal */}
            <AnimatePresence>
                {showBlockConfirm && selectedUser && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        onClick={() => setShowBlockConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-md overflow-hidden rounded-[2rem] bg-white p-6 shadow-2xl z-[200] border border-red-100"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="mb-3 font-serif text-xl text-sacred-dark">Block {selectedUser.name}?</h3>
                            <p className="text-sm text-gray-500 font-sans leading-relaxed mb-6">
                                Are you sure you want to block {selectedUser.name}? This will remove them from all your connections (likes, matches) and prevent you both from ever finding each other again. This action is permanent.
                            </p>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowBlockConfirm(false)}
                                    disabled={actionLoading}
                                    className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleBlockConfirm}
                                    disabled={actionLoading}
                                    className="flex-1 rounded-2xl bg-red-600 py-3 text-sm font-semibold text-white transition-all hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
                                >
                                    {actionLoading ? 'Blocking...' : 'Yes, Block Profile'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Report Form Modal */}
            <AnimatePresence>
                {showReportForm && selectedUser && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        onClick={() => setShowReportForm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-md overflow-hidden rounded-[2rem] bg-white p-6 shadow-2xl z-[200] border border-red-100"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="mb-2 font-serif text-xl text-sacred-dark">Report {selectedUser.name}</h3>
                            <p className="text-xs text-gray-500 font-sans leading-relaxed mb-4">
                                Tell us why you are reporting this user. They will also be automatically blocked for your safety.
                            </p>

                            <div className="space-y-2.5 mb-6">
                                {[
                                    'Inappropriate messages or harassment',
                                    'Fake account / Scammer / Fraud',
                                    'Commercial use / Solicitation',
                                    'Inappropriate photos',
                                    'Other behavior violating community guidelines'
                                ].map((reason) => (
                                    <button
                                        key={reason}
                                        onClick={() => setReportReason(reason)}
                                        className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-medium transition-all ${
                                            reportReason === reason
                                                ? 'border-red-400 bg-red-50 text-red-700'
                                                : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                                        }`}
                                    >
                                        {reason}
                                    </button>
                                ))}

                                <textarea
                                    value={reportReason}
                                    onChange={(e) => setReportReason(e.target.value)}
                                    placeholder="Please provide more details (optional)..."
                                    className="w-full h-24 p-3 border border-gray-200 rounded-xl text-xs font-sans focus:border-red-400 focus:outline-none resize-none"
                                />
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => {
                                        setShowReportForm(false);
                                        setReportReason('');
                                    }}
                                    disabled={actionLoading}
                                    className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReportSubmit}
                                    disabled={actionLoading || !reportReason.trim()}
                                    className="flex-1 rounded-2xl bg-red-600 py-3 text-sm font-semibold text-white transition-all hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
                                >
                                    {actionLoading ? 'Submitting...' : 'Submit & Block'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── ReceivedCard ─────────────────────────────────────────────────────────────
function ReceivedCard({ item, onLikeBack, onChat, timeAgo, onOptions }: {
    item: ReceivedItem;
    onLikeBack: (item: ReceivedItem) => void;
    onChat: (conversationId: string) => void;
    timeAgo: (d: string) => string;
    onOptions: (user: ProfileSummary) => void;
}) {
    const [liking, setLiking] = useState(false);

    const handleLike = async () => {
        setLiking(true);
        await onLikeBack(item);
        setLiking(false);
    };

    const showActual = item.isMutual || item.user.photoVisibilityOptIn;

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
                    <img src={item.user.avatar} alt={showActual ? item.user.name : 'Candidate'} className={`w-14 h-14 rounded-full object-cover border-2 border-rose-100 ${!showActual ? 'blur-md' : ''}`} />
                    {item.isMutual && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gold-500 rounded-full flex items-center justify-center border-2 border-white">
                            <Sparkles className="w-2.5 h-2.5 text-white fill-white" />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0 mr-1">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <h3 className="font-serif text-lg font-medium text-sacred-dark truncate flex items-center gap-1.5">
                                {showActual ? item.user.name : '••••••'}
                                {showActual && item.user.isVerified && (
                                    <span className="inline-flex items-center text-gold-500 shrink-0" title="Verified Catholic">
                                        <CheckCircle2 className="w-4 h-4 fill-gold-50" />
                                    </span>
                                )}
                            </h3>
                            {showActual && item.user.age && <span className="text-sm text-gray-400">{item.user.age}</span>}
                        </div>
                        <button
                            onClick={() => onOptions(item.user)}
                            className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors shrink-0"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>
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
