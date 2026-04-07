// LinkedIn OAuth2 service
// In production, implement the full OAuth2 flow
// For now, this provides the scaffolding

import { env } from '../config/env.js';

const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_PROFILE_URL = 'https://api.linkedin.com/v2/userinfo';

export function getLinkedInAuthUrl(state?: string): string {
    // If we're using mock mode (no client ID), skip the real LinkedIn auth 
    // and just redirect directly to our local callback with a fake code to trigger mock scraping.
    if (!env.LINKEDIN_CLIENT_ID) {
        const redirectUri = env.LINKEDIN_REDIRECT_URI || 'http://localhost:3001/api/auth/linkedin/callback';
        const params = new URLSearchParams({ code: 'mock_code_123' });
        if (state) params.append('state', state);
        return `${redirectUri}?${params.toString()}`;
    }

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: env.LINKEDIN_CLIENT_ID,
        redirect_uri: env.LINKEDIN_REDIRECT_URI || '',
        scope: 'openid profile email',
    });
    
    if (state) {
        params.append('state', state);
    }
    
    return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
}

export interface LinkedInProfileData {
    linkedInId: string;
    name: string;
    email?: string;
    occupation?: string;
    employer?: string;
    education?: string;
}

export async function exchangeLinkedInCode(code: string): Promise<LinkedInProfileData> {
    // In production, exchange code for access token, then fetch profile
    // For development, return mock data
    if (!env.LINKEDIN_CLIENT_ID || !env.LINKEDIN_CLIENT_SECRET) {
        console.log('⚠️ LinkedIn OAuth not configured, using mock scraped data');
        
        // Simulate scraping delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        return {
            linkedInId: `linkedin_${Date.now()}`,
            name: 'Mock LinkedIn User',
            email: undefined,
            occupation: 'Software Engineer',
            employer: 'Tech Innovations Inc.',
            education: 'B.Tech in Computer Science',
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

    // Fetch basic profile
    const profileResponse = await fetch(LINKEDIN_PROFILE_URL, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await profileResponse.json() as { sub: string; name: string; email?: string };
    
    // Simulating scraping the public profile data using third-party APIs here in production
    // e.g. proxycurl
    
    return {
        linkedInId: profile.sub,
        name: profile.name,
        email: profile.email,
        occupation: 'Scraped Occupation', // placeholder for actual scraped data
        employer: 'Scraped Employer',     // placeholder for actual scraped data
        education: 'Scraped Education',   // placeholder for actual scraped data
    };
}
