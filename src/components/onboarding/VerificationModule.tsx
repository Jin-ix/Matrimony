import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowRight, Phone } from 'lucide-react';

interface VerificationModuleProps {
    onVerified: (phoneNumber: string) => void;
}

export default function VerificationModule({ onVerified }: VerificationModuleProps) {
    // Pre-fill phone from registration (stored in localStorage as user.phone)
    const getStoredPhone = () => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                return user?.phone || '';
            }
        } catch (_) {}
        return '';
    };

    const storedPhone = getStoredPhone();

    // If phone is already known from registration, skip straight to OTP step
    const [step, setStep] = useState<'phone' | 'otp' | 'linkedin'>(storedPhone ? 'otp' : 'phone');
    const [phone, setPhone] = useState(storedPhone);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);

    const handlePhoneSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (phone.trim().length > 0) setStep('otp');
    };

    const handleOtpChange = (index: number, value: string) => {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (index < 5 && value) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }
        if (index === 5 && value) {
            setTimeout(() => setStep('linkedin'), 500);
        }
    };

    const handleLinkedInConnect = () => {
        const userId = localStorage.getItem('userId') || '';
        const popupUrl = `${(import.meta as any).env?.VITE_API_URL || 'http://localhost:3001'}/api/auth/linkedin?userId=${userId}&popup=true`;
        
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        const popup = window.open(popupUrl, 'linkedin', `width=${width},height=${height},left=${left},top=${top}`);

        const listener = (event: MessageEvent) => {
            if (event.data?.type === 'LINKEDIN_SUCCESS') {
                window.removeEventListener('message', listener);
                onVerified(phone);
            }
        };

        window.addEventListener('message', listener);
    };

    return (
        <div className="flex w-full max-w-sm flex-col items-center justify-center p-8 glass rounded-[2.5rem] relative overflow-hidden backdrop-blur-2xl border border-white/40 bg-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
            <div className="mb-6 flex flex-col items-center space-y-2 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-gold-50 to-gold-100 text-gold-600 shadow-inner border border-gold-200 mb-2">
                    <ShieldCheck className="h-8 w-8 text-gold-500" />
                </div>
                <h2 className="text-2xl font-serif text-sacred-dark">Verify Identity</h2>
                <p className="text-sm text-gray-600">Sacred connections require real people.</p>
            </div>

            <AnimatePresence mode="wait">
                {step === 'phone' && (
                    <motion.form
                        key="phone"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        onSubmit={handlePhoneSubmit}
                        className="w-full space-y-4"
                    >
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Phone Number"
                                className="w-full rounded-xl border border-gold-200 bg-white/50 py-3 pl-10 pr-4 text-sacred-dark outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all font-sans"
                                autoFocus
                            />
                        </div>
                        <button
                            type="submit"
                            className="flex w-full items-center justify-center space-x-2 rounded-xl bg-sacred-dark py-4 font-medium text-sacred-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-95"
                        >
                            <span>Continue</span>
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </motion.form>
                )}

                {step === 'otp' && (
                    <motion.div
                        key="otp"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="w-full space-y-6"
                    >
                        <p className="text-center text-sm text-gray-600">Enter the code sent to {phone}</p>
                        <div className="flex justify-between">
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    id={`otp-${i}`}
                                    type="text"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(i, e.target.value)}
                                    className="h-12 w-10 rounded-lg border border-gold-200 bg-white/50 text-center text-xl font-medium text-sacred-dark outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all font-sans"
                                />
                            ))}
                        </div>
                    </motion.div>
                )}

                {step === 'linkedin' && (
                    <motion.div
                        key="linkedin"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full space-y-4 text-center"
                    >
                        <p className="text-sm mb-4 text-gray-700">Connecting your professional identity adds a 'Verified Professional' badge to your profile.</p>
                        <button
                            onClick={handleLinkedInConnect}
                            className="w-full rounded-xl bg-[#0a66c2] py-3 font-medium text-white transition-transform hover:bg-[#004182] hover:scale-[1.02] active:scale-95 flex items-center justify-center space-x-2"
                        >
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                            <span>Connect LinkedIn</span>
                        </button>
                        <button onClick={() => onVerified(phone)} className="text-xs text-gray-500 hover:text-gray-800 underline mt-2 block w-full">
                            Skip for now
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
