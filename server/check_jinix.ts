import { PrismaClient } from '@prisma/client';

async function check() {
    const prisma = new PrismaClient();
    try {
        const u = await prisma.user.findFirst({
            where: { profile: { firstName: { startsWith: 'Jinix' } } },
            include: { profile: true }
        });
        console.log(JSON.stringify(u, null, 2));
    } finally {
        await prisma.$disconnect();
    }
}
check();
