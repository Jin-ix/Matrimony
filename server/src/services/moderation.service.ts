const SUSPICIOUS_KEYWORDS = [
    'address', 'bank', 'whatsapp', 'number', 'cash',
    'phone number', 'venmo', 'paypal', 'meet alone',
    'send money', 'wire transfer', 'account number',
    'credit card', 'social security', 'ssn',
];

export interface ModerationResult {
    flagged: boolean;
    reason?: string;
}

export function moderateMessage(text: string): ModerationResult {
    const lowerText = text.toLowerCase();

    for (const keyword of SUSPICIOUS_KEYWORDS) {
        if (lowerText.includes(keyword)) {
            return {
                flagged: true,
                reason: 'For your safety, please avoid sharing intimate personal details or moving off-platform too soon.',
            };
        }
    }

    return { flagged: false };
}

// Extended AI moderation (when OpenAI key is available)
export async function aiModerateMessage(text: string): Promise<ModerationResult> {
    // Start with keyword check
    const keywordResult = moderateMessage(text);
    if (keywordResult.flagged) return keywordResult;

    // In production, add OpenAI moderation API call here:
    // const response = await openai.moderations.create({ input: text });
    // if (response.results[0].flagged) { ... }

    return { flagged: false };
}
