import TopNavigation from '../components/discovery/TopNavigation';
import FilterControlBar from '../components/discovery/FilterControlBar';
import MatchFeedGrid from '../components/discovery/MatchFeedGrid';
import UserProfileModal from '../components/discovery/UserProfileModal';
import AdvancedFiltersModal, { type AdvancedFilters } from '../components/discovery/AdvancedFiltersModal';
import NotificationsPanel from '../components/discovery/NotificationsPanel';
import WelcomeHubBanner from '../components/discovery/WelcomeHubBanner';
import LandingAbout from '../components/onboarding/LandingAbout';
import LandingHowItWorks from '../components/onboarding/LandingHowItWorks';
import LandingServices from '../components/onboarding/LandingServices';
import LandingCTA from '../components/onboarding/LandingCTA';
import FloatingAIAssistant from '../components/ui/FloatingAIAssistant';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

export default function Discovery() {
    const [showProfile, setShowProfile] = useState(false);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const [orthodoxBridge, setOrthodoxBridge] = useState(false);
    const [strictKnanaya, setStrictKnanaya] = useState(false);
    const [activeRite, setActiveRite] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
        ageRange: [18, 60],
        location: '',
        rite: 'Any',
        maritalStatus: 'Any',
        education: 'Any',
        diet: 'Any',
        motherTongue: 'Any',
        smoke: 'any',
        drink: 'any',
    });

    // State for Banner customization
    const [userRole, setUserRole] = useState<string | null>(null);
    const [userGender, setUserGender] = useState<string | null>(null);

    // Socket notifications are handled globally in NotificationProvider

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
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
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
                    advancedFilters={advancedFilters}
                    searchQuery={searchQuery}
                />
                </div>

                {/* Scrollable Information Sections Placed Under Profiles */}
                <div className="relative z-10 bg-white">
                    <LandingAbout />
                    <LandingHowItWorks />
                    <LandingServices />
                    <LandingCTA onStart={() => setToastMessage("Get started with Assisted Matchmaking today!")} />
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
                {showAdvancedFilters && (
                    <AdvancedFiltersModal
                        onClose={() => setShowAdvancedFilters(false)}
                        initialFilters={advancedFilters}
                        onApplyFilters={(newFilters) => setAdvancedFilters(newFilters)}
                    />
                )}
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

                {/* Global toasts are handled by NotificationProvider */}
            </AnimatePresence>
            
            {/* AI Assistant */}
            <FloatingAIAssistant />
        </div>
    );
}
