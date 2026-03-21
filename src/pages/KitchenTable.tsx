import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Users, Search, Bell, Settings, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ChatMessage {
    id: string;
    sender: 'candidate' | 'scout';
    senderName: string;
    text: string;
    createdAt: string;
}

export default function KitchenTable() {
    const { matchId } = useParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [profileName, setProfileName] = useState('Loading...');
    const [profileImage, setProfileImage] = useState('https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80');
    const [myUserId, setMyUserId] = useState<string | null>(null);

    const userStr = localStorage.getItem('user');
    const myName = userStr ? JSON.parse(userStr).email.split('@')[0] : 'Me';
    const myInitial = myName.charAt(0).toUpperCase();

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            const userId = localStorage.getItem('userId');
            setMyUserId(userId);
            if (!userId) return;

            // Ensure table exists
            try {
                await fetch(`http://localhost:3001/api/kitchen-table/${matchId}`, {
                    headers: { 'x-user-id': userId }
                });

                // Fetch messages
                const res = await fetch(`http://localhost:3001/api/kitchen-table/${matchId}/messages`, {
                    headers: { 'x-user-id': userId }
                });
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data.messages.reverse() || []); // newest at bottom
                }
            } catch(e) { console.error('Error fetching table data', e); }

            // Fetch Match Profile Info via Supabase
            if (matchId) {
                const { data: prof } = await supabase.from('Profile').select('firstName').eq('userId', matchId).single();
                if (prof) setProfileName(prof.firstName || 'Candidate');
                
                const { data: photoData } = await supabase.from('Photo').select('url').eq('userId', matchId).eq('isPrimary', true).single();
                if (photoData) setProfileImage(photoData.url);
                else {
                    const { data: backup } = await supabase.from('Photo').select('url').eq('userId', matchId).limit(1);
                    if (backup && backup.length > 0) setProfileImage(backup[0].url);
                }
            }
        };
        fetchInitialData();
    }, [matchId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !myUserId) return;

        const optimMessage = input;
        setInput('');

        try {
            const userStr = localStorage.getItem('user');
            const firstName = userStr ? JSON.parse(userStr).email.split('@')[0] : 'Family Member';
            
            const res = await fetch(`http://localhost:3001/api/kitchen-table/${matchId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-id': myUserId },
                body: JSON.stringify({ text: optimMessage, senderName: firstName })
            });
            if (res.ok) {
                const newMsg = await res.json();
                setMessages(prev => [...prev, newMsg]);
            }
        } catch(e) { console.error('Error sending message', e); }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex h-screen bg-sacred-offwhite text-sacred-dark font-sans overflow-hidden">

            {/* Sidebar (Mock Nav) */}
            <aside className="hidden md:flex flex-col w-20 border-r border-gold-200 bg-white items-center py-8 justify-between z-10">
                <div className="space-y-8 flex flex-col items-center">
                    <div className="h-10 w-10 bg-gold-600 rounded-xl flex items-center justify-center text-white font-serif font-bold text-xl shadow-md">
                        M
                    </div>
                    <nav className="flex flex-col space-y-6">
                        <button onClick={() => navigate('/discovery')} className="relative group p-3 text-gold-400 hover:text-gold-700 hover:bg-gold-50 rounded-xl transition-all duration-300">
                            <Search className="h-6 w-6 transition-transform group-hover:scale-110" />
                        </button>
                        <button className="relative group p-3 text-gold-700 bg-gold-50 rounded-xl shadow-[0_4px_12px_rgba(212,175,55,0.2)] transition-all duration-300">
                            <Users className="h-6 w-6 transition-transform group-hover:scale-110" />
                        </button>
                        <button className="relative group p-3 text-gold-400 hover:text-gold-700 hover:bg-gold-50 rounded-xl transition-all duration-300">
                            <Bell className="h-6 w-6 transition-transform group-hover:scale-110" />
                        </button>
                    </nav>
                </div>
                <button className="group p-3 text-gray-400 hover:text-sacred-dark transition-colors"><Settings className="h-6 w-6 transition-transform group-hover:rotate-45 duration-500" /></button>
            </aside>

            {/* Main Area */}
            <main className="flex-1 flex flex-col md:flex-row relative z-0 bg-gradient-to-br from-[#FAFAF9] via-[#F3F0EA] to-[#FAFAF9]">

                {/* Left Side: Shared Profile Canvas */}
                <div className="hidden lg:flex w-1/3 border-r border-gold-200/50 relative overflow-hidden flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
                    <div className="absolute inset-0">
                        <motion.img
                            animate={{
                                scale: [1.02, 1.05, 1.02],
                                filter: ['blur(4px)', 'blur(3px)', 'blur(4px)']
                            }}
                            transition={{
                                duration: 8,
                                ease: 'easeInOut',
                                repeat: Infinity
                            }}
                            src={profileImage}
                            className="w-full h-full object-cover opacity-70"
                            alt="Profile Background"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-sacred-dark/90 via-sacred-dark/40 to-sacred-dark/10" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full p-10 justify-end text-white">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <p className="text-gold-300 font-medium tracking-wide uppercase text-xs mb-3 flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-500"></span>
                                </span>
                                Live Discussion Topic
                            </p>
                            <h2 className="text-5xl font-serif leading-[1.1] drop-shadow-lg">{profileName}'s<br />Profile</h2>
                            <button
                                onClick={() => navigate('/discovery')}
                                className="mt-8 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md rounded-2xl py-3.5 px-6 w-fit transition-all duration-300 flex items-center gap-3 hover:-translate-x-1 shadow-lg"
                            >
                                <ArrowLeft className="h-4 w-4" /> Return to Discovery
                            </button>
                        </motion.div>
                    </div>
                </div>

                {/* Right Side: Chat Interface */}
                <div className="flex-1 flex flex-col relative bg-transparent">

                    {/* Header */}
                    <header className="h-[88px] border-b border-gold-200/30 flex items-center justify-between px-8 bg-white/40 backdrop-blur-xl z-20 shrink-0 sticky top-0 shadow-sm">
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate('/discovery')} className="md:hidden p-2 -ml-2 text-gray-400 hover:text-gray-700 transition-colors">
                                <ArrowLeft className="h-6 w-6" />
                            </button>
                            <div>
                                <h1 className="font-serif text-2xl text-sacred-dark flex items-center gap-2">
                                    The Kitchen Table
                                </h1>
                                <p className="text-xs text-sacred-dark/60 font-medium flex items-center gap-1.5 mt-1 tracking-wide">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></span>
                                    Private Family Room
                                </p>
                            </div>
                        </div>
                        <div className="flex -space-x-3 items-center">
                            <div className="relative group">
                                <div className="absolute inset-0 rounded-full bg-indigo-400 blur-[4px] opacity-40 group-hover:opacity-70 transition-opacity"></div>
                                <div className="relative h-11 w-11 rounded-full border-[3px] border-white bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-sm z-20">{myInitial}</div>
                            </div>
                            <button className="h-11 w-11 rounded-full border-[3px] border-white bg-white/50 backdrop-blur-sm flex items-center justify-center text-sacred-dark/40 hover:bg-white hover:text-sacred-dark hover:shadow-md transition-all z-0 ml-2">
                                <Users className="h-4 w-4" />
                            </button>
                        </div>
                    </header>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-8 pb-40">
                        <div className="flex justify-center mb-10">
                            <span className="bg-white/60 backdrop-blur-md text-sacred-dark/70 border border-gold-200/50 shadow-sm px-5 py-2 rounded-full text-xs font-medium tracking-wider uppercase flex items-center gap-2">
                                <CheckCircle2 className="h-3.5 w-3.5 text-gold-500" />
                                Started discussing {"" + profileName}'s profile
                            </span>
                        </div>

                        {messages.map((msg, i) => {
                            const isCandidate = msg.sender === 'candidate';
                            const showName = i === 0 || messages[i - 1].sender !== msg.sender;

                            return (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                    className={`flex flex-col w-full ${isCandidate ? 'items-end' : 'items-start'}`}
                                >
                                    {showName && (
                                        <div className={`flex items-center gap-2 mb-2 ${isCandidate ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${isCandidate ? 'bg-sacred-dark' : 'bg-gold-600'}`}>
                                                {msg.senderName.charAt(0)}
                                            </div>
                                            <span className="text-[11px] font-bold tracking-wide uppercase text-sacred-dark/40">
                                                {msg.senderName}
                                            </span>
                                        </div>
                                    )}
                                    <div className={`relative max-w-[70%] px-6 py-4 text-[15px] leading-relaxed shadow-md ${isCandidate
                                        ? 'bg-sacred-dark text-white rounded-2xl rounded-tr-sm shadow-sacred-dark/10'
                                        : 'bg-white border border-gold-100/50 text-sacred-dark rounded-2xl rounded-tl-sm shadow-gold-900/5'
                                        }`}>
                                        {/* Stylized Chat Tail */}
                                        <div className={`absolute top-0 w-3 h-3 ${isCandidate ? '-right-1.5 bg-sacred-dark clip-tail-right' : '-left-1.5 bg-white border-l border-t border-gold-100/50 clip-tail-left'}`}></div>
                                        <p className="relative z-10">{msg.text}</p>
                                    </div>
                                    <span className="text-[10px] font-medium text-sacred-dark/30 mt-1.5 px-2">
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </motion.div>
                            )
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Floating Input Area */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#F3F0EA] via-[#F3F0EA]/80 to-transparent pt-20 pb-8 px-8 pointer-events-none">
                        <div className="relative max-w-3xl mx-auto flex items-end bg-white/70 backdrop-blur-xl rounded-[28px] border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-1.5 pointer-events-auto ring-1 ring-black/5 transition-all focus-within:bg-white/90 focus-within:shadow-[0_8px_40px_rgba(212,175,55,0.15)] focus-within:ring-gold-300/50">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Message your family..."
                                className="w-full resize-none bg-transparent py-4 pl-6 pr-14 text-sacred-dark outline-none font-sans overflow-hidden placeholder:text-sacred-dark/30 focus:ring-0 transition-all duration-300 text-[15px]"
                                rows={Math.min(4, input.split('\n').length || 1)}
                                style={{ minHeight: '56px', maxHeight: '140px' }}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim()}
                                className="absolute bottom-2.5 right-2.5 flex h-10 w-10 items-center justify-center rounded-[18px] bg-gold-600 text-white transition-all duration-300 hover:scale-[1.05] hover:bg-gold-500 hover:shadow-lg hover:shadow-gold-600/30 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none disabled:bg-sacred-dark/10 disabled:text-sacred-dark/30"
                            >
                                <Send className="h-4 w-4 ml-0.5" />
                            </button>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
