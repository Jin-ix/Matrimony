import { PrismaClient } from '@prisma/client';
import { processHomepageChat, extractProfileData } from './src/services/ai.service.js';

const prisma = new PrismaClient();

async function main() {
    // 1. Find a user in the database who has a profile
    let user = await prisma.user.findFirst({
        where: {
            profile: {
                isNot: null
            }
        },
        include: { profile: true }
    });

    if (!user) {
        const anyUser = await prisma.user.findFirst();
        if (anyUser) {
            await prisma.profile.create({
                data: {
                    userId: anyUser.id,
                    firstName: 'TestUser',
                    lastName: 'Profile',
                    age: 30,
                    location: 'Kochi',
                    rite: 'LATIN',
                    profileComplete: 50,
                }
            });
            user = await prisma.user.findUnique({
                where: { id: anyUser.id },
                include: { profile: true }
            });
        }
    }

    if (!user) {
        console.error('No users found in database to test.');
        return;
    }

    const userId = user.id;
    console.log(`Testing with user: ${user.profile?.firstName} ${user.profile?.lastName} (ID: ${userId})`);
    console.log(`Initial Profile Data:`, {
        profileComplete: user.profile?.profileComplete,
        spiritualValues: user.profile?.spiritualValues,
        occupation: user.profile?.occupation,
        annualIncome: user.profile?.annualIncome,
        height: user.profile?.height,
        dietaryPreference: user.profile?.dietaryPreference,
        familyType: user.profile?.familyType,
        familyValues: user.profile?.familyValues,
        hobbies: user.profile?.hobbies
    });

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
        const chatRes = await processHomepageChat(userId, q);
        console.log(`Sacred Guide Response:`, JSON.stringify(chatRes, null, 2));
    }

    // 3. Test extractProfileData (Rule-based Fallback)
    console.log('\n--- Testing Onboarding Response Data Extraction ---');
    
    console.log('\nTesting Theme: religion');
    console.log('User message: "I go to Sunday mass regularly and try to pray daily."');
    await extractProfileData(userId, 'religion', 'I go to Sunday mass regularly and try to pray daily.');
    
    console.log('\nTesting Theme: personality');
    console.log('User message: "I enjoy reading books, cooking, and hiking on weekends."');
    await extractProfileData(userId, 'personality', 'I enjoy reading books, cooking, and hiking on weekends.');

    console.log('\nTesting Theme: finance');
    console.log('User message: "I work as a Software Engineer and make about 12 Lakhs a year."');
    await extractProfileData(userId, 'finance', 'I work as a Software Engineer and make about 12 Lakhs a year.');

    console.log('\nTesting Theme: physical');
    console.log('User message: "My height is 5\'11\\" and I am vegetarian."');
    await extractProfileData(userId, 'physical', 'My height is 5\'11" and I am vegetarian.');

    console.log('\nTesting Theme: family');
    console.log('User message: "We are a joint family with traditional values."');
    await extractProfileData(userId, 'family', 'We are a joint family with traditional values.');

    // Fetch updated profile
    const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true }
    });

    console.log(`\nUpdated Profile Data:`, {
        profileComplete: updatedUser?.profile?.profileComplete,
        spiritualValues: updatedUser?.profile?.spiritualValues,
        occupation: updatedUser?.profile?.occupation,
        annualIncome: updatedUser?.profile?.annualIncome,
        height: updatedUser?.profile?.height,
        dietaryPreference: updatedUser?.profile?.dietaryPreference,
        familyType: updatedUser?.profile?.familyType,
        familyValues: updatedUser?.profile?.familyValues,
        hobbies: updatedUser?.profile?.hobbies
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
