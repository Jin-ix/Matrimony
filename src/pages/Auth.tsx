import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { ShieldCheck, ArrowRight, Mail, Lock, Phone } from 'lucide-react';

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

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
                    .eq('passwordHash', password); // Simple matching for prototype

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
                        passwordHash: password, // Store as is for prototype
                        role: 'candidate',
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
                    const user = { id: userId, email, phone, role: 'candidate' };
                    localStorage.setItem('user', JSON.stringify(user));
                    localStorage.setItem('userId', userId);
                    localStorage.setItem('userRole', 'candidate');
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
                            }}
                            className="text-sm font-medium text-gold-700 hover:text-gold-900 transition-colors"
                        >
                            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
