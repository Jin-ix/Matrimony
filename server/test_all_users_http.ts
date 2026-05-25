import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAllHttp() {
    console.log('Fetching all users from database...');
    const users = await prisma.user.findMany({
        select: { id: true, email: true, phone: true }
    });

    console.log(`Found ${users.length} users. Testing real HTTP requests to http://localhost:3001/api for each...`);

    const API = 'http://localhost:3001/api';
    let failures = 0;

    for (const user of users) {
        const headers = {
            'Content-Type': 'application/json',
            'x-user-id': user.id,
            'x-user-role': 'candidate'
        };

        const endpoints = [
            `${API}/conversations`,
            `${API}/interactions/sent`,
            `${API}/interactions/received`
        ];

        for (const url of endpoints) {
            try {
                const res = await fetch(url, { headers });
                if (!res.ok) {
                    const text = await res.text();
                    console.error(`\n[FAILURE] User ${user.id} (${user.email || user.phone}) on ${url}`);
                    console.error(`Status: ${res.status} ${res.statusText}`);
                    console.error(`Response: ${text}`);
                    failures++;
                }
            } catch (err: any) {
                console.error(`\n[FETCH ERROR] User ${user.id} on ${url}:`, err.message);
                failures++;
            }
        }
    }

    console.log(`\nTest completed. Total HTTP endpoint failures detected: ${failures}`);
}

testAllHttp()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
