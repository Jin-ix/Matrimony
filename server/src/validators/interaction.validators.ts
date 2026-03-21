import { z } from 'zod';

export const expressInterestSchema = z.object({
    toUserId: z.string().min(1),
    message: z.string().max(500).optional(),
});

export const recommendSchema = z.object({
    toUserId: z.string().min(1),
    message: z.string().max(500).optional(),
});
