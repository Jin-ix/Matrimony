import prisma from '../config/database.js';
import type { Profile, Rite } from '@prisma/client';

export interface CompatibilityResult {
    overallPercentage: number;
    score: 'green' | 'yellow' | 'red';
    dealbreaker?: string;
    breakdown: {
        religion: number;
        personality: number;
        finance: number;
        physical: number;
        family: number;
        expectations: number;
    };
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

// 1. Religion (25%)
function calculateReligionScore(user: Profile, candidate: Profile): number {
    let score = 100;
    
    // Rite Match
    if (user.rite === candidate.rite) {
        // Perfect match
    } else if (getRiteFamily(user.rite) === getRiteFamily(candidate.rite)) {
        score -= 15; // Same family (e.g. both Eastern)
    } else {
        score -= 30; // Different family
    }

    // Orthodox Bridge
    if (user.orthodoxBridge && !candidate.orthodoxBridge) score -= 15;
    
    // Spiritual Values & Sacraments
    if (user.spiritualValues && candidate.spiritualValues && user.spiritualValues !== candidate.spiritualValues) {
        score -= 10;
    }

    return Math.max(0, score);
}

// 2. Personality (15%)
function calculatePersonalityScore(user: Profile, candidate: Profile): number {
    let score = 100;
    
    // Hobbies
    if (user.hobbies.length > 0 && candidate.hobbies.length > 0) {
        const shared = user.hobbies.filter((h) =>
            candidate.hobbies.map((ch) => ch.toLowerCase()).includes(h.toLowerCase())
        );
        if (shared.length >= 2) score += 10;
        else if (shared.length === 0) score -= 10;
    }

    // Lifestyle Habits
    if (user.smoke !== null && candidate.smoke !== null && user.smoke !== candidate.smoke) score -= 15;
    if (user.drink !== null && candidate.drink !== null && user.drink !== candidate.drink) score -= 10;
    
    // Dietary
    if (user.dietaryPreference && candidate.dietaryPreference && user.dietaryPreference !== candidate.dietaryPreference) {
        if (user.dietaryPreference.toLowerCase().includes('veg') !== candidate.dietaryPreference.toLowerCase().includes('veg')) {
            score -= 15;
        }
    }

    return Math.min(100, Math.max(0, score));
}

// 3. Finance (15%)
function calculateFinanceScore(user: Profile, candidate: Profile): number {
    let score = 100;
    if (!candidate.occupation && !candidate.annualIncome) score -= 20;
    return Math.max(0, score);
}

// 4. Physical Attributes (10%)
function calculatePhysicalScore(user: Profile, candidate: Profile): number {
    let score = 100;
    const ageDiff = Math.abs(user.age - candidate.age);
    if (ageDiff > 10) score -= 30;
    else if (ageDiff > 5) score -= 15;
    return Math.max(0, score);
}

// 5. Family (15%)
function calculateFamilyScoreSub(user: Profile, candidate: Profile): number {
    let score = 100;
    if (user.familyValues && candidate.familyValues && user.familyValues !== candidate.familyValues) {
        score -= 20;
    }
    if (user.familyType && candidate.familyType && user.familyType !== candidate.familyType) {
        score -= 10;
    }
    
    const myCS = user.culturalScore ?? computeCulturalScore(user.location);
    const theirCS = candidate.culturalScore ?? computeCulturalScore(candidate.location);
    const culturalDistance = Math.abs(myCS - theirCS);
    if (culturalDistance > 40) score -= 25;
    else if (culturalDistance > 20) score -= 10;

    return Math.max(0, score);
}

// 6. Spouse Expectations (20%)
function calculateExpectationsScore(candidate: Profile, prefs?: any): { score: number, dealbreaker?: string } {
    let score = 100;
    let dealbreaker;

    if (!prefs) return { score };

    // Strict Knanaya check
    if (prefs.strictKnanayaRequired && candidate.rite !== 'KNANAYA_CATHOLIC') {
        return { score: 0, dealbreaker: 'Not within the Knanaya Catholic community' };
    }

    if (prefs.preferredRites && prefs.preferredRites.length > 0) {
        if (!prefs.preferredRites.includes(candidate.rite)) {
            score -= 40;
        }
    }

    if (prefs.orthodoxBridgeRequired && !candidate.orthodoxBridge) {
        score -= 30;
    }

    if (candidate.age < prefs.minAge || candidate.age > prefs.maxAge) {
        const ageDiff = Math.min(
            Math.abs(candidate.age - prefs.minAge),
            Math.abs(candidate.age - prefs.maxAge)
        );
        if (ageDiff <= 3) {
            score -= 15;
        } else {
            score -= 35;
        }
    }

    if (score < 40 && !dealbreaker) {
        dealbreaker = 'Multiple preference mismatches detected';
    }

    return { score: Math.max(0, score), dealbreaker };
}

export function calculateCompatibility(
    userProfile: Profile & { user?: { ghostMode: boolean } },
    candidateProfile: Profile,
    userPrefs?: { minAge: number; maxAge: number; orthodoxBridgeRequired: boolean; strictKnanayaRequired: boolean; preferredRites: Rite[] } | null
): CompatibilityResult {
    // Hard Dealbreaker inverse check
    if (candidateProfile.strictKnanaya && userProfile.rite !== 'KNANAYA_CATHOLIC') {
        return {
            overallPercentage: 0,
            score: 'red',
            dealbreaker: 'Requires Knanaya Catholic community match',
            breakdown: { religion: 0, personality: 0, finance: 0, physical: 0, family: 0, expectations: 0 },
            culturalDistance: 0,
            culturalAlignment: 0
        };
    }

    const relScore = calculateReligionScore(userProfile, candidateProfile);
    const perScore = calculatePersonalityScore(userProfile, candidateProfile);
    const finScore = calculateFinanceScore(userProfile, candidateProfile);
    const phyScore = calculatePhysicalScore(userProfile, candidateProfile);
    const famScore = calculateFamilyScoreSub(userProfile, candidateProfile);
    
    const expResult = calculateExpectationsScore(candidateProfile, userPrefs);
    const expScore = expResult.score;
    let dealbreaker = expResult.dealbreaker;

    // Weights
    const wRel = 0.25;
    const wExp = 0.20;
    const wFam = 0.15;
    const wPer = 0.15;
    const wFin = 0.15;
    const wPhy = 0.10;

    let overallPercentage = 
        (relScore * wRel) + 
        (expScore * wExp) + 
        (famScore * wFam) + 
        (perScore * wPer) + 
        (finScore * wFin) + 
        (phyScore * wPhy);

    overallPercentage = Math.round(overallPercentage);

    if (expScore === 0 && dealbreaker) {
        overallPercentage = 0; // Hard dealbreaker
    }

    const baseTier: CompatibilityResult['score'] =
        overallPercentage >= 75 ? 'green' : overallPercentage >= 50 ? 'yellow' : 'red';

    // Diaspora Bridge
    const myCS = userProfile.culturalScore ?? computeCulturalScore(userProfile.location);
    const theirCS = candidateProfile.culturalScore ?? computeCulturalScore(candidateProfile.location);
    const culturalDistance = Math.abs(myCS - theirCS);
    const culturalAlignment = Math.max(0, 100 - culturalDistance);

    // Legacy family score for backward compatibility in other parts of the app
    const riteMatchBonus = userProfile.rite === candidateProfile.rite ? 15 :
        getRiteFamily(userProfile.rite) === getRiteFamily(candidateProfile.rite) ? 8 : 0;
    const legacyFamilyScore = Math.min(98, Math.max(50, 65 + riteMatchBonus + (culturalAlignment * 0.15)));

    const riteInsight = RITE_AI_INSIGHTS[candidateProfile.rite] || 'brings a sincere Catholic faith that forms a strong foundation.';
    const aiInsight = `This candidate ${riteInsight} ${culturalAlignment >= 80 ? 'Cultural expectations are well-aligned — ideal for back-home families.' : culturalDistance <= 30 ? 'Cultural balance is manageable with open communication.' : 'Be prepared to bridge cultural expectations between diaspora and home.'}`;

    return { 
        overallPercentage,
        score: baseTier, 
        dealbreaker,
        breakdown: {
            religion: Math.round(relScore),
            personality: Math.round(perScore),
            finance: Math.round(finScore),
            physical: Math.round(phyScore),
            family: Math.round(famScore),
            expectations: Math.round(expScore)
        },
        familyScore: Math.round(legacyFamilyScore),
        individualScore: Math.min(99, Math.max(50, overallPercentage)),
        culturalDistance: Math.round(culturalDistance),
        culturalAlignment: Math.round(culturalAlignment),
        aiInsight
    };
}
