import { useState, useEffect, useCallback } from 'react';
import { Sparkles, RefreshCw, ChevronDown, ChevronUp, MessageSquarePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AIIcebreakerBannerProps {
    matchName: string;
    matchUserId: string;
    onSelectIcebreaker: (text: string) => void;
    initialCollapsed?: boolean;
}

import { API_URL as API } from '../../utils/api';

// ── Instant client-side fallback generator ────────────────────────────────────
function generateLocalIcebreakers(matchName: string): string[] {
    const first = matchName.split(' ')[0] || matchName;
    return [
        `Hi ${first}! I'd love to know — what does your Sunday morning usually look like? 🙏`,
        `Hello ${first}! Which feast day in the Catholic calendar means the most to you, and why?`,
        `Hi ${first}! If you could describe your family in three words, what would they be?`,
        `Hello! What's one tradition from your upbringing that you'd love to carry forward in your own home someday?`,
        `Hi ${first}! Outside of faith, what's something you're truly passionate about that most people might not expect?`,
    ];
}

// ── Shimmer skeleton ──────────────────────────────────────────────────────────
function IcebreakerSkeleton() {
    return (
        <div className="space-y-2.5 w-full mt-4">
            {[100, 85, 95].map((w, i) => (
                <div key={i} className="h-[44px] rounded-2xl bg-gradient-to-r from-gold-100 via-amber-50 to-gold-100 animate-pulse" style={{ width: `${w}%` }} />
            ))}
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AIIcebreakerBanner({ matchName, matchUserId, onSelectIcebreaker, initialCollapsed = false }: AIIcebreakerBannerProps) {
    const [icebreakers, setIcebreakers] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
    const [isAIGenerated, setIsAIGenerated] = useState(false);

    const fetchFromServer = useCallback(async (): Promise<string[] | null> => {
        try {
            const userId = localStorage.getItem('userId');
            const userRole = localStorage.getItem('userRole') || 'candidate';
            if (!userId) return null;

            const res = await fetch(`${API}/ai/icebreaker`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userId,
                    'x-user-role': userRole,
                },
                body: JSON.stringify({ matchUserId }),
                signal: AbortSignal.timeout(8000),
            });

            if (!res.ok) return null;
            const data = await res.json();
            if (data.icebreakers && Array.isArray(data.icebreakers) && data.icebreakers.length >= 3) {
                return data.icebreakers.slice(0, 5);
            }
            return null;
        } catch {
            return null;
        }
    }, [matchUserId]);

    const load = useCallback(async (preferAI: boolean = true) => {
        setIsLoading(true);

        // Always show local suggestions immediately
        const localSuggestions = generateLocalIcebreakers(matchName);
        setIcebreakers(localSuggestions);
        setIsAIGenerated(false);

        if (preferAI) {
            // Try server in background — upgrade if server responds
            const serverIcebreakers = await fetchFromServer();
            if (serverIcebreakers && serverIcebreakers.length > 0) {
                setIcebreakers(serverIcebreakers);
                setIsAIGenerated(true);
            }
        }

        setIsLoading(false);
    }, [matchName, fetchFromServer]);

    // Auto-load on mount
    useEffect(() => {
        load(true);
    }, [load]);

    const handleRegenerate = () => {
        load(true);
    };

    const handleSelect = (text: string) => {
        onSelectIcebreaker(text);
        setIsCollapsed(true);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mt-6 mb-2 rounded-[1.75rem] overflow-hidden shadow-sm border border-gold-200/50"
            style={{ background: 'linear-gradient(135deg, #fefdf8 0%, #fffdf4 50%, #fefcf0 100%)' }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-amber-500 shadow-md">
                        <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <h3 className="font-serif text-[15px] font-medium text-sacred-dark leading-tight">
                            Sacred Icebreakers
                        </h3>
                        <p className="text-[11px] text-gray-400 font-sans mt-0.5 leading-none">
                            {isAIGenerated ? '✦ Crafted by Sacred Guide AI' : '✦ Conversation starters for you'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <motion.button
                        onClick={handleRegenerate}
                        disabled={isLoading}
                        whileTap={{ scale: 0.9 }}
                        title="Get new suggestions"
                        className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gold-100 text-gold-600 transition-colors disabled:opacity-40"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    </motion.button>
                    <motion.button
                        onClick={() => setIsCollapsed(c => !c)}
                        whileTap={{ scale: 0.9 }}
                        className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gold-100 text-gold-500 transition-colors"
                    >
                        {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    </motion.button>
                </div>
            </div>

            {/* Body */}
            <AnimatePresence initial={false}>
                {!isCollapsed && (
                    <motion.div
                        key="body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5">
                            <p className="text-[12px] text-gray-500 font-sans italic mb-4 leading-relaxed border-t border-gold-100 pt-3">
                                Tap a prompt to fill it in your message box — then personalise it before sending.
                            </p>

                            {isLoading && icebreakers.length === 0 ? (
                                <IcebreakerSkeleton />
                            ) : (
                                <div className="space-y-2.5">
                                    {icebreakers.map((prompt, idx) => (
                                        <motion.button
                                            key={idx}
                                            onClick={() => handleSelect(prompt)}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.06 }}
                                            className="group text-left w-full px-4 py-3 bg-white/70 hover:bg-gold-50 border border-gold-200/40 hover:border-gold-300 rounded-2xl text-[13px] text-sacred-dark leading-relaxed font-sans font-medium transition-all hover:shadow-sm active:scale-[0.99] flex items-start gap-3"
                                        >
                                            <MessageSquarePlus className="h-4 w-4 text-gold-400 group-hover:text-gold-600 shrink-0 mt-0.5 transition-colors" />
                                            <span>{prompt}</span>
                                        </motion.button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Collapsed summary */}
            {isCollapsed && (
                <div className="px-5 pb-4">
                    <p className="text-[11px] text-gold-600 font-sans">
                        {icebreakers.length} conversation starters ready — tap ↑ to expand
                    </p>
                </div>
            )}
        </motion.div>
    );
}
