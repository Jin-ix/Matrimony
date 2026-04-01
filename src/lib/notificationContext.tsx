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

const API = 'http://localhost:3001/api';
const SOCKET_URL = 'http://localhost:3001';

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    const userId = localStorage.getItem('userId');

    // ------- Fetch initial notifications via REST -------
    const fetchNotifications = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const res = await fetch(`${API}/notifications`, {
                headers: { 'x-user-id': userId },
            });
            if (!res.ok) return;
            const data = await res.json();
            setNotifications(data.data?.notifications ?? data.notifications ?? []);
        } catch (e) {
            console.error('[Notifications] fetch error', e);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // ------- Connect Socket.IO for real-time push -------
    useEffect(() => {
        if (!userId) return;

        fetchNotifications();

        const socket = io(`${SOCKET_URL}/notifications`, {
            transports: ['websocket'],
            reconnectionAttempts: 5,
        });

        socket.on('connect', () => {
            console.log('[Socket] Notification namespace connected');
            socket.emit('notification:register', userId);
        });

        socket.on('notification:new', (notif: AppNotification) => {
            console.log('[Socket] Received notification:', notif);
            setNotifications((prev) => {
                // Avoid duplicates
                if (prev.some((n) => n.id === notif.id)) return prev;
                return [notif, ...prev];
            });
        });

        socket.on('disconnect', () => {
            console.log('[Socket] Notification namespace disconnected');
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
        };
    }, [userId, fetchNotifications]);

    // ------- Mark all as read -------
    const markAllRead = useCallback(async () => {
        if (!userId) return;
        try {
            await fetch(`${API}/notifications/read-all`, {
                method: 'PUT',
                headers: { 'x-user-id': userId },
            });
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        } catch (e) {
            console.error('[Notifications] markAllRead error', e);
        }
    }, [userId]);

    // ------- Mark single as read -------
    const markOneRead = useCallback(async (id: string) => {
        if (!userId) return;
        try {
            await fetch(`${API}/notifications/${id}/read`, {
                method: 'PUT',
                headers: { 'x-user-id': userId },
            });
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );
        } catch (e) {
            console.error('[Notifications] markOneRead error', e);
        }
    }, [userId]);

    // ------- Dismiss from local state -------
    const dismissNotification = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const unreadCount = notifications.filter((n) => !n.isRead).length;

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
