import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import VerificationModule from '../components/onboarding/VerificationModule';
import ConversationalAgent from '../components/onboarding/ConversationalAgent';
import MediaUploadModal from '../components/onboarding/MediaUploadModal';


import BasicInfoForm from '../components/onboarding/BasicInfoForm';

import { supabase } from '../lib/supabase';

type OnboardingState = 'verification' | 'basicInfo' | 'chat' | 'upload' | 'transitioning';

export default function Onboarding() {
    const [step, setStep] = useState<OnboardingState>('verification');
    const [role] = useState<'candidate' | 'scout'>('candidate');
    const [phone, setPhone] = useState<string>('');
    const [chatAnswers, setChatAnswers] = useState<Record<string, any>>({});
    const navigate = useNavigate();



    const handleVerified = (verifiedPhone: string) => {
        setPhone(verifiedPhone);
        setStep('basicInfo');
    };

    const handleBasicInfoComplete = () => {
        setStep('chat');
    };

    const handleChatComplete = () => {
        setStep('upload');
    };

    const handleMoodChange = () => {
        // Mood affects dynamic atmosphere
    };

    const handleFinishOnboarding = async (photos: { file: File, preview: string, isBlurred: boolean }[] = []) => {
        setStep('transitioning');
        
        try {
            const userStr = localStorage.getItem('user');
            const authUser = userStr ? JSON.parse(userStr) : null;
            const userId = authUser?.id || crypto.randomUUID();
            
            // 5. Photos
            const photoPromises = photos.map((photo, index) => {
                return new Promise<void>((resolve, reject) => {
                    if (photo.isBlurred) {
                        supabase.from('Photo').insert([{
                            id: crypto.randomUUID(),
                            userId: userId,
                            url: 'blurred_placeholder_url',
                            publicId: 'blurred',
                            isPrimary: index === 0,
                            order: index
                        }]).then(({ error }) => {
                            if (error) reject(error);
                            else resolve();
                        });
                    } else {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            const base64String = reader.result as string;
                            supabase.from('Photo').insert([{
                                id: crypto.randomUUID(),
                                userId: userId,
                                url: base64String,
                                publicId: 'clear',
                                isPrimary: index === 0,
                                order: index
                            }]).then(({ error }) => {
                                if (error) reject(error);
                                else resolve();
                            });
                        };
                        reader.onerror = reject;
                        reader.readAsDataURL(photo.file);
                    }
                });
            });
            
            await Promise.all(photoPromises);
            console.log("Onboarding photos saved successfully to Supabase!");
        } catch (e) {
            console.error("Failed to save photos data", e);
            alert("An unexpected error occurred while uploading photos.");
        }

        setTimeout(() => {
            navigate('/discovery');
        }, 1500); 
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-pearl-50 text-sacred-dark font-sans">
            {/* Background layer for inner pages */}
            <div className="absolute inset-0 z-0">
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5, ease: 'easeInOut' }}
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url('/christian-wedding-bg.png')` }}
                    >
                        {/* Overlay to ensure glassmorphism components remain legible */}
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]"></div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Content layer */}

            {/* Skip Button */}
            {step !== 'transitioning' && (
                <div className="absolute top-6 right-6 z-50">
                    <button 
                        onClick={() => navigate('/discovery')}
                        className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors bg-white/50 hover:bg-white/80 px-4 py-2 rounded-full backdrop-blur-sm border border-gray-200 shadow-sm"
                    >
                        Skip for now
                    </button>
                </div>
            )}

            <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-6 pb-12">
                <AnimatePresence>


                    {step === 'verification' && (
                        <motion.div
                            key="verification"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute inset-0 flex flex-col items-center justify-center p-6"
                        >
                            <VerificationModule onVerified={handleVerified} />
                        </motion.div>
                    )}

                    {step === 'basicInfo' && (
                        <motion.div
                            key="basicInfo"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute inset-0 flex flex-col items-center justify-center p-6"
                        >
                            <BasicInfoForm onComplete={handleBasicInfoComplete} />
                        </motion.div>
                    )}

                    {step === 'chat' && role && (
                        <motion.div
                            key="chat"
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute inset-0 flex flex-col items-center justify-center p-6 pb-12"
                        >
                            <ConversationalAgent
                                role={role}
                                onComplete={handleChatComplete}
                                onMoodChange={handleMoodChange}
                            />
                        </motion.div>
                    )}

                    {step === 'upload' && (
                        <motion.div
                            key="upload"
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute inset-0 flex flex-col items-center justify-center p-6"
                        >
                            <MediaUploadModal onFinish={(photos) => handleFinishOnboarding(photos)} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Sweeping Curtain Reveal Animation - Christian Wedding Theme */}
            <AnimatePresence>
                {step === 'transitioning' && (
                    <motion.div
                        initial={{ translateY: '100%' }}
                        animate={{ translateY: '0%' }}
                        transition={{ duration: 1.5, ease: [0.77, 0, 0.175, 1] }}
                        className="fixed inset-0 z-[100] bg-gradient-to-br from-gold-50 via-white to-gold-50 flex flex-col items-center justify-center overflow-hidden"
                    >
                        {/* Elegant background graphics */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.5, duration: 1.5, ease: "easeOut" }}
                            className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none"
                        >
                            <div className="w-[500px] h-[500px] rounded-full border-2 border-gold-300 border-dashed animate-spin-slow"></div>
                            <div className="absolute w-[600px] h-[600px] rounded-full border border-gold-200 animate-reverse-spin"></div>
                        </motion.div>

                        {/* Cross / Holy Matrimony Icon */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: 0.8, duration: 1, type: "spring" }}
                            className="mb-6 z-10"
                        >
                            <div className="relative flex items-center justify-center">
                                <div className="absolute inset-0 bg-gold-200 rounded-full blur-2xl opacity-40"></div>
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="text-gold-600 drop-shadow-md">
                                    <path
                                        d="M12 2V22M7 7H17"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    {/* Subtle rings intersecting the cross to signify Holy Matrimony */}
                                    <circle cx="9.5" cy="14" r="3" stroke="currentColor" strokeWidth="1.5" />
                                    <circle cx="14.5" cy="14" r="3" stroke="currentColor" strokeWidth="1.5" />
                                </svg>
                            </div>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1, duration: 1 }}
                            className="text-5xl font-serif text-sacred-dark z-10 text-center drop-shadow-sm"
                        >
                            Welcome to the Hub
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.5, duration: 1 }}
                            className="mt-4 text-gold-700 font-sans tracking-widest uppercase text-sm z-10"
                        >
                            Entering a sacred space
                        </motion.p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
