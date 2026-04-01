import prisma from '../config/database.js';
import type { Profile, Rite } from '@prisma/client';

interface CompatibilityResult {
    score: 'green' | 'yellow' | 'red';
    dealbreaker?: string;
    familyScore?: number;
    individualScore?: number;
    culturalDistance?: number;
    culturalAlignment?: number;
    aiInsight?: string;
}

// Rite compatibility groups
const RITE_FAMILIES: Record<string, string[]> = {
    eastern: ['SYRO_MALABAR', 'SYRO_MALANKARA', 'MALANKARA_ORTHODOX'],
    western: ['LATIN'],
    knanaya: ['KNANAYA_CATHOLIC'],
};

function getRiteFamily(rite: Rite): string {
    for (const [family, rites] of Object.entries(RITE_FAMILIES)) {
        if (rites.includes(rite)) return family;
    }
    return 'other';
}

/**
 * Estimate "westernisation" (0 = Kerala-rooted, 100 = fully Western) from location string.
 */
function computeCulturalScore(location: string | null): number {
    if (!location) return 50;
    const loc = location.toLowerCase();
    if (/kerala|kochi|trivandrum|thrissur|calicut|kannur|kottayam|palakkad|malappuram/.test(loc)) return 8;
    if (/india|mumbai|bangalore|chennai|delhi|hyderabad|pune|kolkata/.test(loc)) return 22;
    if (/dubai|abu dhabi|qatar|kuwait|bahrain|saudi|uae|oman/.test(loc)) return 42;
    if (/singapore|malaysia|kuala/.test(loc)) return 50;
    if (/uk|united kingdom|london|germany|france|italy|ireland|spain|netherlands/.test(loc)) return 70;
    if (/australia|sydney|melbourne|brisbane|perth|new zealand/.test(loc)) return 72;
    if (/canada|toronto|vancouver|montreal|calgary|ottawa/.test(loc)) return 78;
    if (/usa|united states|chicago|new york|houston|dallas|san francisco|los angeles|seattle|boston|miami|atlanta|, [a-z]{2}$/.test(loc)) return 82;
    return 50;
}

const RITE_AI_INSIGHTS: Record<string, string> = {
    KNANAYA_CATHOLIC: 'shares the sacred Knanaya heritage — an endogamous match that families back home will deeply appreciate.',
    SYRO_MALABAR: 'brings the ancient Syro-Malabar tradition rooted in the St. Thomas Christian legacy of Kerala.',
    LATIN: 'carries a Latin Catholic upbringing with an open, welcoming spirit for interfaith family conversations.',
    SYRO_MALANKARA: 'represents the Syro-Malankara tradition — a bridge between Eastern heritage and ecumenical openness.',
    MALANKARA_ORTHODOX: 'holds a proud Malankara Orthodox faith — deeply rooted in the Thomas Christian tradition of India.',
};

export function calculateCompatibility(
    userProfile: Profile & { user: { ghostMode: boolean } },
    candidateProfile: Profile,
    userPrefs?: { minAge: number; maxAge: number; orthodoxBridgeRequired: boolean; strictKnanayaRequired: boolean; preferredRites: Rite[] } | null
): CompatibilityResult {
    let score = 100;
    let dealbreaker: string | undefined;

    // Strict Knanaya check — hard dealbreaker
    if (userPrefs?.strictKnanayaRequired && candidateProfile.rite !== 'KNANAYA_CATHOLIC') {
        return { score: 'red', dealbreaker: 'Not within the Knanaya Catholic community' };
    }
    if (candidateProfile.strictKnanaya && userProfile.rite !== 'KNANAYA_CATHOLIC') {
        return { score: 'red', dealbreaker: 'Requires Knanaya Catholic community match' };
    }

    // Rite compatibility
    if (userPrefs?.preferredRites && userPrefs.preferredRites.length > 0) {
        if (!userPrefs.preferredRites.includes(candidateProfile.rite)) {
            const userFamily = getRiteFamily(userProfile.rite);
            const candidateFamily = getRiteFamily(candidateProfile.rite);
            if (userFamily !== candidateFamily) {
                score -= 30;
            } else {
                score -= 15;
            }
        }
    }

    // Orthodox Bridge compatibility
    if (userPrefs?.orthodoxBridgeRequired && !candidateProfile.orthodoxBridge) {
        score -= 25;
        if (score <= 40) {
            dealbreaker = 'Different views on traditional Catholic values';
        }
    }

    // Age range
    if (userPrefs) {
        if (candidateProfile.age < userPrefs.minAge || candidateProfile.age > userPrefs.maxAge) {
            const ageDiff = Math.min(
                Math.abs(candidateProfile.age - userPrefs.minAge),
                Math.abs(candidateProfile.age - userPrefs.maxAge)
            );
            if (ageDiff <= 3) {
                score -= 10;
            } else {
                score -= 25;
            }
        }
    }

    // Hobby overlap bonus
    if (userProfile.hobbies.length > 0 && candidateProfile.hobbies.length > 0) {
        const shared = userProfile.hobbies.filter((h) =>
            candidateProfile.hobbies.map((ch) => ch.toLowerCase()).includes(h.toLowerCase())
        );
        if (shared.length >= 2) score += 10;
        else if (shared.length === 0) score -= 5;
    }

    // Calculate final tier
    const baseTier: CompatibilityResult['score'] =
        score >= 70 ? 'green' : score >= 45 ? 'yellow' : 'red';

    if (baseTier === 'red' && !dealbreaker) {
        dealbreaker = 'Multiple preference mismatches detected';
    }

    // Diaspora Bridge: real location-based cultural distance
    const myCS = userProfile.culturalScore ?? computeCulturalScore(userProfile.location);
    const theirCS = candidateProfile.culturalScore ?? computeCulturalScore(candidateProfile.location);
    const culturalDistance = Math.abs(myCS - theirCS);
    const culturalAlignment = Math.max(0, 100 - culturalDistance);

    // Family score: weighted combination of rite match + cultural alignment
    const riteMatchBonus = userProfile.rite === candidateProfile.rite ? 15 :
        getRiteFamily(userProfile.rite) === getRiteFamily(candidateProfile.rite) ? 8 : 0;
    const familyScore = Math.min(98, Math.max(50, 65 + riteMatchBonus + (culturalAlignment * 0.15)));

    // AI Insight
    const riteInsight = RITE_AI_INSIGHTS[candidateProfile.rite] || 'brings a sincere Catholic faith that forms a strong foundation.';
    const aiInsight = `This candidate ${riteInsight} ${culturalAlignment >= 80 ? 'Cultural expectations are well-aligned — ideal for back-home families.' : culturalDistance <= 30 ? 'Cultural balance is manageable with open communication.' : 'Be prepared to bridge cultural expectations between diaspora and home.'}`;

    return { 
        score: baseTier, 
        dealbreaker,
        familyScore: Math.round(familyScore),
        individualScore: Math.min(99, Math.max(50, score)),
        culturalDistance,
        culturalAlignment,
        aiInsight
    };
}
