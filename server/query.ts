import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();

async function main() {
    const profiles = await prisma.profile.findMany({
        include: {
            user: {
                include: {
                    photos: true
                }
            }
        }
    });
    
    let out = `Found ${profiles.length} profiles.\n`;
    for (const p of profiles) {
        out += `User: ${p.firstName} ${p.lastName} | Gender: ${p.gender} | Photos: ${p.user.photos.length}\n`;
        for (const photo of p.user.photos) {
            const isAI = photo.url.includes('unsplash');
            const isBase64 = photo.url.startsWith('data:image');
            out += `  - Photo: primary=${photo.isPrimary}, isBase64=${isBase64}, isUnsplash=${isAI}\n`;
            out += `    url length: ${photo.url.length}\n`;
        }
    }
    fs.writeFileSync('./db_output2.txt', out, 'utf8');
}
main().finally(() => prisma.$disconnect());
