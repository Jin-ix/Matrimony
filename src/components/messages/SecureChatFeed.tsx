import { useState, useRef, useEffect } from 'react';
import { Send, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
    id: string;
    senderId: string;
    text: string;
    timestamp: string;
    flagged?: boolean;
}

export default function SecureChatFeed({
    currentUser,
    matchUser,
}: {
    currentUser: { id: string; name: string };
    matchUser: { id: string; name: string; avatar: string };
}) {
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', senderId: matchUser.id, text: 'Hi! I read your profile, it’s really wonderful how much you value family dinners.', timestamp: '10:00 AM' },
    ]);
    const [input, setInput] = useState('');
    const [moderationWarning, setModerationWarning] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, moderationWarning]);

    const handleSend = () => {
        if (!input.trim()) return;

        // Moderation Shield Mock
        const suspiciousKeywords = ['address', 'bank', 'whatsapp', 'number', 'cash'];
        const isSuspicious = suspiciousKeywords.some(kw => input.toLowerCase().includes(kw));

        if (isSuspicious) {
            setModerationWarning('For your safety, please avoid sharing intimate personal details or moving off-platform too soon.');
            // We still send the message but flag it in the UI (or block it in a real app)
        } else {
            setModerationWarning(null);
        }

        setMessages((prev) => [
            ...prev,
            { id: Date.now().toString(), senderId: currentUser.id, text: input, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), flagged: isSuspicious },
        ]);
        setInput('');
    };

    return (
        <div className="flex h-full w-full flex-col bg-sacred-offwhite">
            {/* Moderation Shield Banner */}
            <AnimatePresence>
                {moderationWarning && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-yellow-50 border-b border-yellow-200 px-6 py-3 flex items-start space-x-3 overflow-hidden"
                    >
                        <ShieldAlert className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-yellow-800 font-sans">{moderationWarning}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
                <AnimatePresence>
                    {messages.map((msg) => {
                        const isMine = msg.senderId === currentUser.id;
                        return (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}
                            >
                                {!isMine && (
                                    <img src={matchUser.avatar} alt="Avatar" className="h-8 w-8 rounded-full border border-gold-200 mr-3 mt-1 object-cover shadow-sm bg-white" />
                                )}
                                <div className="flex flex-col items-start max-w-[70%]">
                                    <div
                                        className={`rounded-[20px] px-5 py-3.5 text-[15px] leading-relaxed shadow-sm font-sans ${isMine
                                            ? 'bg-sacred-dark text-white rounded-tr-sm'
                                            : 'bg-white border border-gold-100/50 text-sacred-dark rounded-tl-sm'
                                            } ${msg.flagged ? 'border border-yellow-400 bg-yellow-50/10' : ''}`}
                                    >
                                        {msg.text}
                                    </div>
                                    <span className={`text-[10px] text-gray-400 mt-1 font-medium tracking-wide ${isMine ? 'self-end' : 'self-start'}`}>
                                        {msg.timestamp}
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gold-100 bg-white p-4 pb-8 sm:pb-4 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
                <div className="mx-auto max-w-4xl relative flex items-end">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                        }}
                        placeholder="Write a message..."
                        className="w-full resize-none rounded-2xl border border-gray-200 bg-sacred-offwhite py-4 pl-5 pr-14 text-sacred-dark outline-none focus:border-gold-400 focus:bg-white focus:ring-2 focus:ring-gold-100 transition-all duration-300 font-sans overflow-hidden shadow-inner focus:shadow-md"
                        rows={Math.min(4, input.split('\n').length || 1)}
                        style={{ minHeight: '56px', maxHeight: '120px' }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gold-600 text-white transition-all duration-300 hover:scale-105 hover:bg-gold-500 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-md hover:shadow-lg"
                    >
                        <Send className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
