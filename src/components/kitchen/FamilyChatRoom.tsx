import { useState, useEffect, useRef } from 'react';
import { Send, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    isSystem?: boolean;
}

export default function FamilyChatRoom({
    currentUser,
    onRecommend,
}: {
    currentUser: { id: string; name: string; role: 'candidate' | 'scout' };
    onRecommend: () => void;
}) {
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', senderId: 'sys', senderName: 'System', text: 'Aleyamma (Mother) joined the Kitchen Table.', isSystem: true },
        { id: '2', senderId: 'parent1', senderName: 'Aleyamma', text: 'Maria, this profile looks very promising. He is from a good family in Chicago.' },
    ]);
    const [input, setInput] = useState('');
    const [recommendSent, setRecommendSent] = useState(false);
    const [candidateInterested, setCandidateInterested] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, recommendSent, candidateInterested]);

    const handleSend = () => {
        if (!input.trim()) return;
        setMessages((prev) => [
            ...prev,
            { id: Date.now().toString(), senderId: currentUser.id, senderName: currentUser.name, text: input },
        ]);
        setInput('');
    };

    const handleRecommend = () => {
        setRecommendSent(true);
        setMessages((prev) => [
            ...prev,
            { id: Date.now().toString(), senderId: 'sys', senderName: 'System', text: 'Aleyamma recommended this profile to Maria.', isSystem: true },
        ]);
        onRecommend();
    };

    const handleCandidateInterest = () => {
        setCandidateInterested(true);
        setMessages((prev) => [
            ...prev,
            { id: Date.now().toString(), senderId: 'sys', senderName: 'System', text: 'Maria silently expressed interest. The match has been notified.', isSystem: true },
        ]);
    };

    return (
        <div className="flex h-full w-full flex-col bg-gradient-to-br from-[#FAFAF9] via-[#F3F0EA] to-[#FAFAF9] border-l border-gold-200/50 relative shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
            {/* Header */}
            <div className="h-[72px] border-b border-gold-200/30 bg-white/40 backdrop-blur-xl px-6 flex items-center shadow-sm z-20 shrink-0 sticky top-0 justify-between">
                <div>
                    <h2 className="text-xl font-serif font-medium text-sacred-dark flex items-center gap-2">Family Discussion</h2>
                    <p className="text-[11px] text-sacred-dark/60 font-medium flex items-center gap-1.5 mt-0.5 tracking-wide uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></span>
                        Private & Invisible
                    </p>
                </div>
                <div className="flex -space-x-2 items-center">
                    <div className="relative group">
                        <div className="absolute inset-0 rounded-full bg-gold-400 blur-[3px] opacity-40 group-hover:opacity-70 transition-opacity"></div>
                        <div className="relative h-8 w-8 rounded-full border-[2px] border-white bg-gradient-to-br from-gold-200 to-gold-300 flex items-center justify-center text-xs font-bold text-gold-900 shadow-sm z-20">A</div>
                    </div>
                </div>
            </div>

            {/* Scout Action Panel */}
            {currentUser.role === 'scout' && !recommendSent && (
                <div className="bg-white/60 backdrop-blur-md p-4/5 border-b border-gold-200/50 flex flex-col items-center justify-center py-4 space-y-3 shadow-sm z-10 relative">
                    <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-400/30 to-transparent" />
                    <p className="text-[13px] font-medium text-sacred-dark/80 tracking-wide text-center">Do you think this is a good match for Maria?</p>
                    <button
                        onClick={handleRecommend}
                        className="flex items-center space-x-2 rounded-full bg-gradient-to-r from-gold-500 to-gold-600 px-6 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:shadow-lg hover:shadow-gold-600/30 hover:-translate-y-0.5 active:scale-95 group"
                    >
                        <Heart className="h-4 w-4 fill-white/20 group-hover:fill-current group-hover:text-red-400 transition-colors" />
                        <span>Highly Recommend</span>
                    </button>
                </div>
            )}

            {/* Candidate Action Panel (Shown if recommended) */}
            {currentUser.role === 'candidate' && recommendSent && !candidateInterested && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/60 backdrop-blur-md p-4/5 border-b border-indigo-200/50 flex flex-col items-center justify-center py-4 space-y-3 shadow-sm z-10 relative"
                >
                    <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent" />
                    <p className="text-[13px] font-medium text-indigo-900/80 tracking-wide text-center">Your mother recommended this profile. Connect?</p>
                    <button
                        onClick={handleCandidateInterest}
                        className="relative overflow-hidden flex items-center space-x-2 rounded-full bg-sacred-dark px-8 py-2.5 text-sm font-medium text-white transition-all hover:bg-black hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 active:scale-95 group"
                    >
                        <span className="absolute inset-0 w-full h-full bg-white/10 aspect-square rounded-full scale-0 group-hover:scale-[2] transition-transform duration-700 ease-out origin-center" />
                        <span className="relative z-10 flex items-center space-x-2">
                            <span>Show Interest</span>
                        </span>
                    </button>
                </motion.div>
            )}

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-36 relative">
                <AnimatePresence>
                    {messages.map((msg, i) => {
                        const showName = !msg.isSystem && (i === 0 || messages[i - 1].senderId !== msg.senderId);
                        return (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                className={`flex w-full flex-col ${msg.isSystem ? 'items-center' : msg.senderId === currentUser.id ? 'items-end' : 'items-start'}`}
                            >
                                {msg.isSystem ? (
                                    <div className="rounded-full bg-white/60 backdrop-blur-md border border-gold-200/50 shadow-sm px-5 py-1.5 text-[11px] font-medium text-sacred-dark/60 tracking-wider uppercase my-4">
                                        {msg.text}
                                    </div>
                                ) : (
                                    <>
                                        {showName && (
                                            <div className={`flex items-center gap-2 mb-2 ${msg.senderId === currentUser.id ? 'flex-row-reverse' : 'flex-row'}`}>
                                                <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm ${msg.senderId === currentUser.id ? 'bg-sacred-dark' : 'bg-gold-600'}`}>
                                                    {msg.senderName.charAt(0)}
                                                </div>
                                                <span className="text-[10px] font-bold tracking-wide uppercase text-sacred-dark/40">
                                                    {msg.senderName}
                                                </span>
                                            </div>
                                        )}
                                        <div className={`flex flex-col max-w-[85%] relative`}>
                                            <div
                                                className={`relative px-5 py-3.5 text-[14px] leading-relaxed shadow-md ${msg.senderId === currentUser.id
                                                    ? 'bg-sacred-dark text-white rounded-2xl rounded-tr-sm shadow-sacred-dark/10'
                                                    : 'bg-white border border-gold-100/50 text-sacred-dark rounded-2xl rounded-tl-sm shadow-gold-900/5'
                                                    }`}
                                            >
                                                <div className={`absolute top-0 w-2.5 h-2.5 ${msg.senderId === currentUser.id ? '-right-1 bg-sacred-dark clip-tail-right' : '-left-1 bg-white border-l border-t border-gold-100/50 clip-tail-left'}`}></div>
                                                <span className="relative z-10">{msg.text}</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Floating Input Box */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#F3F0EA] via-[#F3F0EA]/90 to-transparent pt-20 pb-6 px-6 pointer-events-none">
                <div className="relative flex items-end bg-white/70 backdrop-blur-xl rounded-[24px] border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-1.5 pointer-events-auto ring-1 ring-black/5 transition-all focus-within:bg-white/90 focus-within:shadow-[0_8px_40px_rgba(212,175,55,0.15)] focus-within:ring-gold-300/50">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Discuss privately..."
                        className="w-full bg-transparent py-3 pl-5 pr-12 text-[14px] text-sacred-dark outline-none placeholder:text-sacred-dark/30 font-sans transition-all"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="absolute right-2 bottom-2 flex h-9 w-9 items-center justify-center rounded-[14px] bg-gold-600 text-white transition-all duration-300 hover:scale-[1.05] hover:bg-gold-500 hover:shadow-lg hover:shadow-gold-600/30 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none disabled:bg-sacred-dark/10 disabled:text-sacred-dark/30"
                    >
                        <Send className="h-4 w-4 ml-0.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
