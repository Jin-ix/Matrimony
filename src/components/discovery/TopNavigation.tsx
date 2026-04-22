import { Bell, User, Ghost, Settings, Church, UtensilsCrossed, MessageCircle, Moon, Sun, LogOut } from 'lucide-react';
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

    const handleSignOut = () => {
        localStorage.clear();
        navigate('/auth', { replace: true });
    };

    return (
        <nav className="sticky top-0 z-40 flex w-full items-center justify-between border-b border-gold-200/20 dark:border-white/5 bg-white/70 dark:bg-sacred-dark/70 px-4 md:px-8 py-3 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.02)] dark:shadow-none overflow-x-auto no-scrollbar transition-all duration-500">
            {/* Left: Brand Identity */}
            <div className="flex items-center space-x-3 shrink-0 mr-4">
                <div className="relative flex h-10 w-10 md:h-12 md:w-12 items-center justify-center bg-gradient-to-br from-gold-400 via-gold-500 to-gold-700 rounded-xl shadow-[0_4px_20px_rgba(212,175,55,0.4)] border border-gold-300/50 transform hover:scale-105 transition-all duration-500 group overflow-hidden cursor-pointer" onClick={() => navigate('/discovery')}>
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-overlay"></div>
                    <Church className="w-5 h-5 md:w-6 md:h-6 text-white drop-shadow-md z-10 transition-transform duration-500 group-hover:rotate-6" />
                </div>
                <div className="flex flex-col hidden lg:flex cursor-pointer group" onClick={() => navigate('/discovery')}>
                    <span className="font-serif text-[22px] font-medium tracking-tight text-sacred-dark dark:text-pearl-50 leading-none group-hover:text-gold-600 transition-colors duration-300">Indian Catholic</span>
                    <span className="font-sans text-[10px] font-bold tracking-[0.25em] text-gold-600 dark:text-gold-400 uppercase mt-1">Matrimony</span>
                </div>
            </div>

            {/* Right: Premium Dynamic Islands */}
            <div className="flex items-center space-x-3 md:space-x-4 shrink-0">
                
                {/* Island 1: System Controls */}
                <div className="flex items-center bg-gray-50/80 dark:bg-sacred-midnight/60 border border-gray-200/50 dark:border-white/5 rounded-full p-1 shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-md">
                    <button
                        onClick={toggleTheme}
                        className="flex h-9 items-center gap-1.5 px-3 rounded-full transition-all duration-300 hover:bg-white dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-sacred-dark dark:hover:text-white"
                        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {theme === 'dark' ? <Sun className="h-4 w-4 text-gold-400" /> : <Moon className="h-4 w-4 text-indigo-900" />}
                        <span className="text-[10px] font-bold uppercase tracking-widest hidden xl:inline-block">Theme</span>
                    </button>

                    <div className="w-[1px] h-4 bg-gray-200 dark:bg-white/10 mx-1 rounded-full"></div>

                    <div
                        onClick={() => {
                            const newState = !ghostMode;
                            setGhostMode(newState);
                            if (onGhostModeToggle) onGhostModeToggle(newState);
                        }}
                        className={`flex h-9 items-center gap-1.5 px-3 rounded-full transition-all duration-300 cursor-pointer ${ghostMode ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'hover:bg-white dark:hover:bg-white/10 text-gray-500 dark:text-gray-400'}`}
                    >
                        <Ghost className="h-4 w-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest hidden xl:inline-block">Ghost</span>
                        <div className={`flex h-4 w-7 items-center rounded-full p-0.5 transition-colors duration-300 ${ghostMode ? 'bg-indigo-500 shadow-inner' : 'bg-gray-300 dark:bg-gray-600'}`}>
                            <div className={`h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-300 ${ghostMode ? 'translate-x-3' : 'translate-x-0'}`} />
                        </div>
                    </div>
                </div>

                {/* Island 2: Main Navigation */}
                <div className="flex items-center bg-gray-50/80 dark:bg-sacred-midnight/60 border border-gray-200/50 dark:border-white/5 rounded-full p-1 shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-md">
                    
                    <button
                        onClick={onNotificationsClick}
                        className="relative flex h-9 items-center gap-1.5 px-3 rounded-full transition-all duration-300 hover:bg-white dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-sacred-dark dark:hover:text-white group"
                    >
                        <Bell className="h-4.5 w-4.5 transition-colors group-hover:text-gold-500" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-2 ring-white dark:ring-sacred-midnight animate-bounce">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-widest hidden md:inline-block">Alerts</span>
                    </button>

                    <button
                        onClick={() => navigate('/kitchen-table')}
                        className="flex h-9 items-center gap-2 px-4 rounded-full transition-all duration-500 bg-gradient-to-r from-gold-400 to-amber-300 dark:from-gold-600 dark:to-gold-700 shadow-[0_2px_10px_rgba(212,175,55,0.3)] hover:shadow-[0_4px_20px_rgba(212,175,55,0.5)] active:scale-95 group relative overflow-hidden mx-1"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] skew-x-[-15deg] group-hover:animate-[shimmer_1.5s_infinite]"></div>
                        <UtensilsCrossed className="h-4 w-4 text-sacred-dark dark:text-white relative z-10" />
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-sacred-dark dark:text-white whitespace-nowrap relative z-10 hidden md:inline-block">Kitchen Table</span>
                    </button>

                    <button
                        onClick={onProfileClick}
                        className="flex h-9 items-center gap-1.5 px-3 rounded-full transition-all duration-300 hover:bg-white dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-sacred-dark dark:hover:text-white group"
                    >
                        <User className="h-4.5 w-4.5 transition-colors group-hover:text-gold-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest hidden md:inline-block">Profile</span>
                    </button>

                    {localStorage.getItem('userRole') !== 'scout' && (
                        <button
                            onClick={() => navigate('/messages')}
                            className="flex h-9 items-center gap-1.5 px-3 rounded-full transition-all duration-300 hover:bg-white dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-sacred-dark dark:hover:text-white group"
                        >
                            <MessageCircle className="h-4.5 w-4.5 transition-colors group-hover:text-gold-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest hidden md:inline-block">Messages</span>
                        </button>
                    )}

                    <button
                        onClick={() => navigate('/settings')}
                        className="flex h-9 items-center gap-1.5 px-3 rounded-full transition-all duration-300 hover:bg-white dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-sacred-dark dark:hover:text-white group"
                    >
                        <Settings className="h-4.5 w-4.5 transition-transform group-hover:rotate-45" />
                        <span className="text-[10px] font-bold uppercase tracking-widest hidden md:inline-block">Settings</span>
                    </button>

                </div>

                {/* Island 3: Destructive Action */}
                <div className="flex items-center bg-red-50/40 dark:bg-red-900/10 border border-red-100/50 dark:border-red-900/20 rounded-full p-1 shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-md hover:border-red-200 dark:hover:border-red-800/40">
                    <button
                        onClick={handleSignOut}
                        className="flex h-9 items-center gap-1.5 px-3 md:px-4 rounded-full transition-all duration-300 hover:bg-red-100/50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 active:scale-95 group"
                    >
                        <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest hidden md:inline-block whitespace-nowrap">Sign Out</span>
                    </button>
                </div>

            </div>
        </nav>
    );
}
