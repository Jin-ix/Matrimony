import prisma from '../config/database.js';
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

export async function generateIcebreaker(
    userId: string,
    matchUserId: string
): Promise<{ icebreakers: string[] }> {
    const [userProfile, matchProfile] = await Promise.all([
        prisma.profile.findUnique({ where: { userId } }),
        prisma.profile.findUnique({ where: { userId: matchUserId } }),
    ]);

    if (!userProfile || !matchProfile) {
        return {
            icebreakers: [
                "Hi! I'd love to get to know you better. What's something you're passionate about?",
                "Hello! It's great to connect. What is your favorite church tradition?",
                "Hi there! What values are most important to you in a partner?"
            ]
        };
    }

    // Attempt LLM call if keys are present
    if (geminiInstance || openaiInstance) {
        try {
            const systemPrompt = `You are the "Sacred Guide", a wise and friendly Catholic matrimonial counselor.
Your task is to generate 3 custom, faith-centered icebreakers for a chat room between two matched users.
The icebreakers should be conversational, warm, and highlight common ground or interesting details from their profiles (such as shared hobbies, their Catholic rites, location, family background, or spiritual values).
Address the recipient from the sender's perspective (i.e. "I noticed you like..."). Keep each option concise and easy to reply to (1-2 sentences).
Output a JSON object with a single key "icebreakers" containing an array of 3 strings. Do not output any other text or markdown.`;

            const promptContext = `
Sender Profile:
- Name: ${userProfile.firstName}
- Rite: ${userProfile.rite}
- Location: ${userProfile.location}
- Hobbies: ${userProfile.hobbies.join(', ')}
- Spiritual/Family Values: ${userProfile.spiritualValues || 'Not specified'} / ${userProfile.familyValues || 'Not specified'}

Recipient Profile:
- Name: ${matchProfile.firstName}
- Rite: ${matchProfile.rite}
- Location: ${matchProfile.location}
- Hobbies: ${matchProfile.hobbies.join(', ')}
- Spiritual/Family Values: ${matchProfile.spiritualValues || 'Not specified'} / ${matchProfile.familyValues || 'Not specified'}
`;

            let jsonText = '';
            if (geminiInstance) {
                const model = geminiInstance.getGenerativeModel({
                    model: "gemini-1.5-flash",
                    generationConfig: { responseMimeType: "application/json" }
                });
                const result = await model.generateContent({
                    contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nContext:\n${promptContext}` }] }]
                });
                jsonText = result.response.text().trim();
            } else if (openaiInstance) {
                const response = await openaiInstance.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: promptContext }
                    ],
                    response_format: { type: "json_object" }
                });
                jsonText = response.choices[0].message.content?.trim() || '';
            }

            if (jsonText) {
                const parsed = JSON.parse(jsonText);
                if (parsed.icebreakers && Array.isArray(parsed.icebreakers) && parsed.icebreakers.length >= 3) {
                    return { icebreakers: parsed.icebreakers.slice(0, 3) };
                }
            }
        } catch (error) {
            console.error('Error generating AI icebreakers:', error);
            // Fall back to rule-based generation
        }
    }

    // Rule-based fallback: Generate 3 distinct icebreakers
    const sharedHobbies = userProfile.hobbies.filter((h) =>
        matchProfile.hobbies.map((mh) => mh.toLowerCase()).includes(h.toLowerCase())
    );

    const hobbyIcebreaker = sharedHobbies.length > 0
        ? `Hi ${matchProfile.firstName}! I noticed we both enjoy ${sharedHobbies[0]} — what's your favorite memory related to that?`
        : matchProfile.hobbies.length > 0
        ? `Hello! I see you enjoy ${matchProfile.hobbies[0]} — I'd love to hear more about how you got started with it!`
        : `Hi ${matchProfile.firstName}! How has your week been going? I'd love to learn more about what you like to do in your free time.`;

    const riteName = matchProfile.rite.replace('_', ' ').toLowerCase();
    const faithIcebreaker = userProfile.rite === matchProfile.rite
        ? `Hi! It's beautiful to connect with another ${riteName} Catholic. What parish do you attend, or what's your favorite church feast/tradition?`
        : `Hello! I'd love to hear about your experience in the ${riteName} rite — how does it shape your faith journey?`;

    const familyValuesText = matchProfile.familyValues || 'family-centered';
    const valuesIcebreaker = `Hi ${matchProfile.firstName}! Family and faith are very important to me. What is one family tradition or value you treasure the most?`;

    return {
        icebreakers: [hobbyIcebreaker, faithIcebreaker, valuesIcebreaker]
    };
}
