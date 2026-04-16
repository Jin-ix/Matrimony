import { Bell, User, Ghost, Settings, Church, UtensilsCrossed, MessageCircle, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../lib/notificationContext';
import { useTheme } from '../../hooks/useTheme';

interface TopNavigationProps {
    onProfileClick?: () => void;
    onNotificationsClick?: () => void;
    onGhostModeToggle?: (enabled: boolean) => void;
}

export default function TopNavigation({ onProfileClick, onNotificationsClick, onGhostModeToggle }: TopNavigationProps) {
    const [ghostMode, setGhostMode] = useState(false);
    const navigate = useNavigate();
    const { unreadCount } = useNotifications();
    const { theme, toggleTheme } = useTheme();

    return (
        <nav className="sticky top-0 z-40 flex w-full items-center justify-between border-b border-gold-200/50 dark:border-white/10 bg-white/80 dark:bg-sacred-midnight/80 px-6 py-4 backdrop-blur-3xl shadow-[0_4px_30px_rgba(0,0,0,0.03)] dark:shadow-none">
            <div className="flex items-center space-x-3">
                {/* Premium Crest Logo */}
                <div className="relative flex h-11 w-11 items-center justify-center bg-gradient-to-br from-gold-400 to-gold-600 rounded-xl shadow-[0_4px_12px_rgba(212,175,55,0.3)] border border-gold-300 transform rotate-3 hover:rotate-0 transition-transform duration-500 overflow-hidden group">
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity blur-[2px]"></div>
                    <Church className="w-6 h-6 text-white drop-shadow-md z-10 -rotate-3 group-hover:rotate-0 transition-transform duration-500" />
                </div>
                <div className="flex flex-col">
                    <span className="font-serif text-[20px] font-medium tracking-tight text-sacred-dark dark:text-pearl-50 leading-none">Indian Catholic</span>
                    <span className="font-sans text-[11px] font-bold tracking-[0.2em] text-gold-600 uppercase mt-0.5">Matrimony</span>
                </div>
            </div>

            <div className="flex items-center space-x-6">
                <button
                    onClick={toggleTheme}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md haptic-btn"
                    title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {theme === 'dark' ? (
                        <Sun className="h-5 w-5 text-gold-400" />
                    ) : (
                        <Moon className="h-5 w-5 text-indigo-900" />
                    )}
                </button>

                <div
                    onClick={() => {
                        const newState = !ghostMode;
                        setGhostMode(newState);
                        if (onGhostModeToggle) onGhostModeToggle(newState);
                    }}
                    className={`flex items-center space-x-2 rounded-full border transition-all duration-300 cursor-pointer px-4 py-2 hover:shadow-md ${ghostMode ? 'border-indigo-300 bg-indigo-50/50 dark:bg-indigo-900/20' : 'border-gold-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm hover:border-gold-300'}`}
                >
                    <Ghost className={`h-4 w-4 transition-colors duration-300 ${ghostMode ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
                    <span className={`text-[13px] font-bold uppercase tracking-wider transition-colors duration-300 ${ghostMode ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-500'}`}>Ghost</span>
                    <div className={`ml-2 flex h-5 w-8 items-center rounded-full p-1 transition-colors duration-300 ${ghostMode ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
                        <div className={`h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-300 ${ghostMode ? 'translate-x-3' : 'translate-x-0'}`} />
                    </div>
                </div>

                <div className="relative">
                    <button
                        onClick={onNotificationsClick}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md haptic-btn group"
                    >
                        <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300 group-hover:text-gold-600 dark:group-hover:text-gold-400 transition-colors" />
                    </button>
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-sacred-midnight animate-bounce">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </div>

                <button
                    onClick={() => navigate('/kitchen-table')}
                    title="Kitchen Table 2.0"
                    className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gold-200 bg-gradient-to-br from-amber-50 to-gold-50 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md hover:border-gold-400 active:scale-95 group"
                >
                    <UtensilsCrossed className="h-4.5 w-4.5 text-gold-600 group-hover:text-gold-800 transition-colors" />
                </button>

                <button
                    onClick={onProfileClick}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-gold-200 bg-gradient-to-br from-white to-gold-50 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md hover:border-gold-300 active:scale-95"
                >
                    <User className="h-5 w-5 text-gold-700" />
                </button>

                {localStorage.getItem('userRole') !== 'scout' && (
                    <button
                        onClick={() => navigate('/messages')}
                        title="Messages & Connections"
                        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md hover:border-gray-300 active:scale-95 group"
                    >
                        <MessageCircle className="h-5 w-5 text-gray-600 group-hover:text-gold-600 transition-colors" />
                    </button>
                )}

                <button
                    onClick={() => navigate('/settings')}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md hover:border-gray-300 active:scale-95"
                >
                    <Settings className="h-5 w-5 text-gray-600" />
                </button>
            </div>
        </nav>
    );
}
