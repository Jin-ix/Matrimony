import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        where: { email: { in: ['sebinapeter01@gmail.com', 'Sebastianps01@gmail.com'] } },
        include: { profile: true }
    });
    console.log('Users:', JSON.stringify(users, null, 2));

    const userIds = users.map(u => u.id);

    const interests = await prisma.interest.findMany({
        where: {
            OR: [
                { fromUserId: { in: userIds } },
                { toUserId: { in: userIds } }
            ]
        }
    });
    console.log('Interests:', JSON.stringify(interests, null, 2));

    const notifs = await prisma.notification.findMany({
        where: { userId: { in: userIds } }
    });
    console.log('Notifications:', JSON.stringify(notifs, null, 2));

    const convs = await prisma.conversation.findMany({
        where: {
            participants: {
                some: { userId: { in: userIds } }
            }
        },
        include: { participants: true }
    });
    console.log('Conversations:', JSON.stringify(convs, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
