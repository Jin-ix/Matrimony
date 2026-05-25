async function testHttp() {
    const userId = 'cfe43df0-5fde-47fb-9196-922ccdb8c9b5'; // Jinix
    const userRole = 'candidate';
    const API = 'http://localhost:3001/api';

    const headers = {
        'Content-Type': 'application/json',
        'x-user-id': userId,
        'x-user-role': userRole
    };

    const endpoints = [
        `${API}/conversations`,
        `${API}/interactions/sent`,
        `${API}/interactions/received`
    ];

    console.log('Sending real HTTP requests to running server...');

    for (const url of endpoints) {
        try {
            console.log(`\nFetching ${url}...`);
            const res = await fetch(url, { headers });
            if (res.ok) {
                const json = await res.json();
                console.log(`\nURL: ${url}`);
                console.log(`Success! Array length: ${json.length}`);
                
                if (url.endsWith('/conversations')) {
                    const RITE_DISPLAY: Record<string, string> = {
                        SYRO_MALABAR: 'Syro-Malabar', LATIN: 'Latin',
                        KNANAYA_CATHOLIC: 'Knanaya Catholic', MALANKARA_ORTHODOX: 'Malankara Orthodox',
                        SYRO_MALANKARA: 'Syro-Malankara', OTHER: 'Other',
                    };
                    const getAvatar = (photoUrl?: string, gender?: string) => {
                        if (photoUrl) return photoUrl;
                        return gender === 'female' ? 'female' : 'male';
                    };
                    const builtMatches = json.map((conv: any) => ({
                        conversationId: conv.id,
                        matchUser: {
                            id: conv.matchUser?.id || '',
                            name: conv.matchUser?.name || 'Unknown',
                            avatar: getAvatar(conv.matchUser?.avatar, conv.matchUser?.gender),
                            location: conv.matchUser?.location || undefined,
                            rite: RITE_DISPLAY[conv.matchUser?.rite || ''] || conv.matchUser?.rite || undefined,
                            age: conv.matchUser?.age || undefined,
                            photoVisibilityOptIn: conv.matchUser?.photoVisibilityOptIn ?? false,
                            isVerified: conv.matchUser?.isVerified ?? false,
                        },
                        lastMessage: conv.lastMessage?.text,
                        lastMessageTime: conv.lastMessage?.timestamp,
                    }));
                    console.log('Built Matches:', builtMatches);
                } else if (url.endsWith('/interactions/received')) {
                    const RITE_DISPLAY: Record<string, string> = {
                        SYRO_MALABAR: 'Syro-Malabar', LATIN: 'Latin',
                        KNANAYA_CATHOLIC: 'Knanaya Catholic', MALANKARA_ORTHODOX: 'Malankara Orthodox',
                        SYRO_MALANKARA: 'Syro-Malankara', OTHER: 'Other',
                    };
                    const getAvatar = (photoUrl?: string, gender?: string) => {
                        if (photoUrl) return photoUrl;
                        return gender === 'female' ? 'female' : 'male';
                    };
                    const builtReceived = json.map((r: any) => {
                        const sender = r.fromUser;
                        const profile = sender?.profile;
                        const photo = sender?.photos?.[0];
                        const isMutual = false;
                        return {
                            interestId: r.id,
                            userId: r.fromUserId,
                            user: {
                                id: r.fromUserId,
                                name: profile ? `${profile.firstName} ${profile.lastName || ''}`.trim() : 'Unknown',
                                location: profile?.location || undefined,
                                rite: RITE_DISPLAY[profile?.rite || ''] || profile?.rite || undefined,
                                age: profile?.age || undefined,
                                avatar: getAvatar(photo?.url, profile?.gender),
                                photoVisibilityOptIn: sender?.photoVisibilityOptIn ?? false,
                                isVerified: sender?.isVerified ?? false,
                            },
                            createdAt: r.createdAt,
                            isMutual,
                            conversationId: undefined,
                        };
                    });
                    console.log('Built Received:', builtReceived);
                }
            } else {
                const text = await res.text();
                console.log(`Error body: ${text}`);
            }
        } catch (err: any) {
            console.error(`Fetch error for ${url}:`, err.message, err.stack);
        }
    }
}

testHttp();
