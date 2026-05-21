// Mock Prisma Client BEFORE importing ai.service.ts
const mockUser = {
    id: "test-user-id",
    phone: "1234567890",
    email: "test@example.com",
    role: "candidate",
    ghostMode: false,
    photoVisibilityOptIn: true,
    profile: {
        firstName: "Jinix",
        lastName: "Chacko",
        age: 28,
        location: "Kochi, Kerala",
        rite: "SYRO_MALABAR",
        profileComplete: 45,
        spiritualValues: "Traditional",
        occupation: "Engineer",
        annualIncome: "12 Lakhs",
        hobbies: ["Reading"],
    },
    matchPreferences: {
        minAge: 21,
        maxAge: 35,
    },
    sentInteractions: [1, 2, 3],
    receivedInteractions: [1, 2],
};

const mockPrisma = {
    user: {
        findUnique: async () => mockUser,
        findFirst: async () => mockUser,
    },
    profile: {
        findUnique: async () => mockUser.profile,
        update: async ({ where, data }: any) => {
            console.log(`[Mock DB Profile Update] for ${where.userId}:`, data);
            Object.assign(mockUser.profile, data);
            return mockUser.profile;
        },
    },
    conversation: {
        count: async () => 2,
    },
    onboardingResponse: {
        create: async ({ data }: any) => {
            console.log(`[Mock DB OnboardingResponse Create]:`, data);
            return data;
        },
    },
    matchPreferences: {
        findUnique: async () => mockUser.matchPreferences,
        create: async ({ data }: any) => {
            console.log(`[Mock DB MatchPreferences Create]:`, data);
            return data;
        },
    },
};

(globalThis as any).prisma = mockPrisma;

// Now import the service dynamically to prevent hoisting
const { processHomepageChat, extractProfileData } = await import('./src/services/ai.service.js');

async function main() {
    console.log(`Testing with mock user: ${mockUser.profile.firstName} ${mockUser.profile.lastName}`);
    console.log(`Initial Profile Data:`, JSON.stringify(mockUser.profile, null, 2));

    // 2. Test processHomepageChat
    console.log('\n--- Testing Homepage Chat Assistant ---');
    const queries = [
        'hi',
        'who liked me?',
        'show me my matches',
        'how do I complete my profile?',
        'tell me about privacy settings',
        'what is the kitchen table?'
    ];

    for (const q of queries) {
        console.log(`\nUser message: "${q}"`);
        const chatRes = await processHomepageChat(mockUser.id, q);
        console.log(`Sacred Guide Response:`, JSON.stringify(chatRes, null, 2));
    }

    // 3. Test extractProfileData (Rule-based Fallback)
    console.log('\n--- Testing Onboarding Response Data Extraction ---');
    
    console.log('\nTesting Theme: religion');
    console.log('User message: "I go to Sunday mass regularly and try to pray daily."');
    await extractProfileData(mockUser.id, 'religion', 'I go to Sunday mass regularly and try to pray daily.');
    
    console.log('\nTesting Theme: personality');
    console.log('User message: "I enjoy reading books, cooking, and hiking on weekends."');
    await extractProfileData(mockUser.id, 'personality', 'I enjoy reading books, cooking, and hiking on weekends.');

    console.log('\nTesting Theme: finance');
    console.log('User message: "I work as a Software Engineer and make about 12 Lakhs a year."');
    await extractProfileData(mockUser.id, 'finance', 'I work as a Software Engineer and make about 12 Lakhs a year.');

    console.log('\nTesting Theme: physical');
    console.log('User message: "My height is 5\'11\\" and I am vegetarian."');
    await extractProfileData(mockUser.id, 'physical', 'My height is 5\'11" and I am vegetarian.');

    console.log('\nTesting Theme: family');
    console.log('User message: "We are a joint family with traditional values."');
    await extractProfileData(mockUser.id, 'family', 'We are a joint family with traditional values.');

    console.log(`\nUpdated Profile Data:`, JSON.stringify(mockUser.profile, null, 2));
}

main().catch(console.error);
