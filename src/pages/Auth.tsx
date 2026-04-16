import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { ShieldCheck, ArrowRight, Mail, Lock, Phone, Users, User, Link2, X, CheckCircle2, Loader2 } from 'lucide-react';

const API = 'http://localhost:3001/api';

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<'candidate' | 'scout'>('candidate');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Parent-link modal state
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [pendingParentId, setPendingParentId] = useState('');
    const [candidateId, setCandidateId] = useState('');
    const [linking, setLinking] = useState(false);
    const [linkError, setLinkError] = useState<string | null>(null);
    const [linkSuccess, setLinkSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isLogin) {
                // Login Flow
                const { data: users, error: fetchError } = await supabase
                    .from('User')
                    .select('*')
                    .eq('email', email)
                    .eq('passwordHash', password);

                if (fetchError) throw fetchError;

                if (users && users.length > 0) {
                    const user = users[0];
                    localStorage.setItem('user', JSON.stringify(user));
                    localStorage.setItem('userId', user.id);
                    localStorage.setItem('userRole', user.role);

                    // Fetch Profile to get gender
                    const { data: profiles } = await supabase
                        .from('Profile')
                        .select('gender')
                        .eq('userId', user.id);

                    if (profiles && profiles.length > 0) {
                        localStorage.setItem('userGender', profiles[0].gender);
                    }

                    // If scout (parent), check if already linked; if not, show link modal
                    if (user.role === 'scout') {
                        try {
                            const { data: links, error: linkError } = await supabase
                                .from('ParentCandidateLink')
                                .select('*')
                                .eq('parentId', user.id);

                            if (!linkError && links && links.length > 0) {
                                const linkData = links[0];
                                localStorage.setItem('linkedCandidateId', linkData.candidateId);
                                
                                const { data: profiles } = await supabase
                                    .from('Profile')
                                    .select('firstName')
                                    .eq('userId', linkData.candidateId);
                                    
                                const name = (profiles && profiles.length > 0) ? profiles[0].firstName : 'your child';
                                localStorage.setItem('linkedCandidateName', name);
                                navigate('/discovery');
                                return;
                            }
                        } catch (_) { /* no-op, proceed to modal */ }

                        // No link yet — show modal
                        setPendingParentId(user.id);
                        setShowLinkModal(true);
                        setLoading(false);
                        return;
                    }

                    // Also load existing link for candidates (so KitchenTable knows their parent)
                    try {
                        const colToMatch = user.role === 'scout' ? 'parentId' : 'candidateId';
                        const { data: links } = await supabase
                            .from('ParentCandidateLink')
                            .select('*')
                            .eq(colToMatch, user.id);
                        if (links && links.length > 0) {
                            const linkedId = user.role === 'scout' ? links[0].candidateId : links[0].parentId;
                            localStorage.setItem(user.role === 'scout' ? 'linkedCandidateId' : 'linkedParentId', linkedId);
                        }
                    } catch (_) { /* no-op */ }

                    navigate('/discovery');
                } else {
                    setError('Invalid email or password');
                }
            } else {
                // Register Flow
                if (password !== confirmPassword) {
                    setError('Passwords do not match');
                    setLoading(false);
                    return;
                }

                const userId = crypto.randomUUID();
                const now = new Date().toISOString();

                const { error: insertError } = await supabase
                    .from('User')
                    .insert([{
                        id: userId,
                        email: email,
                        phone: phone,
                        passwordHash: password,
                        role: role,
                        isVerified: true,
                        isPhoneVerified: true,
                        updatedAt: now
                    }]);

                if (insertError) {
                    if (insertError.code === '23505') {
                        setError('User with this email or phone already exists.');
                    } else {
                        throw insertError;
                    }
                } else {
                    const user = { id: userId, email, phone, role };
                    localStorage.setItem('user', JSON.stringify(user));
                    localStorage.setItem('userId', userId);
                    localStorage.setItem('userRole', role);

                    if (role === 'scout') {
                        // Show link modal immediately after scout registration
                        setPendingParentId(userId);
                        setShowLinkModal(true);
                        setLoading(false);
                        return;
                    }

                    navigate('/onboarding');
                }
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const handleLink = async () => {
        if (!candidateId.trim()) return;
        setLinking(true);
        setLinkError(null);
        try {
            // Validate candidate exists
            const { data: candidates, error: candError } = await supabase
                .from('User')
                .select('*')
                .eq('id', candidateId.trim());

            if (candError || !candidates || candidates.length === 0) {
                setLinkError('Candidate account not found. Please check the ID.');
                setLinking(false);
                return;
            }
            
            // Check if link already exists
            const { data: existing } = await supabase
                .from('ParentCandidateLink')
                .select('*')
                .eq('parentId', pendingParentId)
                .eq('candidateId', candidateId.trim());
                
            if (!existing || existing.length === 0) {
                const { error: insertError } = await supabase
                    .from('ParentCandidateLink')
                    .insert([{
                        id: crypto.randomUUID(),
                        parentId: pendingParentId,
                        candidateId: candidateId.trim()
                    }]);
                    
                if (insertError) {
                    setLinkError('Failed to link accounts: ' + insertError.message);
                    setLinking(false);
                    return;
                }
            }

            // Store link in localStorage
            localStorage.setItem('linkedCandidateId', candidateId.trim());
            setLinkSuccess(true);
            setTimeout(() => {
                navigate('/discovery');
            }, 1500);
        } catch (err: any) {
            setLinkError(err.message || 'Connection error');
        } finally {
            setLinking(false);
        }
    };

    const handleSkipLink = () => {
        setShowLinkModal(false);
        navigate('/discovery');
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-pearl-50 text-sacred-dark font-sans flex items-center justify-center p-6 pb-12">
            <div className="absolute inset-0 bg-cover bg-center opacity-40 blur-sm" style={{ backgroundImage: `url('/christian-wedding-bg.png')` }}></div>

            <div className="relative z-10 w-full max-w-md p-8 glass rounded-[2.5rem] overflow-hidden backdrop-blur-2xl border border-white/40 bg-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
                <div className="mb-8 flex flex-col items-center space-y-2 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-gold-50 to-gold-100 text-gold-600 shadow-inner border border-gold-200 mb-2">
                        <ShieldCheck className="h-8 w-8 text-gold-500" />
                    </div>
                    <h2 className="text-3xl font-serif text-sacred-dark">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                    <p className="text-sm text-gray-600">{isLogin ? 'Enter your details to sign in' : 'Start your sacred journey today'}</p>
                </div>

                <AnimatePresence mode="wait">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-red-500 text-sm mb-4 text-center bg-red-50 p-3 rounded-xl border border-red-100"
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="w-full space-y-4">
                    {/* Role selector — only on signup */}
                    {!isLogin && (
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setRole('candidate')}
                                className={`flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 transition-all duration-200 ${role === 'candidate'
                                    ? 'border-gold-500 bg-gold-50 text-sacred-dark shadow-sm'
                                    : 'border-gray-200 bg-white/60 text-gray-400 hover:border-gold-300'}`}
                            >
                                <User className="h-6 w-6" />
                                <span className="text-xs font-semibold">I'm the Candidate</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('scout')}
                                className={`flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 transition-all duration-200 ${role === 'scout'
                                    ? 'border-gold-500 bg-gold-50 text-sacred-dark shadow-sm'
                                    : 'border-gray-200 bg-white/60 text-gray-400 hover:border-gold-300'}`}
                            >
                                <Users className="h-6 w-6" />
                                <span className="text-xs font-semibold">I'm a Parent</span>
                            </button>
                        </div>
                    )}

                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email Address"
                            required
                            className="w-full rounded-xl border border-gold-200 bg-white/50 py-3 pl-10 pr-4 text-sacred-dark outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all font-sans"
                        />
                    </div>

                    {!isLogin && (
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Phone Number"
                                required
                                className="w-full rounded-xl border border-gold-200 bg-white/50 py-3 pl-10 pr-4 text-sacred-dark outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all font-sans"
                            />
                        </div>
                    )}

                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            required
                            className="w-full rounded-xl border border-gold-200 bg-white/50 py-3 pl-10 pr-4 text-sacred-dark outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all font-sans"
                        />
                    </div>

                    {!isLogin && (
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm Password"
                                required
                                className="w-full rounded-xl border border-gold-200 bg-white/50 py-3 pl-10 pr-4 text-sacred-dark outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all font-sans"
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-6 flex w-full items-center justify-center space-x-2 rounded-xl bg-sacred-dark py-4 font-medium text-sacred-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
                    >
                        <span>{loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}</span>
                        {!loading && <ArrowRight className="h-4 w-4" />}
                    </button>

                    <div className="mt-6 text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError(null);
                                setRole('candidate');
                            }}
                            className="text-sm font-medium text-gold-700 hover:text-gold-900 transition-colors"
                        >
                            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                        </button>
                    </div>
                </form>
            </div>

            {/* ─── Parent Link Modal ─── */}
            <AnimatePresence>
                {showLinkModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 24 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 24 }}
                            className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
                        >
                            {linkSuccess ? (
                                <div className="flex flex-col items-center py-8 text-center">
                                    <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                                    <h3 className="font-serif text-2xl text-sacred-dark mb-2">Accounts Linked!</h3>
                                    <p className="text-sm text-gray-500">You are now connected to your child's account. You share the same Kitchen Table.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="h-11 w-11 rounded-full bg-gold-50 border border-gold-200 flex items-center justify-center">
                                                <Link2 className="h-5 w-5 text-gold-600" />
                                            </div>
                                            <h2 className="font-serif text-2xl text-sacred-dark">Link to Your Child</h2>
                                        </div>
                                        <button onClick={handleSkipLink} className="p-2 text-gray-400 hover:text-gray-700 rounded-full transition-colors">
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-6 pl-14">
                                        Enter your child's User ID so you both share the same Kitchen Table discussion room.
                                        They can find their ID in their Settings page.
                                    </p>

                                    {linkError && (
                                        <div className="mb-4 text-red-500 text-sm bg-red-50 border border-red-100 rounded-xl p-3">
                                            {linkError}
                                        </div>
                                    )}

                                    <input
                                        value={candidateId}
                                        onChange={e => setCandidateId(e.target.value)}
                                        placeholder="Child's User ID..."
                                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-3.5 text-sacred-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-300 transition mb-4"
                                    />

                                    <button
                                        onClick={handleLink}
                                        disabled={!candidateId.trim() || linking}
                                        className="w-full rounded-2xl bg-gold-600 text-white py-3.5 font-semibold hover:bg-gold-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mb-3"
                                    >
                                        {linking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                                        {linking ? 'Linking...' : 'Link Accounts'}
                                    </button>

                                    <button
                                        onClick={handleSkipLink}
                                        className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors"
                                    >
                                        Skip for now
                                    </button>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
