import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreVertical, ShieldCheck, CheckCircle2 } from 'lucide-react';
import SecureChatFeed from '../components/messages/SecureChatFeed';
import DecisionActionSheet from '../components/messages/DecisionActionSheet';
import { motion, AnimatePresence } from 'framer-motion';
import { resolvePhotoUrl } from '../utils/photo';

import { supabase } from '../lib/supabase';

interface MatchUser {
    id: string;
    name: string;
    avatar: string;
    isVerified?: boolean;
}

export default function Messages() {
    const { chatId } = useParams();
    const navigate = useNavigate();
    const [showActionSheet, setShowActionSheet] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);
    const [showBlockConfirm, setShowBlockConfirm] = useState(false);
    const [showReportForm, setShowReportForm] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    
    const [matchUser, setMatchUser] = useState<MatchUser | null>(null);
    const [initialMessages, setInitialMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

    const currentUserStr = localStorage.getItem('user');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : { id: localStorage.getItem('userId'), name: 'Me' };

    useEffect(() => {
        const fetchChat = async () => {
            const userId = localStorage.getItem('userId');
            const token = localStorage.getItem('token');
            if (!userId || !chatId) return;

            try {
                // Try backend first
                const headers: Record<string, string> = {};
                if (token) headers['Authorization'] = `Bearer ${token}`;
                if (userId) headers['x-user-id'] = userId;

                const res = await fetch(`${API}/conversations/${chatId}/messages`, {
                    signal: AbortSignal.timeout(4000),
                    headers
                }).catch(() => null);

                if (res && res.ok) {
                    const data = await res.json();
                    if (data.matchUser) {
                        setMatchUser({
                            ...data.matchUser,
                            avatar: resolvePhotoUrl(data.matchUser.avatar)
                        });
                    }
                    if (data.messages) setInitialMessages(data.messages);
                    return;
                }

                // Fallback to Supabase direct
                console.log('[Messages] Backend unavailable — querying Supabase directly');
                
                // 1. Get other participant
                const { data: participants, error: pError } = await supabase
                    .from('ConversationParticipant')
                    .select('userId')
                    .eq('conversationId', chatId)
                    .neq('userId', userId)
                    .single();
                
                if (pError || !participants) throw new Error('Conversation participant not found');
                const otherUserId = participants.userId;

                // 2. Get profile, photo, and user details
                const [{ data: profile }, { data: photo }, { data: user }] = await Promise.all([
                    supabase.from('Profile').select('firstName').eq('userId', otherUserId).single(),
                    supabase.from('Photo').select('url').eq('userId', otherUserId).eq('isPrimary', true).single(),
                    supabase.from('User').select('isVerified').eq('id', otherUserId).single(),
                ]);

                setMatchUser({
                    id: otherUserId,
                    name: profile?.firstName || 'Unknown',
                    avatar: resolvePhotoUrl(photo?.url) || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80',
                    isVerified: user?.isVerified || false,
                });

                // 3. Get initial messages
                const { data: messages, error: mError } = await supabase
                    .from('Message')
                    .select('*')
                    .eq('conversationId', chatId)
                    .order('createdAt', { ascending: true })
                    .limit(50);
                
                if (!mError && messages) {
                    setInitialMessages(messages.map((m: any) => ({
                        id: m.id,
                        senderId: m.senderId,
                        text: m.text,
                        timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        flagged: false,
                    })));
                }

            } catch (err) {
                console.error('[Messages] error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchChat();
    }, [chatId]);

    const handleAction = async (action: string) => {
        setShowActionSheet(false);
        if (action === 'close') {
            setIsArchiving(true);
            const userId = localStorage.getItem('userId');
            const token = localStorage.getItem('token');
            if (userId && chatId) {
                const headers: Record<string, string> = {};
                if (token) headers['Authorization'] = `Bearer ${token}`;
                headers['x-user-id'] = userId;

                fetch(`${API}/conversations/${chatId}/archive`, {
                    method: 'POST',
                    headers
                }).catch(console.error);
            }
            setTimeout(() => navigate('/messages'), 2000); 
        } else if (action === 'block') {
            setShowBlockConfirm(true);
        } else if (action === 'report') {
            setShowReportForm(true);
        }
    };

    const handleBlockConfirm = async () => {
        if (!matchUser) return;
        setActionLoading(true);
        try {
            const userId = localStorage.getItem('userId');
            const token = localStorage.getItem('token');
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            if (userId) headers['x-user-id'] = userId;

            const res = await fetch(`${API}/users/block`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ blockedId: matchUser.id }),
            });

            if (res.ok) {
                setShowBlockConfirm(false);
                navigate('/messages');
            } else {
                alert('Failed to block user. Please try again.');
            }
        } catch (error) {
            console.error('Error blocking user:', error);
            alert('Failed to block user. Please check your connection.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReportSubmit = async () => {
        if (!matchUser || !reportReason.trim()) return;
        setActionLoading(true);
        try {
            const userId = localStorage.getItem('userId');
            const token = localStorage.getItem('token');
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            if (userId) headers['x-user-id'] = userId;

            const res = await fetch(`${API}/users/report`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ reportedId: matchUser.id, reason: reportReason }),
            });

            if (res.ok) {
                setShowReportForm(false);
                setReportReason('');
                navigate('/messages');
            } else {
                alert('Failed to report user. Please try again.');
            }
        } catch (error) {
            console.error('Error reporting user:', error);
            alert('Failed to report user. Please check your connection.');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return <div className="flex h-screen w-full items-center justify-center bg-white"><div className="w-8 h-8 rounded-full border-4 border-gold-400 border-t-transparent animate-spin" /></div>;
    }

    if (!matchUser) {
        return <div className="flex h-screen w-full items-center justify-center bg-white"><p>Conversation not found.</p></div>;
    }

    return (
        <div className="flex h-screen w-full flex-col bg-white overflow-hidden font-sans relative">

            {/* Respectful Close Animation Banner */}
            <AnimatePresence>
                {isArchiving && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 z-[100] bg-white flex flex-col items-center justify-center pointer-events-none"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex flex-col items-center"
                        >
                            <ShieldCheck className="w-12 h-12 text-gray-300 mb-4" />
                            <h2 className="font-serif text-2xl text-sacred-dark mb-2">Connection Archived</h2>
                            <p className="text-gray-500 font-sans text-sm">{matchUser.name} has been notified respectfully.</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="flex h-[72px] items-center justify-between border-b border-gold-200/60 bg-white/95 px-4 sm:px-6 backdrop-blur-xl z-10 shrink-0">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate('/messages')}
                        className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-sacred-offwhite transition-colors text-sacred-dark"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <img src={matchUser.avatar} alt={matchUser.name} className="h-10 w-10 rounded-full object-cover border border-gold-200 shadow-sm" />
                            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
                        </div>
                        <div>
                            <h1 className="font-serif text-lg font-medium text-sacred-dark leading-tight flex items-center gap-1.5">
                                {matchUser.name}
                                {matchUser.isVerified && (
                                    <span className="inline-flex items-center text-gold-500 shrink-0" title="Verified Catholic">
                                        <CheckCircle2 className="w-4 h-4 fill-gold-50" />
                                    </span>
                                )}
                            </h1>
                            <p className="text-xs font-medium text-gold-600 uppercase tracking-wide">Mutual Interest</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setShowActionSheet(true)}
                    className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-sacred-offwhite transition-colors text-gray-600"
                >
                    <MoreVertical className="h-5 w-5" />
                </button>
            </header>

            {/* Main Chat Area */}
            <main className="flex-1 overflow-hidden relative flex flex-col pt-2">
                <div className="max-w-4xl mx-auto w-full flex flex-col h-full bg-white shadow-[0_0_60px_-15px_rgba(0,0,0,0.05)] rounded-t-[2.5rem] border-x border-t border-gold-100/50 overflow-hidden">
                    <SecureChatFeed 
                        currentUser={{ id: currentUser.id || localStorage.getItem('userId') || 'me', name: currentUser.firstName || currentUser.name || 'Me' }} 
                        matchUser={matchUser} 
                        chatId={chatId!}
                        initialMessages={initialMessages}
                    />
                </div>
            </main>

            {/* Action Sheet */}
            <AnimatePresence>
                {showActionSheet && (
                    <DecisionActionSheet onClose={() => setShowActionSheet(false)} onAction={handleAction} />
                )}
            </AnimatePresence>

            {/* Block Confirmation Modal */}
            <AnimatePresence>
                {showBlockConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
                        onClick={() => setShowBlockConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-md overflow-hidden rounded-[2rem] bg-white p-6 shadow-2xl z-50 border border-red-100"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="mb-3 font-serif text-xl text-sacred-dark">Block {matchUser.name}?</h3>
                            <p className="text-sm text-gray-500 font-sans leading-relaxed mb-6">
                                Are you sure you want to block {matchUser.name}? This will delete this conversation entirely and prevent you both from ever connecting or finding each other again. This action cannot be undone.
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
                {showReportForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        onClick={() => setShowReportForm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-md overflow-hidden rounded-[2rem] bg-white p-6 shadow-2xl z-50 border border-red-100"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="mb-2 font-serif text-xl text-sacred-dark">Report {matchUser.name}</h3>
                            <p className="text-xs text-gray-500 font-sans leading-relaxed mb-4">
                                Tell us why you are reporting this user. Our moderation team will investigate. Reporting this user will also block them automatically.
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
