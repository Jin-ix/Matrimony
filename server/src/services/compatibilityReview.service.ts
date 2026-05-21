import prisma from '../config/database.js';
import { calculateCompatibility } from './compatibility.service.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { env } from '../config/env.js';

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

export async function generateCompatibilityReview(userId: string, targetUserId: string): Promise<{
    review: string;
    overallScore: number;
    scoreColor: 'green' | 'yellow' | 'red';
    dealbreaker?: string;
    breakdown: any;
}> {
    const [userProfile, targetProfile, userPrefs] = await Promise.all([
        prisma.profile.findUnique({ where: { userId } }),
        prisma.profile.findUnique({ where: { userId: targetUserId } }),
        prisma.matchPreferences.findUnique({ where: { userId } }),
    ]);

    if (!userProfile || !targetProfile) {
        throw new Error('User or target profile not found');
    }

    const compatResult = calculateCompatibility(userProfile, targetProfile, userPrefs);

    // Fallback: Rule-based detailed insights
    const ruleBasedInsights: string[] = [];

    // Rite / Religion comparison
    if (userProfile.rite === targetProfile.rite) {
        ruleBasedInsights.push(`You both share the ${userProfile.rite.replace('_', ' ')} rite, providing a unified spiritual foundation for your future family.`);
    } else {
        ruleBasedInsights.push(`You practice the ${userProfile.rite.replace('_', ' ')} rite while they practice ${targetProfile.rite.replace('_', ' ')}, which offers a beautiful opportunity to blend diverse Catholic traditions.`);
    }

    if (userProfile.spiritualValues && targetProfile.spiritualValues) {
        if (userProfile.spiritualValues === targetProfile.spiritualValues) {
            ruleBasedInsights.push(`You are both aligned on having a ${userProfile.spiritualValues} spiritual lifestyle and family focus.`);
        } else {
            ruleBasedInsights.push(`You describe your spiritual values as "${userProfile.spiritualValues}" whereas they describe theirs as "${targetProfile.spiritualValues}".`);
        }
    }

    // Family Background
    if (userProfile.familyValues && targetProfile.familyValues) {
        if (userProfile.familyValues === targetProfile.familyValues) {
            ruleBasedInsights.push(`Family is central to both of you, sharing a commitment to ${userProfile.familyValues} family structures.`);
        } else {
            ruleBasedInsights.push(`You value a ${userProfile.familyValues} family environment, while they lean towards a ${targetProfile.familyValues} structure.`);
        }
    }

    // Hobbies
    const sharedHobbies = userProfile.hobbies.filter(h =>
        targetProfile.hobbies.map(th => th.toLowerCase()).includes(h.toLowerCase())
    );
    if (sharedHobbies.length > 0) {
        ruleBasedInsights.push(`You share a common interest in ${sharedHobbies.join(', ')}, which is a great starting point for connection.`);
    } else if (targetProfile.hobbies.length > 0) {
        ruleBasedInsights.push(`While you have different hobbies, they enjoy ${targetProfile.hobbies.slice(0, 3).join(', ')}, offering fresh activities to discover together.`);
    }

    // Diet / Location / Habits
    if (userProfile.dietaryPreference && targetProfile.dietaryPreference) {
        if (userProfile.dietaryPreference.toLowerCase() === targetProfile.dietaryPreference.toLowerCase()) {
            ruleBasedInsights.push(`You both prefer a ${userProfile.dietaryPreference} diet.`);
        } else {
            ruleBasedInsights.push(`You have a ${userProfile.dietaryPreference} dietary preference, while they prefer ${targetProfile.dietaryPreference}.`);
        }
    }

    const locA = userProfile.location.split(',')[0].trim();
    const locB = targetProfile.location.split(',')[0].trim();
    if (locA.toLowerCase() === locB.toLowerCase()) {
        ruleBasedInsights.push(`Both of you are conveniently located in or near ${locA}.`);
    } else {
        ruleBasedInsights.push(`You reside in ${userProfile.location} while they are based in ${targetProfile.location}.`);
    }

    // Build the default rule-based review text
    let fallbackReview = `**Sacred Guide Compatibility Review**\n\n`;
    if (compatResult.dealbreaker) {
        fallbackReview += `⚠️ **Notice:** ${compatResult.dealbreaker}\n\n`;
    }
    fallbackReview += ruleBasedInsights.map(insight => `• ${insight}`).join('\n');

    let finalReview = fallbackReview;

    // Call LLM if keys exist
    if (geminiInstance || openaiInstance) {
        try {
            const systemPrompt = `You are the "Sacred Guide", a wise, warm, and encouraging Catholic matrimonial counselor. 
Your task is to explain why two profiles are compatible or point out differences/challenges based on the provided details. 
Write a short, engaging, and premium summary paragraph (3-4 sentences max) explaining the compatibility.
Address the user directly (use "You" and "They"). Emphasize their common ground (like shared Catholic rite, values, hobbies, or location) and gently note areas of difference (like different daily Mass habits or different dietary preferences) as growth opportunities.
Do not output markdown headings or JSON, just return a plain text description.`;

            const promptContext = `
User Profile:
- Rite: ${userProfile.rite}
- Location: ${userProfile.location}
- Age: ${userProfile.age}
- Spiritual Values: ${userProfile.spiritualValues || 'Not specified'}
- Family Values: ${userProfile.familyValues || 'Not specified'}
- Family Type: ${userProfile.familyType || 'Not specified'}
- Hobbies: ${userProfile.hobbies.join(', ') || 'Not specified'}
- Occupation: ${userProfile.occupation || 'Not specified'}
- Dietary Preference: ${userProfile.dietaryPreference || 'Not specified'}

Target Profile:
- Rite: ${targetProfile.rite}
- Location: ${targetProfile.location}
- Age: ${targetProfile.age}
- Spiritual Values: ${targetProfile.spiritualValues || 'Not specified'}
- Family Values: ${targetProfile.familyValues || 'Not specified'}
- Family Type: ${targetProfile.familyType || 'Not specified'}
- Hobbies: ${targetProfile.hobbies.join(', ') || 'Not specified'}
- Occupation: ${targetProfile.occupation || 'Not specified'}
- Dietary Preference: ${targetProfile.dietaryPreference || 'Not specified'}

Compatibility Results:
- Overall Compatibility: ${compatResult.overallPercentage}%
- Score: ${compatResult.score}
- Dealbreakers: ${compatResult.dealbreaker || 'None'}
`;

            if (geminiInstance) {
                const model = geminiInstance.getGenerativeModel({ model: "gemini-1.5-flash" });
                const result = await model.generateContent({
                    contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nContext:\n${promptContext}` }] }]
                });
                const llmText = result.response.text().trim();
                if (llmText) {
                    finalReview = llmText;
                }
            } else if (openaiInstance) {
                const response = await openaiInstance.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: promptContext }
                    ]
                });
                const llmText = response.choices[0].message.content?.trim();
                if (llmText) {
                    finalReview = llmText;
                }
            }
        } catch (error) {
            console.error('Error generating compatibility review from LLM:', error);
            // Fall back silently to rule-based review
        }
    }

    return {
        review: finalReview,
        overallScore: compatResult.overallPercentage,
        scoreColor: compatResult.score,
        dealbreaker: compatResult.dealbreaker,
        breakdown: compatResult.breakdown
    };
}
