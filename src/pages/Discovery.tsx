import TopNavigation from '../components/discovery/TopNavigation';
import FilterControlBar from '../components/discovery/FilterControlBar';
import MatchFeedGrid from '../components/discovery/MatchFeedGrid';
import UserProfileModal from '../components/discovery/UserProfileModal';
import AdvancedFiltersModal from '../components/discovery/AdvancedFiltersModal';
import NotificationsPanel from '../components/discovery/NotificationsPanel';
import WelcomeHubBanner from '../components/discovery/WelcomeHubBanner';
import LandingAbout from '../components/onboarding/LandingAbout';
import LandingHowItWorks from '../components/onboarding/LandingHowItWorks';
import LandingServices from '../components/onboarding/LandingServices';
import LandingCTA from '../components/onboarding/LandingCTA';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, type AppNotification } from '../lib/notificationContext';
import { supabase } from '../lib/supabase';

export default function Discovery() {
    const [showProfile, setShowProfile] = useState(false);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [liveToast, setLiveToast] = useState<AppNotification | null>(null);
    const prevCountRef = useRef(0);
    const { notifications } = useNotifications();
    const navigate = useNavigate();

    const [orthodoxBridge, setOrthodoxBridge] = useState(false);
    const [strictKnanaya, setStrictKnanaya] = useState(false);
    const [activeRite, setActiveRite] = useState<string | null>(null);

    // State for Banner customization
    const [userRole, setUserRole] = useState<string | null>(null);
    const [userGender, setUserGender] = useState<string | null>(null);

    // Show live toast when a new notification arrives via socket
    useEffect(() => {
        if (notifications.length > prevCountRef.current) {
            const newest = notifications[0];
            if (newest && !newest.isRead) {
                setLiveToast(newest);
                const t = setTimeout(() => setLiveToast(null), 6000);
                return () => clearTimeout(t);
            }
        }
        prevCountRef.current = notifications.length;
    }, [notifications]);

    // Auto-hide toast & setup user preferences
    useEffect(() => {
        const loadPreferences = async () => {
            let role = localStorage.getItem('userRole');
            let gender = localStorage.getItem('userGender');
            const userId = localStorage.getItem('userId');

            if ((!role || !gender) && userId) {
                const { data: user } = await supabase.from('User').select('role').eq('id', userId).single();
                if (user?.role) {
                    role = user.role;
                    localStorage.setItem('userRole', role as string);
                }

                const { data: profile } = await supabase.from('Profile').select('gender').eq('userId', userId).single();
                if (profile?.gender) {
                    gender = profile.gender;
                    localStorage.setItem('userGender', gender as string);
                }
            }

            setUserRole(role);
            setUserGender(gender);
        };

        loadPreferences();

        if (toastMessage) {
            const timer = setTimeout(() => setToastMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    const handleGhostModeToggle = (enabled: boolean) => {
        setToastMessage(enabled ? 'Ghost Mode Enabled: Your profile is now hidden.' : 'Ghost Mode Disabled: You are visible to matches.');
    };

    return (
        <div className="min-h-screen bg-sacred-offwhite text-sacred-dark font-sans selection:bg-gold-200">
            <TopNavigation
                onProfileClick={() => setShowProfile(true)}
                onNotificationsClick={() => setShowNotifications(true)}
                onGhostModeToggle={handleGhostModeToggle}
            />
            <FilterControlBar
                orthodoxBridge={orthodoxBridge}
                setOrthodoxBridge={setOrthodoxBridge}
                strictKnanaya={strictKnanaya}
                setStrictKnanaya={setStrictKnanaya}
                activeRite={activeRite}
                setActiveRite={setActiveRite}
                onAdvancedFiltersClick={() => setShowAdvancedFilters(true)}
            />
            <main className="relative z-0 min-h-screen">
                {/* Subtle background ornamentation with wedding vibes */}
                <div className="fixed inset-0 z-0 pointer-events-none hidden md:block">
                    <motion.div
                        animate={{ y: [0, -30, 0], rotate: [0, 5, 0] }}
                        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-40 left-[10%] w-48 h-48 rounded-full border border-gold-300 opacity-20"
                    />
                    <motion.div
                        animate={{ y: [0, 40, 0], rotate: [0, -10, 0] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute bottom-40 right-[15%] w-64 h-64 rounded-full border-2 border-gold-400 border-dashed opacity-10"
                    />
                </div>
                <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_right,rgba(213,168,75,0.08),transparent_60%)] pointer-events-none" />

                <div className="relative z-10 w-full overflow-hidden pt-8">
                    <div className="px-6 mx-auto w-full max-w-7xl">
                        <WelcomeHubBanner userRole={userRole} userGender={userGender} />
                    </div>
                    <MatchFeedGrid
                        orthodoxBridge={orthodoxBridge}
                        strictKnanaya={strictKnanaya}
                        activeRite={activeRite}
                    />
                </div>

                {/* Scrollable Information Sections Placed Under Profiles */}
                <div className="relative z-10 bg-white">
                    <LandingAbout />
                    <LandingHowItWorks />
                    <LandingServices />
                    <LandingCTA onStart={() => setToastMessage("Upgrade to Premium to get started with Assisted Matchmaking!")} />
                </div>
            </main>

            {/* Global Auxiliary Overlays */}
            <AnimatePresence>
                {showProfile && (
                    <UserProfileModal
                        onClose={() => setShowProfile(false)}
                        onSettingsClick={() => {
                            setShowProfile(false);
                            setToastMessage('Account Settings opened (Mock)');
                        }}
                    />
                )}
                {showAdvancedFilters && <AdvancedFiltersModal onClose={() => setShowAdvancedFilters(false)} />}
                {showNotifications && <NotificationsPanel onClose={() => setShowNotifications(false)} />}

                {toastMessage && (
                    <motion.div
                        key="system-toast"
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed top-24 left-1/2 z-[150] -translate-x-1/2 rounded-full border border-gold-200 bg-white shadow-lg px-6 py-3 font-medium text-sacred-dark"
                    >
                        {toastMessage}
                    </motion.div>
                )}

                {/* Live Socket Notification Toast */}
                {liveToast && (
                    <motion.div
                        key={liveToast.id}
                        initial={{ opacity: 0, y: -32, scale: 0.93 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -16, scale: 0.96 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 260 }}
                        className={`fixed top-24 right-6 z-[200] flex items-start gap-4 rounded-2xl shadow-2xl border p-4 max-w-sm w-[calc(100vw-3rem)] ${
                            liveToast.type === 'mutual_match'
                                ? 'bg-gradient-to-br from-amber-900 to-stone-900 border-gold-500/40 text-white'
                                : 'bg-white border-gray-200 text-sacred-dark'
                        }`}
                    >
                        {/* Icon */}
                        <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                            liveToast.type === 'mutual_match' ? 'bg-gold-500/20' : 'bg-rose-50'
                        }`}>
                            {liveToast.type === 'mutual_match'
                                ? <Sparkles className="w-5 h-5 text-gold-400 fill-current" />
                                : <Heart className="w-5 h-5 text-rose-500 fill-current" />
                            }
                        </div>

                        {/* Body */}
                        <div className="flex-1 min-w-0">
                            <p className={`font-semibold text-sm ${
                                liveToast.type === 'mutual_match' ? 'text-gold-300' : 'text-sacred-dark'
                            }`}>{liveToast.title}</p>
                            <p className={`text-xs mt-0.5 leading-relaxed ${
                                liveToast.type === 'mutual_match' ? 'text-amber-200/80' : 'text-gray-500'
                            }`}>{liveToast.description}</p>

                            {liveToast.type === 'mutual_match' && liveToast.relatedId && (
                                <button
                                    onClick={() => {
                                        setLiveToast(null);
                                        navigate(`/messages/${liveToast.relatedId}`);
                                    }}
                                    className="mt-2 text-xs font-semibold text-gold-400 hover:text-gold-300 underline underline-offset-2 transition-colors"
                                >
                                    Start chatting →
                                </button>
                            )}

                            {liveToast.type === 'new_interest' && (
                                <button
                                    onClick={() => {
                                        setLiveToast(null);
                                        setShowNotifications(true);
                                    }}
                                    className="mt-2 text-xs font-semibold text-gold-600 hover:text-gold-800 underline underline-offset-2 transition-colors"
                                >
                                    View notifications →
                                </button>
                            )}
                        </div>

                        {/* Dismiss */}
                        <button
                            onClick={() => setLiveToast(null)}
                            className={`shrink-0 rounded-full p-1 transition-colors ${
                                liveToast.type === 'mutual_match' ? 'text-amber-300/60 hover:text-amber-200' : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
