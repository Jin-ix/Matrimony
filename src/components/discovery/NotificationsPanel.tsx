import { motion } from 'framer-motion';
import { X, Bell, Heart, ShieldCheck, Mail } from 'lucide-react';

interface NotificationsPanelProps {
    onClose: () => void;
}

export default function NotificationsPanel({ onClose }: NotificationsPanelProps) {
    const notifications = [
        { id: 1, icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50', title: 'New Interest', time: '2m ago', desc: 'Thomas has expressed interest in your profile.' },
        { id: 2, icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50', title: 'Profile Verified', time: '1h ago', desc: 'Your church documents have been verified.' },
        { id: 3, icon: Mail, color: 'text-gold-600', bg: 'bg-gold-50', title: 'New Message', time: 'Yesterday', desc: 'Your family has started a new Kitchen Table discussion.' },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-end bg-black/40 backdrop-blur-sm">
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="flex h-full w-full max-w-sm flex-col bg-white shadow-2xl border-l border-gold-200"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gold-200 bg-sacred-offwhite px-6 py-5">
                    <h2 className="font-serif text-2xl text-sacred-dark flex items-center gap-2">
                        <Bell className="h-5 w-5 text-gold-600 fill-current" /> Notifications
                    </h2>
                    <button onClick={onClose} className="rounded-full p-2 text-gray-500 hover:bg-gold-50 hover:text-sacred-dark transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                    {notifications.map(notif => (
                        <div key={notif.id} className="relative flex items-start gap-4 rounded-2xl bg-white p-4 shadow-sm border border-gray-100 hover:border-gold-200 hover:shadow-md transition-all cursor-pointer group">
                            <div className={`mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${notif.bg}`}>
                                <notif.icon className={`h-5 w-5 ${notif.color}`} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-sacred-dark text-sm">{notif.title}</h4>
                                    <span className="text-xs font-medium text-gray-400">{notif.time}</span>
                                </div>
                                <p className="mt-1 text-sm text-gray-600 leading-snug">{notif.desc}</p>
                            </div>
                            <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                    ))}
                    <button className="w-full text-center text-sm font-medium text-gold-600 py-4 hover:text-gold-800 transition-colors">
                        Mark all as read
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
