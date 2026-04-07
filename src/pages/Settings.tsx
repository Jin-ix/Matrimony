import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Bell, LogOut, Shield, User,
    Heart, EyeOff, Save, ChevronRight, Activity, CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type SettingsTab = 'profile' | 'preferences' | 'privacy' | 'notifications';

export default function Settings() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Lifted Profile State
    const [profile, setProfile] = useState<any>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                let userId = localStorage.getItem('userId');
                if (!userId) {
                    const userStr = localStorage.getItem('user');
                    if (userStr) userId = JSON.parse(userStr).id;
                }
                if (!userId) return;
                
                const { data } = await supabase.from('Profile').select('*').eq('userId', userId).single();
                if (data) setProfile(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        let userId = localStorage.getItem('userId');
        if (!userId) {
            const userStr = localStorage.getItem('user');
            if (userStr) userId = JSON.parse(userStr).id;
        }

        if (userId) {
            try {
                // Upsert the profile data
                const { error } = await supabase.from('Profile').upsert({
                    id: profile.id || crypto.randomUUID(),
                    userId: userId,
                    firstName: profile.firstName || 'Candidate',
                    lastName: profile.lastName || '',
                    age: profile.age || 25,
                    dateOfBirth: profile.dateOfBirth || null,
                    gender: profile.gender || 'male',
                    location: profile.location || 'Unknown',
                    rite: profile.rite || 'SYRO_MALABAR',
                    parish: profile.parish || '',
                    bio: profile.bio || '',
                    ...profile,
                    updatedAt: new Date().toISOString()
                }, { onConflict: 'userId' });

                if (error) console.error("Error saving profile:", error);
                else {
                    setSaveSuccess(true);
                    setTimeout(() => setSaveSuccess(false), 3000);
                }
            } catch (e) {
                console.error(e);
            }
        }
        setIsSaving(false);
    };

    const tabs = [
        { id: 'profile', icon: User, label: 'Profile Details', desc: 'Manage your personal and faith identity' },
        { id: 'preferences', icon: Heart, label: 'Matching Criteria', desc: 'Set your partner preferences and filters' },
        { id: 'privacy', icon: Shield, label: 'Privacy & Security', desc: 'Account security and visibility settings' },
        { id: 'notifications', icon: Bell, label: 'Notifications', desc: 'Communication and alert preferences' }
    ] as const;

    const handleSignOut = () => {
        localStorage.clear();
        navigate('/auth');
    };

    return (
        <div
            className="min-h-screen w-full relative overflow-x-hidden font-sans selection:bg-gold-200 selection:text-gold-900"
            style={{
                backgroundImage: `linear-gradient(rgba(252, 251, 250, 0.85), rgba(252, 251, 250, 0.95)), url('https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2069&auto=format&fit=crop')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed'
            }}
        >
            {/* Header */}
            <header className="sticky top-0 z-40 border-b border-gold-200/50 bg-white/80 backdrop-blur-3xl shadow-[0_4px_30px_rgba(0,0,0,0.03)] selection:bg-gold-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-full hover:bg-gold-50 transition-colors text-sacred-dark border border-transparent hover:border-gold-100"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="font-serif text-[24px] font-medium tracking-tight text-sacred-dark">Account Settings</h1>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving || loading}
                    className="flex items-center space-x-2 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-white px-5 py-2.5 rounded-full font-medium text-[13px] tracking-wide shadow-md transition-all active:scale-95 disabled:opacity-70"
                >
                    {isSaving ? (
                        <>
                            <Activity className="w-4 h-4 animate-spin" />
                            <span>Saving...</span>
                        </>
                    ) : saveSuccess ? (
                        <>
                            <CheckCircle className="w-4 h-4 text-white" />
                            <span>Saved</span>
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            <span>Save Changes</span>
                        </>
                    )}
                </button>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row items-start gap-8">
                {/* Sidebar Navigation */}
                <aside className="w-full md:w-72 shrink-0 border border-gray-100/50 bg-white/50 backdrop-blur-xl p-3 rounded-3xl">
                    <nav className="flex flex-col space-y-1.5">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-start text-left p-4 rounded-2xl transition-all duration-300 border ${isActive
                                        ? 'bg-gradient-to-br from-white to-gold-50/30 border-gold-200 shadow-sm'
                                        : 'bg-transparent border-transparent hover:bg-white/60 hover:border-gold-100/50'
                                        }`}
                                >
                                    <div className={`p-2 rounded-xl shrink-0 mr-4 ${isActive ? 'bg-gold-100 text-gold-700' : 'bg-gray-100 text-gray-500'}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={`font-medium text-[15px] mb-0.5 ${isActive ? 'text-sacred-dark' : 'text-gray-700'}`}>
                                            {tab.label}
                                        </h3>
                                        <p className="text-[12px] text-gray-500 leading-snug">
                                            {tab.desc}
                                        </p>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 mt-2 transition-transform ${isActive ? 'text-gold-400 translate-x-1' : 'text-gray-300'}`} />
                                </button>
                            );
                        })}

                        <div className="pt-6 mt-6 border-t border-gold-200/50 px-4">
                            <button onClick={handleSignOut} className="flex items-center space-x-3 text-rose-600 hover:text-rose-700 transition-colors py-2 font-medium text-[14px]">
                                <LogOut className="w-4 h-4" />
                                <span>Sign Out</span>
                            </button>
                        </div>

                        {/* Marriage Motif / Scripture */}
                        <div className="pt-12 px-4 text-center opacity-60">
                            <div className="flex justify-center mb-2">
                                <span className="text-gold-400 text-lg">✝</span>
                            </div>
                            <p className="font-serif text-[12px] italic text-sacred-dark leading-relaxed">
                                "What therefore God hath joined together, let not man put asunder."
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">Mark 10:9</p>
                        </div>
                    </nav>
                </aside>

                {/* Content Area */}
                <section className="flex-1 w-full md:w-auto min-w-0 bg-white rounded-3xl border border-gold-100/50 shadow-sm p-6 sm:p-8 min-h-[600px] relative overflow-hidden">
                    {/* Add a subtle aesthetic background flare & Watermark */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gold-400/5 blur-[120px] rounded-full pointer-events-none" />
                    <div className="absolute bottom-[-10%] right-[-5%] text-gold-100/30 rotate-[-15deg] pointer-events-none">
                        <Heart className="w-96 h-96" strokeWidth={0.5} />
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="relative z-10 w-full"
                        >
                            {activeTab === 'profile' && <ProfileSettings profile={profile} setProfile={setProfile} loading={loading} />}
                            {activeTab === 'preferences' && <PreferencesSettings />}
                            {activeTab === 'privacy' && <PrivacySettings />}
                            {activeTab === 'notifications' && <NotificationSettings />}
                        </motion.div>
                    </AnimatePresence>
                </section>
            </main>
        </div>
    );
}

function ProfileSettings({ profile, setProfile, loading }: { profile: any, setProfile: any, loading: boolean }) {
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchPhoto = async () => {
            try {
                const userId = localStorage.getItem('userId') || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).id : null);
                if (!userId) return;
                const { data } = await supabase.from('Photo').select('*').eq('userId', userId).eq('isPrimary', true).single();
                if (data) setPhotoUrl(data.url);
                else {
                    const { data: anyPhoto } = await supabase.from('Photo').select('*').eq('userId', userId).limit(1);
                    if (anyPhoto && anyPhoto.length > 0) setPhotoUrl(anyPhoto[0].url);
                }
            } catch(e) {}
        };
        fetchPhoto();
    }, []);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            setPhotoUrl(base64String);

            const userId = localStorage.getItem('userId') || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).id : null);
            if (!userId) return;

            // Delete existing primary photo if any to keep it clean
            await supabase.from('Photo').delete().eq('userId', userId);
            
            await supabase.from('Photo').insert([{
                id: crypto.randomUUID(),
                userId: userId,
                url: base64String,
                isPrimary: true,
                order: 0
            }]);
        };
        reader.readAsDataURL(file);
    };

    const handlePhotoRemove = async () => {
        setPhotoUrl(null);
        const userId = localStorage.getItem('userId') || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).id : null);
        if (userId) await supabase.from('Photo').delete().eq('userId', userId);
    };

    if (loading) return <div className="py-20 text-center text-gray-400">Loading Profile...</div>;

    const firstName = profile?.firstName || '';
    const lastName = profile?.lastName || '';
    const initial = firstName ? firstName.charAt(0) : 'C';

    const handleUpdate = (field: string, value: string) => {
        setProfile((prev: any) => {
            const updated = { ...prev, [field]: value };
            if (field === 'dateOfBirth' && value) {
                const dob = new Date(value);
                const diffMs = Date.now() - dob.getTime();
                const ageDt = new Date(diffMs); 
                updated.age = Math.abs(ageDt.getUTCFullYear() - 1970);
            }
            return updated;
        });
    };

    // Safely format date string for input type="date"
    const dobString = profile?.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '';

    return (
        <div className="space-y-8">
            <div className="relative pb-6 border-b border-gold-100/40">
                <h2 className="text-2xl font-serif text-sacred-dark mb-1">Profile Details</h2>
                <p className="text-sm text-gray-500">Manage how others view your baseline identity.</p>
                <div className="absolute bottom-[-1px] left-0 w-24 h-[2px] bg-gradient-to-r from-gold-400 to-transparent"></div>
            </div>

            <div className="space-y-6 max-w-2xl mt-8">
                <div className="flex items-center space-x-6 pb-6 border-b border-gray-100">
                    <div className="relative group cursor-pointer p-1 rounded-full border border-gold-300">
                        {/* Double Ring motif for Avatar */}
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gold-100 to-gold-400 flex items-center justify-center text-3xl font-serif text-white shadow-inner relative overflow-hidden border-2 border-white">
                            {photoUrl ? <img src={photoUrl} className="w-full h-full object-cover" alt="Profile" /> : initial}
                            <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px] cursor-pointer">
                                <User className="w-8 h-8 text-white" />
                                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                            </label>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-medium text-sacred-dark">Profile Photo</h3>
                        <p className="text-[13px] text-gray-500 mb-3">JPG, PNG or WEBP. Max size of 5MB.</p>
                        <div className="flex space-x-3">
                            <label className="px-4 py-1.5 bg-sacred-dark text-white rounded-full text-[13px] font-medium hover:bg-black transition-colors cursor-pointer block">
                                Change
                                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                            </label>
                            <button onClick={handlePhotoRemove} className="px-4 py-1.5 border border-gray-200 text-gray-600 rounded-full text-[13px] font-medium hover:bg-gray-50 transition-colors">Remove</button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex-1 space-y-2">
                        <label className="text-[13px] font-bold uppercase tracking-wider text-gray-500">First Name</label>
                        <input type="text" value={firstName} onChange={(e) => handleUpdate('firstName', e.target.value)} placeholder="First Name" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[15px] focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 focus:bg-white outline-none transition-all" />
                    </div>
                    <div className="flex-1 space-y-2">
                        <label className="text-[13px] font-bold uppercase tracking-wider text-gray-500">Last Name</label>
                        <input type="text" value={lastName} onChange={(e) => handleUpdate('lastName', e.target.value)} placeholder="Last Name" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[15px] focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 focus:bg-white outline-none transition-all" />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex-1 space-y-2">
                        <label className="text-[13px] font-bold uppercase tracking-wider text-gray-500">Date of Birth</label>
                        <input type="date" value={dobString} onChange={(e) => handleUpdate('dateOfBirth', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[15px] focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 focus:bg-white outline-none transition-all" />
                    </div>
                    <div className="flex-1 space-y-2">
                        <label className="text-[13px] font-bold uppercase tracking-wider text-gray-500">Gender</label>
                        <select value={profile?.gender || 'male'} onChange={(e) => handleUpdate('gender', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[15px] focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 focus:bg-white outline-none transition-all appearance-none cursor-pointer">
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[13px] font-bold uppercase tracking-wider text-gray-500">Church Parish / Diocese</label>
                    <input type="text" value={profile?.parish || ''} onChange={(e) => handleUpdate('parish', e.target.value)} placeholder="St. Thomas Cathedral" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[15px] focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 focus:bg-white outline-none transition-all" />
                </div>
                
                <div className="space-y-2">
                    <label className="text-[13px] font-bold uppercase tracking-wider text-gray-500">Location</label>
                    <input type="text" value={profile?.location || ''} onChange={(e) => handleUpdate('location', e.target.value)} placeholder="City, State" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[15px] focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 focus:bg-white outline-none transition-all" />
                </div>

                <div className="space-y-2">
                    <label className="text-[13px] font-bold uppercase tracking-wider text-gray-500">About Me (Bio)</label>
                    <textarea
                        rows={4}
                        value={profile?.bio || ''}
                        onChange={(e) => handleUpdate('bio', e.target.value)}
                        placeholder="Passionate about faith, family..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[15px] focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 focus:bg-white outline-none transition-all resize-none"
                    />
                </div>
                <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium text-sacred-dark text-[15px]">Professional Details</h3>
                            <p className="text-[13px] text-gray-500">Your career background, which can be enriched via LinkedIn.</p>
                        </div>
                        <a 
                            href={`${(import.meta as any).env?.VITE_API_URL || 'http://localhost:3001'}/api/auth/linkedin?userId=${localStorage.getItem('userId') || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).id : '')}`}
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-[#0077b5] text-white rounded-xl text-[13px] font-medium hover:bg-[#005a87] transition-colors shadow-sm"
                        >
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                            <span>Connect LinkedIn</span>
                        </a>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-6">
                        <div className="flex-1 space-y-2">
                            <label className="text-[13px] font-bold uppercase tracking-wider text-gray-500">Occupation</label>
                            <input type="text" value={profile?.occupation || ''} onChange={(e) => handleUpdate('occupation', e.target.value)} placeholder="Software Engineer" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[15px] focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 focus:bg-white outline-none transition-all" />
                        </div>
                        <div className="flex-1 space-y-2">
                            <label className="text-[13px] font-bold uppercase tracking-wider text-gray-500">Employer</label>
                            <input type="text" value={profile?.employer || ''} onChange={(e) => handleUpdate('employer', e.target.value)} placeholder="Tech Innovations Inc." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[15px] focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 focus:bg-white outline-none transition-all" />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[13px] font-bold uppercase tracking-wider text-gray-500">Education</label>
                        <input type="text" value={profile?.education || ''} onChange={(e) => handleUpdate('education', e.target.value)} placeholder="B.Tech in Computer Science" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[15px] focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 focus:bg-white outline-none transition-all" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function PreferencesSettings() {
    return (
        <div className="space-y-8">
            <div className="relative pb-6 border-b border-gold-100/40">
                <h2 className="text-2xl font-serif text-sacred-dark mb-1">Matching Criteria</h2>
                <p className="text-sm text-gray-500">Refine what you are looking for in a prospective partner.</p>
                <div className="absolute bottom-[-1px] left-0 w-24 h-[2px] bg-gradient-to-r from-gold-400 to-transparent"></div>
            </div>

            <div className="space-y-8 max-w-2xl mt-8">
                <div className="space-y-2">
                    <label className="text-[13px] font-bold uppercase tracking-wider text-gray-500">Preferred Age Range</label>
                    <div className="flex items-center space-x-4">
                        <input type="number" defaultValue="26" className="w-24 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-center text-[15px] focus:ring-2 focus:ring-indigo-400/50 outline-none" />
                        <span className="text-gray-400 font-medium">to</span>
                        <input type="number" defaultValue="32" className="w-24 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-center text-[15px] focus:ring-2 focus:ring-indigo-400/50 outline-none" />
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-[13px] font-bold uppercase tracking-wider text-gray-500">Faith Rigor Requirements</label>

                    <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                        <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 text-gold-600 rounded focus:ring-gold-500 accent-gold-600" />
                        <div>
                            <span className="block font-medium text-sacred-dark text-[15px]">Orthodox Bridge (Traditional Values)</span>
                            <span className="text-[13px] text-gray-500">Only match with users prioritizing traditional church teachings and frequent sacrament participation.</span>
                        </div>
                    </label>

                    <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                        <input type="checkbox" className="mt-1 w-4 h-4 text-gold-600 rounded focus:ring-gold-500 accent-gold-600" />
                        <div>
                            <span className="block font-medium text-sacred-dark text-[15px]">Strict Endogamy (Knanaya)</span>
                            <span className="text-[13px] text-gray-500">Constrain matches strictly within the Knanaya Catholic community.</span>
                        </div>
                    </label>
                </div>
            </div>
        </div>
    );
}

function PrivacySettings() {
    return (
        <div className="space-y-8">
            <div className="relative pb-6 border-b border-gold-100/40">
                <h2 className="text-2xl font-serif text-sacred-dark mb-1">Privacy & Security</h2>
                <p className="text-sm text-gray-500">Maintain control over your account and who sees your profile.</p>
                <div className="absolute bottom-[-1px] left-0 w-24 h-[2px] bg-gradient-to-r from-gold-400 to-transparent"></div>
            </div>

            <div className="space-y-6 max-w-2xl mt-8">
                {/* Your Account ID — share with parent for Kitchen Table linking */}
                {(() => {
                    const uid = localStorage.getItem('userId') || '';
                    return (
                        <div className="p-5 rounded-2xl border border-gold-200/60 bg-gold-50/50">
                            <h3 className="font-semibold text-sacred-dark mb-1">🔑 Your Account ID</h3>
                            <p className="text-[13px] text-gray-500 mb-3">
                                Share this ID with a parent so they can link their account and join your Kitchen Table.
                            </p>
                            <div className="flex items-center gap-3">
                                <code className="flex-1 bg-white border border-gold-200 rounded-xl px-4 py-2.5 text-[13px] text-sacred-dark font-mono truncate select-all">
                                    {uid || 'Not logged in'}
                                </code>
                                <button
                                    onClick={() => { navigator.clipboard.writeText(uid); }}
                                    className="px-4 py-2.5 rounded-xl text-[13px] font-medium border bg-white border-gold-200 text-gold-700 hover:bg-gold-50 transition-all"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>
                    );
                })()}
                <div className="flex items-center justify-between p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <EyeOff className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-medium text-sacred-dark">Ghost Mode</h3>
                            <p className="text-[13px] text-gray-500">Your profile is hidden from all discovery feeds.</p>
                        </div>
                    </div>
                    {/* Toggle */}
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                    </label>
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <h3 className="font-medium text-sacred-dark mb-4">Update Password</h3>
                    <div className="space-y-4">
                        <input type="password" placeholder="Current Password" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[15px] focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 focus:bg-white outline-none transition-all" />
                        <input type="password" placeholder="New Password" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[15px] focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 focus:bg-white outline-none transition-all" />
                        <input type="password" placeholder="Confirm New Password" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[15px] focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 focus:bg-white outline-none transition-all" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function NotificationSettings() {
    return (
        <div className="space-y-8">
            <div className="relative pb-6 border-b border-gold-100/40">
                <h2 className="text-2xl font-serif text-sacred-dark mb-1">Notifications</h2>
                <p className="text-sm text-gray-500">Decide how we communicate with you.</p>
                <div className="absolute bottom-[-1px] left-0 w-24 h-[2px] bg-gradient-to-r from-gold-400 to-transparent"></div>
            </div>

            <div className="space-y-6 max-w-2xl mt-8">
                <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                    <div>
                        <h3 className="font-medium text-sacred-dark text-[15px]">New Matches</h3>
                        <p className="text-[13px] text-gray-500">Get notified when a highly compatible profile joins.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                    </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                    <div>
                        <h3 className="font-medium text-sacred-dark text-[15px]">Direct Messages</h3>
                        <p className="text-[13px] text-gray-500">Alert me immediately when I receive a message.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                    </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                    <div>
                        <h3 className="font-medium text-sacred-dark text-[15px]">Family Recommendations</h3>
                        <p className="text-[13px] text-gray-500">When your assigned family scouts recommend a profile.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                    </label>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-100 space-y-4">
                    <h3 className="font-medium text-sacred-dark mb-4">Communication Channels</h3>
                    <label className="flex items-center space-x-3 cursor-pointer">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-gold-600 rounded focus:ring-gold-500 accent-gold-600" />
                        <span className="text-[14px] text-gray-700">Email Notifications</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 text-gold-600 rounded focus:ring-gold-500 accent-gold-600" />
                        <span className="text-[14px] text-gray-700">Push Notifications (Browser)</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-gold-600 rounded focus:ring-gold-500 accent-gold-600" />
                        <span className="text-[14px] text-gray-700">SMS Alerts (Critical only)</span>
                    </label>
                </div>
            </div>
        </div>
    );
}
