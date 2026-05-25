import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('Retrieving users sorted by updatedAt desc...');
    const users = await prisma.user.findMany({
        take: 10,
        orderBy: { updatedAt: 'desc' },
        include: {
            profile: true
        }
    });

    for (const u of users) {
        console.log(`User ID: ${u.id}`);
        console.log(`Email: ${u.email}`);
        console.log(`Name: ${u.profile?.firstName} ${u.profile?.lastName}`);
        console.log(`Updated At: ${u.updatedAt}`);
        console.log('-------------------');
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
