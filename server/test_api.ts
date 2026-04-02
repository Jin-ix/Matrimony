import { PrismaClient } from '@prisma/client';

async function test() {
    const prisma = new PrismaClient();
    
    // Find a female user
    const femaleUser = await prisma.user.findFirst({
        where: { profile: { gender: 'female' } },
        include: { profile: true }
    });
    
    if (!femaleUser) {
        console.log("No female user found in DB");
        return;
    }

    console.log(`Testing feed for female user: ${femaleUser.profile.firstName} (${femaleUser.id})`);
    
    try {
        const res = await fetch(`http://localhost:3001/api/discovery/feed?limit=20&orthodoxBridge=false&strictKnanaya=false`, {
            headers: { 'x-user-id': femaleUser.id },
        });
        
        const text = await res.text();
        const data = JSON.parse(text);
        if (data.profiles && data.profiles.length > 0) {
            console.log(`Returned profiles: ${data.profiles.length}`);
            for (const p of data.profiles) {
                 console.log(`- Profile: ${p.name} | hasImage: ${!!p.image} | imageLength: ${p.image ? p.image.length : 0}`);
            }
        } else {
            console.log("No profiles returned");
        }
    } catch (e) {
        console.error("Fetch failed", e);
    }
    
    await prisma.$disconnect();
}

test();
