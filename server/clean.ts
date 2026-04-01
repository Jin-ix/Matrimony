import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function clean() {
    const res = await prisma.photo.deleteMany({
        where: {
            url: {
                startsWith: 'blob:'
            }
        }
    });
    console.log('Cleaned blobs:', res);
    await prisma.$disconnect();
}

clean().catch(console.error);
