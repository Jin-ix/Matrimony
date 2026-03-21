import prisma from '../config/database.js';

// In production, use Redis or a dedicated OTP store with TTL
const otpStore = new Map<string, { otp: string; expiresAt: Date }>();

export function generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOtp(phone: string): Promise<{ success: boolean; message: string }> {
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    otpStore.set(phone, { otp, expiresAt });

    // In production, send via Twilio:
    // const twilio = require('twilio')(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    // await twilio.messages.create({
    //   body: `Your ICM verification code is: ${otp}`,
    //   from: env.TWILIO_PHONE_NUMBER,
    //   to: phone,
    // });

    console.log(`📱 OTP for ${phone}: ${otp} (dev mode)`);

    return { success: true, message: 'OTP sent successfully' };
}

export async function verifyOtp(phone: string, otp: string): Promise<boolean> {
    const stored = otpStore.get(phone);

    if (!stored) return false;
    if (new Date() > stored.expiresAt) {
        otpStore.delete(phone);
        return false;
    }
    if (stored.otp !== otp) return false;

    otpStore.delete(phone);

    // Mark phone as verified
    await prisma.user.updateMany({
        where: { phone },
        data: { isPhoneVerified: true },
    });

    return true;
}
