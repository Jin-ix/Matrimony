/**
 * Dynamic scoring utilities for Kitchen Table 2.0 features.
 * Computes culturalDistance, compatibilityScore, and generates
 * profile-specific AI insight text from real profile data.
 */

/** 
 * Estimate how "Westernised" a location is (0 = Kerala-rooted, 100 = fully Western)
 */
export function computeCulturalDistance(location: string): number {
    if (!location) return 50;
    const loc = location.toLowerCase();

    // Strong India / Kerala indicators
    if (loc.includes('kerala') || loc.includes('kochi') || loc.includes('trivandrum') ||
        loc.includes('thrissur') || loc.includes('calicut') || loc.includes('kannur') ||
        loc.includes('kottayam') || loc.includes('palakkad') || loc.includes('malappuram')) return 8;

    // Rest of India
    if (loc.includes('india') || loc.includes('mumbai') || loc.includes('bangalore') ||
        loc.includes('chennai') || loc.includes('delhi') || loc.includes('hyderabad') ||
        loc.includes('pune') || loc.includes('kolkata')) return 22;

    // Gulf countries — partially westernised NRIs
    if (loc.includes('dubai') || loc.includes('abu dhabi') || loc.includes('qatar') ||
        loc.includes('kuwait') || loc.includes('bahrain') || loc.includes('saudi') ||
        loc.includes('uae') || loc.includes('oman')) return 42;

    // Singapore / Malaysia  
    if (loc.includes('singapore') || loc.includes('malaysia') || loc.includes('kuala')) return 50;

    // European countries
    if (loc.includes('uk') || loc.includes('united kingdom') || loc.includes('london') ||
        loc.includes('germany') || loc.includes('france') || loc.includes('italy') ||
        loc.includes('ireland') || loc.includes('spain') || loc.includes('netherlands') ||
        loc.includes('belgium') || loc.includes('austria') || loc.includes('switzerland')) return 70;

    // Australia / New Zealand
    if (loc.includes('australia') || loc.includes('sydney') || loc.includes('melbourne') ||
        loc.includes('brisbane') || loc.includes('perth') || loc.includes('new zealand')) return 72;

    // Canada
    if (loc.includes('canada') || loc.includes('toronto') || loc.includes('vancouver') ||
        loc.includes('montreal') || loc.includes('calgary') || loc.includes('ottawa')) return 78;

    // United States
    if (loc.includes('usa') || loc.includes('united states') || loc.includes('chicago') ||
        loc.includes('new york') || loc.includes('houston') || loc.includes('dallas') ||
        loc.includes('san francisco') || loc.includes('los angeles') || loc.includes('seattle') ||
        loc.includes('boston') || loc.includes('miami') || loc.includes('atlanta') ||
        loc.includes(', al') || loc.includes(', ak') || loc.includes(', az') ||
        loc.includes(', ca') || loc.includes(', co') || loc.includes(', fl') ||
        loc.includes(', ga') || loc.includes(', il') || loc.includes(', in') ||
        loc.includes(', ma') || loc.includes(', mi') || loc.includes(', mn') ||
        loc.includes(', mo') || loc.includes(', nc') || loc.includes(', nj') ||
        loc.includes(', ny') || loc.includes(', oh') || loc.includes(', or') ||
        loc.includes(', pa') || loc.includes(', sc') || loc.includes(', tn') ||
        loc.includes(', tx') || loc.includes(', va') || loc.includes(', wa')) return 82;

    // Default: unknown
    return 50;
}

const RITE_COMPATIBILITY: Record<string, string[]> = {
    'KNANAYA_CATHOLIC': ['KNANAYA_CATHOLIC'],
    'SYRO_MALABAR': ['SYRO_MALABAR', 'KNANAYA_CATHOLIC', 'LATIN'],
    'LATIN': ['LATIN', 'SYRO_MALABAR', 'SYRO_MALANKARA'],
    'SYRO_MALANKARA': ['SYRO_MALANKARA', 'LATIN', 'MALANKARA_ORTHODOX'],
    'MALANKARA_ORTHODOX': ['MALANKARA_ORTHODOX', 'SYRO_MALANKARA'],
};

/**
 * Compute a 0–100 individual compatibility score based on profile fields.
 */
export function computeIndividualCompatibility(
    myRite: string,
    theirRite: string,
    myLocation: string,
    theirLocation: string,
    myAge: number,
    theirAge: number,
    myHobbies: string[],
    theirHobbies: string[],
): number {
    let score = 60; // baseline

    // Rite compatibility (+20 max)
    const compatibleRites = RITE_COMPATIBILITY[myRite] || [];
    if (myRite === theirRite) score += 20;
    else if (compatibleRites.includes(theirRite)) score += 10;

    // Cultural distance alignment (+10 max)
    const myCD = computeCulturalDistance(myLocation);
    const theirCD = computeCulturalDistance(theirLocation);
    const cdDiff = Math.abs(myCD - theirCD);
    if (cdDiff <= 15) score += 10;
    else if (cdDiff <= 30) score += 5;

    // Age gap (+10 max)
    const ageDiff = Math.abs(myAge - theirAge);
    if (ageDiff <= 2) score += 10;
    else if (ageDiff <= 5) score += 6;
    else if (ageDiff <= 8) score += 3;

    // Hobby overlap (+10 max)
    const myH = myHobbies.map(h => h.toLowerCase());
    const theirH = theirHobbies.map(h => h.toLowerCase());
    const overlap = myH.filter(h => theirH.some(t => t.includes(h) || h.includes(t))).length;
    score += Math.min(10, overlap * 3);

    return Math.min(99, Math.max(50, score));
}

/**
 * Family values alignment score — derived from rite and cultural distance similarity.
 */
export function computeFamilyValuesScore(
    myRite: string,
    theirRite: string,
    myLocation: string,
    theirLocation: string,
): number {
    let score = 65;

    if (myRite === theirRite) score += 15;
    else {
        const compatible = RITE_COMPATIBILITY[myRite] || [];
        if (compatible.includes(theirRite)) score += 8;
    }

    const myCD = computeCulturalDistance(myLocation);
    const theirCD = computeCulturalDistance(theirLocation);
    const diff = Math.abs(myCD - theirCD);
    if (diff <= 10) score += 12;
    else if (diff <= 25) score += 8;
    else if (diff <= 40) score += 3;

    return Math.min(98, Math.max(55, score));
}

/**
 * AI-generated insight text that is profile-specific.
 */
const RITE_TRAIT_MAP: Record<string, string> = {
    'Syro-Malabar Catholic': 'a deep reverence for the Qurbana liturgy and a strong sense of Knanaya or Palakunnathu lineage',
    'Knanaya Catholic': 'a proud Knanaya heritage and a commitment to endogamous marriage within the community',
    'Latin Catholic': 'a Western Catholic upbringing with a warm, open-hearted approach to interfaith families',
    'Syro-Malankara': 'a Malankara tradition rooted in the Antiochene rite with a spirit of unity and ecumenism',
    'Malankara Orthodox': 'a rich Malankara Orthodox heritage and a heartfelt devotion to St. Thomas Christian roots',
};

export function generateAIInsight(name: string, rite: string, location: string, hobbies: string[]): string {
    const riteTrait = RITE_TRAIT_MAP[rite] || `a strong Catholic faith background`;
    const locationCtx = computeCulturalDistance(location) < 35
        ? `Their Kerala upbringing brings a grounded, family-first worldview that blends beautifully with traditional values.`
        : computeCulturalDistance(location) > 65
        ? `Growing up in ${location} has given them cultural fluency and openness, while remaining firmly anchored in their faith.`
        : `Having lived in ${location}, they carry a thoughtful balance of tradition and modern perspectives.`;

    const hobbyCtx = hobbies.length > 0
        ? ` Their passion for ${hobbies.slice(0, 2).join(' and ')} reflects a person of depth and curiosity.`
        : '';

    return `${name} reflects ${riteTrait}.${hobbyCtx} ${locationCtx} Their commitment to building a faith-centred home aligns closely with your preferences and family values.`;
}
