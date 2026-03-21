import { z } from 'zod';

export const sendMessageSchema = z.object({
    text: z.string().min(1, 'Message cannot be empty').max(2000),
});

export const sendKitchenMessageSchema = z.object({
    text: z.string().min(1).max(2000),
    senderName: z.string().min(1).max(50),
});
