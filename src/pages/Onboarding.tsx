import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import VerificationModule from '../components/onboarding/VerificationModule';
import ConversationalAgent from '../components/onboarding/ConversationalAgent';
import MediaUploadModal from '../components/onboarding/MediaUploadModal';

import RoleSelection from '../components/onboarding/RoleSelection';

import { supabase } from '../lib/supabase';

type OnboardingState = 'role' | 'verification' | 'chat' | 'upload' | 'transitioning';

export default function Onboarding() {
    const [step, setStep] = useState<OnboardingState>('role');
    const [role, setRole] = useState<'candidate' | 'scout' | null>(null);
    const [phone, setPhone] = useState<string>('');
    const [chatAnswers, setChatAnswers] = useState<Record<string, any>>({});
    const navigate = useNavigate();

    const handleRoleSelection = (selectedRole: 'candidate' | 'scout') => {
        setRole(selectedRole);
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setPhone(user.phone || '');
            setStep('chat');
        } else {
            setStep('verification');
        }
    };

    const handleVerified = (verifiedPhone: string) => {
        setPhone(verifiedPhone);
        setStep('chat');
    };

    const handleChatComplete = (answers: Record<string, any>) => {
        setChatAnswers(answers);
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
            const email = chatAnswers.email || authUser?.email || null;
            const now = new Date().toISOString();
            
            // 1. Update/Upsert User
            const { error: userError } = await supabase
                .from('User')
                .upsert([{
                    id: userId,
                    phone: phone,
                    email: email,
                    role: role || 'candidate',
                    isVerified: true, 
                    isPhoneVerified: true,
                    updatedAt: now
                }]);
            
            // Explicitly sync localStorage for Discovery page rendering
            if (role) {
                localStorage.setItem('userRole', role);
            }
            if (chatAnswers.gender) {
                localStorage.setItem('userGender', chatAnswers.gender === 'Woman' ? 'female' : 'male');
            }
                
            if (userError) {
                console.error("Error creating user:", userError);
                alert(`Failed to save user: ${userError.message}`);
            } else {
                // 2. Map Rite Enum
                let mappedRite = 'OTHER';
                const ansRite = chatAnswers.rite || '';
                if (ansRite.includes('Syro-Malabar')) mappedRite = 'SYRO_MALABAR';
                else if (ansRite.includes('Latin')) mappedRite = 'LATIN';
                else if (ansRite.includes('Knanaya')) mappedRite = 'KNANAYA_CATHOLIC';
                else if (ansRite.includes('Malankara Orthodox')) mappedRite = 'MALANKARA_ORTHODOX';
                else if (ansRite.includes('Syro-Malankara')) mappedRite = 'SYRO_MALANKARA';

                // 3. Insert Profile
                const nameParts = (chatAnswers.name || '').trim().split(' ');
                const firstName = nameParts[0] || 'Unknown';
                const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Unknown';
                
                const { error: profileError } = await supabase
                    .from('Profile')
                    .insert([{
                        id: crypto.randomUUID(),
                        userId: userId,
                        firstName,
                        lastName,
                        age: parseInt(chatAnswers.age) || 25,
                        gender: chatAnswers.gender === 'Woman' ? 'female' : 'male',
                        location: chatAnswers.occupation || 'Unknown', // Storing location with occupation currently
                        rite: mappedRite,
                        parish: chatAnswers.parish || null,
                        bio: chatAnswers.familyValues || null,
                        education: chatAnswers.education || null,
                        dietaryPreference: chatAnswers.dietaryPreference || null,
                        maritalStatus: chatAnswers.maritalStatus || 'Never Married',
                        height: chatAnswers.height || null,
                        sacramentsReceived: chatAnswers.sacramentsReceived || [],
                        spiritualValues: chatAnswers.spiritualValues || null,
                        occupation: chatAnswers.occupation || null,
                        hobbies: chatAnswers.hobbies || [],
                        updatedAt: now,
                        profileComplete: 0.8
                    }]);
                    
                if (profileError) console.error("Error creating profile:", profileError);

                // 4. Save structured generic responses too just in case
                const responsePromises = Object.entries(chatAnswers).map(([key, value], index) => {
                    return supabase
                        .from('OnboardingResponse')
                        .insert([{
                            id: crypto.randomUUID(),
                            userId: userId,
                            step: index,
                            question: key,
                            answer: Array.isArray(value) ? value.join(', ') : value
                        }]);
                });
                
                // 5. Photos
                const photoPromises = photos.map((photo, index) => {
                    return supabase
                        .from('Photo')
                        .insert([{
                            id: crypto.randomUUID(),
                            userId: userId,
                            url: photo.isBlurred ? 'blurred_placeholder_url' : photo.preview,
                            publicId: photo.isBlurred ? 'blurred' : 'clear',
                            isPrimary: index === 0,
                            order: index
                        }]);
                });
                
                await Promise.all([...responsePromises, ...photoPromises]);
                console.log("Onboarding data & profile saved successfully to Supabase!");
            }
        } catch (e) {
            console.error("Failed to save onboarding data", e);
            alert("An unexpected error occurred while saving the data.");
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
            <div className="fixed top-2 left-2 z-50 bg-black/80 text-white text-xs p-2 rounded">
                DEBUG STEP: {step}
            </div>
            
            <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-6 pb-12">
                <AnimatePresence>
                    {step === 'role' && (
                        <motion.div
                            key="role"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute inset-0 flex flex-col items-center justify-center p-6"
                        >
                            <RoleSelection onSelectRole={handleRoleSelection} />
                        </motion.div>
                    )}

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
