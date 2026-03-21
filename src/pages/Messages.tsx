import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreVertical, ShieldCheck } from 'lucide-react';
import AIIcebreakerBanner from '../components/messages/AIIcebreakerBanner';
import SecureChatFeed from '../components/messages/SecureChatFeed';
import DecisionActionSheet from '../components/messages/DecisionActionSheet';
import { motion, AnimatePresence } from 'framer-motion';

const MOCK_MATCH = {
    id: 'match_123',
    name: 'Johan',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80',
};

export default function Messages() {
    useParams();
    const navigate = useNavigate();
    const [showActionSheet, setShowActionSheet] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);

    const handleAction = (action: string) => {
        setShowActionSheet(false);
        if (action === 'close') {
            setIsArchiving(true);
            setTimeout(() => navigate('/discovery'), 2000); // Respectful close animation transition
        }
    };

    return (
        <div className="flex h-screen w-full flex-col bg-white overflow-hidden font-sans relative">

            {/* Respectful Close Animation Banner */}
            <AnimatePresence>
                {isArchiving && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 z-[100] bg-white flex flex-col items-center justify-center pointer-events-none"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex flex-col items-center"
                        >
                            <ShieldCheck className="w-12 h-12 text-gray-300 mb-4" />
                            <h2 className="font-serif text-2xl text-sacred-dark mb-2">Connection Archived</h2>
                            <p className="text-gray-500 font-sans text-sm">{MOCK_MATCH.name} has been notified respectfully.</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="flex h-[72px] items-center justify-between border-b border-gold-200/60 bg-white/95 px-4 sm:px-6 backdrop-blur-xl z-10 shrink-0">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate('/discovery')}
                        className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-sacred-offwhite transition-colors text-sacred-dark"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <img src={MOCK_MATCH.avatar} alt={MOCK_MATCH.name} className="h-10 w-10 rounded-full object-cover border border-gold-200 shadow-sm" />
                            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
                        </div>
                        <div>
                            <h1 className="font-serif text-lg font-medium text-sacred-dark leading-tight">{MOCK_MATCH.name}</h1>
                            <p className="text-xs font-medium text-gold-600 uppercase tracking-wide">Mutual Interest</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setShowActionSheet(true)}
                    className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-sacred-offwhite transition-colors text-gray-600"
                >
                    <MoreVertical className="h-5 w-5" />
                </button>
            </header>

            {/* Main Chat Area */}
            <main className="flex-1 overflow-hidden relative flex flex-col pt-2">
                <div className="max-w-4xl mx-auto w-full flex flex-col h-full bg-white shadow-[0_0_60px_-15px_rgba(0,0,0,0.05)] rounded-t-[2.5rem] border-x border-t border-gold-100/50 overflow-hidden">
                    <div className="shrink-0 z-10 bg-white">
                        <AIIcebreakerBanner matchName={MOCK_MATCH.name} />
                    </div>
                    <SecureChatFeed currentUser={{ id: 'me', name: 'Maria' }} matchUser={MOCK_MATCH} />
                </div>
            </main>

            {/* Action Sheet */}
            <AnimatePresence>
                {showActionSheet && (
                    <DecisionActionSheet onClose={() => setShowActionSheet(false)} onAction={handleAction} />
                )}
            </AnimatePresence>
        </div>
    );
}
