// Instagram Basic Display API OAuth service
// Mirrors the LinkedIn service pattern.
// Requires INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET, INSTAGRAM_REDIRECT_URI in .env

import { env } from '../config/env.js';

const INSTAGRAM_AUTH_URL = 'https://api.instagram.com/oauth/authorize';
const INSTAGRAM_TOKEN_URL = 'https://api.instagram.com/oauth/access_token';
const INSTAGRAM_PROFILE_URL = 'https://graph.instagram.com/me';

export function getInstagramAuthUrl(state?: string): string {
    // If no App ID is configured, redirect to callback with a mock code
    if (!env.INSTAGRAM_APP_ID) {
        const redirectUri = env.INSTAGRAM_REDIRECT_URI || 'http://localhost:3001/api/auth/instagram/callback';
        const params = new URLSearchParams({ code: 'mock_ig_code_123' });
        if (state) params.append('state', state);
        return `${redirectUri}?${params.toString()}`;
    }

    const params = new URLSearchParams({
        client_id: env.INSTAGRAM_APP_ID,
        redirect_uri: env.INSTAGRAM_REDIRECT_URI || '',
        scope: 'user_profile,user_media',
        response_type: 'code',
    });

    if (state) params.append('state', state);

    return `${INSTAGRAM_AUTH_URL}?${params.toString()}`;
}

export interface InstagramProfileData {
    instagramId: string;
    username: string;
    name?: string;
    profilePictureUrl?: string;
}

export async function exchangeInstagramCode(code: string): Promise<InstagramProfileData> {
    // Mock fallback when credentials are not configured
    if (!env.INSTAGRAM_APP_ID || !env.INSTAGRAM_APP_SECRET) {
        console.log('⚠️  Instagram OAuth not configured; using mock data');
        await new Promise(resolve => setTimeout(resolve, 800));
        return {
            instagramId: `ig_${Date.now()}`,
            username: 'mock_instagram_user',
            name: 'Mock Instagram User',
            profilePictureUrl: undefined,
        };
    }

    // Exchange authorization code for a short-lived access token
    const tokenRes = await fetch(INSTAGRAM_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: env.INSTAGRAM_APP_ID,
            client_secret: env.INSTAGRAM_APP_SECRET,
            grant_type: 'authorization_code',
            redirect_uri: env.INSTAGRAM_REDIRECT_URI || '',
            code,
        }),
    });

    const tokenData = await tokenRes.json() as { access_token: string; user_id: string };

    // Fetch basic profile (username + id)
    const profileRes = await fetch(
        `${INSTAGRAM_PROFILE_URL}?fields=id,username,name,profile_picture_url&access_token=${tokenData.access_token}`
    );
    const profileData = await profileRes.json() as {
        id: string;
        username: string;
        name?: string;
        profile_picture_url?: string;
    };

    return {
        instagramId: profileData.id ?? tokenData.user_id,
        username: profileData.username,
        name: profileData.name,
        profilePictureUrl: profileData.profile_picture_url,
    };
}
