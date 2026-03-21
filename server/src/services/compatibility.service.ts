import prisma from '../config/database.js';
import type { Profile, Rite } from '@prisma/client';

interface CompatibilityResult {
    score: 'green' | 'yellow' | 'red';
    dealbreaker?: string;
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
                score -= 10; // Slightly outside range
            } else {
                score -= 25; // Significantly outside range
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
    const compatibility: CompatibilityResult['score'] =
        score >= 70 ? 'green' : score >= 45 ? 'yellow' : 'red';

    if (compatibility === 'red' && !dealbreaker) {
        dealbreaker = 'Multiple preference mismatches detected';
    }

    return { score: compatibility, dealbreaker };
}
