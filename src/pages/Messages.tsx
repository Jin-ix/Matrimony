import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreVertical, ShieldCheck } from 'lucide-react';
import AIIcebreakerBanner from '../components/messages/AIIcebreakerBanner';
import SecureChatFeed from '../components/messages/SecureChatFeed';
import DecisionActionSheet from '../components/messages/DecisionActionSheet';
import { motion, AnimatePresence } from 'framer-motion';

interface MatchUser {
    id: string;
    name: string;
    avatar: string;
}

export default function Messages() {
    const { chatId } = useParams();
    const navigate = useNavigate();
    const [showActionSheet, setShowActionSheet] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);
    
    const [matchUser, setMatchUser] = useState<MatchUser | null>(null);
    const [initialMessages, setInitialMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const currentUserStr = localStorage.getItem('user');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : { id: localStorage.getItem('userId'), name: 'Me' };

    useEffect(() => {
        const fetchChat = async () => {
            const userId = localStorage.getItem('userId');
            if (!userId || !chatId) return;

            try {
                const res = await fetch(`http://localhost:3001/api/conversations/${chatId}/messages`, {
                    headers: { 'x-user-id': userId }
                });
                if (!res.ok) throw new Error('Failed to load chat');
                
                const data = await res.json();
                if (data.matchUser) setMatchUser(data.matchUser);
                if (data.messages) setInitialMessages(data.messages);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchChat();
    }, [chatId]);

    const handleAction = async (action: string) => {
        setShowActionSheet(false);
        if (action === 'close') {
            setIsArchiving(true);
            const userId = localStorage.getItem('userId');
            if (userId && chatId) {
                fetch(`http://localhost:3001/api/conversations/${chatId}/archive`, {
                    method: 'POST',
                    headers: { 'x-user-id': userId }
                }).catch(console.error);
            }
            setTimeout(() => navigate('/messages'), 2000); 
        }
    };

    if (loading) {
        return <div className="flex h-screen w-full items-center justify-center bg-white"><div className="w-8 h-8 rounded-full border-4 border-gold-400 border-t-transparent animate-spin" /></div>;
    }

    if (!matchUser) {
        return <div className="flex h-screen w-full items-center justify-center bg-white"><p>Conversation not found.</p></div>;
    }

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
                            <p className="text-gray-500 font-sans text-sm">{matchUser.name} has been notified respectfully.</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="flex h-[72px] items-center justify-between border-b border-gold-200/60 bg-white/95 px-4 sm:px-6 backdrop-blur-xl z-10 shrink-0">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate('/messages')}
                        className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-sacred-offwhite transition-colors text-sacred-dark"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <img src={matchUser.avatar} alt={matchUser.name} className="h-10 w-10 rounded-full object-cover border border-gold-200 shadow-sm" />
                            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
                        </div>
                        <div>
                            <h1 className="font-serif text-lg font-medium text-sacred-dark leading-tight">{matchUser.name}</h1>
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
                        <AIIcebreakerBanner matchName={matchUser.name} />
                    </div>
                    <SecureChatFeed 
                        currentUser={{ id: currentUser.id || localStorage.getItem('userId') || 'me', name: currentUser.firstName || currentUser.name || 'Me' }} 
                        matchUser={matchUser} 
                        chatId={chatId!}
                        initialMessages={initialMessages}
                    />
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
