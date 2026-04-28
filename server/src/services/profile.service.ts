import prisma from '../config/database.js';
import type { Rite } from '@prisma/client';

export async function getProfile(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            profile: true,
            photos: { orderBy: { order: 'asc' } },
            matchPreferences: true,
        },
    });

    if (!user) {
        throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }

    return user;
}

export async function getPublicProfile(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            profile: true,
            photos: { orderBy: { order: 'asc' } },
        },
    });

    if (!user || !user.profile) {
        throw Object.assign(new Error('Profile not found'), { statusCode: 404 });
    }

    return {
        id: user.id,
        role: user.role,
        isVerified: user.isVerified,
        profile: user.profile,
        photos: user.photos,
    };
}

export async function updateProfile(userId: string, data: {
    firstName?: string;
    lastName?: string;
    age?: number;
    dateOfBirth?: Date | string;
    gender?: 'male' | 'female';
    location?: string;
    rite?: Rite;
    parish?: string;
    bio?: string;
    education?: string;
    dietaryPreference?: string;
    hobbies?: string[];
    orthodoxBridge?: boolean;
    strictKnanaya?: boolean;
    weight?: string;
    complexion?: string;
    bloodGroup?: string;
    motherTongue?: string;
    familyValues?: string;
    familyType?: string;
    fatherOccupation?: string;
    motherOccupation?: string;
    siblingsCount?: number;
    spiritualValues?: string;
    sacramentsReceived?: string[];
    occupation?: string;
    employer?: string;
    annualIncome?: string;
    smoke?: boolean;
    drink?: boolean;
    maritalStatus?: string;
    height?: string;
}) {
    let profile = await prisma.profile.findUnique({ where: { userId } });

    if (data.dateOfBirth && !data.age) {
        const dob = new Date(data.dateOfBirth);
        const diffMs = Date.now() - dob.getTime();
        const ageDt = new Date(diffMs); 
        data.age = Math.abs(ageDt.getUTCFullYear() - 1970);
    }

    if (profile) {
        profile = await prisma.profile.update({
            where: { userId },
            data: {
                ...data,
                dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
                updatedAt: new Date(),
            },
        });
    } else {
        profile = await prisma.profile.create({
            data: {
                userId,
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                age: data.age || 25,
                dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
                gender: data.gender || 'male',
                location: data.location || '',
                rite: data.rite || 'SYRO_MALABAR',
                parish: data.parish,
                bio: data.bio,
                education: data.education,
                dietaryPreference: data.dietaryPreference,
                hobbies: data.hobbies || [],
                orthodoxBridge: data.orthodoxBridge ?? false,
                strictKnanaya: data.strictKnanaya ?? false,
                weight: data.weight,
                complexion: data.complexion,
                bloodGroup: data.bloodGroup,
                motherTongue: data.motherTongue,
                familyValues: data.familyValues,
                familyType: data.familyType,
                fatherOccupation: data.fatherOccupation,
                motherOccupation: data.motherOccupation,
                siblingsCount: data.siblingsCount,
                spiritualValues: data.spiritualValues,
                sacramentsReceived: data.sacramentsReceived || [],
                occupation: data.occupation,
                employer: data.employer,
                annualIncome: data.annualIncome,
                smoke: data.smoke,
                drink: data.drink,
                maritalStatus: data.maritalStatus || 'Never Married',
                height: data.height,
            },
        });
    }

    const completeness = calculateProfileCompleteness(profile);
    await prisma.profile.update({
        where: { userId },
        data: { profileComplete: completeness },
    });

    return profile;
}

function calculateProfileCompleteness(profile: {
    firstName: string;
    lastName: string;
    age: number;
    location: string;
    bio: string | null;
    parish: string | null;
    education: string | null;
    hobbies: string[];
}): number {
    let filled = 0;
    const total = 8;

    if (profile.firstName) filled++;
    if (profile.lastName) filled++;
    if (profile.age) filled++;
    if (profile.location) filled++;
    if (profile.bio) filled++;
    if (profile.parish) filled++;
    if (profile.education) filled++;
    if (profile.hobbies.length > 0) filled++;

    return Math.round((filled / total) * 100);
}

export async function updatePreferences(userId: string, data: {
    minAge?: number;
    maxAge?: number;
    preferredRites?: Rite[];
    preferredEducation?: string;
    preferredDiet?: string;
    orthodoxBridgeRequired?: boolean;
    strictKnanayaRequired?: boolean;
    weightReligion?: number;
    weightPersonality?: number;
    weightFinance?: number;
    weightPhysical?: number;
    weightFamily?: number;
    weightExpectations?: number;
}) {
    let prefs = await prisma.matchPreferences.findUnique({ where: { userId } });

    if (prefs) {
        prefs = await prisma.matchPreferences.update({
            where: { userId },
            data,
        });
    } else {
        prefs = await prisma.matchPreferences.create({
            data: {
                userId,
                minAge: data.minAge ?? 21,
                maxAge: data.maxAge ?? 40,
                preferredRites: data.preferredRites || [],
                orthodoxBridgeRequired: data.orthodoxBridgeRequired ?? false,
                strictKnanayaRequired: data.strictKnanayaRequired ?? false,
                preferredEducation: data.preferredEducation,
                preferredDiet: data.preferredDiet,
                weightReligion: data.weightReligion ?? 25,
                weightPersonality: data.weightPersonality ?? 15,
                weightFinance: data.weightFinance ?? 15,
                weightPhysical: data.weightPhysical ?? 10,
                weightFamily: data.weightFamily ?? 15,
                weightExpectations: data.weightExpectations ?? 20,
            },
        });
    }

    return prefs;
}

export async function getPreferences(userId: string) {
    return prisma.matchPreferences.findUnique({ where: { userId } });
}

export async function saveOnboardingResponse(
    userId: string,
    step: number,
    question: string,
    answer: string
) {
    return prisma.onboardingResponse.create({
        data: { userId, step, question, answer },
    });
}

export async function toggleGhostMode(userId: string, enabled: boolean) {
    return prisma.user.update({
        where: { id: userId },
        data: { ghostMode: enabled },
    });
}
