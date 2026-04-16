import { MapPin, ShieldCheck, Heart, BookOpen, Briefcase, Home, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import RadialChart from '../ui/RadialChart';

export default function SharedProfileView({ user, compatibility, loading = false }: { user: any, compatibility?: any, loading?: boolean }) {
    if (loading) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-sacred-offwhite p-6">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-400 border-t-transparent mb-4" />
                <p className="text-sm font-medium text-sacred-dark/60 animate-pulse">Loading Profile Details...</p>
            </div>
        );
    }

    if (!user) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-sacred-offwhite p-6 text-center">
            <p className="text-rose-500 font-medium">Profile data is completely null. It failed to fetch from backend.</p>
        </div>
    );

    if (!user.profile) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-sacred-offwhite p-6 text-center">
            <p className="text-rose-500 font-medium">User object retrieved, but no profile was attached: {JSON.stringify(user)}</p>
        </div>
    );

    const { profile, photos } = user;
    const primaryPhoto = photos?.find((p: any) => p.isPrimary)?.url || photos?.[0]?.url || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80';

    return (
        <div className="h-full w-full overflow-y-auto bg-sacred-offwhite dark:bg-sacred-midnight p-6 no-scrollbar relative">
            <div className="sticky top-0 mb-6 flex items-center justify-between z-10 bg-sacred-offwhite/80 dark:bg-sacred-midnight/80 backdrop-blur-sm py-2">
                <h2 className="text-xl font-serif font-medium text-sacred-dark dark:text-pearl-50">Candidate Profile</h2>
            </div>

            {/* Animated Radial Compatibility Scores */}
            {compatibility && (compatibility.familyScore || compatibility.individualScore) && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center justify-center gap-8 mb-8 p-6 rounded-2xl bg-white/60 dark:bg-white/5 border border-gold-100 dark:border-white/10 backdrop-blur-md shadow-sm"
                >
                    {compatibility.familyScore && (
                        <RadialChart value={Math.round(compatibility.familyScore)} label="Family Score" colorFrom="#22c55e" colorTo="#16a34a" delay={0.3} />
                    )}
                    {compatibility.individualScore && (
                        <RadialChart value={Math.round(compatibility.individualScore)} label="Individual" colorFrom="#d5a84b" colorTo="#cc8e2d" delay={0.5} />
                    )}
                    {compatibility.culturalDistance !== undefined && (
                        <RadialChart value={Math.max(0, 100 - Math.round(compatibility.culturalDistance))} label="Cultural Fit" colorFrom="#6366f1" colorTo="#4f46e5" delay={0.7} />
                    )}
                </motion.div>
            )}

            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full overflow-hidden rounded-[2rem] bg-white dark:bg-sacred-midnight/60 shadow-xl border border-gold-100 dark:border-white/10 mb-8 max-w-lg mx-auto"
            >
                <div className="relative aspect-[3/4] w-full">
                    <img
                        src={primaryPhoto}
                        alt={profile.firstName}
                        className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6">
                        <h1 className="font-serif text-4xl text-white drop-shadow-lg">
                            {profile.firstName} {profile.lastName}, {profile.age}
                        </h1>
                        <div className="mt-3 flex flex-wrap gap-2 text-white/90">
                            <span className="flex items-center text-xs font-medium bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full">
                                <MapPin className="mr-1.5 h-3.5 w-3.5" /> {profile.location}
                            </span>
                            {/* Glassmorphism Shimmer Badge */}
                            <span className="relative flex items-center text-xs font-medium bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full overflow-hidden">
                                <Home className="mr-1.5 h-3.5 w-3.5" /> {profile.rite.replace(/_/g, ' ')}
                                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer pointer-events-none" />
                            </span>
                            {profile.orthodoxBridge && (
                                <span className="relative flex items-center text-xs font-medium bg-indigo-500/20 backdrop-blur-md px-2.5 py-1 rounded-full text-indigo-100 overflow-hidden">
                                    <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Orthodox Bridge
                                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer pointer-events-none" />
                                </span>
                            )}
                            {profile.strictKnanaya && (
                                <span className="relative flex items-center text-xs font-medium bg-amber-500/20 backdrop-blur-md px-2.5 py-1 rounded-full text-amber-100 overflow-hidden">
                                    <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Strict Knanaya
                                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer pointer-events-none" />
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {profile.bio && (
                        <section>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-gold-700 mb-3 border-b border-gold-100 pb-2">About Me</h3>
                            <p className="font-serif text-sacred-dark leading-relaxed italic text-[15px] bg-gold-50/30 p-4 rounded-xl border border-gold-50">
                                "{profile.bio}"
                            </p>
                        </section>
                    )}

                    <section className="grid grid-cols-2 gap-4">
                        {(profile.education || profile.occupation) && (
                            <div className="space-y-1">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-gold-700 mb-2 flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Education & Career</h3>
                                {profile.education && <p className="text-sm text-sacred-dark">{profile.education}</p>}
                                {profile.occupation && <p className="text-sm text-sacred-dark/70 pt-0.5">{profile.occupation} {profile.employer ? `at ${profile.employer}` : ''}</p>}
                            </div>
                        )}
                        {(profile.maritalStatus || profile.hobbies?.length > 0) && (
                            <div className="space-y-1">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-gold-700 mb-2 flex items-center gap-1.5"><Heart className="h-3.5 w-3.5" /> Background</h3>
                                {profile.maritalStatus && <p className="text-sm text-sacred-dark">{profile.maritalStatus}</p>}
                                {profile.hobbies && profile.hobbies.length > 0 && <p className="text-sm text-sacred-dark/70 pt-0.5 mt-1">{profile.hobbies.slice(0, 3).join(', ')}</p>}
                            </div>
                        )}
                    </section>

                    {profile.familyValues && (
                        <section>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-gold-700 mb-3 border-b border-gold-100 pb-2">Family Values</h3>
                            <p className="text-sm text-sacred-dark/80 leading-relaxed">
                                {profile.familyValues}
                            </p>
                        </section>
                    )}

                    {compatibility?.aiInsight && (
                        <section>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-gold-700 mb-3 border-b border-gold-100 pb-2 flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4" /> AI Compatibility Insight
                            </h3>
                            <div className="bg-green-50/50 p-4 rounded-xl text-sm text-green-900 leading-relaxed font-sans border border-green-100 shadow-sm">
                                {compatibility.aiInsight}
                            </div>
                        </section>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
