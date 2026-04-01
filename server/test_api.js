import fetch from 'node-fetch';

async function test() {
    // Need a valid user id. The user logged in as female.
    // Let's first get a female user ID from the database using Prisma.
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Find a female user
    const femaleUser = await prisma.user.findFirst({
        where: { profile: { gender: 'female' } },
        include: { profile: true }
    });
    
    console.log(`Testing with user: ${femaleUser.profile.firstName} (${femaleUser.id})`);
    
    try {
        const res = await fetch(`http://localhost:3001/api/discovery/feed?limit=20`, {
            headers: { 'x-user-id': femaleUser.id },
        });
        
        console.log(`Status: ${res.status}`);
        const text = await res.text();
        console.log(`Response length: ${text.length}`);
        
        const data = JSON.parse(text);
        if (data.profiles) {
            console.log(`Returned profiles: ${data.profiles.length}`);
            if (data.profiles.length > 0) {
                console.log(`First profile image: ${data.profiles[0].image ? data.profiles[0].image.substring(0, 50) + '...' : 'none'}`);
            }
        } else {
            console.log("No profiles array in response:", data);
        }
    } catch (e) {
        console.error("Fetch failed", e.message);
    }
    
    await prisma.$disconnect();
}

test();
