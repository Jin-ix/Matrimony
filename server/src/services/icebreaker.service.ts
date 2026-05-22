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

    const matchFirst = matchProfile?.firstName || 'there';
    const userFirst  = userProfile?.firstName || '';

    // Attempt LLM call if keys are present and profiles exist
    if ((geminiInstance || openaiInstance) && userProfile && matchProfile) {
        try {
            const systemPrompt = `You are "Sacred Guide", a warm Catholic matrimonial counsellor.
Generate exactly 5 personalised, faith-centred conversation starters for a first message from ${userFirst || 'the sender'} to ${matchFirst}.
Rules:
- Reference specific details from the recipient's profile (hobbies, rite, parish, location, occupation, education, spiritual/family values).
- Each starter must be 1-2 sentences, warm, and easy to reply to.
- Do NOT use generic greetings like "Hi, how are you?" alone.
- Address the recipient by first name (${matchFirst}).
- Output ONLY valid JSON: {"icebreakers": ["...", "...", "...", "...", "..."]}`;

            const promptContext = `
Sender: ${userFirst}, Rite: ${userProfile.rite || 'Catholic'}, Location: ${userProfile.location || 'N/A'}, Occupation: ${userProfile.occupation || 'N/A'}, Hobbies: ${(userProfile.hobbies || []).join(', ') || 'N/A'}, Spiritual: ${userProfile.spiritualValues || 'N/A'}, Parish: ${(userProfile as any).parish || 'N/A'}

Recipient: ${matchFirst}, Rite: ${matchProfile.rite || 'Catholic'}, Location: ${matchProfile.location || 'N/A'}, Occupation: ${matchProfile.occupation || 'N/A'}, Education: ${matchProfile.education || 'N/A'}, Hobbies: ${(matchProfile.hobbies || []).join(', ') || 'N/A'}, Spiritual: ${matchProfile.spiritualValues || 'N/A'}, Family Values: ${matchProfile.familyValues || 'N/A'}, Parish: ${(matchProfile as any).parish || 'N/A'}`;

            let jsonText = '';
            if (geminiInstance) {
                const model = geminiInstance.getGenerativeModel({
                    model: "gemini-2.0-flash",
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
                    return { icebreakers: parsed.icebreakers.slice(0, 5) };
                }
            }
        } catch (error) {
            console.error('Error generating AI icebreakers:', error);
            // Fall through to rule-based generation
        }
    }

    // ── Rich rule-based fallback ──────────────────────────────────────────────
    const sharedHobbies = (userProfile?.hobbies || []).filter((h) =>
        (matchProfile?.hobbies || []).map((mh) => mh.toLowerCase()).includes(h.toLowerCase())
    );

    const hobbyIcebreaker = sharedHobbies.length > 0
        ? `Hi ${matchFirst}! I noticed we both love ${sharedHobbies[0]} — what's your favourite memory or moment related to that?`
        : (matchProfile?.hobbies?.length ?? 0) > 0
        ? `Hello ${matchFirst}! I'd love to hear more about your interest in ${(matchProfile?.hobbies || [])[0]} — how did you get started with it?`
        : `Hi ${matchFirst}! What's something you enjoy doing on your weekends that brings you real joy?`;

    const matchRite = (matchProfile?.rite || '').replace('_', ' ').toLowerCase();
    const sameRite = userProfile?.rite === matchProfile?.rite;
    const faithIcebreaker = sameRite
        ? `Hi ${matchFirst}! It's wonderful to connect with another ${matchRite || 'Catholic'}. Is there a particular feast day or church tradition that's especially meaningful to you?`
        : `Hello ${matchFirst}! I'd love to learn about your experience in the ${matchRite || 'Catholic'} community — what aspect of your rite do you find most meaningful?`;

    const locationIcebreaker = matchProfile?.location
        ? `Hi ${matchFirst}! I see you're from ${matchProfile.location} — what's your favourite thing about that place?`
        : `Hi ${matchFirst}! I'd love to know what a typical Sunday looks like for you — Mass, family lunch, a favourite tradition?`;

    const familyIcebreaker = `Hello ${matchFirst}! Family is so central to our faith. If you could describe your family in three words, what would they be?`;

    const spiritualIcebreaker = matchProfile?.spiritualValues
        ? `Hi ${matchFirst}! Growing together in faith is so important to me. Is there a prayer, saint, or Scripture passage that is especially close to your heart?`
        : `Hello ${matchFirst}! What role does prayer and parish life play in your day-to-day life?`;

    return {
        icebreakers: [hobbyIcebreaker, faithIcebreaker, locationIcebreaker, familyIcebreaker, spiritualIcebreaker]
    };
}
