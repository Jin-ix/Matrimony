import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Heart, ShieldCheck, Mail, Sparkles, Star, Users, CheckCheck, Loader2, MessageCircle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, type AppNotification, type NotificationType } from '../../lib/notificationContext';

interface NotificationsPanelProps {
    onClose: () => void;
}

// ---- Icon config per notification type ----
const TYPE_CONFIG: Record<
    NotificationType,
    { icon: React.ElementType; color: string; bg: string; label: string }
> = {
    new_interest: {
        icon: Heart,
        color: 'text-rose-500',
        bg: 'bg-rose-50',
        label: 'New Like',
    },
    mutual_match: {
        icon: Sparkles,
        color: 'text-gold-600',
        bg: 'bg-amber-50',
        label: "It's a Match!",
    },
    new_message: {
        icon: Mail,
        color: 'text-blue-500',
        bg: 'bg-blue-50',
        label: 'New Message',
    },
    scout_recommendation: {
        icon: Users,
        color: 'text-purple-500',
        bg: 'bg-purple-50',
        label: 'Family Recommendation',
    },
    profile_verified: {
        icon: ShieldCheck,
        color: 'text-green-600',
        bg: 'bg-green-50',
        label: 'Profile Verified',
    },
};

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

function NotificationItem({ notif, onRead, onClose }: {
    notif: AppNotification;
    onRead: (id: string) => void;
    onClose: () => void;
}) {
    const navigate = useNavigate();
    const config = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.new_interest;
    const Icon = config.icon;

    const handleClick = () => {
        onRead(notif.id);
        if (notif.type === 'mutual_match' && notif.relatedId) {
            onClose();
            navigate(`/messages/${notif.relatedId}`);
        } else if (notif.type === 'new_message' && notif.relatedId) {
            onClose();
            navigate(`/messages/${notif.relatedId}`);
        }
    };

    const isMutualMatch = notif.type === 'mutual_match';

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={handleClick}
            className={`relative flex items-start gap-4 rounded-2xl p-4 border transition-all cursor-pointer group
                ${isMutualMatch
                    ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-gold-200 hover:border-gold-400 hover:shadow-md shadow-sm'
                    : 'bg-white border-gray-100 hover:border-gold-200 hover:shadow-md'
                }
                ${!notif.isRead ? 'ring-1 ring-gold-300/30' : ''}
            `}
        >
            {/* Unread dot */}
            {!notif.isRead && (
                <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}

            {/* Icon */}
            <div className={`mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full ${config.bg} shadow-sm`}>
                <Icon className={`h-5 w-5 ${config.color} ${isMutualMatch ? 'fill-current' : ''}`} />
            </div>

            {/* Body */}
            <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                    <h4 className={`font-semibold text-sm truncate ${isMutualMatch ? 'text-gold-700' : 'text-sacred-dark'}`}>
                        {notif.title}
                    </h4>
                    <span className="text-xs text-gray-400 shrink-0">{timeAgo(notif.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-600 leading-snug line-clamp-2">{notif.description}</p>

                {/* CTA for mutual match */}
                {isMutualMatch && notif.relatedId && (
                    <div className="mt-2 flex items-center gap-1.5 text-gold-600 font-medium text-xs group-hover:text-gold-700 transition-colors">
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>Start chatting now</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                )}

                {/* CTA for new_message */}
                {notif.type === 'new_message' && notif.relatedId && (
                    <div className="mt-2 flex items-center gap-1.5 text-blue-500 font-medium text-xs">
                        <span>Open conversation</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                )}
            </div>
        </motion.div>
    );
}

export default function NotificationsPanel({ onClose }: NotificationsPanelProps) {
    const { notifications, unreadCount, loading, markAllRead, markOneRead } = useNotifications();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                className="flex h-full w-full max-w-sm flex-col bg-white shadow-2xl border-l border-gold-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gold-200 bg-sacred-offwhite px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Bell className="h-5 w-5 text-gold-600 fill-current" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 h-4 w-4 flex items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-1 ring-white">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </div>
                        <h2 className="font-serif text-2xl text-sacred-dark">Notifications</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-gray-500 hover:bg-gold-50 hover:text-sacred-dark transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Mark all read */}
                {unreadCount > 0 && (
                    <div className="px-6 py-3 border-b border-gray-100 bg-white">
                        <button
                            onClick={markAllRead}
                            className="flex items-center gap-2 text-sm font-medium text-gold-600 hover:text-gold-800 transition-colors"
                        >
                            <CheckCheck className="h-4 w-4" />
                            Mark all as read ({unreadCount})
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <Loader2 className="h-8 w-8 animate-spin mb-3 text-gold-400" />
                            <p className="text-sm">Loading notifications...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                <Bell className="h-7 w-7 text-gray-300" />
                            </div>
                            <p className="font-medium text-gray-500 text-sm">No notifications yet</p>
                            <p className="text-xs text-gray-400 mt-1 text-center px-4">When someone likes your profile or you get a match, it'll appear here.</p>
                        </div>
                    ) : (
                        <AnimatePresence initial={false}>
                            {notifications.map((notif) => (
                                <NotificationItem
                                    key={notif.id}
                                    notif={notif}
                                    onRead={markOneRead}
                                    onClose={onClose}
                                />
                            ))}
                        </AnimatePresence>
                    )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                    <div className="shrink-0 border-t border-gray-100 p-4 bg-white">
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                            <Star className="h-3 w-3 text-gold-400 fill-current" />
                            <span>Showing {notifications.length} notification{notifications.length !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
