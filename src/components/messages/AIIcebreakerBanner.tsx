import { useState } from 'react';
import { Sparkles, Loader2, MessageSquareCode } from 'lucide-react';

interface AIIcebreakerBannerProps {
    matchName: string;
    matchUserId: string;
    onSelectIcebreaker: (text: string) => void;
}

export default function AIIcebreakerBanner({ matchName, matchUserId, onSelectIcebreaker }: AIIcebreakerBannerProps) {
    const [icebreakers, setIcebreakers] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

    const handleFetchIcebreakers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const userId = localStorage.getItem('userId');
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            if (userId) headers['x-user-id'] = userId;

            const res = await fetch(`${API}/ai/icebreaker`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ matchUserId }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.icebreakers && Array.isArray(data.icebreakers)) {
                    setIcebreakers(data.icebreakers);
                    setHasLoaded(true);
                } else {
                    throw new Error('Invalid format');
                }
            } else {
                throw new Error('Failed to generate icebreakers');
            }
        } catch (err: any) {
            console.error('Error fetching icebreakers:', err);
            setError('Could not generate custom icebreakers at this moment.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mx-4 mt-6 rounded-[2rem] bg-gradient-to-br from-gold-50 via-white to-gold-50 p-[2px] shadow-sm border border-gold-200/40">
            <div className="flex flex-col items-center justify-center rounded-[2rem] bg-white/80 px-6 py-6 text-center backdrop-blur-md">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gold-100 text-gold-600 shadow-sm border border-gold-200">
                    <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="mb-1 font-serif text-lg font-medium text-sacred-dark">
                    A Shared Foundation
                </h3>
                <p className="max-w-md text-xs leading-relaxed text-gray-600 font-sans italic mb-4">
                    Both you and {matchName} value family tradition, shared values, and growing together in faith. Start the conversation with a meaningful question.
                </p>

                {!hasLoaded && !isLoading && (
                    <button
                        onClick={handleFetchIcebreakers}
                        className="px-5 py-2.5 rounded-full bg-gradient-to-r from-gold-600 to-amber-500 text-white font-medium text-xs shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center space-x-2 border border-gold-400/20"
                    >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Ask Sacred Guide for Icebreakers</span>
                    </button>
                )}

                {isLoading && (
                    <div className="flex items-center space-x-2 text-gold-600 py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-xs font-medium">Sacred Guide is crafting customized icebreakers...</span>
                    </div>
                )}

                {error && (
                    <p className="text-xs text-red-500 font-medium py-1">{error}</p>
                )}

                {hasLoaded && icebreakers.length > 0 && (
                    <div className="w-full mt-2">
                        <p className="text-[11px] font-semibold text-gold-700 uppercase tracking-widest mb-3">Choose a prompt to write in composer</p>
                        <div className="grid grid-cols-1 gap-2.5 max-w-lg mx-auto">
                            {icebreakers.map((prompt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => onSelectIcebreaker(prompt)}
                                    className="text-left w-full px-4 py-3 bg-white/70 hover:bg-gold-50/50 border border-gold-200/50 rounded-2xl text-xs text-sacred-dark leading-relaxed font-sans font-medium hover:border-gold-300 transition-all hover:shadow-sm flex items-start space-x-2.5"
                                >
                                    <MessageSquareCode className="h-4 w-4 text-gold-500 shrink-0 mt-0.5" />
                                    <span>{prompt}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
