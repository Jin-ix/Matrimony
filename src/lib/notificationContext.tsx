import {
    createContext,
    useContext,
    useEffect,
    useState,
    useRef,
    useCallback,
    type ReactNode,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import { supabase } from './supabase';

export type NotificationType =
    | 'new_interest'
    | 'mutual_match'
    | 'new_message'
    | 'scout_recommendation'
    | 'profile_verified';

export interface AppNotification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    description: string;
    relatedId?: string | null;
    isRead: boolean;
    createdAt: string;
}

interface NotificationContextValue {
    notifications: AppNotification[];
    unreadCount: number;
    loading: boolean;
    markAllRead: () => Promise<void>;
    markOneRead: (id: string) => Promise<void>;
    dismissNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const userId = localStorage.getItem('userId');

    // ── Merge helper: insert without duplicates, newest first ───────────────
    const mergeNotifications = useCallback((fresh: AppNotification[]) => {
        setNotifications(prev => {
            const existingIds = new Set(prev.map(n => n.id));
            const newOnes = fresh.filter(n => !existingIds.has(n.id));
            return [...newOnes, ...prev].sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        });
    }, []);

    // ── Fetch via REST API (backend) ─────────────────────────────────────────
    const fetchFromBackend = useCallback(async (): Promise<boolean> => {
        if (!userId) return false;
        try {
            const res = await fetch(`${API}/notifications`, {
                signal: AbortSignal.timeout(4000),
                headers: { 'x-user-id': userId },
            });
            if (!res.ok) return false;
            const data = await res.json();
            const notifs: AppNotification[] = data.data?.notifications ?? data.notifications ?? [];
            setNotifications(notifs.sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            ));
            return true;
        } catch {
            return false;
        }
    }, [userId]);

    // ── Fetch directly from Supabase (fallback) ──────────────────────────────
    const fetchFromSupabase = useCallback(async () => {
        if (!userId) return;
        try {
            const { data, error } = await supabase
                .from('Notification')
                .select('*')
                .eq('userId', userId)
                .order('createdAt', { ascending: false })
                .limit(50);

            if (error) { console.error('[Notifications] Supabase error:', error.message); return; }

            // Build synthetic notifications from Interest table too (in case Notification table is empty)
            const notifs: AppNotification[] = (data ?? []).map((n: any) => ({
                id: n.id,
                userId: n.userId,
                type: n.type as NotificationType,
                title: n.title,
                description: n.description,
                relatedId: n.relatedId ?? null,
                isRead: n.isRead ?? false,
                createdAt: n.createdAt,
            }));

            if (notifs.length === 0) {
                // Synthesize from raw Interest table if Notification table empty/missing
                await synthesizeFromInterests();
                return;
            }

            setNotifications(notifs);
        } catch (e) {
            console.error('[Notifications] Supabase fetch exception:', e);
            await synthesizeFromInterests();
        }
    }, [userId]);   // eslint-disable-line

    // ── Synthesize notifications from raw Interest records ───────────────────
    const synthesizeFromInterests = useCallback(async () => {
        if (!userId) return;
        try {
            // Interests received
            const { data: received } = await supabase
                .from('Interest')
                .select('id,fromUserId,type,createdAt')
                .eq('toUserId', userId)
                .eq('type', 'interest')
                .order('createdAt', { ascending: false })
                .limit(20);

            const synth: AppNotification[] = [];
            for (const r of (received ?? [])) {
                // Get name
                const { data: profile } = await supabase
                    .from('Profile')
                    .select('firstName')
                    .eq('userId', r.fromUserId)
                    .single();

                const name = profile?.firstName || 'Someone';

                // Check if mutual
                const { data: myInterest } = await supabase
                    .from('Interest')
                    .select('id')
                    .eq('fromUserId', userId)
                    .eq('toUserId', r.fromUserId)
                    .eq('type', 'interest')
                    .single();

                if (myInterest) {
                    // Mutual match — find conversation
                    const { data: convPart } = await supabase
                        .from('ConversationParticipant')
                        .select('conversationId')
                        .eq('userId', userId)
                        .limit(1)
                        .single();

                    synth.push({
                        id: `synth_match_${r.id}`,
                        userId,
                        type: 'mutual_match',
                        title: "It's a Match! 💍",
                        description: `You and ${name} are mutually interested. Start a conversation!`,
                        relatedId: convPart?.conversationId ?? null,
                        isRead: false,
                        createdAt: r.createdAt,
                    });
                } else {
                    synth.push({
                        id: `synth_interest_${r.id}`,
                        userId,
                        type: 'new_interest',
                        title: 'New Like',
                        description: `${name} has expressed interest in your profile.`,
                        relatedId: r.fromUserId,
                        isRead: false,
                        createdAt: r.createdAt,
                    });
                }
            }

            if (synth.length > 0) mergeNotifications(synth);
        } catch (e) {
            console.error('[Notifications] synthesize error:', e);
        }
    }, [userId, mergeNotifications]);

    // ── Main init ─────────────────────────────────────────────────────────────
    const fetchNotifications = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        const ok = await fetchFromBackend();
        if (!ok) {
            console.log('[Notifications] Backend unavailable — querying Supabase directly');
            await fetchFromSupabase();
        }
        setLoading(false);
    }, [userId, fetchFromBackend, fetchFromSupabase]);

    // ── Socket.IO real-time ───────────────────────────────────────────────────
    useEffect(() => {
        if (!userId) return;

        fetchNotifications();

        // Try socket — silently fail if server is down
        try {
            const socket = io(`${SOCKET_URL}/notifications`, {
                transports: ['websocket'],
                reconnectionAttempts: 3,
                timeout: 5000,
            });

            socket.on('connect', () => {
                console.log('[Socket] Notification namespace connected');
                socket.emit('notification:register', userId);
            });

            socket.on('notification:new', (notif: AppNotification) => {
                console.log('[Socket] Received notification:', notif);
                mergeNotifications([notif]);
            });

            socket.on('connect_error', () => {
                // Server not running — silently ignore, we've already queried Supabase
            });

            socketRef.current = socket;
            return () => { socket.disconnect(); };
        } catch {
            // Socket.IO not available
        }
    }, [userId, fetchNotifications, mergeNotifications]);

    // ── Mark all read ─────────────────────────────────────────────────────────
    const markAllRead = useCallback(async () => {
        if (!userId) return;
        // Optimistic UI
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        try {
            // Try backend
            const res = await fetch(`${API}/notifications/read-all`, {
                method: 'PUT',
                signal: AbortSignal.timeout(3000),
                headers: { 'x-user-id': userId },
            });
            if (!res.ok) throw new Error('backend unavailable');
        } catch {
            // Supabase direct fallback
            await supabase
                .from('Notification')
                .update({ isRead: true })
                .eq('userId', userId)
                .eq('isRead', false);
        }
    }, [userId]);

    // ── Mark single read ──────────────────────────────────────────────────────
    const markOneRead = useCallback(async (id: string) => {
        if (!userId) return;
        setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
        try {
            const res = await fetch(`${API}/notifications/${id}/read`, {
                method: 'PUT',
                signal: AbortSignal.timeout(3000),
                headers: { 'x-user-id': userId },
            });
            if (!res.ok) throw new Error('backend unavailable');
        } catch {
            if (!id.startsWith('synth_')) {
                await supabase.from('Notification').update({ isRead: true }).eq('id', id);
            }
        }
    }, [userId]);

    // ── Dismiss from local state ──────────────────────────────────────────────
    const dismissNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <NotificationContext.Provider
            value={{ notifications, unreadCount, loading, markAllRead, markOneRead, dismissNotification }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
    return ctx;
}
