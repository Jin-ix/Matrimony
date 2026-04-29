import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles } from 'lucide-react';

// ─── Typewriter Hook ───────────────────────────────────────────────────────────
function useTypewriter(text: string, speed = 20, enabled = true) {
    const [displayed, setDisplayed] = useState('');
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (!enabled) {
            setDisplayed(text);
            setDone(true);
            return;
        }
        setDisplayed('');
        setDone(false);
        let i = 0;
        const timer = setInterval(() => {
            i++;
            setDisplayed(text.slice(0, i));
            if (i >= text.length) {
                clearInterval(timer);
                setDone(true);
            }
        }, speed);
        return () => clearInterval(timer);
    }, [text, speed, enabled]);

    return { displayed, done };
}

function TypewriterBubble({ text, isActive }: { text: string; isActive: boolean }) {
    const { displayed, done } = useTypewriter(text, 20, isActive);
    return (
        <span>
            {displayed}
            {!done && (
                <span className="inline-block w-0.5 h-4 bg-gold-500 ml-0.5 animate-pulse align-text-bottom" />
            )}
        </span>
    );
}

// ─── Constants ────────────────────────────────────────────────────────────────
const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface Message {
    id: string;
    sender: 'ai' | 'user';
    text: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ConversationalAgent({
    role: _role,
    onComplete,
    onMoodChange,
}: {
    role: 'candidate' | 'scout';
    onComplete: (answers?: any) => void;
    onMoodChange: (mood: 'neutral' | 'warm' | 'cool') => void;
}) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [currentStep, setCurrentStep] = useState(0);
    const [isTyping, setIsTyping] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isChatFinished, setIsChatFinished] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Fetch the first question from the backend on mount
    useEffect(() => {
        const fetchInitialQuestion = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setIsTyping(false);
                    return;
                }

                const res = await fetch(`${API}/ai/onboarding/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ message: '', currentStep: 0 }),
                });

                const data = await res.json();
                setMessages([{ id: 'start', sender: 'ai', text: data.response }]);
                setCurrentStep(data.nextStep);
                onMoodChange((data.mood as any) || 'warm');
            } catch (err) {
                console.error('Failed to fetch initial question:', err);
                setMessages([{
                    id: 'fallback',
                    sender: 'ai',
                    text: "Welcome! I'm here to help you build your sacred profile. Could you start by telling me about your faith and involvement in the Church?",
                }]);
            } finally {
                setIsTyping(false);
            }
        };

        fetchInitialQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, errorMsg]);

    const handleSend = async () => {
        const userText = input.trim();
        if (!userText || isTyping || isChatFinished) return;

        setErrorMsg(null);

        const userMessage: Message = {
            id: Date.now().toString(),
            sender: 'user',
            text: userText,
        };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        try {
            const token = localStorage.getItem('token');

            const res = await fetch(`${API}/ai/onboarding/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ message: userText, currentStep }),
            });

            if (!res.ok) {
                throw new Error('Failed to reach AI service');
            }

            const data = await res.json();

            setTimeout(() => {
                setIsTyping(false);
                const aiMessage: Message = {
                    id: Date.now().toString() + '_ai',
                    sender: 'ai',
                    text: data.response,
                };
                setMessages((prev) => [...prev, aiMessage]);
                setCurrentStep(data.nextStep);
                onMoodChange((data.mood as any) || 'neutral');

                if (data.isComplete) {
                    setIsChatFinished(true);
                    setTimeout(() => {
                        onComplete();
                    }, 3500);
                }
            }, 800);
        } catch (err: any) {
            setIsTyping(false);
            setErrorMsg(err.message || 'Connection error. Please try again.');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // ─── Animation Variants ──────────────────────────────────────────────────
    const bubbleVariants = {
        hidden: { opacity: 0, y: 15, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { type: 'spring', stiffness: 300, damping: 24 },
        },
    };

    // ─── Render ──────────────────────────────────────────────────────────────
    return (
        <>
            {/* Theater Mode Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xl pointer-events-none"
            />

            <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-50 flex h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2.5rem] backdrop-blur-3xl border border-white/50 bg-white/85 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]"
            >
                {/* Header */}
                <div className="flex items-center space-x-3 border-b border-gold-200/50 bg-white/50 px-6 py-4 backdrop-blur-md z-10">
                    <div className="relative">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gold-50 to-gold-100 text-gold-700 shadow-sm border border-gold-200">
                            <Sparkles className="h-5 w-5 text-gold-600" />
                        </div>
                        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white shadow-sm" />
                    </div>
                    <div>
                        <h3 className="font-serif text-lg font-medium text-sacred-dark tracking-wide">
                            Sacred Guide
                        </h3>
                        <p className="text-xs font-semibold uppercase tracking-wider text-green-600/80">
                            Active
                        </p>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                    <AnimatePresence>
                        {messages.map((msg, index) => {
                            const isLastMsg = index === messages.length - 1;
                            return (
                                <motion.div
                                    key={msg.id}
                                    variants={bubbleVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className={`flex w-full flex-col ${
                                        msg.sender === 'user' ? 'items-end' : 'items-start'
                                    }`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed tracking-wide ${
                                            msg.sender === 'user'
                                                ? 'bg-sacred-dark text-white rounded-tr-sm shadow-md'
                                                : 'bg-white text-sacred-dark rounded-tl-sm border border-gold-100 shadow-[0_4px_12px_rgba(0,0,0,0.03)]'
                                        }`}
                                    >
                                        {msg.sender === 'ai' ? (
                                            <TypewriterBubble text={msg.text} isActive={isLastMsg} />
                                        ) : (
                                            msg.text
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}

                        {isTyping && (
                            <motion.div
                                key="typing-indicator"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="flex justify-start"
                            >
                                <div className="flex items-center space-x-1 rounded-2xl rounded-tl-sm bg-white border border-gold-100 px-5 py-4 shadow-sm">
                                    <div className="h-2 w-2 animate-bounce rounded-full bg-gold-300 [animation-delay:-0.3s]" />
                                    <div className="h-2 w-2 animate-bounce rounded-full bg-gold-400 [animation-delay:-0.15s]" />
                                    <div className="h-2 w-2 animate-bounce rounded-full bg-gold-500" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t border-gold-200/50 bg-white/60 p-4 backdrop-blur-md flex flex-col gap-3 relative z-10">
                    <AnimatePresence>
                        {errorMsg && (
                            <motion.p
                                key="error"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="text-red-500 text-sm px-2 font-medium"
                            >
                                {errorMsg}
                            </motion.p>
                        )}
                    </AnimatePresence>

                    <div className="relative flex items-end">
                        <textarea
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                if (errorMsg) setErrorMsg(null);
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder={
                                isChatFinished ? 'Chat complete.' : 'Type your answer softly...'
                            }
                            disabled={isTyping || isChatFinished}
                            className="w-full resize-none rounded-2xl border border-gold-200 bg-white py-3.5 pl-4 pr-14 text-sacred-dark outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all font-sans disabled:bg-gray-50/80 disabled:text-gray-400 disabled:cursor-not-allowed shadow-inner"
                            rows={1}
                            style={{ minHeight: '52px', maxHeight: '120px' }}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isTyping || isChatFinished}
                            className="absolute bottom-2.5 right-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-gold-600 text-white transition-all duration-300 hover:bg-gold-500 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </>
    );
}
