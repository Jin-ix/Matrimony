import { PrismaClient } from '@prisma/client';
import { getUserConversations } from './src/services/conversation.service.js';
import { getSentInterests, getReceivedInterests } from './src/services/interaction.service.js';

const prisma = new PrismaClient();

async function checkAll() {
    console.log('Fetching all users...');
    const users = await prisma.user.findMany({
        select: { id: true, email: true, phone: true }
    });
    console.log(`Found ${users.length} users. Checking each for API errors...`);

    let errorCount = 0;
    for (const user of users) {
        try {
            // Simulate getUserConversations
            const convs = await getUserConversations(user.id);
            // Simulate getSentInterests
            const sent = await getSentInterests(user.id);
            // Simulate getReceivedInterests
            const received = await getReceivedInterests(user.id);
            
            // console.log(`User ${user.id} (${user.email || user.phone}) - Ok. Convs: ${convs.length}, Sent: ${sent.length}, Recv: ${received.length}`);
        } catch (err) {
            console.error(`ERROR for user ${user.id} (${user.email || user.phone}):`, err);
            errorCount++;
        }
    }
    console.log(`Check complete. Total errors found: ${errorCount}`);
}

checkAll()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
