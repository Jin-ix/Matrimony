import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, X, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL as API } from '../../utils/api';

// ─── Typewriter Hook ──────────────────────────────────────────────────────────
function useTypewriter(text: string, speed = 18, enabled = true) {
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
    const { displayed, done } = useTypewriter(text, 18, isActive);
    return (
        <span>
            {displayed}
            {!done && (
                <span className="inline-block w-0.5 h-[1em] bg-gold-400 ml-0.5 animate-pulse align-text-bottom rounded-full" />
            )}
        </span>
    );
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface SuggestedLink { label: string; url: string; }

interface Message {
    id: string;
    sender: 'ai' | 'user';
    text: string;
    suggestedLinks?: SuggestedLink[];
    quickReplies?: string[];
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function FloatingAIAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isMinimized, setIsMinimized] = useState(false);
    const [hasNotification, setHasNotification] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const navigate = useNavigate();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            fetchAIResponse('');
        }
        if (isOpen) {
            setHasNotification(false);
            setTimeout(() => inputRef.current?.focus(), 400);
        }
    }, [isOpen]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // ── Auth helpers ──────────────────────────────────────────────────────────
    const getAuthHeaders = (): Record<string, string> | null => {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId') ||
            (() => { try { return JSON.parse(localStorage.getItem('user') || '{}').id || ''; } catch { return ''; } })();
        const role = localStorage.getItem('userRole') || 'candidate';

        if (!token && !userId) {
            return null;
        }

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (userId) {
            headers['x-user-id'] = userId;
            headers['x-user-role'] = role;
        }
        return headers;
    };

    const fetchAIResponse = async (userText: string) => {
        setIsTyping(true);
        setErrorMsg(null);

        const headers = getAuthHeaders();
        if (!headers) {
            setIsTyping(false);
            setMessages([{
                id: 'fallback',
                sender: 'ai',
                text: "Please sign in to chat with the Sacred Guide.",
                suggestedLinks: [{ label: '🔐 Sign In', url: '/auth' }],
            }]);
            return;
        }

        try {
            const res = await fetch(`${API}/ai/assistant/chat`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ message: userText }),
            });

            if (!res.ok) throw new Error(`${res.status}`);

            const data = await res.json();

            setTimeout(() => {
                setIsTyping(false);
                setMessages((prev) => [...prev, {
                    id: Date.now().toString() + '_ai',
                    sender: 'ai',
                    text: data.response,
                    suggestedLinks: data.suggestedLinks,
                    quickReplies: data.quickReplies,
                }]);
            }, 500);
        } catch {
            setIsTyping(false);
            setErrorMsg('Could not reach the Sacred Guide. Please try again.');
        }
    };

    const handleSend = async (text?: string) => {
        const userText = (text ?? input).trim();
        if (!userText || isTyping) return;

        setMessages((prev) => [...prev, {
            id: Date.now().toString(),
            sender: 'user',
            text: userText,
        }]);
        setInput('');
        await fetchAIResponse(userText);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // ── Animations ────────────────────────────────────────────────────────────
    const bubbleVariants = {
        hidden: { opacity: 0, y: 12, scale: 0.96 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 350, damping: 28 } },
    };

    const panelVariants = {
        hidden: { opacity: 0, y: 24, scale: 0.94 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 28 } },
        exit: { opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.18 } },
    };

    return (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:bottom-6 sm:right-6 z-[90] flex flex-col items-end gap-3 pointer-events-none">
            <AnimatePresence mode="wait">
                {isOpen && (
                    <motion.div
                        key="panel"
                        variants={panelVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="w-full sm:w-[370px] pointer-events-auto flex flex-col overflow-hidden rounded-[1.75rem] shadow-[0_24px_80px_-12px_rgba(0,0,0,0.22)] border border-white/60"
                        style={{ height: isMinimized ? 'auto' : '520px', maxHeight: 'calc(100dvh - 120px)' }}
                    >
                        {/* ── Header ── */}
                        <div className="flex items-center justify-between bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 px-5 py-4 shrink-0">
                            <div className="flex items-center gap-3">
                                {/* Avatar */}
                                <div className="relative shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-500/30 to-gold-700/20 border border-gold-500/40 flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-gold-300" />
                                    </div>
                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-stone-950 shadow" />
                                </div>
                                <div>
                                    <h3 className="font-serif text-[17px] text-gold-50 tracking-wide leading-tight">Sacred Guide</h3>
                                    <p className="text-[11px] text-gold-400/70 font-medium tracking-wider uppercase">AI Assistant · Online</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setIsMinimized(m => !m)}
                                    className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                                    aria-label="Minimise"
                                >
                                    <ChevronDown className={`w-4 h-4 transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                                    aria-label="Close"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {!isMinimized && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.22 }}
                                    className="flex flex-col flex-1 overflow-hidden bg-[#fafaf8]"
                                >
                                    {/* ── Messages ── */}
                                    <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 scroll-smooth">
                                        <AnimatePresence initial={false}>
                                            {messages.map((msg, index) => {
                                                const isLast = index === messages.length - 1;
                                                return (
                                                    <motion.div
                                                        key={msg.id}
                                                        variants={bubbleVariants}
                                                        initial="hidden"
                                                        animate="visible"
                                                        className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                                                    >
                                                        {/* Bubble */}
                                                        <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed ${
                                                            msg.sender === 'user'
                                                                ? 'bg-stone-900 text-white rounded-tr-sm shadow-md'
                                                                : 'bg-white text-stone-800 rounded-tl-sm border border-stone-200/70 shadow-sm'
                                                        }`}>
                                                            {msg.sender === 'ai'
                                                                ? <TypewriterBubble text={msg.text} isActive={isLast && !isTyping} />
                                                                : msg.text
                                                            }
                                                        </div>

                                                        {/* Suggested Links */}
                                                        {msg.sender === 'ai' && msg.suggestedLinks && msg.suggestedLinks.length > 0 && (
                                                            <div className="mt-2 flex flex-col gap-1.5 max-w-[88%] w-full">
                                                                {msg.suggestedLinks.map((link, idx) => (
                                                                    <motion.button
                                                                        key={idx}
                                                                        initial={{ opacity: 0, x: -8 }}
                                                                        animate={{ opacity: 1, x: 0 }}
                                                                        transition={{ delay: 0.3 + idx * 0.08 }}
                                                                        onClick={() => { setIsOpen(false); navigate(link.url); }}
                                                                        className="text-left text-[12px] font-medium px-3 py-2 bg-gold-50 text-gold-800 rounded-xl border border-gold-200/60 hover:bg-gold-100 hover:border-gold-300 transition-all"
                                                                    >
                                                                        {link.label}
                                                                    </motion.button>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Quick Replies */}
                                                        {msg.sender === 'ai' && isLast && msg.quickReplies && msg.quickReplies.length > 0 && !isTyping && (
                                                            <div className="mt-2.5 flex flex-wrap gap-1.5 max-w-[95%]">
                                                                {msg.quickReplies.map((qr, idx) => (
                                                                    <motion.button
                                                                        key={idx}
                                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                                        animate={{ opacity: 1, scale: 1 }}
                                                                        transition={{ delay: 0.5 + idx * 0.07 }}
                                                                        onClick={() => handleSend(qr)}
                                                                        className="text-[11.5px] font-medium px-3 py-1.5 rounded-full bg-white border border-stone-200 text-stone-600 hover:bg-stone-100 hover:text-stone-800 hover:border-stone-300 transition-all shadow-sm"
                                                                    >
                                                                        {qr}
                                                                    </motion.button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                );
                                            })}

                                            {/* Typing indicator */}
                                            {isTyping && (
                                                <motion.div
                                                    key="typing"
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    className="flex justify-start"
                                                >
                                                    <div className="flex items-center gap-1 bg-white border border-stone-200/70 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                                                        {['-0.32s', '-0.16s', '0s'].map((delay, i) => (
                                                            <div
                                                                key={i}
                                                                className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-bounce"
                                                                style={{ animationDelay: delay }}
                                                            />
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* ── Input Area ── */}
                                    <div className="border-t border-stone-100 bg-white px-4 py-3 shrink-0">
                                        {errorMsg && (
                                            <motion.p
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="text-red-500 text-[11px] mb-2 px-1 font-medium"
                                            >
                                                {errorMsg}
                                            </motion.p>
                                        )}
                                        <div className="flex items-end gap-2">
                                            <textarea
                                                ref={inputRef}
                                                value={input}
                                                onChange={(e) => { setInput(e.target.value); if (errorMsg) setErrorMsg(null); }}
                                                onKeyDown={handleKeyDown}
                                                placeholder="Ask me anything…"
                                                disabled={isTyping}
                                                rows={1}
                                                className="flex-1 resize-none rounded-2xl border border-stone-200 bg-stone-50 py-2.5 px-4 text-[13px] text-stone-800 outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400/50 focus:bg-white transition-all disabled:opacity-60 placeholder:text-stone-400"
                                                style={{ minHeight: '42px', maxHeight: '100px' }}
                                            />
                                            <button
                                                onClick={() => handleSend()}
                                                disabled={!input.trim() || isTyping}
                                                className="w-9 h-9 rounded-xl bg-gold-600 text-white flex items-center justify-center shrink-0 transition-all hover:bg-gold-500 hover:shadow-md active:scale-95 disabled:opacity-40 disabled:bg-stone-400"
                                            >
                                                <Send className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Floating Action Button ── */}
            <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => setIsOpen(o => !o)}
                className="relative w-14 h-14 pointer-events-auto rounded-full bg-gradient-to-br from-gold-500 to-gold-700 text-white shadow-lg shadow-gold-600/30 border border-gold-400/40 flex items-center justify-center overflow-hidden group"
                aria-label="Open Sacred Guide"
            >
                {/* Shimmer on hover */}
                <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-full" />

                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                            <X className="w-5 h-5 relative z-10" />
                        </motion.div>
                    ) : (
                        <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                            <Sparkles className="w-6 h-6 relative z-10" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Notification dot */}
                <AnimatePresence>
                    {hasNotification && !isOpen && (
                        <motion.span
                            key="notif"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-sm z-20"
                        />
                    )}
                </AnimatePresence>

                {/* Pulse ring */}
                {hasNotification && !isOpen && (
                    <span className="absolute inset-0 rounded-full animate-ping bg-gold-400/30 z-0" />
                )}
            </motion.button>
        </div>
    );
}
