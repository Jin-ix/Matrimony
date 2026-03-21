import prisma from '../config/database.js';
import type { UserRole } from '@prisma/client';

// Role-based conversation templates (matching frontend ConversationalAgent.tsx)
const CANDIDATE_STEPS = [
    { question: "Welcome to Indian Catholic Matrimony! I'm here to help you create a meaningful profile. Let's start with the basics — could you tell me a little about yourself? Your name, age, and where you're from?", mood: 'warm' },
    { question: "That's wonderful. Now, tell me about your professional life — what do you do, and what are you most proud of in your career?", mood: 'neutral' },
    { question: "Faith is central to who we are. Could you share about your church life? How often do you attend Mass, and what role does your parish community play in your life?", mood: 'warm' },
    { question: "Family values shape our relationships deeply. What does family mean to you, and what traditions do you hold dear?", mood: 'warm' },
    { question: "Let's talk about your lifestyle. What are your hobbies and interests? What does a perfect weekend look like for you?", mood: 'cool' },
    { question: "Now for the important part — what are you looking for in a partner? What qualities and values matter most to you?", mood: 'warm' },
    { question: "Finally, are there any dealbreakers — things that would be non-negotiable for you in a relationship? This helps us ensure better matches.", mood: 'neutral' },
];

const SCOUT_STEPS = [
    { question: "Welcome! It's wonderful that you're helping your family member find a match. Let's start — could you tell me about the person you're representing? Their name, age, and a bit about them?", mood: 'warm' },
    { question: "What does this person do professionally? What achievements or qualities make you most proud of them?", mood: 'neutral' },
    { question: "How would you describe their relationship with faith and the Church? Are they active in parish life?", mood: 'warm' },
    { question: "Tell me about your family values and traditions. What kind of household did they grow up in?", mood: 'warm' },
    { question: "What are their hobbies and interests? What makes them unique and special?", mood: 'cool' },
    { question: "As a family, what kind of partner do you envision for them? What qualities and values are you looking for?", mood: 'warm' },
    { question: "Are there any dealbreakers from the family's perspective? Anything that's absolutely non-negotiable?", mood: 'neutral' },
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

    // Save the user's response
    if (currentStep > 0 && currentStep <= steps.length) {
        await prisma.onboardingResponse.create({
            data: {
                userId,
                step: currentStep,
                question: steps[currentStep - 1].question,
                answer: userMessage,
            },
        });
    }

    // Auto-extract profile data from responses
    await extractProfileData(userId, currentStep, userMessage);

    const nextStep = currentStep + 1;
    const isComplete = nextStep > steps.length;

    if (isComplete) {
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

async function extractProfileData(userId: string, step: number, answer: string) {
    // Simple extraction logic — in production, use LLM for semantic extraction
    const profile = await prisma.profile.findUnique({ where: { userId } });

    if (!profile) return;

    switch (step) {
        case 1: {
            // Extract basic info (name, age, location)
            const ageMatch = answer.match(/\b(\d{2})\b/);
            if (ageMatch) {
                await prisma.profile.update({
                    where: { userId },
                    data: { age: parseInt(ageMatch[1]) },
                });
            }
            break;
        }
        case 2: {
            // Extract career/education
            const educationKeywords = ['bachelors', 'masters', 'doctorate', 'phd', 'md', 'engineering', 'medical'];
            const found = educationKeywords.find((kw) => answer.toLowerCase().includes(kw));
            if (found) {
                await prisma.profile.update({
                    where: { userId },
                    data: { education: found.charAt(0).toUpperCase() + found.slice(1) },
                });
            }
            break;
        }
        case 5: {
            // Extract hobbies
            const commonHobbies = [
                'reading', 'cooking', 'hiking', 'photography', 'music', 'travel',
                'gardening', 'painting', 'yoga', 'dance', 'writing', 'sports',
                'baking', 'singing', 'guitar', 'piano', 'chess', 'cricket',
            ];
            const foundHobbies = commonHobbies.filter((h) => answer.toLowerCase().includes(h));
            if (foundHobbies.length > 0) {
                await prisma.profile.update({
                    where: { userId },
                    data: { hobbies: foundHobbies.map((h) => h.charAt(0).toUpperCase() + h.slice(1)) },
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
