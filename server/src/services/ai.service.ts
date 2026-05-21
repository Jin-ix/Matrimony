import prisma from '../config/database.js';
import type { UserRole } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { env } from '../config/env.js';

// Initialize LLM APIs if keys are present
const openAiKey = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
const geminiKey = env.GEMINI_API_KEY || env.GOOGLE_GEN_AI_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_GEN_AI_KEY;

let openaiInstance: OpenAI | null = null;
let geminiInstance: GoogleGenerativeAI | null = null;

if (openAiKey) {
    openaiInstance = new OpenAI({ apiKey: openAiKey });
}
if (geminiKey) {
    geminiInstance = new GoogleGenerativeAI(geminiKey);
}

function cleanJsonResponse(rawText: string): string {
    let text = rawText.trim();
    if (text.startsWith('```')) {
        text = text.replace(/^```(json)?/i, '');
        text = text.replace(/```$/, '');
    }
    return text.trim();
}

async function callGemini(prompt: string, systemInstruction: string): Promise<string> {
    if (!geminiInstance) throw new Error("Gemini instance is not initialized");
    const model = geminiInstance.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: systemInstruction,
        generationConfig: { responseMimeType: "application/json" }
    });
    const result = await model.generateContent(prompt);
    return result.response.text();
}

async function callOpenAI(prompt: string, systemInstruction: string): Promise<string> {
    if (!openaiInstance) throw new Error("OpenAI instance is not initialized");
    const response = await openaiInstance.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
    });
    return response.choices[0].message.content || '';
}

// ─── Onboarding Steps ─────────────────────────────────────────────────────────

const CANDIDATE_STEPS = [
    {
        id: 'intro',
        question: "Welcome! To tailor this sacred space exactly for you, let's explore who you are. Could you share a bit about your faith, religion, and involvement in the Church?",
        mood: 'warm',
        isOptional: false,
        theme: 'religion'
    },
    {
        id: 'personality',
        question: "Beautiful. Moving on to your daily life — how would you describe your personality? What are your passions and hobbies?",
        mood: 'cool',
        isOptional: false,
        theme: 'personality'
    },
    {
        id: 'finance',
        question: "A solid foundation is important. Could you share a bit about your professional life, occupation, and approximate annual income? (Feel free to say 'skip' if you prefer to keep this private for now).",
        mood: 'neutral',
        isOptional: true,
        theme: 'finance'
    },
    {
        id: 'physical',
        question: "Got it. Next, regarding physical attributes — could you share your height, and any lifestyle details like diet preferences? (You can also 'skip' this).",
        mood: 'warm',
        isOptional: true,
        theme: 'physical'
    },
    {
        id: 'family',
        question: "Family shapes who we are. Can you tell me about your family background and your core family values?",
        mood: 'warm',
        isOptional: false,
        theme: 'family'
    },
    {
        id: 'expectations',
        question: "Finally, what are your spouse expectations? What qualities are most important to you in a lifelong partner, and are there any dealbreakers?",
        mood: 'warm',
        isOptional: false,
        theme: 'expectations'
    },
];

const SCOUT_STEPS = [
    {
        id: 'intro',
        question: "Welcome! To help your loved one find their perfect match, let's start with their spiritual life. Could you share a bit about their faith and church involvement?",
        mood: 'warm',
        isOptional: false,
        theme: 'religion'
    },
    {
        id: 'personality',
        question: "Thank you. How would you describe their personality, hobbies, and interests?",
        mood: 'cool',
        isOptional: false,
        theme: 'personality'
    },
    {
        id: 'finance',
        question: "Could you share a bit about their professional life, finance, and occupation? (You may say 'skip' if you prefer).",
        mood: 'neutral',
        isOptional: true,
        theme: 'finance'
    },
    {
        id: 'physical',
        question: "Regarding physical attributes — could you share their height and lifestyle preferences? (You can also 'skip' this).",
        mood: 'warm',
        isOptional: true,
        theme: 'physical'
    },
    {
        id: 'family',
        question: "Tell me about your family background and the environment they grew up in.",
        mood: 'warm',
        isOptional: false,
        theme: 'family'
    },
    {
        id: 'expectations',
        question: "Finally, as a family, what spouse expectations do you have? Are there any dealbreakers?",
        mood: 'warm',
        isOptional: false,
        theme: 'expectations'
    },
];

export function getOnboardingSteps(role: UserRole) {
    return role === 'candidate' ? CANDIDATE_STEPS : SCOUT_STEPS;
}

export async function processOnboardingChat(
    userId: string,
    role: UserRole,
    userMessage: string,
    currentStep: number
): Promise<{ response: string; mood: string; isComplete: boolean; nextStep: number }> {
    const steps = getOnboardingSteps(role);

    let targetUserId = userId;
    if (role === 'scout') {
        const link = await prisma.parentCandidateLink.findFirst({
            where: { parentId: userId }
        });
        if (link) {
            targetUserId = link.candidateId;
        }
    }

    if (currentStep > 0 && currentStep <= steps.length) {
        const prevStepData = steps[currentStep - 1];

        await prisma.onboardingResponse.create({
            data: {
                userId: targetUserId,
                step: currentStep,
                question: prevStepData.question,
                answer: userMessage,
            },
        });

        const isSkip = ['skip', 'pass', 'next'].includes(userMessage.trim().toLowerCase());

        if (!isSkip) {
            await extractProfileData(targetUserId, prevStepData.theme, userMessage);
        } else if (!prevStepData.isOptional) {
            return {
                response: "This detail is very important for matchmaking. Please share a few words, or give a brief answer to continue.",
                mood: 'cool',
                isComplete: false,
                nextStep: currentStep
            };
        }
    }

    const nextStep = currentStep + 1;
    const isComplete = nextStep > steps.length;

    if (isComplete) {
        await prisma.profile.update({
            where: { userId: targetUserId },
            data: { profileComplete: 100 }
        });

        return {
            response: "Thank you so much for sharing! Your profile is being set up with all the details you've provided. You're ready to start discovering meaningful connections. 🙏",
            mood: 'warm',
            isComplete: true,
            nextStep,
        };
    }

    return {
        response: steps[nextStep - 1].question,
        mood: steps[nextStep - 1].mood,
        isComplete: false,
        nextStep,
    };
}

const EXTRACTION_SYSTEM_PROMPT = `
You are a precise data extraction assistant for Indian Catholic Matrimony.
Your task is to analyze a user's answer to an onboarding question and extract profile data fields.

The current step theme is: "{theme}".
The user's answer: "{answer}".

Based on the theme, extract any of the following fields if mentioned:

1. For theme "religion":
- "spiritualValues": Must be one of ["Deeply Religious", "Traditional", "Moderate"] if mentioned or implied.
  - "Deeply Religious" implies daily mass, active ministry, deep devotion.
  - "Traditional" implies regular Sunday mass, conventional beliefs.
  - "Moderate" implies occasional attendance, casual faith.

2. For theme "personality":
- "bio": A short summary (up to 200 characters) written by the user.
- "hobbies": An array of hobbies mentioned (e.g. ["Reading", "Cooking", "Hiking"]).

3. For theme "finance":
- "annualIncome": Extract the income mentioned (e.g. "INR 8 Lakhs", "$100k").
- "occupation": Extract the occupation/job title (e.g. "Software Engineer", "Teacher").

4. For theme "physical":
- "height": Extract height (e.g. "5'11\"", "175 cm").
- "dietaryPreference": Must be one of ["Vegetarian", "Non-Vegetarian", "Pescatarian"] if mentioned.

5. For theme "family":
- "familyType": Must be one of ["Nuclear", "Joint"] if mentioned.
- "familyValues": Must be one of ["Traditional", "Conservative", "Modern", "Progressive", "Open"] if mentioned.

6. For theme "expectations":
- No fields to extract directly for Profile, but if spouse expectations are mentioned, do not extract.

You must return a JSON object with only the fields you were able to extract. For example:
{
    "occupation": "Software Engineer",
    "annualIncome": "INR 12 Lakhs"
}
If no fields can be extracted, return an empty JSON object: {}.
Do not include any other conversational response, markdown formatting, or text outside the JSON.
`;

async function extractProfileDataLLM(theme: string, answer: string): Promise<any> {
    if (!openaiInstance && !geminiInstance) return null;
    try {
        const systemPrompt = EXTRACTION_SYSTEM_PROMPT.replace('{theme}', theme).replace('{answer}', answer);
        const prompt = `Extract properties for theme "${theme}" from this message: "${answer}"`;
        
        let responseText = '';
        if (geminiInstance) {
            responseText = await callGemini(prompt, systemPrompt);
        } else if (openaiInstance) {
            responseText = await callOpenAI(prompt, systemPrompt);
        }
        
        const parsed = JSON.parse(cleanJsonResponse(responseText));
        return parsed;
    } catch (e) {
        console.error('[extractProfileDataLLM Error]:', e);
        return null;
    }
}

export async function extractProfileData(userId: string, theme: string, answer: string) {
    // 1. Try LLM extraction first if configured
    if (openaiInstance || geminiInstance) {
        const extracted = await extractProfileDataLLM(theme, answer);
        if (extracted && Object.keys(extracted).length > 0) {
            const updateProps: any = {};
            const profile = await prisma.profile.findUnique({ where: { userId } });
            if (profile) {
                // Religion
                if (extracted.spiritualValues) {
                    const validValues = ['Deeply Religious', 'Traditional', 'Moderate'];
                    if (validValues.includes(extracted.spiritualValues)) {
                        updateProps.spiritualValues = extracted.spiritualValues;
                    }
                }
                // Personality
                if (theme === 'personality') {
                    if (extracted.bio) {
                        updateProps.bio = extracted.bio.substring(0, 200);
                    }
                    if (Array.isArray(extracted.hobbies) && extracted.hobbies.length > 0) {
                        const existingHobbies = profile.hobbies || [];
                        const uniqueHobbies = Array.from(new Set([
                            ...existingHobbies,
                            ...extracted.hobbies.map((h: string) => h.charAt(0).toUpperCase() + h.slice(1))
                        ]));
                        updateProps.hobbies = uniqueHobbies;
                    }
                }
                // Finance
                if (theme === 'finance') {
                    if (extracted.annualIncome) {
                        updateProps.annualIncome = extracted.annualIncome.toString();
                    }
                    if (extracted.occupation) {
                        updateProps.occupation = extracted.occupation.toString();
                    }
                }
                // Physical
                if (theme === 'physical') {
                    if (extracted.height) {
                        updateProps.height = extracted.height.toString();
                    }
                    if (extracted.dietaryPreference) {
                        const validDiets = ['Vegetarian', 'Non-Vegetarian', 'Pescatarian'];
                        if (validDiets.includes(extracted.dietaryPreference)) {
                            updateProps.dietaryPreference = extracted.dietaryPreference;
                        }
                    }
                }
                // Family
                if (theme === 'family') {
                    if (extracted.familyType) {
                        const validTypes = ['Nuclear', 'Joint'];
                        if (validTypes.includes(extracted.familyType)) {
                            updateProps.familyType = extracted.familyType;
                        }
                    }
                    if (extracted.familyValues) {
                        const validValues = ['Traditional', 'Conservative', 'Modern', 'Progressive', 'Open'];
                        if (validValues.includes(extracted.familyValues)) {
                            updateProps.familyValues = extracted.familyValues;
                        }
                    }
                }

                if (Object.keys(updateProps).length > 0) {
                    await prisma.profile.update({ where: { userId }, data: updateProps });
                    return; // Skip fallback as LLM successfully extracted and saved
                }
            }
        }
    }

    // 2. Pre-existing rule-based fallback logic (runs if LLM is missing, fails, or fails to extract anything)
    const profile = await prisma.profile.findUnique({
        where: { userId },
        select: {
            hobbies: true,
            age: true,
            occupation: true,
            bio: true,
            familyType: true,
            spiritualValues: true,
            height: true,
            dietaryPreference: true,
            annualIncome: true,
        }
    });
    if (!profile) return;

    const lowerAnswer = answer.toLowerCase();

    switch (theme) {
        case 'religion': {
            const updateProps: any = {};
            if (lowerAnswer.includes('daily mass') || lowerAnswer.includes('every day')) {
                updateProps.spiritualValues = 'Deeply Religious';
            } else if (lowerAnswer.includes('mass') || lowerAnswer.includes('sunday')) {
                updateProps.spiritualValues = 'Traditional';
            } else if (lowerAnswer.includes('occasional') || lowerAnswer.includes('sometimes')) {
                updateProps.spiritualValues = 'Moderate';
            }
            if (Object.keys(updateProps).length > 0) {
                await prisma.profile.update({ where: { userId }, data: updateProps });
            }
            break;
        }
        case 'personality': {
            const commonHobbies = [
                'reading', 'cooking', 'hiking', 'photography', 'music', 'travel',
                'gardening', 'painting', 'yoga', 'dance', 'writing', 'sports',
                'baking', 'singing', 'guitar', 'piano', 'chess', 'cricket', 'football',
                'swimming', 'cycling', 'drawing', 'crafts', 'prayer', 'volunteering',
            ];
            const foundHobbies = commonHobbies.filter((h) => lowerAnswer.includes(h));
            const newBio = answer.length > 10 ? `${answer.substring(0, 200)}` : undefined;
            const updateProps: any = {};
            if (newBio) updateProps.bio = newBio;
            if (foundHobbies.length > 0) {
                const uniqueHobbies = Array.from(new Set([
                    ...(profile.hobbies || []),
                    ...foundHobbies.map((h) => h.charAt(0).toUpperCase() + h.slice(1))
                ]));
                updateProps.hobbies = uniqueHobbies;
            }
            if (Object.keys(updateProps).length > 0) {
                await prisma.profile.update({ where: { userId }, data: updateProps });
            }
            break;
        }
        case 'finance': {
            const updateProps: any = {};
            const incomeMatch = lowerAnswer.match(/(?:(?:rs\.?|inr|usd|\$)\s*)?\d+(?:\.\d+)?\s*(?:lakhs?|cr|crores?|k|m|million|l|thousand)?\b/i);
            if (incomeMatch) updateProps.annualIncome = incomeMatch[0].toUpperCase().trim();

            const jobKeywords = [
                { kw: 'software engineer', label: 'Software Engineer' },
                { kw: 'software developer', label: 'Software Developer' },
                { kw: 'engineer', label: 'Engineer' },
                { kw: 'developer', label: 'Software Developer' },
                { kw: 'doctor', label: 'Doctor' },
                { kw: 'teacher', label: 'Teacher' },
                { kw: 'nurse', label: 'Nurse' },
                { kw: 'lawyer', label: 'Lawyer' },
                { kw: 'accountant', label: 'Accountant' },
                { kw: 'architect', label: 'Architect' },
                { kw: 'manager', label: 'Manager' },
                { kw: 'professor', label: 'Professor' },
                { kw: 'consultant', label: 'Consultant' },
                { kw: 'analyst', label: 'Analyst' },
                { kw: 'designer', label: 'Designer' },
            ];
            const foundJob = jobKeywords.find(({ kw }) => lowerAnswer.includes(kw));
            if (foundJob) updateProps.occupation = foundJob.label;

            if (Object.keys(updateProps).length > 0) {
                await prisma.profile.update({ where: { userId }, data: updateProps });
            }
            break;
        }
        case 'physical': {
            const updateProps: any = {};
            const heightMatch = lowerAnswer.match(/\b\d' ?\d{1,2}"?\b|\b\d{3} ?cm\b/i);
            if (heightMatch) updateProps.height = heightMatch[0];

            if (lowerAnswer.includes('vegetarian') || (lowerAnswer.includes('veg') && !lowerAnswer.includes('non'))) {
                updateProps.dietaryPreference = 'Vegetarian';
            } else if (lowerAnswer.includes('non-veg') || lowerAnswer.includes('non veg') || lowerAnswer.includes('meat')) {
                updateProps.dietaryPreference = 'Non-Vegetarian';
            } else if (lowerAnswer.includes('fish') || lowerAnswer.includes('seafood') || lowerAnswer.includes('pescatarian')) {
                updateProps.dietaryPreference = 'Pescatarian';
            }

            if (Object.keys(updateProps).length > 0) {
                await prisma.profile.update({ where: { userId }, data: updateProps });
            }
            break;
        }
        case 'family': {
            const updateProps: any = {};
            if (lowerAnswer.includes('nuclear')) updateProps.familyType = 'Nuclear';
            if (lowerAnswer.includes('joint')) updateProps.familyType = 'Joint';

            const valueKeywords = ['traditional', 'conservative', 'modern', 'progressive', 'open'];
            const foundValue = valueKeywords.find((v) => lowerAnswer.includes(v));
            if (foundValue) updateProps.familyValues = foundValue.charAt(0).toUpperCase() + foundValue.slice(1);

            if (Object.keys(updateProps).length > 0) {
                await prisma.profile.update({ where: { userId }, data: updateProps });
            }
            break;
        }
        case 'expectations': {
            const pref = await prisma.matchPreferences.findUnique({ where: { userId } });
            if (!pref) {
                await prisma.matchPreferences.create({
                    data: {
                        userId,
                        minAge: Math.max(21, (profile.age || 25) - 5),
                        maxAge: Math.min(60, (profile.age || 25) + 5)
                    }
                });
            }
            break;
        }
    }
}

export async function getOnboardingSummary(userId: string) {
    const responses = await prisma.onboardingResponse.findMany({
        where: { userId },
        orderBy: { step: 'asc' },
    });

    return responses.map((r) => ({
        step: r.step,
        question: r.question,
        answer: r.answer,
    }));
}

// ─── Homepage Chat Assistant ──────────────────────────────────────────────────

type ChatResponse = {
    response: string;
    action?: string;
    suggestedLinks?: { label: string; url: string }[];
    quickReplies?: string[];
};

export async function processHomepageChat(
    userId: string,
    userMessage: string
): Promise<ChatResponse> {
    // Load user + profile in one shot
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            profile: true,
            matchPreferences: true,
            sentInteractions: { where: { type: 'interest' }, select: { id: true } },
            receivedInteractions: { where: { type: 'interest' }, select: { id: true } },
        }
    });

    const profile = user?.profile;
    const firstName = profile?.firstName ?? 'there';
    const profileComplete = profile?.profileComplete ?? 0;
    const interestsSent = user?.sentInteractions?.length ?? 0;
    const interestsReceived = user?.receivedInteractions?.length ?? 0;

    const mutualMatchesCount = await prisma.conversation.count({
        where: {
            participants: { some: { userId } },
            isArchived: false,
        }
    });

    // 1. Try LLM Homepage Chat Assistant if configured
    if (openaiInstance || geminiInstance) {
        try {
            const systemPrompt = `
You are "Sacred Guide", a warm, wise, and helpful AI assistant for Indian Catholic Matrimony, a premium, faith-centered matrimony platform.
Your purpose is to help the user navigate the platform, manage their profile, find matches, and understand compatibility (which is based on rite, spiritual values, family type, lifestyle, and preferences).

Here is the context of the user you are chatting with:
- First Name: ${firstName}
- Profile Setup Completion: ${profileComplete}%
- Rite: ${profile?.rite || 'Not specified'}
- Location: ${profile?.location || 'Not specified'}
- Sent Likes/Interests: ${interestsSent}
- Received Likes/Interests: ${interestsReceived}
- Mutual Matches (Conversations): ${mutualMatchesCount}

Important Links and Actions on the platform:
1. Discover Matches / Browse candidates: "/discovery"
2. Connections Page (for Shortlists and Received Likes): "/connections"
3. Inbox / Chat: "/messages"
4. Edit Profile (Bio, Hobbies, Basic Details, Photos): "/settings?tab=profile"
5. Set Match Preferences (Age, Rite, Location preferences, weights): "/settings?tab=preferences"
6. Privacy Settings (Ghost mode, photo visibility opt-in, Link a Parent): "/settings?tab=privacy"
7. Kitchen Table (Shared space for family/parents to connect once a mutual match is made): "/kitchen"

Guidelines for your response:
1. Keep the tone warm, welcoming, respectful, and slightly spiritual (e.g., using terms like "blessings", "sacred covenant", "meaningful journey").
2. Answer the user's message accurately. If they ask to see matches, suggest they visit "/discovery". If they ask about who liked them, guide them to "/connections". If they need to edit their profile or photos, guide them to "/settings?tab=profile".
3. Recommend 1 to 3 relevant suggested links from the list above.
4. Provide 2 to 4 quick replies for the user to continue the conversation.
5. You MUST return your response as a valid JSON object matching the following structure:
{
    "response": "Your conversational answer to the user",
    "suggestedLinks": [
        { "label": "Link Button Label (e.g., 🔍 Discover Matches)", "url": "/discovery" }
    ],
    "quickReplies": [
        "Quick reply suggestion 1",
        "Quick reply suggestion 2"
    ]
}
Do not return any other text, markdown formatting, or code blocks outside the JSON object.
`;

            let responseText = '';
            if (geminiInstance) {
                responseText = await callGemini(userMessage, systemPrompt);
            } else if (openaiInstance) {
                responseText = await callOpenAI(userMessage, systemPrompt);
            }

            const parsed = JSON.parse(cleanJsonResponse(responseText));
            if (parsed && typeof parsed.response === 'string') {
                return {
                    response: parsed.response,
                    suggestedLinks: parsed.suggestedLinks || [],
                    quickReplies: parsed.quickReplies || []
                };
            }
        } catch (error) {
            console.error('[SacredGuide LLM Error]:', error);
            // Fall through to existing rule-based behavior
        }
    }

    // 2. Pre-existing rule-based fallback logic (runs if LLM is missing, fails, or returns invalid format)
    const msg = userMessage.trim().toLowerCase();

    // Greeting / empty
    if (!msg || msg.length < 2 || ['hi', 'hello', 'hey', 'hii', 'yo', 'namaste'].some(g => msg === g)) {
        if (!profile || profileComplete < 50) {
            return {
                response: `Welcome, ${firstName}! 🙏 I'm your Sacred Guide — here to help you find a meaningful, faith-centered match. It looks like your profile is still being set up. Let's complete it so I can find you the best connections!`,
                suggestedLinks: [
                    { label: '✏️ Complete My Profile', url: '/settings?tab=profile' },
                    { label: '🔍 Browse Matches', url: '/discovery' },
                ],
                quickReplies: ['Show me my matches', 'How does matching work?', 'Who has shown interest in me?'],
            };
        }
        return {
            response: `Good to see you, ${firstName}! 🙏 You have sent ${interestsSent} interest${interestsSent !== 1 ? 's' : ''} and received ${interestsReceived}. How can I guide you today?`,
            suggestedLinks: [
                { label: '🔍 Discover Matches', url: '/discovery' },
                { label: '💬 My Connections', url: '/messages' },
            ],
            quickReplies: ['Show me new matches', 'Who has shown interest in me?', 'Help me with my profile'],
        };
    }

    // Interest / Who liked me
    if (msg.includes('interest') || msg.includes('who liked') || msg.includes('likes me') || msg.includes('interested in me') || msg.includes('who has shown')) {
        return {
            response: `You've received ${interestsReceived} expression${interestsReceived !== 1 ? 's' : ''} of interest so far${interestsReceived > 0 ? ' — check your connections to see who!' : '.'}`,
            suggestedLinks: [
                { label: '💌 View Connections', url: '/connections' },
                { label: '💬 Open Messages', url: '/messages' },
            ],
            quickReplies: ['Show me new matches', 'How does matching work?'],
        };
    }

    // Matches / Discovery
    if (msg.includes('match') || msg.includes('suggest') || msg.includes('discover') || msg.includes('find') || msg.includes('browse') || msg.includes('new profile')) {
        const hasPrefs = !!user?.matchPreferences;
        return {
            response: hasPrefs
                ? `I'll show you profiles that align with your preferences${profile?.rite ? ` in the ${profile.rite} rite` : ''}. Head to the discovery feed to explore!`
                : `I can find matches for you! Setting your match preferences first will give you much better results.`,
            suggestedLinks: [
                { label: '🔍 Discover Profiles', url: '/discovery' },
                { label: '⚙️ Set Preferences', url: '/settings?tab=preferences' },
            ],
            quickReplies: ['Who has shown interest in me?', 'How do I start a conversation?'],
        };
    }

    // Profile help
    if (msg.includes('profile') || msg.includes('edit') || msg.includes('update') || msg.includes('photo') || msg.includes('bio') || msg.includes('complete')) {
        const remaining = 100 - profileComplete;
        return {
            response: profileComplete >= 100
                ? `Your profile is complete at 100%! 🎉 Other candidates can see your full profile. You can still update your bio, photos, or preferences anytime.`
                : `Your profile is ${profileComplete}% complete — ${remaining}% remaining. Adding more details like your hobbies, bio, and a good photo greatly improves your match quality.`,
            suggestedLinks: [
                { label: '✏️ Edit Profile', url: '/settings?tab=profile' },
                { label: '🖼️ Manage Photos', url: '/settings?tab=profile' },
            ],
            quickReplies: ['Show me my matches', 'How does matching work?'],
        };
    }

    // Messaging / Conversations
    if (msg.includes('message') || msg.includes('chat') || msg.includes('conversation') || msg.includes('talk') || msg.includes('send')) {
        return {
            response: `Messaging is unlocked once you and another candidate mutually express interest — that's your cue that both families are open to dialogue. Go to Connections to start!`,
            suggestedLinks: [
                { label: '💬 My Conversations', url: '/messages' },
                { label: '🤝 Connections', url: '/connections' },
            ],
            quickReplies: ['How do I express interest?', 'Who has shown interest in me?'],
        };
    }

    // How matching works
    if (msg.includes('how') && (msg.includes('work') || msg.includes('match') || msg.includes('algorithm') || msg.includes('score'))) {
        return {
            response: `The Sacred Guide uses a compatibility engine that weighs your rite, spiritual values, family type, lifestyle, and expectations — all personalized to your weightings in preferences. Green = high compatibility, yellow = moderate, red = potential dealbreakers.`,
            suggestedLinks: [
                { label: '⚙️ Set My Weights', url: '/settings?tab=preferences' },
                { label: '🔍 Discover Profiles', url: '/discovery' },
            ],
            quickReplies: ['Show me my matches', 'Help me with my profile'],
        };
    }

    // Privacy
    if (msg.includes('privacy') || msg.includes('hidden') || msg.includes('ghost') || msg.includes('photo visible') || msg.includes('blur')) {
        return {
            response: `Your privacy is fully in your hands. You can enable Ghost Mode to hide from all discovery feeds, or toggle Photo Visibility to let your photo show before a match is made.`,
            suggestedLinks: [
                { label: '🔒 Privacy Settings', url: '/settings?tab=privacy' },
            ],
            quickReplies: ['Show me my matches', 'Help me with my profile'],
        };
    }

    // Kitchen Table
    if (msg.includes('kitchen') || msg.includes('family') || msg.includes('parent') || msg.includes('scout')) {
        return {
            response: `The Kitchen Table is where families meet — once there's a mutual match, both families can connect together in a shared space. You can link a parent to your account under Privacy Settings.`,
            suggestedLinks: [
                { label: '🍽️ Kitchen Table', url: '/kitchen' },
                { label: '🔒 Link a Parent', url: '/settings?tab=privacy' },
            ],
            quickReplies: ['How does matching work?', 'Show me my matches'],
        };
    }

    // Settings / Help
    if (msg.includes('setting') || msg.includes('preference') || msg.includes('notification') || msg.includes('help') || msg.includes('guide')) {
        return {
            response: `I'm here to guide you every step of the way. You can adjust your match preferences, notification settings, privacy options, and more from Settings.`,
            suggestedLinks: [
                { label: '⚙️ Open Settings', url: '/settings' },
                { label: '🔍 Discover Matches', url: '/discovery' },
            ],
            quickReplies: ['Show me my matches', 'Help me with my profile', 'How does matching work?'],
        };
    }

    // Default contextual fallback
    const greeting = profile ? `${firstName}, ` : '';
    return {
        response: `${greeting}I didn't quite follow that — but I'm here to help with finding matches, completing your profile, starting conversations, or navigating the platform. What would you like to explore?`,
        suggestedLinks: [
            { label: '🔍 Discover Matches', url: '/discovery' },
            { label: '✏️ Edit Profile', url: '/settings?tab=profile' },
        ],
        quickReplies: ['Show me my matches', 'Who has shown interest in me?', 'How does matching work?', 'Help me with my profile'],
    };
}

