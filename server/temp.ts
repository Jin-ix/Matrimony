import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'jinix.chacko01@gmail.com' },
    include: { profile: true, photos: true }
  });
  console.log(`Photos found: ${user?.photos?.length}`);
  if (user?.photos && user.photos.length > 0) {
    console.log(`Photo 0 URL length: ${user.photos[0].url.length}`);
    console.log(`Photo 0 URL Start: ${user.photos[0].url.substring(0, 50)}`);
  }
}
main().finally(() => prisma.$disconnect());
