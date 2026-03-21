import { PrismaClient, Rite, Gender, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Clear existing data
    await prisma.onboardingResponse.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.notificationPreferences.deleteMany();
    await prisma.kitchenMessage.deleteMany();
    await prisma.kitchenTableMember.deleteMany();
    await prisma.kitchenTable.deleteMany();
    await prisma.message.deleteMany();
    await prisma.conversationParticipant.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.interest.deleteMany();
    await prisma.matchPreferences.deleteMany();
    await prisma.photo.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.user.deleteMany();

    const passwordHash = await bcrypt.hash('password123', 12);

    // Create seed profiles matching the frontend MOCK_PROFILES
    const profiles = [
        {
            phone: '+11111111101',
            email: 'johan@example.com',
            role: 'candidate' as UserRole,
            profile: {
                firstName: 'Johan',
                lastName: 'Mathew',
                age: 28,
                gender: 'male' as Gender,
                location: 'Chicago, IL',
                rite: 'SYRO_MALABAR' as Rite,
                parish: 'St. Thomas Cathedral, Chicago',
                bio: 'Passionate about faith, family, and building a life built on strong Catholic values.',
                education: 'Masters',
                dietaryPreference: 'Non-Vegetarian',
                hobbies: ['Photography', 'Theology', 'Hiking'],
                orthodoxBridge: true,
                strictKnanaya: false,
            },
            photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80',
        },
        {
            phone: '+11111111102',
            email: 'maria@example.com',
            role: 'candidate' as UserRole,
            profile: {
                firstName: 'Maria',
                lastName: 'Thomas',
                age: 26,
                gender: 'female' as Gender,
                location: 'Kerala, India',
                rite: 'SYRO_MALABAR' as Rite,
                parish: 'Sacred Heart Church, Kottayam',
                bio: 'Looking for someone similarly rooted in faith and family values.',
                education: 'Bachelors',
                dietaryPreference: 'Vegetarian',
                hobbies: ['Reading', 'Cooking', 'Music'],
                orthodoxBridge: true,
                strictKnanaya: false,
            },
            photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80',
        },
        {
            phone: '+11111111103',
            email: 'thomas@example.com',
            role: 'candidate' as UserRole,
            profile: {
                firstName: 'Thomas',
                lastName: 'Kurian',
                age: 30,
                gender: 'male' as Gender,
                location: 'New York, NY',
                rite: 'LATIN' as Rite,
                parish: 'St. Patricks Cathedral, NYC',
                bio: 'A thoughtful soul seeking a faith-driven partnership.',
                education: 'Masters',
                dietaryPreference: 'Non-Vegetarian',
                hobbies: ['Music', 'Writing', 'Volunteering'],
                orthodoxBridge: false,
                strictKnanaya: false,
            },
            photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80',
        },
        {
            phone: '+11111111104',
            email: 'mathew@example.com',
            role: 'candidate' as UserRole,
            profile: {
                firstName: 'Mathew',
                lastName: 'Philip',
                age: 31,
                gender: 'male' as Gender,
                location: 'Dallas, TX',
                rite: 'KNANAYA_CATHOLIC' as Rite,
                parish: 'Holy Family Knanaya Church, Dallas',
                bio: 'Rooted in Knanaya traditions, looking for someone from within the community.',
                education: 'Professional Degree',
                dietaryPreference: 'Non-Vegetarian',
                hobbies: ['Cricket', 'Cooking', 'Travel'],
                orthodoxBridge: false,
                strictKnanaya: true,
            },
            photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
        },
        {
            phone: '+11111111105',
            email: 'anna@example.com',
            role: 'candidate' as UserRole,
            profile: {
                firstName: 'Anna',
                lastName: 'Joseph',
                age: 25,
                gender: 'female' as Gender,
                location: 'San Jose, CA',
                rite: 'SYRO_MALABAR' as Rite,
                parish: 'St. Thomas Church, San Jose',
                bio: 'Young professional seeking a partner who values Sunday Mass and community.',
                education: 'Masters',
                dietaryPreference: 'Vegetarian',
                hobbies: ['Dance', 'Reading', 'Gardening'],
                orthodoxBridge: true,
                strictKnanaya: false,
            },
            photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80',
        },
        {
            phone: '+11111111106',
            email: 'george@example.com',
            role: 'candidate' as UserRole,
            profile: {
                firstName: 'George',
                lastName: 'Abraham',
                age: 33,
                gender: 'male' as Gender,
                location: 'Houston, TX',
                rite: 'MALANKARA_ORTHODOX' as Rite,
                parish: 'Malankara Orthodox Church, Houston',
                bio: 'Looking for a partner to share lifes journey, grounded in faith.',
                education: 'Doctorate',
                dietaryPreference: 'Non-Vegetarian',
                hobbies: ['Investing', 'Coffee Roasting', 'Marathons'],
                orthodoxBridge: false,
                strictKnanaya: false,
            },
            photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&q=80',
        },
        {
            phone: '+11111111107',
            email: 'priya@example.com',
            role: 'candidate' as UserRole,
            profile: {
                firstName: 'Priya',
                lastName: 'Varghese',
                age: 27,
                gender: 'female' as Gender,
                location: 'Atlanta, GA',
                rite: 'MALANKARA_ORTHODOX' as Rite,
                parish: 'Orthodox Church, Atlanta',
                bio: 'Art lover and community organizer, looking for a compassionate partner.',
                education: 'Masters',
                dietaryPreference: 'Pescatarian',
                hobbies: ['Painting', 'Yoga', 'Community Outreach'],
                orthodoxBridge: false,
                strictKnanaya: false,
            },
            photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80',
        },
        {
            phone: '+11111111108',
            email: 'sarah@example.com',
            role: 'candidate' as UserRole,
            profile: {
                firstName: 'Sarah',
                lastName: 'Chacko',
                age: 27,
                gender: 'female' as Gender,
                location: 'Seattle, WA',
                rite: 'SYRO_MALABAR' as Rite,
                parish: 'St. Alphonsa Church, Seattle',
                bio: 'Tech professional who loves nature and exploring Gods creation.',
                education: 'Masters',
                dietaryPreference: 'Vegetarian',
                hobbies: ['Hiking', 'Photography', 'Baking'],
                orthodoxBridge: true,
                strictKnanaya: false,
            },
            photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
        },
        {
            phone: '+11111111109',
            email: 'james@example.com',
            role: 'candidate' as UserRole,
            profile: {
                firstName: 'James',
                lastName: 'Tharakan',
                age: 29,
                gender: 'male' as Gender,
                location: 'Boston, MA',
                rite: 'SYRO_MALABAR' as Rite,
                parish: 'Our Lady of Good Health, Boston',
                bio: 'Engineer and musician seeking a life partner rooted in faith.',
                education: 'Masters',
                dietaryPreference: 'Non-Vegetarian',
                hobbies: ['Guitar', 'Coding', 'Church Choir'],
                orthodoxBridge: true,
                strictKnanaya: false,
            },
            photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80',
        },
        {
            phone: '+11111111110',
            email: 'rachel@example.com',
            role: 'candidate' as UserRole,
            profile: {
                firstName: 'Rachel',
                lastName: 'Kurien',
                age: 26,
                gender: 'female' as Gender,
                location: 'Miami, FL',
                rite: 'KNANAYA_CATHOLIC' as Rite,
                parish: 'Knanaya Catholic Church, Miami',
                bio: 'Knanaya girl with a love for gardening, design, and family traditions.',
                education: 'Bachelors',
                dietaryPreference: 'Vegetarian',
                hobbies: ['Gardening', 'Interior Design', 'Reading'],
                orthodoxBridge: false,
                strictKnanaya: true,
            },
            photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80',
        },
    ];

    for (const p of profiles) {
        const user = await prisma.user.create({
            data: {
                phone: p.phone,
                email: p.email,
                passwordHash,
                role: p.role,
                isVerified: true,
                isPhoneVerified: true,
                profile: {
                    create: {
                        ...p.profile,
                        profileComplete: 85,
                    },
                },
                photos: {
                    create: {
                        url: p.photo,
                        isPrimary: true,
                        order: 0,
                    },
                },
                matchPreferences: {
                    create: {
                        minAge: Math.max(21, p.profile.age - 5),
                        maxAge: p.profile.age + 5,
                        preferredRites: [p.profile.rite],
                        orthodoxBridgeRequired: p.profile.orthodoxBridge,
                        strictKnanayaRequired: p.profile.strictKnanaya,
                    },
                },
                notificationPrefs: {
                    create: {
                        newMatches: true,
                        directMessages: true,
                        familyRecommendations: true,
                        emailEnabled: true,
                        smsEnabled: true,
                    },
                },
            },
        });

        console.log(`  ✅ Created user: ${p.profile.firstName} ${p.profile.lastName} (${user.id})`);
    }

    // Create a scout user (Mom / family member)
    const scout = await prisma.user.create({
        data: {
            phone: '+11111111120',
            email: 'aleyamma@example.com',
            passwordHash,
            role: 'scout',
            isVerified: true,
            isPhoneVerified: true,
            profile: {
                create: {
                    firstName: 'Aleyamma',
                    lastName: 'Thomas',
                    age: 55,
                    gender: 'female',
                    location: 'Kerala, India',
                    rite: 'SYRO_MALABAR',
                    parish: 'Sacred Heart Church, Kottayam',
                    bio: 'Looking for the best match for my daughter Maria.',
                    profileComplete: 70,
                },
            },
            notificationPrefs: {
                create: {
                    newMatches: true,
                    directMessages: true,
                    familyRecommendations: true,
                    emailEnabled: true,
                    smsEnabled: true,
                },
            },
        },
    });

    console.log(`  ✅ Created scout: Aleyamma Thomas (${scout.id})`);
    console.log('\n🎉 Seeding complete!');
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error(e);
        prisma.$disconnect();
        process.exit(1);
    });
