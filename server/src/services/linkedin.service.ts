// LinkedIn OAuth2 service
// In production, implement the full OAuth2 flow
// For now, this provides the scaffolding

import { env } from '../config/env.js';

const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_PROFILE_URL = 'https://api.linkedin.com/v2/userinfo';

export function getLinkedInAuthUrl(): string {
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: env.LINKEDIN_CLIENT_ID || '',
        redirect_uri: env.LINKEDIN_REDIRECT_URI || '',
        scope: 'openid profile email',
    });
    return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
}

export async function exchangeLinkedInCode(code: string): Promise<{ linkedInId: string; name: string; email?: string }> {
    // In production, exchange code for access token, then fetch profile
    // For development, return mock data
    if (!env.LINKEDIN_CLIENT_ID || !env.LINKEDIN_CLIENT_SECRET) {
        console.log('⚠️ LinkedIn OAuth not configured, using mock data');
        return {
            linkedInId: `linkedin_${Date.now()}`,
            name: 'Mock LinkedIn User',
            email: undefined,
        };
    }

    // Token exchange
    const tokenResponse = await fetch(LINKEDIN_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: env.LINKEDIN_REDIRECT_URI || '',
            client_id: env.LINKEDIN_CLIENT_ID,
            client_secret: env.LINKEDIN_CLIENT_SECRET,
        }),
    });

    const tokenData = await tokenResponse.json() as { access_token: string };

    // Fetch profile
    const profileResponse = await fetch(LINKEDIN_PROFILE_URL, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await profileResponse.json() as { sub: string; name: string; email?: string };

    return {
        linkedInId: profile.sub,
        name: profile.name,
        email: profile.email,
    };
}
