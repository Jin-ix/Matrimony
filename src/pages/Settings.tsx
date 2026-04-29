import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Bell, LogOut, Shield, User, Heart, EyeOff,
    Save, ChevronRight, Activity, CheckCircle, MapPin, Church,
    Briefcase, GraduationCap, Instagram, CheckCircle2, X
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

type SettingsTab = 'profile' | 'preferences' | 'privacy' | 'notifications';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const RITE_DISPLAY: Record<string, string> = {
    SYRO_MALABAR: 'Syro-Malabar',
    LATIN: 'Latin',
    KNANAYA_CATHOLIC: 'Knanaya Catholic',
    MALANKARA_ORTHODOX: 'Malankara Orthodox',
    SYRO_MALANKARA: 'Syro-Malankara',
    OTHER: 'Other',
};

function getUserId(): string {
    return (
        localStorage.getItem('userId') ||
        (() => { try { return JSON.parse(localStorage.getItem('user') || '{}').id || ''; } catch { return ''; } })()
    );
}

function apiHeaders(userId: string) {
    return {
        'Content-Type': 'application/json',
        'x-user-id': userId,
        'x-user-role': localStorage.getItem('userRole') || 'candidate',
    };
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ type, message }: { type: 'success' | 'error'; message: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 rounded-2xl px-5 py-3.5 shadow-xl text-sm font-medium pointer-events-none ${
                type === 'success' ? 'bg-emerald-900 text-white' : 'bg-rose-900 text-white'
            }`}
        >
            {type === 'success'
                ? <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                : <X className="w-4 h-4 text-rose-300 shrink-0" />}
            {message}
        </motion.div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Settings() {
    const navigate = useNavigate();
    const [_searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // profile comes from the backend API (mirrors the Supabase Profile table)
    const [userData, setUserData] = useState<any>(null);     // { id, email, phone, role, isVerified, profile, photos }
    const [profile, setProfile] = useState<any>({});
    const [preferences, setPreferences] = useState<any>({});
    const [loading, setLoading] = useState(true);

    const showToast = useCallback((type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    }, []);

    // Instagram popup message handler
    useEffect(() => {
        const handler = (e: MessageEvent) => {
            if (e.data?.type === 'INSTAGRAM_SUCCESS') {
                const { username } = e.data.data;
                setProfile((p: any) => ({ ...p, instagramHandle: username }));
                showToast('success', `Instagram connected as @${username}!`);
            }
            if (e.data?.type === 'LINKEDIN_SUCCESS') {
                const d = e.data.data;
                setProfile((p: any) => ({
                    ...p,
                    occupation: d.occupation || p.occupation,
                    employer: d.employer || p.employer,
                    education: d.education || p.education,
                }));
                showToast('success', 'LinkedIn connected — professional details updated!');
            }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, [showToast]);

    // ── Fetch: Supabase REST (primary) → backend API (fallback) ─────────────
    useEffect(() => {
        const fetchData = async () => {
            const userId = getUserId();
            if (!userId) { setLoading(false); return; }

            try {
                // Primary: Supabase REST API (HTTPS — always works, bypasses TCP pooler)
                const [profileRes, userRes, prefsRes] = await Promise.all([
                    supabase.from('Profile').select('*').eq('userId', userId).maybeSingle(),
                    supabase.from('User').select('id,email,phone,role,isVerified,createdAt,ghostMode').eq('id', userId).maybeSingle(),
                    supabase.from('MatchPreferences').select('*').eq('userId', userId).maybeSingle(),
                ]);

                if (profileRes.data) {
                    setProfile(profileRes.data);
                } else if (profileRes.error) {
                    console.warn('Supabase Profile fetch error:', profileRes.error.message);
                }

                if (userRes.data) {
                    setUserData(userRes.data);
                } else if (userRes.error) {
                    console.warn('Supabase User fetch error:', userRes.error.message);
                    // Fallback: populate userRecord from localStorage
                    const stored = localStorage.getItem('user');
                    if (stored) try { setUserData(JSON.parse(stored)); } catch {}
                }

                if (prefsRes.data) {
                    setPreferences(prefsRes.data);
                } else if (prefsRes.error) {
                    console.warn('Supabase MatchPreferences fetch error:', prefsRes.error.message);
                }

                // If no profile found via Supabase, try backend API
                if (!profileRes.data) {
                    console.log('No profile in Supabase, trying backend API…');
                    try {
                        const res = await fetch(`${API}/api/profile/me`, { headers: apiHeaders(userId) });
                        if (res.ok) {
                            const d = await res.json();
                            setUserData(d);
                            if (d.profile) setProfile(d.profile);
                            if (d.matchPreferences) setPreferences(d.matchPreferences);
                        }
                    } catch (be) {
                        console.warn('Backend API also unavailable:', be);
                    }
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // ── Save: Supabase upsert (primary) → backend PUT (fallback) ────────────
    const handleSave = async () => {
        setIsSaving(true);
        const userId = getUserId();
        if (!userId) { setIsSaving(false); return; }

        // Build the row — only columns that exist in the Supabase schema
        const row = {
            id:               profile.id || crypto.randomUUID(),
            userId,
            firstName:        profile.firstName    || 'Candidate',
            lastName:         profile.lastName     || '',
            age:              profile.age          || 25,
            gender:           profile.gender       || 'male',
            location:         profile.location     || '',
            rite:             profile.rite         || 'SYRO_MALABAR',
            parish:           profile.parish       || null,
            bio:              profile.bio          || null,
            education:        profile.education    || null,
            dietaryPreference:profile.dietaryPreference || null,
            hobbies:          profile.hobbies      || [],
            orthodoxBridge:   profile.orthodoxBridge ?? false,
            strictKnanaya:    profile.strictKnanaya  ?? false,
            height:           profile.height       || null,
            maritalStatus:    profile.maritalStatus  || 'Never Married',
            motherTongue:     profile.motherTongue   || null,
            annualIncome:     profile.annualIncome   || null,
            occupation:       profile.occupation   || null,
            employer:         profile.employer     || null,
            spiritualValues:  profile.spiritualValues || null,
            familyValues:     profile.familyValues   || null,
            smoke:            profile.smoke        ?? null,
            drink:            profile.drink        ?? null,
            updatedAt:        new Date().toISOString(),
        };

        try {
            const { error } = await supabase
                .from('Profile')
                .upsert(row, { onConflict: 'userId' });

            if (error) {
                console.error('Supabase save error:', error);
                // Try backend as fallback
                const res = await fetch(`${API}/api/profile/me`, {
                    method: 'PUT',
                    headers: apiHeaders(userId),
                    body: JSON.stringify(row),
                }).catch(() => null);
                if (!res?.ok) {
                    showToast('error', 'Failed to save profile.');
                    setIsSaving(false);
                    return;
                }
            }

            // Save preferences if on preferences tab, or just save them anyway
            if (activeTab === 'preferences') {
                const prefsRow = {
                    id: preferences.id || crypto.randomUUID(),
                    userId,
                    minAge: preferences.minAge ?? 21,
                    maxAge: preferences.maxAge ?? 40,
                    orthodoxBridgeRequired: preferences.orthodoxBridgeRequired ?? false,
                    strictKnanayaRequired: preferences.strictKnanayaRequired ?? false,
                    weightReligion: preferences.weightReligion ?? 25,
                    weightPersonality: preferences.weightPersonality ?? 15,
                    weightFinance: preferences.weightFinance ?? 15,
                    weightPhysical: preferences.weightPhysical ?? 10,
                    weightFamily: preferences.weightFamily ?? 15,
                    weightExpectations: preferences.weightExpectations ?? 20,
                    updatedAt: new Date().toISOString(),
                };
                
                const { error: prefError } = await supabase
                    .from('MatchPreferences')
                    .upsert(prefsRow, { onConflict: 'userId' });
                
                if (prefError) {
                    console.error('Supabase prefs save error:', prefError);
                    await fetch(`${API}/api/profile/preferences`, {
                        method: 'PUT',
                        headers: apiHeaders(userId),
                        body: JSON.stringify(prefsRow),
                    }).catch(() => null);
                }
            }

            setSaveSuccess(true);
            showToast('success', 'Changes saved successfully!');
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (e) {
            console.error('Save exception:', e);
            showToast('error', 'Network error saving profile.');
        }
        setIsSaving(false);
    };

    const tabs = [
        { id: 'profile',       icon: User,   label: 'Profile Details',   desc: 'Manage your personal and faith identity' },
        { id: 'preferences',   icon: Heart,  label: 'Matching Criteria',  desc: 'Set your partner preferences and filters' },
        { id: 'privacy',       icon: Shield, label: 'Privacy & Security', desc: 'Account security and visibility settings' },
        { id: 'notifications', icon: Bell,   label: 'Notifications',      desc: 'Communication and alert preferences' },
    ] as const;

    return (
        <div
            className="min-h-screen w-full relative overflow-x-hidden font-sans selection:bg-gold-200 selection:text-gold-900"
            style={{
                backgroundImage: `linear-gradient(rgba(252,251,250,0.88), rgba(252,251,250,0.96)), url('https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2069')`,
                backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed',
            }}
        >
            <AnimatePresence>{toast && <Toast type={toast.type} message={toast.message} />}</AnimatePresence>

            {/* Header */}
            <header className="sticky top-0 z-40 border-b border-gold-200/50 bg-white/80 backdrop-blur-3xl shadow-sm px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gold-50 transition-colors text-sacred-dark border border-transparent hover:border-gold-100">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="font-serif text-[24px] font-medium tracking-tight text-sacred-dark">Account Settings</h1>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving || loading}
                    className="flex items-center space-x-2 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-white px-5 py-2.5 rounded-full font-medium text-[13px] shadow-md transition-all active:scale-95 disabled:opacity-60"
                >
                    {isSaving    ? <><Activity className="w-4 h-4 animate-spin" /><span>Saving…</span></>
                    : saveSuccess ? <><CheckCircle className="w-4 h-4" /><span>Saved!</span></>
                    :               <><Save className="w-4 h-4" /><span>Save Changes</span></>}
                </button>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row items-start gap-8">

                {/* Sidebar */}
                <aside className="w-full md:w-72 shrink-0 border border-gray-100/50 bg-white/50 backdrop-blur-xl p-3 rounded-3xl">
                    <nav className="flex flex-col space-y-1.5">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-start text-left p-4 rounded-2xl transition-all duration-200 border ${
                                        isActive
                                            ? 'bg-gradient-to-br from-white to-gold-50/30 border-gold-200 shadow-sm'
                                            : 'bg-transparent border-transparent hover:bg-white/60 hover:border-gold-100/50'
                                    }`}
                                >
                                    <div className={`p-2 rounded-xl shrink-0 mr-4 ${isActive ? 'bg-gold-100 text-gold-700' : 'bg-gray-100 text-gray-500'}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={`font-medium text-[15px] mb-0.5 ${isActive ? 'text-sacred-dark' : 'text-gray-700'}`}>{tab.label}</h3>
                                        <p className="text-[12px] text-gray-500 leading-snug">{tab.desc}</p>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 mt-2 transition-transform ${isActive ? 'text-gold-400 translate-x-1' : 'text-gray-300'}`} />
                                </button>
                            );
                        })}
                        <div className="pt-6 mt-6 border-t border-gold-200/50 px-4">
                            <button onClick={() => { localStorage.clear(); navigate('/auth'); }}
                                className="flex items-center space-x-3 text-rose-600 hover:text-rose-700 transition-colors py-2 font-medium text-[14px]">
                                <LogOut className="w-4 h-4" /><span>Sign Out</span>
                            </button>
                        </div>
                        <div className="pt-12 px-4 text-center opacity-60">
                            <div className="flex justify-center mb-2"><span className="text-gold-400 text-lg">✝</span></div>
                            <p className="font-serif text-[12px] italic text-sacred-dark leading-relaxed">
                                "What therefore God hath joined together, let not man put asunder."
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">Mark 10:9</p>
                        </div>
                    </nav>
                </aside>

                {/* Content */}
                <section className="flex-1 w-full min-w-0 space-y-5">

                    {/* Profile Summary Card */}
                    {activeTab === 'profile' && !loading && profile.firstName && (
                        <ProfileSummaryCard profile={profile} userData={userData} />
                    )}

                    {/* Tab Panel */}
                    <div className="bg-white rounded-3xl border border-gold-100/50 shadow-sm p-6 sm:p-8 relative overflow-hidden min-h-[500px]">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-gold-400/5 blur-[120px] rounded-full pointer-events-none" />
                        <div className="absolute bottom-[-10%] right-[-5%] text-gold-100/30 rotate-[-15deg] pointer-events-none">
                            <Heart className="w-96 h-96" strokeWidth={0.5} />
                        </div>
                        <AnimatePresence mode="wait">
                            <motion.div key={activeTab}
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.25 }} className="relative z-10 w-full"
                            >
                                {activeTab === 'profile'       && <ProfileForm profile={profile} setProfile={setProfile} loading={loading} userId={getUserId()} />}
                                {activeTab === 'preferences'   && <PreferencesSettings preferences={preferences} setPreferences={setPreferences} />}
                                {activeTab === 'privacy'       && <PrivacySettings />}
                                {activeTab === 'notifications' && <NotificationSettings />}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </section>
            </main>
        </div>
    );
}

// ─── Profile Summary Card ─────────────────────────────────────────────────────

function ProfileSummaryCard({ profile, userData }: { profile: any; userData: any }) {
    const riteLabel = RITE_DISPLAY[profile.rite] || profile.rite || '—';
    const fullName  = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Your Profile';

    const chips = [
        { icon: MapPin,          label: profile.location },
        { icon: Church,          label: riteLabel },
        { icon: Briefcase,       label: profile.occupation },
        { icon: GraduationCap,   label: profile.education },
    ].filter(c => Boolean(c.label));

    const completeness = Math.round(profile.profileComplete ?? 0);

    return (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-sacred-dark to-stone-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden"
        >
            <div className="absolute -right-8 -top-8 w-56 h-56 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {/* Avatar */}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shrink-0 shadow-lg">
                    <span className="text-3xl font-serif text-white">{(profile.firstName?.[0] || '?').toUpperCase()}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="font-serif text-2xl text-white">{fullName}</h2>
                        {profile.age && <span className="text-gold-300 font-light text-lg">{profile.age} yrs</span>}
                        {userData?.isVerified && (
                            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-300 bg-emerald-900/40 border border-emerald-700/40 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" /> Verified
                            </span>
                        )}
                        <span className="capitalize bg-gold-800/30 text-gold-300 px-2 py-0.5 rounded-full text-xs font-medium">
                            {userData?.role || 'candidate'}
                        </span>
                    </div>

                    <div className="mt-1 flex flex-wrap gap-3 text-sm text-gray-400">
                        {userData?.email && <span>{userData.email}</span>}
                        {userData?.phone && <span>· {userData.phone}</span>}
                    </div>

                    {/* Chips */}
                    {chips.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {chips.map((chip, i) => {
                                const Icon = chip.icon;
                                return (
                                    <span key={i} className="flex items-center gap-1.5 bg-white/10 border border-white/10 rounded-full px-3 py-1 text-xs text-gray-200">
                                        <Icon className="w-3 h-3 text-gold-400" />{chip.label}
                                    </span>
                                );
                            })}
                        </div>
                    )}

                    {profile.bio && (
                        <p className="mt-3 text-sm text-gray-400 italic leading-relaxed line-clamp-2">"{profile.bio}"</p>
                    )}

                    {profile.maritalStatus && (
                        <p className="mt-2 text-xs text-gray-500">{profile.maritalStatus} · {profile.motherTongue || 'Mother tongue not set'}</p>
                    )}
                </div>

                {/* Completeness ring */}
                <div className="shrink-0 text-center">
                    <div className="relative w-16 h-16">
                        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 56 56">
                            <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                            <circle cx="28" cy="28" r="22" fill="none" stroke="url(#ggrad)" strokeWidth="6"
                                strokeLinecap="round"
                                strokeDasharray={`${(completeness / 100) * 138.2} 138.2`} />
                            <defs>
                                <linearGradient id="ggrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#d4a836" /><stop offset="100%" stopColor="#f0c84e" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gold-300">{completeness}%</div>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">Profile</p>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Profile Form ─────────────────────────────────────────────────────────────

const inputCls = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[15px] focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 focus:bg-white outline-none transition-all';
const labelCls = 'text-[13px] font-bold uppercase tracking-wider text-gray-500';

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-2">
        <label className={labelCls}>{label}</label>
        {children}
    </div>
);

function ProfileForm({ profile, setProfile, loading, userId }: {
    profile: any; setProfile: any; loading: boolean; userId: string;
}) {
    const [photos, setPhotos]         = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [igConnecting, setIgConnecting] = useState(false);

    useEffect(() => {
        if (!userId) return;
        const loadPhotos = async () => {
            const { data, error } = await supabase
                .from('Photo')
                .select('*')
                .eq('userId', userId)
                .order('order', { ascending: true });
            if (data) setPhotos(data);
            if (error) console.warn('Photo fetch:', error.message);
        };
        loadPhotos();
    }, [userId]);

    const up = (field: string, val: any) => setProfile((p: any) => ({ ...p, [field]: val }));

    /* ── Photo helpers ── */
    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setIsUploading(true);
        const remaining = 6 - photos.length;
        const files = Array.from(e.target.files).slice(0, remaining);
        for (const file of files) {
            await new Promise<void>(res => {
                const reader = new FileReader();
                reader.onloadend = async () => {
                    const newPhoto = { id: crypto.randomUUID(), userId, url: reader.result as string, isPrimary: photos.length === 0, order: photos.length };
                    await supabase.from('Photo').insert([newPhoto]);
                    setPhotos(p => [...p, newPhoto]);
                    res();
                };
                reader.readAsDataURL(file);
            });
        }
        setIsUploading(false);
        if (e.target) e.target.value = '';
    };

    const removePhoto = async (id: string) => {
        await supabase.from('Photo').delete().eq('id', id);
        setPhotos(prev => {
            const next = prev.filter(p => p.id !== id);
            if (next.length && !next.some(p => p.isPrimary)) {
                next[0].isPrimary = true;
                supabase.from('Photo').update({ isPrimary: true }).eq('id', next[0].id).then();
            }
            return next;
        });
    };

    const makePrimary = async (id: string) => {
        await supabase.from('Photo').update({ isPrimary: false }).eq('userId', userId);
        await supabase.from('Photo').update({ isPrimary: true }).eq('id', id);
        setPhotos(p => p.map(ph => ({ ...ph, isPrimary: ph.id === id })));
    };

    /* ── Instagram OAuth popup ── */
    const connectInstagram = () => {
        if (igConnecting) return;
        setIgConnecting(true);
        const url = `${API}/api/auth/instagram?userId=${userId}&popup=true`;
        const popup = window.open(url, 'ig_oauth', 'width=520,height=680,scrollbars=yes');
        const timer = setInterval(() => { if (popup?.closed) { clearInterval(timer); setIgConnecting(false); } }, 700);
        const onMsg = (e: MessageEvent) => { if (e.data?.type === 'INSTAGRAM_SUCCESS') { clearInterval(timer); setIgConnecting(false); window.removeEventListener('message', onMsg); } };
        window.addEventListener('message', onMsg);
        setTimeout(() => { clearInterval(timer); setIgConnecting(false); window.removeEventListener('message', onMsg); }, 120_000);
    };

    if (loading) return (
        <div className="py-20 flex flex-col items-center gap-3 text-gray-400">
            <div className="w-8 h-8 rounded-full border-4 border-gold-200 border-t-gold-500 animate-spin" />
            <p className="text-sm">Fetching your profile…</p>
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Section header */}
            <div className="relative pb-5 border-b border-gold-100/40">
                <h2 className="text-2xl font-serif text-sacred-dark mb-1">Profile Details</h2>
                <p className="text-sm text-gray-500">Your data is fetched live from the database. Click "Save Changes" to update.</p>
                <div className="absolute bottom-[-1px] left-0 w-24 h-[2px] bg-gradient-to-r from-gold-400 to-transparent" />
            </div>

            <div className="space-y-6 max-w-2xl">

                {/* ── Photos ── */}
                <div className="space-y-4 pb-6 border-b border-gray-100">
                    <div>
                        <h3 className="font-semibold text-sacred-dark">Profile Photos</h3>
                        <p className="text-[13px] text-gray-500">Upload up to 6 photos. Hover to set primary or remove.</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {[0,1,2,3,4,5].map(i => {
                            const ph = photos[i];
                            return (
                                <div key={i} className="relative aspect-[3/4] rounded-2xl border-2 overflow-hidden group bg-gray-50 border-dashed border-gray-200">
                                    {ph ? (
                                        <>
                                            <img src={ph.url} alt="" className="w-full h-full object-cover" />
                                            {ph.isPrimary && <div className="absolute top-2 left-2 bg-gold-500 text-white text-[10px] font-bold uppercase px-2 py-1 rounded-full">Primary</div>}
                                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                                                {!ph.isPrimary && <button onClick={() => makePrimary(ph.id)} className="px-3 py-1.5 bg-white/20 text-white rounded-full text-xs font-medium hover:bg-white/40 transition-colors">Make Primary</button>}
                                                <button onClick={() => removePhoto(ph.id)} className="px-3 py-1.5 bg-rose-500 text-white rounded-full text-xs font-medium hover:bg-rose-600 transition-colors">Remove</button>
                                            </div>
                                        </>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-gray-100 transition-colors opacity-60 hover:opacity-100">
                                            <svg className="w-6 h-6 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{isUploading ? 'Uploading…' : 'Add Photo'}</span>
                                            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} multiple disabled={isUploading} />
                                        </label>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Personal Info ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="First Name">
                        <input type="text" value={profile.firstName || ''} onChange={e => up('firstName', e.target.value)} placeholder="First Name" className={inputCls} />
                    </Field>
                    <Field label="Last Name">
                        <input type="text" value={profile.lastName || ''} onChange={e => up('lastName', e.target.value)} placeholder="Last Name" className={inputCls} />
                    </Field>
                    <Field label="Age">
                        <input type="number" min={18} max={80} value={profile.age || ''} onChange={e => up('age', parseInt(e.target.value))} placeholder="28" className={inputCls} />
                    </Field>
                    <Field label="Gender">
                        <select value={profile.gender || 'male'} onChange={e => up('gender', e.target.value)} className={inputCls + ' appearance-none cursor-pointer'}>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </Field>
                    <Field label="Church Rite">
                        <select value={profile.rite || 'SYRO_MALABAR'} onChange={e => up('rite', e.target.value)} className={inputCls + ' appearance-none cursor-pointer'}>
                            <option value="SYRO_MALABAR">Syro-Malabar</option>
                            <option value="LATIN">Latin</option>
                            <option value="KNANAYA_CATHOLIC">Knanaya Catholic</option>
                            <option value="MALANKARA_ORTHODOX">Malankara Orthodox</option>
                            <option value="SYRO_MALANKARA">Syro-Malankara</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </Field>
                    <Field label="Marital Status">
                        <select value={profile.maritalStatus || 'Never Married'} onChange={e => up('maritalStatus', e.target.value)} className={inputCls + ' appearance-none cursor-pointer'}>
                            <option>Never Married</option>
                            <option>Annulled</option>
                            <option>Widowed</option>
                        </select>
                    </Field>
                </div>

                <Field label="Church Parish / Diocese">
                    <input type="text" value={profile.parish || ''} onChange={e => up('parish', e.target.value)} placeholder="St. Thomas Cathedral" className={inputCls} />
                </Field>
                <Field label="Location">
                    <input type="text" value={profile.location || ''} onChange={e => up('location', e.target.value)} placeholder="City, State / Country" className={inputCls} />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="Height">
                        <input type="text" value={profile.height || ''} onChange={e => up('height', e.target.value)} placeholder="5 ft 8 in" className={inputCls} />
                    </Field>
                    <Field label="Mother Tongue">
                        <select value={profile.motherTongue || ''} onChange={e => up('motherTongue', e.target.value)} className={inputCls + ' appearance-none cursor-pointer'}>
                            <option value="">— Select —</option>
                            {['Malayalam', 'Konkani', 'Tamil', 'Kannada', 'Hindi', 'English', 'Other'].map(l => <option key={l}>{l}</option>)}
                        </select>
                    </Field>
                    <Field label="Annual Income">
                        <input type="text" value={profile.annualIncome || ''} onChange={e => up('annualIncome', e.target.value)} placeholder="₹12 LPA / $60,000" className={inputCls} />
                    </Field>
                    <Field label="Dietary Preference">
                        <select value={profile.dietaryPreference || ''} onChange={e => up('dietaryPreference', e.target.value)} className={inputCls + ' appearance-none cursor-pointer'}>
                            <option value="">— Select —</option>
                            {['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Pescatarian'].map(d => <option key={d}>{d}</option>)}
                        </select>
                    </Field>
                    <Field label="Smokes">
                        <select value={profile.smoke === true ? 'yes' : profile.smoke === false ? 'no' : ''} onChange={e => up('smoke', e.target.value === 'yes' ? true : e.target.value === 'no' ? false : null)} className={inputCls + ' appearance-none cursor-pointer'}>
                            <option value="">Not specified</option>
                            <option value="no">No</option>
                            <option value="yes">Yes</option>
                        </select>
                    </Field>
                    <Field label="Drinks Alcohol">
                        <select value={profile.drink === true ? 'yes' : profile.drink === false ? 'no' : ''} onChange={e => up('drink', e.target.value === 'yes' ? true : e.target.value === 'no' ? false : null)} className={inputCls + ' appearance-none cursor-pointer'}>
                            <option value="">Not specified</option>
                            <option value="no">No</option>
                            <option value="yes">Yes</option>
                        </select>
                    </Field>
                </div>

                <Field label="About Me (Bio)">
                    <textarea rows={4} value={profile.bio || ''} onChange={e => up('bio', e.target.value)}
                        placeholder="Passionate about faith, family…"
                        className={inputCls + ' resize-none'} />
                </Field>

                <Field label="Spiritual Values">
                    <textarea rows={2} value={profile.spiritualValues || ''} onChange={e => up('spiritualValues', e.target.value)}
                        placeholder="Mass every Sunday, daily rosary…"
                        className={inputCls + ' resize-none'} />
                </Field>

                {/* ── Professional Details ── */}
                <div className="space-y-5 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                            <h3 className="font-semibold text-sacred-dark">Professional Details</h3>
                            <p className="text-[13px] text-gray-500">Your career background.</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Instagram */}
                            <button onClick={connectInstagram} disabled={igConnecting}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-all shadow-sm text-white ${
                                    profile.instagramHandle
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-500'
                                        : 'bg-gradient-to-r from-purple-700 to-pink-600 hover:from-purple-600 hover:to-pink-500'
                                }`}
                            >
                                {igConnecting
                                    ? <><Activity className="w-4 h-4 animate-spin" /><span>Connecting…</span></>
                                    : profile.instagramHandle
                                        ? <><Instagram className="w-4 h-4" /><span>@{profile.instagramHandle}</span><CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /></>
                                        : <><Instagram className="w-4 h-4" /><span>Connect Instagram</span></>
                                }
                            </button>
                            {/* LinkedIn */}
                            <a href={`${API}/api/auth/linkedin?userId=${userId}&popup=true`} target="_blank" rel="noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0077b5] hover:bg-[#005a87] text-white rounded-xl text-[13px] font-medium transition-colors shadow-sm"
                            >
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                </svg>
                                <span>Connect LinkedIn</span>
                            </a>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <Field label="Occupation">
                            <input type="text" value={profile.occupation || ''} onChange={e => up('occupation', e.target.value)} placeholder="Software Engineer" className={inputCls} />
                        </Field>
                        <Field label="Employer">
                            <input type="text" value={profile.employer || ''} onChange={e => up('employer', e.target.value)} placeholder="Tech Innovations Inc." className={inputCls} />
                        </Field>
                    </div>
                    <Field label="Education">
                        <input type="text" value={profile.education || ''} onChange={e => up('education', e.target.value)} placeholder="B.Tech in Computer Science" className={inputCls} />
                    </Field>
                    <Field label="Family Values">
                        <textarea rows={2} value={profile.familyValues || ''} onChange={e => up('familyValues', e.target.value)}
                            placeholder="Close-knit Catholic family, strong Kerala roots…"
                            className={inputCls + ' resize-none'} />
                    </Field>
                </div>
            </div>
        </div>
    );
}

// ─── Preferences ──────────────────────────────────────────────────────────────

function PreferencesSettings({ preferences, setPreferences }: { preferences: any, setPreferences: any }) {
    const up = (field: string, val: any) => setPreferences((p: any) => ({ ...p, [field]: val }));
    return (
        <div className="space-y-8">
            <SectionHeader title="Matching Criteria" desc="Refine what you are looking for in a prospective partner." />
            <div className="space-y-8 max-w-2xl mt-8">
                <div className="space-y-2">
                    <label className={labelCls}>Preferred Age Range</label>
                    <div className="flex items-center space-x-4">
                        <input type="number" value={preferences.minAge ?? 21} onChange={e => up('minAge', parseInt(e.target.value))} className="w-24 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-center text-[15px] outline-none focus:ring-2 focus:ring-gold-400/50" />
                        <span className="text-gray-400">to</span>
                        <input type="number" value={preferences.maxAge ?? 40} onChange={e => up('maxAge', parseInt(e.target.value))} className="w-24 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-center text-[15px] outline-none focus:ring-2 focus:ring-gold-400/50" />
                    </div>
                </div>
                {[
                    { label: 'Orthodox Bridge (Traditional Values)', field: 'orthodoxBridgeRequired', desc: 'Only match with users prioritizing traditional church teachings.' },
                    { label: 'Strict Endogamy (Knanaya)', field: 'strictKnanayaRequired', desc: 'Constrain matches strictly within the Knanaya Catholic community.' },
                ].map(item => (
                    <label key={item.label} className="flex items-start space-x-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                        <input type="checkbox" checked={preferences[item.field] ?? false} onChange={e => up(item.field, e.target.checked)} className="mt-1 w-4 h-4 accent-gold-600" />
                        <div>
                            <span className="block font-medium text-sacred-dark text-[15px]">{item.label}</span>
                            <span className="text-[13px] text-gray-500">{item.desc}</span>
                        </div>
                    </label>
                ))}
            </div>

            <div className="mt-12">
                <SectionHeader title="Compatibility Weights" desc="Slide to prioritize what matters most to you in a match. These weights personalize your match percentage." />
                <div className="space-y-6 max-w-2xl mt-8">
                    {[
                        { key: 'weightReligion', label: 'Religion & Faith', desc: 'Importance of sharing similar faith practices and church rites.', default: 25 },
                        { key: 'weightExpectations', label: 'Expectations & Preferences', desc: 'Importance of aligning on age limits, community constraints, and marriage expectations.', default: 20 },
                        { key: 'weightPersonality', label: 'Personality & Lifestyle', desc: 'Importance of shared hobbies, dietary choices, and habits.', default: 15 },
                        { key: 'weightFinance', label: 'Financial Stability', desc: 'Importance of occupation, income, and career alignment.', default: 15 },
                        { key: 'weightFamily', label: 'Family & Culture', desc: 'Importance of family values, cultural background, and upbringing.', default: 15 },
                        { key: 'weightPhysical', label: 'Physical Attributes', desc: 'Importance of physical factors like age distance and appearance.', default: 10 },
                    ].map(pillar => {
                        const val = preferences[pillar.key] ?? pillar.default;
                        // Display it as a normalized 1-10 scale for UI simplicity, but store internally as 0-100 to allow granularity.
                        // Actually, the prompt says "1 to 10 scale" was suggested. Let's make the slider 0 to 10.
                        const sliderVal = Math.round(val / 10);
                        return (
                            <div key={pillar.key} className="p-4 border border-gray-100 rounded-xl bg-gray-50/30">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-medium text-sacred-dark">{pillar.label}</h3>
                                        <p className="text-[12px] text-gray-500">{pillar.desc}</p>
                                    </div>
                                    <span className="font-bold text-gold-600 w-8 text-right">{sliderVal}</span>
                                </div>
                                <input 
                                    type="range" min="0" max="10" step="1" 
                                    value={sliderVal} 
                                    onChange={e => up(pillar.key, parseInt(e.target.value) * 10)} 
                                    className="w-full accent-gold-500" 
                                />
                                <div className="flex justify-between text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider">
                                    <span>Not Important</span>
                                    <span>Very Important</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ─── Privacy ──────────────────────────────────────────────────────────────────

function PrivacySettings() {
    const uid = localStorage.getItem('userId') || '';
    return (
        <div className="space-y-8">
            <SectionHeader title="Privacy & Security" desc="Maintain control over your account and who sees your profile." />
            <div className="space-y-6 max-w-2xl mt-8">
                <div className="p-5 rounded-2xl border border-gold-200/60 bg-gold-50/50">
                    <h3 className="font-semibold text-sacred-dark mb-1">🔑 Your Account ID</h3>
                    <p className="text-[13px] text-gray-500 mb-3">Share with a parent to link their account to your Kitchen Table.</p>
                    <div className="flex items-center gap-3">
                        <code className="flex-1 bg-white border border-gold-200 rounded-xl px-4 py-2.5 text-[13px] text-sacred-dark font-mono truncate select-all">{uid || 'Not logged in'}</code>
                        <button onClick={() => navigator.clipboard.writeText(uid)} className="px-4 py-2.5 rounded-xl text-[13px] font-medium border bg-white border-gold-200 text-gold-700 hover:bg-gold-50 transition-all">Copy</button>
                    </div>
                </div>
                <div className="flex items-center justify-between p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600"><EyeOff className="w-5 h-5" /></div>
                        <div>
                            <h3 className="font-medium text-sacred-dark">Ghost Mode</h3>
                            <p className="text-[13px] text-gray-500">Your profile is hidden from all discovery feeds.</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500" />
                    </label>
                </div>
                <div className="pt-4 border-t border-gray-100">
                    <h3 className="font-medium text-sacred-dark mb-4">Update Password</h3>
                    <div className="space-y-3">
                        {['Current Password', 'New Password', 'Confirm New Password'].map(ph => (
                            <input key={ph} type="password" placeholder={ph} className={inputCls} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Notifications ────────────────────────────────────────────────────────────

function NotificationSettings() {
    const toggles = [
        { label: 'New Matches', desc: 'Get notified when a highly compatible profile joins.' },
        { label: 'Direct Messages', desc: 'Alert me immediately when I receive a message.' },
        { label: 'Family Recommendations', desc: 'When your assigned family scouts recommend a profile.' },
    ];
    return (
        <div className="space-y-8">
            <SectionHeader title="Notifications" desc="Decide how we communicate with you." />
            <div className="space-y-6 max-w-2xl mt-8">
                {toggles.map(t => (
                    <div key={t.label} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                        <div>
                            <h3 className="font-medium text-sacred-dark text-[15px]">{t.label}</h3>
                            <p className="text-[13px] text-gray-500">{t.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" defaultChecked className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500" />
                        </label>
                    </div>
                ))}
                <div className="pt-8 border-t border-gray-100 space-y-4">
                    <h3 className="font-medium text-sacred-dark">Communication Channels</h3>
                    {['Email Notifications', 'Push Notifications (Browser)', 'SMS Alerts (Critical only)'].map((ch, i) => (
                        <label key={ch} className="flex items-center space-x-3 cursor-pointer">
                            <input type="checkbox" defaultChecked={i !== 1} className="w-4 h-4 accent-gold-600" />
                            <span className="text-[14px] text-gray-700">{ch}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function SectionHeader({ title, desc }: { title: string; desc: string }) {
    return (
        <div className="relative pb-5 border-b border-gold-100/40">
            <h2 className="text-2xl font-serif text-sacred-dark mb-1">{title}</h2>
            <p className="text-sm text-gray-500">{desc}</p>
            <div className="absolute bottom-[-1px] left-0 w-24 h-[2px] bg-gradient-to-r from-gold-400 to-transparent" />
        </div>
    );
}
