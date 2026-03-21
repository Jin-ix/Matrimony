import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log('Fetching users and profiles from Prisma...');
    const users = await prisma.user.findMany({ include: { profile: true } });
    console.log('Total Users:', users.length);
    if (users.length > 0) {
        console.log('First user:', users[0]);
    }
}
main().finally(() => prisma.$disconnect());
