import { z } from 'zod';

export const updateProfileSchema = z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    age: z.number().int().min(18).max(99).optional(),
    gender: z.enum(['male', 'female']).optional(),
    location: z.string().max(200).optional(),
    rite: z.enum(['SYRO_MALABAR', 'LATIN', 'KNANAYA_CATHOLIC', 'MALANKARA_ORTHODOX', 'SYRO_MALANKARA', 'OTHER']).optional(),
    parish: z.string().max(200).optional(),
    bio: z.string().max(1000).optional(),
    education: z.string().max(100).optional(),
    dietaryPreference: z.string().max(50).optional(),
    hobbies: z.array(z.string().max(50)).max(10).optional(),
    orthodoxBridge: z.boolean().optional(),
    strictKnanaya: z.boolean().optional(),
});

export const updatePreferencesSchema = z.object({
    minAge: z.number().int().min(18).max(99).optional(),
    maxAge: z.number().int().min(18).max(99).optional(),
    preferredRites: z.array(z.enum(['SYRO_MALABAR', 'LATIN', 'KNANAYA_CATHOLIC', 'MALANKARA_ORTHODOX', 'SYRO_MALANKARA', 'OTHER'])).optional(),
    preferredEducation: z.string().optional(),
    preferredDiet: z.string().optional(),
    orthodoxBridgeRequired: z.boolean().optional(),
    strictKnanayaRequired: z.boolean().optional(),
});
