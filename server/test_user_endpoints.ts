import { PrismaClient } from '@prisma/client';
import { getUserConversations } from './src/services/conversation.service.js';
import { getSentInterests, getReceivedInterests } from './src/services/interaction.service.js';

const prisma = new PrismaClient();

async function testUser(email: string) {
    console.log(`\n================ Testing endpoints for ${email} ================`);
    const user = await prisma.user.findUnique({
        where: { email },
        include: { profile: true }
    });

    if (!user) {
        console.log(`User with email ${email} not found.`);
        return;
    }

    console.log(`User ID: ${user.id}`);
    console.log(`Profile completed: ${user.profile?.profileComplete}`);

    try {
        console.log('1. Calling getUserConversations...');
        const convs = await getUserConversations(user.id);
        console.log(`Success! Count: ${convs.length}`);
        console.log('Sample conv:', JSON.stringify(convs[0] || null, null, 2));
    } catch (e: any) {
        console.error('FAILED getUserConversations:', e.message, e.stack);
    }

    try {
        console.log('2. Calling getSentInterests...');
        const sent = await getSentInterests(user.id);
        console.log(`Success! Count: ${sent.length}`);
        console.log('Sample sent:', JSON.stringify(sent[0] || null, null, 2));
    } catch (e: any) {
        console.error('FAILED getSentInterests:', e.message, e.stack);
    }

    try {
        console.log('3. Calling getReceivedInterests...');
        const received = await getReceivedInterests(user.id);
        console.log(`Success! Count: ${received.length}`);
        console.log('Sample received:', JSON.stringify(received[0] || null, null, 2));
    } catch (e: any) {
        console.error('FAILED getReceivedInterests:', e.message, e.stack);
    }
}

async function run() {
    await testUser('sebinapeter01@gmail.com');
    await testUser('Sebastianps01@gmail.com');
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
