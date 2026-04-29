import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// --- Typewriter Hook ---
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

// --- Types ---
interface SuggestedLink {
    label: string;
    url: string;
}

interface Message {
    id: string;
    sender: 'ai' | 'user';
    text: string;
    suggestedLinks?: SuggestedLink[];
}

export default function FloatingAIAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            // Send initial empty message to trigger the greeting
            fetchAIResponse('');
        }
    }, [isOpen]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, errorMsg]);

    const fetchAIResponse = async (userText: string) => {
        setIsTyping(true);
        setErrorMsg(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setIsTyping(false);
                setMessages([{
                    id: 'fallback',
                    sender: 'ai',
                    text: "Please sign in to chat with the Sacred Guide."
                }]);
                return;
            }

            const res = await fetch(`${API}/ai/assistant/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ message: userText }),
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
                    suggestedLinks: data.suggestedLinks
                };
                setMessages((prev) => [...prev, aiMessage]);
            }, 600);
        } catch (err: any) {
            setIsTyping(false);
            setErrorMsg('Connection error. Please try again.');
        }
    };

    const handleSend = async () => {
        const userText = input.trim();
        if (!userText || isTyping) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            sender: 'user',
            text: userText,
        };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');

        await fetchAIResponse(userText);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const bubbleVariants = {
        hidden: { opacity: 0, y: 15, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { type: 'spring', stiffness: 300, damping: 24 },
        },
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } }}
                        className="mb-4 w-[360px] h-[500px] bg-white rounded-3xl shadow-2xl border border-gold-100 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gold-200/50 bg-gradient-to-r from-sacred-dark to-stone-900 px-5 py-4 text-white">
                            <div className="flex items-center space-x-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-600/20 border border-gold-500/30">
                                    <Sparkles className="h-5 w-5 text-gold-400" />
                                </div>
                                <div>
                                    <h3 className="font-serif text-lg font-medium text-gold-50 tracking-wide leading-tight">
                                        Sacred Guide
                                    </h3>
                                    <p className="text-xs font-medium text-gold-400/80">
                                        AI Assistant
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5 bg-sacred-offwhite">
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
                                                className={`max-w-[85%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed tracking-wide ${
                                                    msg.sender === 'user'
                                                        ? 'bg-sacred-dark text-white rounded-tr-sm shadow-md'
                                                        : 'bg-white text-sacred-dark rounded-tl-sm border border-gold-100 shadow-sm'
                                                }`}
                                            >
                                                {msg.sender === 'ai' ? (
                                                    <TypewriterBubble text={msg.text} isActive={isLastMsg} />
                                                ) : (
                                                    msg.text
                                                )}
                                                
                                                {/* Suggested Links */}
                                                {msg.sender === 'ai' && msg.suggestedLinks && msg.suggestedLinks.length > 0 && (
                                                    <div className="mt-3 flex flex-col gap-2">
                                                        {msg.suggestedLinks.map((link, idx) => (
                                                            <button
                                                                key={idx}
                                                                onClick={() => {
                                                                    setIsOpen(false);
                                                                    navigate(link.url);
                                                                }}
                                                                className="text-left text-xs font-medium px-3 py-2 bg-gold-50 text-gold-800 rounded-lg border border-gold-200 hover:bg-gold-100 transition-colors"
                                                            >
                                                                {link.label} →
                                                            </button>
                                                        ))}
                                                    </div>
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
                                        <div className="flex items-center space-x-1 rounded-2xl rounded-tl-sm bg-white border border-gold-100 px-4 py-3 shadow-sm">
                                            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold-300 [animation-delay:-0.3s]" />
                                            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold-400 [animation-delay:-0.15s]" />
                                            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold-500" />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="border-t border-gold-100 bg-white p-4">
                            {errorMsg && (
                                <p className="text-red-500 text-xs px-2 mb-2 font-medium">
                                    {errorMsg}
                                </p>
                            )}
                            <div className="relative flex items-end">
                                <textarea
                                    value={input}
                                    onChange={(e) => {
                                        setInput(e.target.value);
                                        if (errorMsg) setErrorMsg(null);
                                    }}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask for guidance or matches..."
                                    disabled={isTyping}
                                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 py-3 pl-4 pr-12 text-sm text-sacred-dark outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400 focus:bg-white transition-all disabled:opacity-70"
                                    rows={1}
                                    style={{ minHeight: '44px', maxHeight: '100px' }}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isTyping}
                                    className="absolute bottom-1.5 right-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-gold-600 text-white transition-all duration-300 hover:bg-gold-500 disabled:opacity-50 disabled:bg-gray-400"
                                >
                                    <Send className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Action Button */}
            {!isOpen && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen(true)}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-gold-500 to-gold-700 text-white shadow-lg shadow-gold-500/30 border border-gold-400/50 relative overflow-hidden group"
                >
                    <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <Sparkles className="h-6 w-6 relative z-10" />
                    {/* Ping Animation for attention */}
                    <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-red-500 border-2 border-white shadow-sm" />
                </motion.button>
            )}
        </div>
    );
}
