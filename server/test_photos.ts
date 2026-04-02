import { PrismaClient } from '@prisma/client';

async function check() {
    const prisma = new PrismaClient();
    try {
        const u = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: { profile: true, photos: true }
        });
        
        console.log(`Checking latest 10 users:`);
        for (const user of u) {
            console.log(`User: ${user.profile?.firstName} (id: ${user.id}) | Photos count: ${user.photos.length}`);
            for (const p of user.photos) {
                 console.log(`  - Photo id: ${p.id} | Primary: ${p.isPrimary} | URL length: ${p.url.length}`);
            }
        }
    } finally {
        await prisma.$disconnect();
    }
}

check();
