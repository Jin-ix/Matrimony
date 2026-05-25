import { PrismaClient } from '@prisma/client';

async function check() {
    const prisma = new PrismaClient();
    try {
        const result = await prisma.$queryRawUnsafe(`
            SELECT tablename, rowsecurity 
            FROM pg_tables 
            WHERE schemaname = 'public'
        `);
        console.log(result);
    } finally {
        await prisma.$disconnect();
    }
}

check();
