import prisma from '../config/database.js';

// AI icebreaker templates for when OpenAI is not configured
const ICEBREAKER_TEMPLATES = [
    "I noticed you're both passionate about {hobby}! What got you started with it?",
    "You both come from {rite} backgrounds — what's your favorite church tradition?",
    "I see you both enjoy {hobby}. Have you ever tried {suggestion} together?",
    "Faith and family seem really important to both of you. What's one family tradition you'd never give up?",
    "You both seem like thoughtful people. What book or experience has shaped your faith the most?",
    "I see {name} is from {location}. Have you been there? What's the best thing about it?",
];

export async function generateIcebreaker(
    userId: string,
    matchUserId: string
): Promise<{ icebreaker: string }> {
    const [userProfile, matchProfile] = await Promise.all([
        prisma.profile.findUnique({ where: { userId } }),
        prisma.profile.findUnique({ where: { userId: matchUserId } }),
    ]);

    if (!userProfile || !matchProfile) {
        return { icebreaker: "Hi! I'd love to get to know you better. What's something you're passionate about?" };
    }

    // Find shared hobbies
    const sharedHobbies = userProfile.hobbies.filter((h) =>
        matchProfile.hobbies.map((mh) => mh.toLowerCase()).includes(h.toLowerCase())
    );

    // In production, use OpenAI for personalized icebreakers:
    // const response = await openai.chat.completions.create({
    //   model: 'gpt-4o-mini',
    //   messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: contextPrompt }],
    // });

    // Template-based fallback
    let template = ICEBREAKER_TEMPLATES[Math.floor(Math.random() * ICEBREAKER_TEMPLATES.length)];

    template = template
        .replace('{hobby}', sharedHobbies[0] || matchProfile.hobbies[0] || 'your interests')
        .replace('{rite}', matchProfile.rite.replace('_', ' '))
        .replace('{name}', matchProfile.firstName)
        .replace('{location}', matchProfile.location)
        .replace('{suggestion}', 'exploring it more');

    return { icebreaker: template };
}
