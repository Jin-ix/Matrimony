import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, UserCircle2, CheckCircle2, Linkedin } from 'lucide-react';

type QuestionType = 'text' | 'choice' | 'multi-choice' | 'email';

export interface ProfileData {
    [key: string]: string | string[];
}

interface Question {
    id: string; // Map to profile fields
    text: (role: 'candidate' | 'scout') => string;
    type: QuestionType;
    options?: string[]; // For choice types
    validation?: (val: string | string[]) => string | null;
}

const isValidText = (val: string) => val.trim().length >= 3;

const QUESTIONS: Question[] = [
    {
        id: 'name',
        type: 'text',
        text: (r) => r === 'candidate' ? `Welcome! It is truly a joy to have you here. Let's start with your beautiful name. What should I call you?` : `Welcome! It is truly a joy to assist your family. Let's start with your loved one's full name.`,
        validation: (val) => typeof val === 'string' && isValidText(val) ? null : 'Please enter a valid name (at least 3 characters).'
    },
    {
        id: 'gender',
        type: 'choice',
        text: (r) => r === 'candidate' ? `Thank you so much. To help find your perfect match, could you kindly confirm your gender?` : `Thank you. To help us find the perfect match, could you confirm their gender?`,
        options: ['Man', 'Woman']
    },
    {
        id: 'age',
        type: 'text',
        text: (r) => r === 'candidate' ? `What a wonderful season of life. Could you share your age?` : `What a wonderful season of life they are in. Could you share their age?`,
        validation: (val) => !isNaN(Number(val)) && Number(val) >= 18 && Number(val) <= 100 ? null : 'Please enter a valid age (18 or older).'
    },
    {
        id: 'height',
        type: 'text',
        text: (r) => r === 'candidate' ? `Got it! And what is your height? (For example: 5'10" or 178cm)` : `Got it! And what is their height? (For example: 5'10" or 178cm)`,
        validation: (val) => typeof val === 'string' && val.trim().length >= 2 ? null : 'Please provide a valid height.'
    },
    {
        id: 'maritalStatus',
        type: 'choice',
        text: (r) => r === 'candidate' ? `Thank you. Could you let me know your current marital status?` : `Thank you. Could you let me know their current marital status?`,
        options: ['Never Married', 'Annulled', 'Widowed']
    },
    {
        id: 'rite',
        type: 'choice',
        text: (r) => r === 'candidate' ? `Finding someone who shares your spiritual roots is so important. What Church Rite do you belong to?` : `Finding a family with shared spiritual roots is so important. What Church Rite does your family belong to?`,
        options: ['Syro-Malabar', 'Latin', 'Knanaya', 'Malankara', 'Other']
    },
    {
        id: 'parish',
        type: 'text',
        text: (r) => r === 'candidate' ? `Your spiritual home is special. Which Parish and Diocese are you part of?` : `Your spiritual home is special. Which Parish and Diocese are they part of?`,
        validation: (val) => typeof val === 'string' && isValidText(val) ? null : 'Please enter a valid parish name.'
    },
    {
        id: 'sacramentsReceived',
        type: 'multi-choice',
        text: (r) => r === 'candidate' ? `The sacraments shape our faith. Which ones have you received? (Select all that apply)` : `The sacraments shape our faith. Which ones have they received? (Select all that apply)`,
        options: ['Baptism', 'Holy Communion', 'Confirmation']
    },
    {
        id: 'spiritualValues',
        type: 'choice',
        text: (r) => r === 'candidate' ? `How would you best describe your faith practice and personal values?` : `How would you best describe their faith practice and personal values?`,
        options: ['Deeply Religious', 'Traditional', 'Moderate', 'Liberal']
    },
    {
        id: 'education',
        type: 'text',
        text: (r) => r === 'candidate' ? `Education is a beautiful journey. What is your highest level of education?` : `Education is a beautiful journey. What is their highest level of education?`,
        validation: (val) => typeof val === 'string' && isValidText(val) ? null : 'Please provide a valid education detail.'
    },
    {
        id: 'occupation',
        type: 'text',
        text: (r) => r === 'candidate' ? `A solid foundation is important. What is your current occupation and which city do you work in?` : `A solid foundation is important. What is their current occupation and which city do they work in?`,
        validation: (val) => typeof val === 'string' && isValidText(val) ? null : 'Please provide genuine occupation and location details.'
    },
    {
        id: 'familyValues',
        type: 'text',
        text: (r) => r === 'candidate' ? `Family shapes who we are. Could you share a bit about your family background and core values?` : `Family shapes who we are. Could you share a bit about your family background and core values?`,
        validation: (val) => typeof val === 'string' && isValidText(val) ? null : 'Please provide a slightly more detailed family background.'
    },
    {
        id: 'dietaryPreference',
        type: 'choice',
        text: (r) => r === 'candidate' ? `Almost done! Do you have any specific dietary preferences?` : `Almost done! Do they have any specific dietary preferences?`,
        options: ['Vegetarian', 'Non-Vegetarian', 'Eggetarian']
    },
    {
        id: 'hobbies',
        type: 'multi-choice',
        text: (r) => r === 'candidate' ? `It's wonderful to share our passions. What are some of your favorite hobbies? (Select all that apply)` : `It's wonderful to share our passions. What are some of their favorite hobbies? (Select all that apply)`,
        options: ['Reading', 'Cooking', 'Music', 'Photography', 'Travel', 'Sports', 'Volunteering', 'Gardening', 'Art', 'Writing']
    },
    {
        id: 'email',
        type: 'email',
        text: (r) => r === 'candidate' ? `Lastly, please provide your email address so we can secure your wonderful profile.` : `Lastly, please provide your email address so we can secure their wonderful profile and keep in touch with your family.`,
        validation: (val) => typeof val === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? null : 'Please double check and enter a valid email address.'
    }
];

interface Message {
    id: string;
    sender: 'ai' | 'user';
    text: string;
    questionIndex?: number; // Connects AI msg to a generic question
}

export default function ConversationalAgent({ role, onComplete, onMoodChange }: { role: 'candidate' | 'scout', onComplete: (answers: ProfileData) => void, onMoodChange: (mood: 'neutral' | 'warm' | 'cool') => void }) {
    
    // start with greeting and Q0 synchronously
    const [messages, setMessages] = useState<Message[]>([
        { id: 'start', sender: 'ai', text: role === 'candidate' ? 'Welcome. I am here to guide you in finding a meaningful, sacred connection in Holy Matrimony. Shall we begin?' : 'Welcome to our community. I am here to help you find a sacred match for your loved one.' },
        { id: 'q0', sender: 'ai', text: QUESTIONS[0].text(role), questionIndex: 0 }
    ]);
    const [input, setInput] = useState('');
    const [multiChoiceSelection, setMultiChoiceSelection] = useState<string[]>([]);
    const [scriptIndex, setScriptIndex] = useState(0); 
    const [isTyping, setIsTyping] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [profileData, setProfileData] = useState<ProfileData>({});
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, errorMsg, multiChoiceSelection]);

    const handleSend = (valueOverride?: string | string[]) => {
        const valToProcess = valueOverride !== undefined ? valueOverride : input;
        
        if (Array.isArray(valToProcess) && valToProcess.length === 0) return;
        if (typeof valToProcess === 'string' && !valToProcess.trim()) return;

        const currentQ = QUESTIONS[scriptIndex];
        
        if (currentQ.validation) {
            const err = currentQ.validation(valToProcess);
            if (err) {
                setErrorMsg(err);
                return;
            }
        }

        setErrorMsg(null);
        
        // Save answer
        setProfileData(prev => ({ ...prev, [currentQ.id]: valToProcess }));

        let displayValue = '';
        if (Array.isArray(valToProcess)) {
            displayValue = valToProcess.join(', ');
        } else {
            displayValue = valToProcess;
        }

        const userMessage: Message = { id: Date.now().toString(), sender: 'user', text: displayValue };
        setMessages(prev => [...prev, userMessage]);
        
        setInput('');
        setMultiChoiceSelection([]);
        setIsTyping(true);

        if (scriptIndex === 4) onMoodChange('warm');
        else if (scriptIndex === 10) onMoodChange('neutral');

        setTimeout(() => {
            setIsTyping(false);
            const nextIndex = scriptIndex + 1;
            
            if (nextIndex < QUESTIONS.length) {
                const aiMessage: Message = { 
                    id: Date.now().toString() + 'ai', 
                    sender: 'ai', 
                    text: QUESTIONS[nextIndex].text(role),
                    questionIndex: nextIndex
                };
                setMessages(prev => [...prev, aiMessage]);
                setScriptIndex(nextIndex);
            } else {
                const completeMsg: Message = { id: 'done', sender: 'ai', text: `Thank you for sharing your heart so openly. God bless you as we create your beautiful profile...` };
                setMessages(prev => [...prev, completeMsg]);
                
                setTimeout(() => {
                    onComplete({ ...profileData, [currentQ.id]: valToProcess });
                }, 2500);
            }
        }, 1200); 
    };

    const handleLinkedInImport = () => {
        setIsTyping(true);
        const importMsg: Message = {
            id: Date.now().toString(),
            sender: 'user',
            text: 'Imported details from LinkedIn.'
        };
        setMessages(prev => [...prev, importMsg]);
        
        // Mock data to auto-fill
        const mockLinkedInData: ProfileData = {
            name: 'LinkedIn User',
            gender: 'Woman', // Defaulting for demo
            age: '28',
            height: '5\'6"',
            maritalStatus: 'Never Married',
            rite: 'Syro-Malabar',
            parish: 'St. Mary\'s',
            sacramentsReceived: ['Baptism', 'Holy Communion', 'Confirmation'],
            spiritualValues: 'Moderate',
            education: 'Master\'s in Computer Science',
            occupation: 'Software Engineer in San Francisco',
            familyValues: 'Value close-knit family bonds and traditions.',
            dietaryPreference: 'Vegetarian',
            hobbies: ['Reading', 'Travel', 'Music'],
            email: 'user@example.com'
        };

        setTimeout(() => {
            setIsTyping(false);
            const successMsg: Message = {
                id: Date.now().toString() + 'ai',
                sender: 'ai',
                text: 'Beautiful! I have successfully imported your professional details from LinkedIn. Our sacred profile is almost ready.'
            };
            setMessages(prev => [...prev, successMsg]);

            setTimeout(() => {
                onComplete({ ...profileData, ...mockLinkedInData });
            }, 3000);
        }, 2000);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const toggleMultiChoice = (opt: string) => {
        setMultiChoiceSelection(prev => 
            prev.includes(opt) ? prev.filter(p => p !== opt) : [...prev, opt]
        );
    };

    const currentQuestion = scriptIndex >= 0 && scriptIndex < QUESTIONS.length ? QUESTIONS[scriptIndex] : null;

    // Framer motion variants for animations
    const bubbleVariants = {
        hidden: { opacity: 0, y: 15, scale: 0.95 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
    };
    
    const optionsContainerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
    };

    const optionItemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
    };

    return (
        <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2.5rem] glass backdrop-blur-3xl border border-white/50 bg-white/85 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]"
        >
            {/* Header */}
            <div className="flex items-center space-x-3 border-b border-gold-200/50 bg-white/50 px-6 py-4 backdrop-blur-md z-10">
                <div className="relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gold-50 to-gold-100 text-gold-700 shadow-sm border border-gold-200">
                        <UserCircle2 className="h-6 w-6 text-gold-600" />
                    </div>
                    <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white shadow-sm ring-1 ring-green-600/20" />
                </div>
                <div>
                    <h3 className="font-serif text-lg font-medium text-sacred-dark tracking-wide">Guide</h3>
                    <p className="text-xs font-semibold uppercase tracking-wider text-green-600/80">Active</p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                <AnimatePresence>
                    {messages.map((msg, index) => {
                        const isLastMsg = index === messages.length - 1;
                        const isActiveAiMsg = msg.sender === 'ai' && isLastMsg;
                        const relatedQuestion = msg.questionIndex !== undefined ? QUESTIONS[msg.questionIndex] : null;
                        const showOptions = !isTyping && isActiveAiMsg && relatedQuestion && (relatedQuestion.type === 'choice' || relatedQuestion.type === 'multi-choice');

                        return (
                            <motion.div
                                key={msg.id}
                                variants={bubbleVariants}
                                initial="hidden"
                                animate="visible"
                                className={`flex w-full flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed tracking-wide ${msg.sender === 'user'
                                        ? 'bg-sacred-dark text-white rounded-tr-sm shadow-md'
                                        : 'bg-white text-sacred-dark rounded-tl-sm border border-gold-100 shadow-[0_4px_12px_rgba(0,0,0,0.03)]'
                                        }`}
                                >
                                    {msg.text}
                                </div>

                                {/* Render options directly beneath the active AI message */}
                                {showOptions && (
                                    <motion.div 
                                        variants={optionsContainerVariants}
                                        initial="hidden"
                                        animate="visible"
                                        className="mt-3 flex flex-wrap gap-2 px-1 max-w-[90%]"
                                    >
                                        {relatedQuestion.type === 'choice' && relatedQuestion.options?.map(opt => (
                                            <motion.button
                                                key={opt}
                                                variants={optionItemVariants}
                                                whileHover={{ scale: 1.03 }}
                                                whileTap={{ scale: 0.97 }}
                                                onClick={() => handleSend(opt)}
                                                className="px-5 py-2.5 rounded-2xl border border-gold-300 bg-white text-sacred-dark hover:bg-gold-50 hover:border-gold-400 focus:bg-gold-50 transition-colors shadow-sm text-sm font-medium"
                                            >
                                                {opt}
                                            </motion.button>
                                        ))}

                                        {relatedQuestion.type === 'multi-choice' && relatedQuestion.options?.map(opt => {
                                            const isSelected = multiChoiceSelection.includes(opt);
                                            return (
                                                <motion.button
                                                    key={opt}
                                                    variants={optionItemVariants}
                                                    whileHover={{ scale: 1.03 }}
                                                    whileTap={{ scale: 0.97 }}
                                                    onClick={() => toggleMultiChoice(opt)}
                                                    className={`px-5 py-2.5 rounded-2xl border shadow-sm text-sm font-medium flex items-center gap-2 transition-all ${
                                                        isSelected ? 'bg-gold-600 border-gold-600 text-white' : 'border-gold-300 bg-white text-sacred-dark hover:bg-gold-50'
                                                    }`}
                                                >
                                                    {isSelected && <CheckCircle2 className="w-4 h-4" />}
                                                    {opt}
                                                </motion.button>
                                            );
                                        })}
                                        
                                        {relatedQuestion.type === 'multi-choice' && multiChoiceSelection.length > 0 && (
                                            <motion.button 
                                                variants={optionItemVariants}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleSend(multiChoiceSelection)}
                                                className="mt-2 w-full sm:w-auto px-6 py-2.5 bg-sacred-dark text-white rounded-2xl hover:bg-sacred-dark/90 transition-colors text-sm font-medium shadow-md"
                                            >
                                                Confirm Selection
                                            </motion.button>
                                        )}
                                    </motion.div>
                                )}
                            </motion.div>
                        );
                    })}
                    {isTyping && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, originY: 0 }}
                            className="flex justify-start"
                        >
                            <div className="flex items-center space-x-1 rounded-2xl rounded-tl-sm bg-white border border-gold-100 px-5 py-4 shadow-sm">
                                <div className="h-2 w-2 animate-fluid-spring rounded-full bg-gold-300 [animation-delay:-0.3s]"></div>
                                <div className="h-2 w-2 animate-fluid-spring rounded-full bg-gold-400 [animation-delay:-0.15s]"></div>
                                <div className="h-2 w-2 animate-fluid-spring rounded-full bg-gold-500"></div>
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
                        <motion.div 
                            initial={{ opacity: 0, y: 10, height: 0 }} 
                            animate={{ opacity: 1, y: 0, height: 'auto' }} 
                            exit={{ opacity: 0, height: 0 }}
                            className="text-red-500 text-sm px-2 font-medium"
                        >
                            {errorMsg}
                        </motion.div>
                    )}
                </AnimatePresence>

                {scriptIndex === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="mb-2"
                    >
                        <button
                            onClick={handleLinkedInImport}
                            className="w-full flex items-center justify-center space-x-2 bg-[#0077b5] text-white py-3 rounded-2xl hover:bg-[#005a87] transition-colors shadow-sm text-sm font-medium"
                        >
                            <Linkedin className="w-4 h-4" />
                            <span>Import details from LinkedIn</span>
                        </button>
                        <div className="flex items-center justify-center space-x-2 mt-3 mb-1">
                            <div className="h-px bg-gold-200/50 flex-1"></div>
                            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">or chat manually</span>
                            <div className="h-px bg-gold-200/50 flex-1"></div>
                        </div>
                    </motion.div>
                )}
                
                {/* Only render text input if the current question is not a choice type */}
                {(!currentQuestion || (currentQuestion.type !== 'choice' && currentQuestion.type !== 'multi-choice')) && (
                    <motion.div layout className="relative flex items-end">
                        <textarea
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                if (errorMsg) setErrorMsg(null); 
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your answer softly..."
                            disabled={isTyping || !currentQuestion}
                            className="w-full resize-none rounded-2xl border border-gold-200 bg-white py-3.5 pl-4 pr-14 text-sacred-dark outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all font-sans overflow-hidden disabled:bg-gray-50/80 disabled:text-gray-400 disabled:cursor-not-allowed shadow-inner"
                            rows={Math.min(4, input.split('\n').length || 1)}
                            style={{ minHeight: '52px', maxHeight: '120px' }}
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isTyping || !currentQuestion}
                            className="absolute bottom-2.5 right-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-gold-600 text-white transition-all duration-300 hover:bg-gold-500 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
