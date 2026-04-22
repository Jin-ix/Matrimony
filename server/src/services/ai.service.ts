import prisma from '../config/database.js';
import type { UserRole } from '@prisma/client';

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
        question: "Beautiful. Moving on to your daily life—how would you describe your personality? What are your passions and hobbies?", 
        mood: 'cool', 
        isOptional: false,
        theme: 'personality'
    },
    { 
        id: 'finance',
        question: "A solid foundation is important. Could you share a bit about your professional life, occupation, and approximate financial income? (Feel free to say 'skip' if you prefer to keep this private for now).", 
        mood: 'neutral', 
        isOptional: true,
        theme: 'finance'
    },
    { 
        id: 'physical',
        question: "Got it. Next, regarding physical attributes—could you share your height, and any lifestyle details like if you exercise or prefer specific diets? (You can also 'skip' this).", 
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
        question: "Regarding physical attributes—could you share their height and lifestyle preferences? (You can also 'skip' this).", 
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

    // Extract logic
    if (currentStep > 0 && currentStep <= steps.length) {
        const prevStepData = steps[currentStep - 1];
        
        await prisma.onboardingResponse.create({
            data: {
                userId,
                step: currentStep,
                question: prevStepData.question,
                answer: userMessage,
            },
        });

        // Verify if it's an optional skip
        const isSkip = userMessage.trim().toLowerCase() === 'skip' || userMessage.trim().toLowerCase() === 'pass' || userMessage.trim().toLowerCase() === 'next';
        
        if (!isSkip) {
            await extractProfileData(userId, prevStepData.theme, userMessage);
        } else if (!prevStepData.isOptional) {
            // Re-prompt if mandatory field skipped implicitly
            return {
                response: "This detail is very important for matchmaking. Please share a few words, or give a brief answer to continue.",
                mood: 'cool',
                isComplete: false,
                nextStep: currentStep // Do not increment step
            };
        }
    }

    const nextStep = currentStep + 1;
    const isComplete = nextStep > steps.length;

    if (isComplete) {
        // Compute completion score
        await prisma.profile.update({
             where: { userId },
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

async function extractProfileData(userId: string, theme: string, answer: string) {
    // Robust simulated semantic extraction
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
            if (lowerAnswer.includes('mass') || lowerAnswer.includes('daily')) {
                updateProps.spiritualValues = 'Deeply Religious';
            } else if (lowerAnswer.includes('sunday')) {
                updateProps.spiritualValues = 'Traditional';
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
                'baking', 'singing', 'guitar', 'piano', 'chess', 'cricket',
            ];
            const foundHobbies = commonHobbies.filter((h) => lowerAnswer.includes(h));
            
            const newBio = `Personality: ${answer.substring(0, 150)}...`;

            const updateProps: any = {
                bio: newBio
            };

            if (foundHobbies.length > 0) {
                const uniqueHobbies = Array.from(new Set([...profile.hobbies, ...foundHobbies.map((h) => h.charAt(0).toUpperCase() + h.slice(1))]));
                updateProps.hobbies = uniqueHobbies;
            }

            await prisma.profile.update({ where: { userId }, data: updateProps });
            break;
        }
        case 'finance': {
            const updateProps: any = {};
            const incomeMatch = lowerAnswer.match(/(\$|rs|inr|usd)?\s*(\d{2,3})[k|l]|\b(\d{5,6})\b/i);
            if (incomeMatch) updateProps.annualIncome = incomeMatch[0].toUpperCase();
            
            const educationKeywords = ['bachelors', 'masters', 'doctorate', 'phd', 'md', 'engineering', 'medical', 'engineer', 'doctor', 'software', 'teacher'];
            const found = educationKeywords.find((kw) => lowerAnswer.includes(kw));
            if (found) {
                updateProps.occupation = found.charAt(0).toUpperCase() + found.slice(1);
            }
            
            if (Object.keys(updateProps).length > 0) {
                await prisma.profile.update({ where: { userId }, data: updateProps });
            }
            break;
        }
        case 'physical': {
            const updateProps: any = {};
            const heightMatch = lowerAnswer.match(/\b\d' ?\d{1,2}"?\b|\b\d{3} ?cm\b/i);
            if (heightMatch) updateProps.height = heightMatch[0];
            
            if (lowerAnswer.includes('veg') && !lowerAnswer.includes('non-veg')) {
                 updateProps.dietaryPreference = 'Vegetarian';
            } else if (lowerAnswer.includes('non-veg') || lowerAnswer.includes('non veg')) {
                 updateProps.dietaryPreference = 'Non-Vegetarian';
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
            
            if (Object.keys(updateProps).length > 0) {
                await prisma.profile.update({ where: { userId }, data: updateProps });
            }
            break;
        }
        case 'expectations': {
            // Ensure MatchPreferences exists or create it
            const pref = await prisma.matchPreferences.findUnique({ where: { userId } });
            if (!pref) {
                 await prisma.matchPreferences.create({
                     data: {
                         userId,
                         minAge: Math.max(21, profile.age - 5),
                         maxAge: Math.min(60, profile.age + 5)
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
