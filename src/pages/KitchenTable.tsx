import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Send, Users, Search, Bell, Settings,
    CheckCircle2, UserPlus, X, Loader2, ChevronRight, MessageSquare, Link2, Info
} from 'lucide-react';
import { io, type Socket } from 'socket.io-client';
import { supabase } from '../lib/supabase';
import SharedProfileView from '../components/kitchen/SharedProfileView';
import MatchBrowser from '../components/kitchen/MatchBrowser';

const API = 'http://localhost:3001/api';
const SOCKET_URL = 'http://localhost:3001';

interface ChatMessage {
    id: string;
    senderId?: string;
    sender?: 'candidate' | 'scout';
    senderName: string;
    senderRole?: string;
    text: string;
    timestamp?: string;
    createdAt?: string;
}

interface TableMember {
    id: string;
    userId: string;
    role: string;
    user?: { profile?: { firstName?: string; lastName?: string } };
}

interface KitchenTableInfo {
    id: string;
    name: string;
    matchProfileId: string;
    members: TableMember[];
}

interface MyTable {
    id: string;
    name: string;
    matchProfileId: string;
    members: TableMember[];
    messages: ChatMessage[];
}

interface FamilyMatchChat {
    id: string;
    candidateAId: string;
    candidateBId: string;
}

function timeStr(dateStr?: string) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function memberDisplay(m: TableMember) {
    const p = m.user?.profile;
    if (p?.firstName) return `${p.firstName} ${p.lastName || ''}`.trim();
    return m.role === 'candidate' ? 'Candidate' : 'Scout';
}

export default function KitchenTable() {
    const { matchId } = useParams();
    const navigate = useNavigate();

    // --- Auth ---
    const myUserId = localStorage.getItem('userId') || '';
    const userStr = localStorage.getItem('user');
    const myName = userStr ? (() => { try { return JSON.parse(userStr).email?.split('@')[0] || 'Me'; } catch { return 'Me'; } })() : 'Me';
    const myRole = localStorage.getItem('userRole') || 'candidate';
    const myInitial = myName.charAt(0).toUpperCase();

    // If this user is a scout (parent), auto-redirect to their linked candidate's table
    const linkedCandidateId = localStorage.getItem('linkedCandidateId');
    const linkedCandidateName = localStorage.getItem('linkedCandidateName') || '';
    const effectiveMatchId = (myRole === 'scout' && linkedCandidateId) ? linkedCandidateId : matchId;

    // --- State ---
    const [tableInfo, setTableInfo] = useState<KitchenTableInfo | null>(null);
    const [tableId, setTableId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [externalMessages, setExternalMessages] = useState<ChatMessage[]>([]);
    const [familyMatchChatId, setFamilyMatchChatId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const userGender = localStorage.getItem('userGender') || 'female';
    const defaultImageFallback = userGender === 'male' 
        ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80'
        : 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80';

    const [chatMode, _setChatMode] = useState<'internal' | 'external'>('internal');
    const [profileName, setProfileName] = useState('');
    const [profileImage, setProfileImage] = useState(defaultImageFallback);
    const [typingUser, setTypingUser] = useState<string | null>(null);
    const [showInvite, setShowInvite] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviting, setInviting] = useState(false);
    const [inviteSuccess, setInviteSuccess] = useState(false);
    const [myTables, setMyTables] = useState<MyTable[]>([]);
    const [showSidebar, setShowSidebar] = useState(false);
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingExternal, setLoadingExternal] = useState(false);

    // Profile & Matches Drawer 
    const [showProfileDrawer, setShowProfileDrawer] = useState(false);
    const [showMatchBrowser, setShowMatchBrowser] = useState(false);
    const [profileData, setProfileData] = useState<any>(null);
    const [profileLoading, setProfileLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);
    const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // ── 1. Bootstrap: resolve table, fetch messages, connect socket ──
    useEffect(() => {
        if (!myUserId) return;

        // If scout and not already on the linked candidate's table URL, redirect
        if (myRole === 'scout' && linkedCandidateId && matchId !== linkedCandidateId) {
            navigate(`/kitchen-table/${linkedCandidateId}`, { replace: true });
            return;
        }

        const bootstrap = async () => {
            setLoading(true);
            try {
                try {
                    // Try to use the backend (API)
                    const tableRes = await fetch(`${API}/kitchen-table/${effectiveMatchId}`, {
                        headers: { 'x-user-id': myUserId, 'x-user-role': myRole }
                    });
                    if (!tableRes.ok) throw new Error('Backend failed');
                    const table: KitchenTableInfo = await tableRes.json();
                    setTableInfo(table);
                    setTableId(table.id);

                    // Fetch persisted messages
                    const msgRes = await fetch(`${API}/kitchen-table/${table.id}/messages`, {
                        headers: { 'x-user-id': myUserId, 'x-user-role': myRole }
                    });
                    if (msgRes.ok) {
                        const data = await msgRes.json();
                        setMessages(data.messages || []);
                    }

                    // Connect socket and join room
                    const socket = io(`${SOCKET_URL}/kitchen`, { transports: ['websocket'] });
                    socket.on('connect', () => {
                        socket.emit('kitchen:join', table.id);
                    });
                    socket.on('kitchen:message', (msg: ChatMessage) => {
                        setMessages(prev => {
                            if (prev.some(m => m.id === msg.id)) return prev;
                            const filtered = prev.filter(m => !(m.id.startsWith('opt-') && m.text === msg.text && m.senderId === msg.senderId));
                            return [...filtered, msg];
                        });
                    });
                    socket.on('kitchen:typing', ({ name }: { name: string }) => {
                        setTypingUser(name);
                        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
                        typingTimerRef.current = setTimeout(() => setTypingUser(null), 3000);
                    });
                    socketRef.current = socket;

                } catch (e) {
                    console.warn('Backend unavailable, engaging offline Supabase fallback', e);
                    // OFFLINE SUPABASE FALLBACK
                    const { data: tableData } = await supabase.from('KitchenTable').select('*').eq('matchProfileId', effectiveMatchId).limit(1);
                    
                    let targetTable = tableData?.[0];
                    if (!targetTable) {
                        const newId = Math.random().toString(36).substring(2) + Date.now().toString(36);
                        const { data: inserted } = await supabase.from('KitchenTable').insert({
                            id: newId,
                            name: 'Kitchen Table',
                            matchProfileId: effectiveMatchId,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        }).select('*').single();
                        targetTable = inserted;
                    }

                    if (targetTable) {
                        // Patch members array to prevent UI crash since Supabase raw row doesn't have populated relations
                        const safeTableInfo = {
                            ...targetTable,
                            members: targetTable.members || []
                        };
                        setTableInfo(safeTableInfo);
                        setTableId(targetTable.id);

                        // Fetch fallback messages
                        const { data: msgs } = await supabase.from('KitchenMessage')
                            .select('*')
                            .eq('kitchenTableId', targetTable.id)
                            .order('createdAt', { ascending: true });
                        if (msgs) setMessages(msgs);

                        // Fallback Realtime via Supabase
                        const channel = supabase.channel(`kitchen-${targetTable.id}`)
                            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'KitchenMessage', filter: `kitchenTableId=eq.${targetTable.id}` }, payload => {
                                setMessages(prev => {
                                    if (prev.some(m => m.id === payload.new.id)) return prev;
                                    const filtered = prev.filter(m => !(m.id.startsWith('opt-') && m.text === payload.new.text && m.senderId === payload.new.senderId));
                                    return [...filtered, payload.new as any];
                                });
                            })
                            .subscribe();
                            
                        // Hack socketRef to maintain our disconnect cleanup signature
                        socketRef.current = {
                            connected: false, // marked as fake
                            disconnect: () => supabase.removeChannel(channel),
                            emit: () => {} // we handle sends differently in fallback
                        } as any;
                    }
                }

                // Fetch my tables for sidebar (optional if online)
                const tablesRes = await fetch(`${API}/kitchen-table/my-tables`, {
                    headers: { 'x-user-id': myUserId, 'x-user-role': myRole }
                }).catch(() => null);
                if (tablesRes && tablesRes.ok) {
                    const tablesData = await tablesRes.json();
                    setMyTables(tablesData || []);
                }
            } catch (e) {
                console.error('Kitchen bootstrap absolute failure', e);
            } finally {
                setLoading(false);
            }

            // Fetch match profile info
            const profileTarget = effectiveMatchId;
            if (profileTarget) {
                const { data: prof } = await supabase.from('Profile').select('firstName, gender').eq('userId', profileTarget).single();
                if (prof) setProfileName(prof.firstName || 'Candidate');
                
                const { data: photoData } = await supabase.from('Photo').select('url').eq('userId', profileTarget).eq('isPrimary', true).single();
                if (photoData?.url) {
                    setProfileImage(photoData.url);
                } else if (prof?.gender) {
                    setProfileImage(
                        prof.gender === 'male'
                            ? 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80'
                            : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80'
                    );
                }
            }
        };

        bootstrap();
        return () => {
            socketRef.current?.emit('kitchen:leave', tableId);
            socketRef.current?.disconnect();
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [effectiveMatchId, myUserId]);

    useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

    // ── 2. Load Both-Families chat when switching to external mode ──
    useEffect(() => {
        if (chatMode !== 'external' || !myUserId) return;
        const load = async () => {
            setLoadingExternal(true);
            try {
                const res = await fetch(`${API}/family-matches`, {
                    headers: { 'x-user-id': myUserId }
                });
                if (!res.ok) return;
                const chats: FamilyMatchChat[] = await res.json();
                if (chats.length === 0) return;
                const chat = chats[0];
                setFamilyMatchChatId(chat.id);
                const msgRes = await fetch(`${API}/family-matches/${chat.id}/messages`, {
                    headers: { 'x-user-id': myUserId }
                });
                if (msgRes.ok) {
                    const data = await msgRes.json();
                    setExternalMessages(data.messages || []);
                }
                
                if (socketRef.current) {
                    socketRef.current.emit('family_match:join', chat.id);
                }
            } catch (e) {
                console.error('Failed to load family-match chat', e);
            } finally {
                setLoadingExternal(false);
            }
        };
        load();
    }, [chatMode, myUserId]);

    // ── 3. Send message ──
    const handleSend = async () => {
        if (!input.trim() || !myUserId) return;
        const text = input.trim();
        setInput('');
        setSending(true);

        try {
            if (chatMode === 'internal' && tableId) {
                const optId = `opt-${Date.now()}`;
                
                // Determine if we are running in Offline Supabase Fallback mode
                if (socketRef.current && (socketRef.current as any).connected === false) {
                     const { error } = await supabase.from('KitchenMessage').insert({
                         id: Math.random().toString(36).substring(2) + Date.now().toString(36),
                         kitchenTableId: tableId,
                         senderId: myUserId,
                         senderRole: myRole,
                         senderName: myName,
                         text,
                         createdAt: new Date().toISOString()
                     });
                     
                     if (error) {
                         console.error('Failed to send fallback message:', error);
                         return;
                     }

                     // Explicitly append to state immediately because Supabase realtime isn't guaranteed
                     setMessages(prev => [...prev, {
                         id: Math.random().toString(36),
                         senderId: myUserId,
                         senderName: myName,
                         senderRole: myRole,
                         text,
                         timestamp: new Date().toISOString(),
                     }]);

                } else {
                    // Send via socket (server persists + broadcasts)
                    socketRef.current?.emit('kitchen:message', {
                        kitchenTableId: tableId,
                        senderId: myUserId,
                        senderRole: myRole,
                        senderName: myName,
                        text,
                    });
                    // Optimistic local append
                    setMessages(prev => [...prev, {
                        id: optId,
                        senderId: myUserId,
                        senderName: myName,
                        senderRole: myRole,
                        text,
                        timestamp: new Date().toISOString(),
                    }]);
                }
            } else if (chatMode === 'external' && familyMatchChatId) {
                // Send via socket (server persists + broadcasts)
                socketRef.current?.emit('family_match:message', {
                    chatId: familyMatchChatId,
                    senderId: myUserId,
                    senderRole: myRole,
                    senderName: myName,
                    text,
                });
                // Optimistic fallback
                setExternalMessages(prev => [...prev, {
                    id: `opt-ext-${Date.now()}`,
                    senderId: myUserId,
                    senderName: myName,
                    senderRole: myRole,
                    text,
                    timestamp: new Date().toISOString(),
                }]);
            }
        } catch (e) {
            console.error('Send error', e);
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // ── 4. Typing indicator ──
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        if (tableId && myUserId) {
            socketRef.current?.emit('kitchen:typing', {
                kitchenTableId: tableId,
                userId: myUserId,
                name: myName,
            });
        }
    };

    // ── 5. Invite member ──
    const handleInvite = async () => {
        if (!inviteEmail.trim() || !effectiveMatchId || !myUserId) return;
        setInviting(true);
        try {
            // First lookup the user by email using Supabase
            const { data: user, error } = await supabase.from('User').select('id').eq('email', inviteEmail.trim()).single();
            if (error || !user) {
                alert('Could not find a user with this email address.');
                setInviting(false);
                return;
            }

            const res = await fetch(`${API}/kitchen-table/${effectiveMatchId}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-id': myUserId, 'x-user-role': myRole },
                body: JSON.stringify({ userId: user.id, role: 'scout' }),
            });
            if (res.ok) {
                setInviteSuccess(true);
                setInviteEmail('');
                setTimeout(() => { setInviteSuccess(false); setShowInvite(false); }, 2000);
                // Refresh table info to update members
                const tableRes = await fetch(`${API}/kitchen-table/${effectiveMatchId}`, {
                    headers: { 'x-user-id': myUserId, 'x-user-role': myRole }
                });
                if (tableRes.ok) setTableInfo(await tableRes.json());
            } else {
                alert('Failed to add this user. They might already be a member.');
            }
        } catch (e) {
            console.error('Invite error', e);
            alert('An error occurred while inviting.');
        } finally {
            setInviting(false);
        }
    };

    const handleViewProfile = async () => {
        if (!effectiveMatchId) return;
        setShowMatchBrowser(false);
        setShowProfileDrawer(true);
        if (profileData && profileData.id) return; // already fetched successfully

        setProfileLoading(true);
        try {
            const res = await fetch(`${API}/profile/${effectiveMatchId}`, {
                headers: { 'x-user-id': myUserId, 'x-user-role': myRole }
            });
            if (res.ok) {
                const data = await res.json();
                setProfileData(data.data || data);
                return;
            }
        } catch (e: any) {
            console.error('Backend Profile fetch failed, falling back to Supabase', e);
        }
        
        // Supabase Fallback if Backend is down
        try {
            const { data: profile } = await supabase.from('Profile').select('*').eq('userId', effectiveMatchId).single();
            const { data: photos } = await supabase.from('Photo').select('*').eq('userId', effectiveMatchId).order('order', { ascending: true });
            if (profile) {
                setProfileData({
                    id: effectiveMatchId,
                    profile: profile,
                    photos: photos || []
                });
            } else {
                setProfileData({ error: 'Profile not found in database via fallback' });
            }
        } catch(e: any) {
             setProfileData({ error: e.message || 'Unknown network error' });
        } finally {
            setProfileLoading(false);
        }
    };

    // ── Helpers ──
    const activeMessages = chatMode === 'internal' ? messages : externalMessages;
    const isMyMessage = (msg: ChatMessage) => msg.senderId === myUserId;

    return (
        <div className="flex h-screen bg-sacred-offwhite text-sacred-dark font-sans overflow-hidden">

            {/* ─────── Sidebar Icon Nav ─────── */}
            <aside className="hidden md:flex flex-col w-20 border-r border-gold-200 bg-white items-center py-8 justify-between z-10 shrink-0">
                <div className="space-y-8 flex flex-col items-center">
                    <div className="h-10 w-10 bg-gold-600 rounded-xl flex items-center justify-center text-white font-serif font-bold text-xl shadow-md">M</div>
                    <nav className="flex flex-col space-y-6">
                        <button onClick={() => navigate('/discovery')} className="relative group p-3 text-gold-400 hover:text-gold-700 hover:bg-gold-50 rounded-xl transition-all duration-300" title="Discovery">
                            <Search className="h-6 w-6 transition-transform group-hover:scale-110" />
                        </button>
                        <button className="relative group p-3 text-gold-700 bg-gold-50 rounded-xl shadow-[0_4px_12px_rgba(212,175,55,0.2)] transition-all duration-300" title="Kitchen Tables">
                            <Users className="h-6 w-6" />
                        </button>
                        <button
                            onClick={() => setShowSidebar(s => !s)}
                            className="relative group p-3 text-gold-400 hover:text-gold-700 hover:bg-gold-50 rounded-xl transition-all duration-300"
                            title="My Discussions"
                        >
                            <MessageSquare className="h-6 w-6 transition-transform group-hover:scale-110" />
                            {myTables.length > 0 && (
                                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 ring-1 ring-white" />
                            )}
                        </button>
                        <button className="relative group p-3 text-gold-400 hover:text-gold-700 hover:bg-gold-50 rounded-xl transition-all duration-300" title="Notifications">
                            <Bell className="h-6 w-6 transition-transform group-hover:scale-110" />
                        </button>
                    </nav>
                </div>
                <button onClick={() => navigate('/settings')} className="group p-3 text-gray-400 hover:text-sacred-dark transition-colors">
                    <Settings className="h-6 w-6 transition-transform group-hover:rotate-45 duration-500" />
                </button>
            </aside>

            {/* ─────── My Tables Drawer ─────── */}
            <AnimatePresence>
                {showSidebar && (
                    <motion.div
                        initial={{ x: -280 }}
                        animate={{ x: 0 }}
                        exit={{ x: -280 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                        className="absolute left-20 top-0 bottom-0 w-72 bg-white border-r border-gold-200 z-30 flex flex-col shadow-2xl"
                    >
                        <div className="flex items-center justify-between px-5 py-5 border-b border-gold-100">
                            <h3 className="font-serif text-xl text-sacred-dark">My Discussions</h3>
                            <button onClick={() => setShowSidebar(false)} className="p-1 text-gray-400 hover:text-gray-700 rounded-full transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                            {myTables.length === 0 ? (
                                <div className="p-6 text-center text-gray-400 text-sm">No discussions yet.</div>
                            ) : myTables.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => { navigate(`/kitchen-table/${t.matchProfileId}`); setShowSidebar(false); }}
                                    className={`w-full text-left px-5 py-4 hover:bg-gold-50 transition-colors flex items-center gap-3 ${t.matchProfileId === matchId ? 'bg-gold-50' : ''}`}
                                >
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white font-semibold shrink-0">
                                        {t.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-sacred-dark truncate">{t.name}</p>
                                        <p className="text-xs text-gray-400 truncate">{t.messages?.[0]?.text || 'No messages yet'}</p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─────── Main Area ─────── */}
            <main className="flex-1 flex flex-col md:flex-row relative z-0 bg-gradient-to-br from-[#FAFAF9] via-[#F3F0EA] to-[#FAFAF9] overflow-hidden">

                {/* Left: Profile Canvas */}
                <div className="hidden lg:flex w-1/3 border-r border-gold-200/50 relative overflow-hidden flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 shrink-0">
                    {effectiveMatchId ? (
                        <>
                            <div className="absolute inset-0">
                                <motion.img
                                    animate={{ scale: [1.02, 1.05, 1.02], filter: ['blur(4px)', 'blur(3px)', 'blur(4px)'] }}
                                    transition={{ duration: 8, ease: 'easeInOut', repeat: Infinity }}
                                    src={profileImage}
                                    className="w-full h-full object-cover opacity-70"
                                    alt="Profile Background"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-sacred-dark/90 via-sacred-dark/40 to-sacred-dark/10" />
                            </div>
                            <div className="relative z-10 flex flex-col h-full p-10 justify-between text-white">
                                <div>
                                    <p className="text-xs text-gold-300 uppercase tracking-widest font-medium mb-3">Participants</p>
                                    <div className="space-y-2">
                                        {tableInfo?.members.map(m => (
                                            <div key={m.id} className="flex items-center gap-2">
                                                <div className="h-7 w-7 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-[11px] font-bold">
                                                    {memberDisplay(m).charAt(0)}
                                                </div>
                                                <span className="text-sm text-white/80">{memberDisplay(m)}</span>
                                                <span className="text-[10px] text-gold-300 uppercase tracking-wide ml-auto">{m.role}</span>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => setShowInvite(true)}
                                            className="flex items-center gap-2 mt-2 text-xs text-gold-300 hover:text-gold-200 transition-colors"
                                        >
                                            <UserPlus className="h-3.5 w-3.5" />
                                            Invite family member
                                        </button>
                                    </div>
                                </div>

                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                                    <p className="text-gold-300 font-medium tracking-wide uppercase text-xs mb-3 flex items-center gap-2">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-500" />
                                        </span>
                                        Live Discussion Topic
                                    </p>
                                    <h2 className="text-5xl font-serif leading-[1.1] drop-shadow-lg">
                                        {profileName ? `${profileName}'s` : 'This'}<br />Profile
                                    </h2>
                                    <button
                                        onClick={handleViewProfile}
                                        className="mt-8 bg-white text-sacred-dark font-medium rounded-2xl py-3.5 px-6 w-fit transition-all duration-300 flex items-center gap-3 shadow-[0_8px_30px_rgba(255,255,255,0.4)] hover:shadow-[0_12px_40px_rgba(255,255,255,0.6)] hover:-translate-y-1"
                                    >
                                        <Info className="h-5 w-5 text-gold-500" /> View Full Profile
                                    </button>
                                    <button
                                        onClick={() => { setShowProfileDrawer(false); setShowMatchBrowser(true); }}
                                        className="mt-4 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md rounded-2xl py-3 px-6 w-fit text-sm transition-all duration-300 flex items-center gap-3 hover:-translate-x-1 shadow-lg"
                                    >
                                        <Search className="h-4 w-4" /> Browse Other Matches
                                    </button>
                                </motion.div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full p-10 text-center bg-transparent z-20">
                            <div className="h-24 w-24 rounded-full bg-gold-50 border-2 border-gold-100 flex items-center justify-center mb-6 shadow-sm">
                                <Search className="h-10 w-10 text-gold-400" />
                            </div>
                            <h2 className="text-3xl font-serif text-sacred-dark mb-4">Discover Matches</h2>
                            <p className="text-sm text-gray-500 mb-8 max-w-xs leading-relaxed">
                                You haven't selected a profile yet. Browse your matches to start a dedicated family discussion space for someone.
                            </p>
                            <button
                                onClick={() => { setShowProfileDrawer(false); setShowMatchBrowser(true); }}
                                className="bg-gold-600 text-white hover:bg-gold-700 rounded-2xl py-4 px-8 w-fit transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center gap-2"
                            >
                                <Users className="h-5 w-5" /> Browse Candidates
                            </button>
                        </div>
                    )}
                </div>

                {/* Right: Chat Area */}
                <div className="flex-1 flex flex-col relative bg-transparent overflow-hidden">

                    {/* Header */}
                    <header className="h-[88px] border-b border-gold-200/30 flex items-center justify-between px-8 bg-white/40 backdrop-blur-xl z-20 shrink-0 sticky top-0 shadow-sm">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => navigate('/discovery')} 
                                className="flex items-center justify-center p-2.5 -ml-4 mr-1 text-gray-500 hover:text-gold-600 hover:bg-gold-50/50 rounded-xl transition-all duration-300"
                                title="Back to Home / Discovery"
                            >
                                <ArrowLeft className="h-6 w-6" />
                            </button>
                            <div>
                                <h1 className="font-serif text-2xl text-sacred-dark leading-none">The Kitchen Table 2.0</h1>
                                <p className="text-xs text-sacred-dark/60 font-medium flex items-center gap-1.5 mt-1.5 tracking-wide">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                                    Private Family Room
                                </p>
                                {/* Parent-Candidate connection badge */}
                                {myRole === 'scout' && linkedCandidateId && (
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <Link2 className="h-3 w-3 text-gold-500" />
                                        <span className="text-[11px] text-gold-600 font-semibold">
                                            Connected to {linkedCandidateName || 'your child'}'s table
                                        </span>
                                    </div>
                                )}
                                {myRole === 'candidate' && localStorage.getItem('linkedParentId') && (
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <Link2 className="h-3 w-3 text-gold-500" />
                                        <span className="text-[11px] text-gold-600 font-semibold">
                                            Parent joined this table
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>



                        {/* Member avatars */}
                        <div className="flex -space-x-3 items-center mr-2">
                            <button
                                onClick={() => { setShowProfileDrawer(false); setShowMatchBrowser(true); }}
                                className="h-11 w-11 rounded-full border-[3px] border-white bg-gold-50 backdrop-blur-sm flex items-center justify-center text-gold-600 hover:bg-gold-100 hover:shadow-md transition-all z-0 mr-4 md:hidden"
                                title="Browse Matches"
                            >
                                <Search className="h-4 w-4" />
                            </button>
                            <div className="relative group">
                                {/* Breathing presence ring */}
                                <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 opacity-60 blur-[3px] animate-pulse group-hover:opacity-90 transition-opacity" />
                                <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 opacity-30 animate-ping" style={{ animationDuration: '3s' }} />
                                <div className="relative h-11 w-11 rounded-full border-[3px] border-white bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-sm z-20">{myInitial}</div>
                                {/* Green dot */}
                                <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-white z-30 shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
                            </div>
                            <button
                                onClick={() => setShowInvite(true)}
                                className="h-11 w-11 rounded-full border-[3px] border-white bg-white/50 backdrop-blur-sm flex items-center justify-center text-sacred-dark/40 hover:bg-white hover:text-gold-600 hover:shadow-md transition-all z-0 ml-2"
                                title="Invite family member"
                            >
                                <UserPlus className="h-4 w-4" />
                            </button>
                        </div>
                    </header>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-6 pb-44">
                        <div className="flex justify-center mb-6">
                            <span className="bg-white/60 backdrop-blur-md text-sacred-dark/70 border border-gold-200/50 shadow-sm px-5 py-2 rounded-full text-xs font-medium tracking-wider uppercase flex items-center gap-2">
                                <CheckCircle2 className="h-3.5 w-3.5 text-gold-500" />
                                {chatMode === 'internal'
                                    ? `Discussing ${profileName || 'this profile'} with your family`
                                    : `Cross-family discussion about ${profileName || 'this match'}`}
                            </span>
                        </div>

                        {(loading && chatMode === 'internal') || (loadingExternal && chatMode === 'external') ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                <Loader2 className="h-8 w-8 animate-spin text-gold-400 mb-3" />
                                <p className="text-sm">Loading messages...</p>
                            </div>
                        ) : activeMessages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="w-16 h-16 rounded-full bg-gold-50 border border-gold-200 flex items-center justify-center mb-4">
                                    <MessageSquare className="h-7 w-7 text-gold-400" />
                                </div>
                                <p className="font-serif text-xl text-sacred-dark/70 mb-2">Start the conversation</p>
                                <p className="text-sm text-gray-400 max-w-xs">
                                    {chatMode === 'internal'
                                        ? 'Share your thoughts about this profile with your family.'
                                        : 'Begin a cross-family discussion. Both families will see these messages.'}
                                </p>
                            </div>
                        ) : (
                            activeMessages.map((msg, i) => {
                                const isMine = isMyMessage(msg);
                                const prevMsg = activeMessages[i - 1];
                                const showName = i === 0 || prevMsg?.senderId !== msg.senderId;

                                return (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 16, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                                        className={`flex flex-col w-full ${isMine ? 'items-end' : 'items-start'}`}
                                    >
                                        {showName && (
                                            <div className={`flex items-center gap-2 mb-1.5 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                                                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${isMine ? 'bg-sacred-dark' : 'bg-gold-600'}`}>
                                                    {msg.senderName?.charAt(0) || '?'}
                                                </div>
                                                <span className="text-[11px] font-bold tracking-wide uppercase text-sacred-dark/40">
                                                    {isMine ? 'You' : msg.senderName}
                                                </span>
                                            </div>
                                        )}
                                        <div className={`relative max-w-[70%] px-5 py-3.5 text-[15px] leading-relaxed shadow-md ${isMine
                                            ? 'bg-sacred-dark text-white rounded-2xl rounded-tr-sm'
                                            : 'bg-white border border-gold-100/50 text-sacred-dark rounded-2xl rounded-tl-sm'
                                        }`}>
                                            <p className="relative z-10">{msg.text}</p>
                                        </div>
                                        <span className="text-[10px] font-medium text-sacred-dark/30 mt-1 px-2">
                                            {timeStr(msg.timestamp || msg.createdAt)}
                                        </span>
                                    </motion.div>
                                );
                            })
                        )}

                        {/* Typing indicator */}
                        <AnimatePresence>
                            {typingUser && chatMode === 'internal' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-2 text-xs text-gray-400"
                                >
                                    <div className="flex gap-1">
                                        {[0, 0.2, 0.4].map((d, i) => (
                                            <motion.span key={i} animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: d }} className="w-1.5 h-1.5 rounded-full bg-gold-400" />
                                        ))}
                                    </div>
                                    <span>{typingUser} is typing...</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Floating Input */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#F3F0EA] via-[#F3F0EA]/80 to-transparent pt-20 pb-8 px-8 pointer-events-none">
                        <div className="relative max-w-3xl mx-auto flex items-end bg-white/70 backdrop-blur-xl rounded-[28px] border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-1.5 pointer-events-auto ring-1 ring-black/5 transition-all focus-within:bg-white/90 focus-within:shadow-[0_8px_40px_rgba(212,175,55,0.15)] focus-within:ring-gold-300/50">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder={chatMode === 'internal' ? 'Message your family...' : 'Message both families...'}
                                className="w-full resize-none bg-transparent py-4 pl-6 pr-14 text-sacred-dark outline-none font-sans overflow-hidden placeholder:text-sacred-dark/30 focus:ring-0 transition-all duration-300 text-[15px]"
                                rows={Math.min(4, input.split('\n').length || 1)}
                                style={{ minHeight: '56px', maxHeight: '140px' }}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || sending}
                                className="absolute bottom-2.5 right-2.5 flex h-10 w-10 items-center justify-center rounded-[18px] bg-gold-600 text-white transition-all duration-300 hover:scale-[1.05] hover:bg-gold-500 hover:shadow-lg hover:shadow-gold-600/30 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none disabled:bg-sacred-dark/10 disabled:text-sacred-dark/30"
                            >
                                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* ─────── Invite Member Modal ─────── */}
            <AnimatePresence>
                {showInvite && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        onClick={() => setShowInvite(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.92, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.92, y: 20 }}
                            className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-serif text-2xl text-sacred-dark">Invite Family Member</h2>
                                <button onClick={() => setShowInvite(false)} className="rounded-full p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            {inviteSuccess ? (
                                <div className="flex flex-col items-center py-8">
                                    <CheckCircle2 className="h-14 w-14 text-green-500 mb-3" />
                                    <p className="font-medium text-sacred-dark">Invitation sent!</p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm text-gray-500 mb-5">Enter the email address of the family member you'd like to add to this discussion.</p>
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={e => setInviteEmail(e.target.value)}
                                        placeholder="Email address..."
                                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-3.5 text-sacred-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-300 transition mb-4"
                                    />
                                    <button
                                        onClick={handleInvite}
                                        disabled={!inviteEmail.trim() || inviting}
                                        className="w-full rounded-2xl bg-gold-600 text-white py-3.5 font-semibold hover:bg-gold-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                                        {inviting ? 'Inviting...' : 'Send Invitation'}
                                    </button>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─────── Profile Drawer Slider ─────── */}
            <AnimatePresence>
                {showProfileDrawer && (
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 240 }}
                        className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-[300] flex flex-col border-l border-gold-200"
                    >
                        <div className="flex items-center justify-between p-5 border-b border-gold-100 bg-sacred-offwhite">
                            <h3 className="font-serif font-medium text-xl text-sacred-dark">Complete Details</h3>
                            <button onClick={() => setShowProfileDrawer(false)} className="p-2 text-gray-400 hover:bg-white hover:text-sacred-dark rounded-full transition-colors shadow-sm">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden relative bg-sacred-offwhite">
                            <SharedProfileView user={profileData} loading={profileLoading} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─────── Match Browser Drawer ─────── */}
            <AnimatePresence>
                {showMatchBrowser && (
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 240 }}
                        className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl z-[300] flex flex-col border-l border-gold-200"
                    >
                        <div className="flex items-center justify-between p-5 border-b border-gold-100 bg-sacred-offwhite">
                            <h3 className="font-serif font-medium text-xl text-sacred-dark">Discovered Matches</h3>
                            <button onClick={() => setShowMatchBrowser(false)} className="p-2 text-gray-400 hover:bg-white hover:text-sacred-dark rounded-full transition-colors shadow-sm">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden relative">
                            <MatchBrowser onClose={() => setShowMatchBrowser(false)} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
