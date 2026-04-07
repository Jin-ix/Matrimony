import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service.js';
import * as otpService from '../services/otp.service.js';
import * as linkedinService from '../services/linkedin.service.js';
import prisma from '../config/database.js';


export async function register(req: Request, res: Response, next: NextFunction) {
    try {
        const { phone, password, role, email } = req.body;
        const result = await authService.register(phone, password, role, email);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
}

export async function sendOtp(req: Request, res: Response, next: NextFunction) {
    try {
        const { phone } = req.body;
        const result = await otpService.sendOtp(phone);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

export async function verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
        const { phone, otp } = req.body;
        const isValid = await otpService.verifyOtp(phone, otp);
        if (!isValid) {
            res.status(400).json({ error: 'Invalid or expired OTP' });
            return;
        }
        res.json({ success: true, message: 'Phone verified successfully' });
    } catch (error) {
        next(error);
    }
}

export async function login(req: Request, res: Response, next: NextFunction) {
    try {
        const { identifier, password } = req.body;
        const result = await authService.login(identifier, password);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
        const { refreshToken } = req.body;
        const tokens = await authService.refreshTokens(refreshToken);
        res.json(tokens);
    } catch (error) {
        next(error);
    }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
    try {
        await authService.logout(req.user!.userId);
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
    try {
        const { currentPassword, newPassword } = req.body;
        await authService.changePassword(req.user!.userId, currentPassword, newPassword);
        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        next(error);
    }
}

export async function linkedInAuth(req: Request, res: Response) {
    const userId = req.query.userId as string || '';
    const isPopup = req.query.popup === 'true';
    const statePayload = JSON.stringify({ userId, popup: isPopup });
    const state = Buffer.from(statePayload).toString('base64');
    
    const url = linkedinService.getLinkedInAuthUrl(state);
    res.redirect(url);
}

export async function linkedInCallback(req: Request, res: Response, next: NextFunction) {
    try {
        const { code, state } = req.query;
        if (!code || typeof code !== 'string') {
            res.status(400).json({ error: 'Authorization code required' });
            return;
        }
        
        let targetUserId = req.user?.userId;
        let isPopup = false;
        
        if (state && typeof state === 'string') {
            try {
                const parsed = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
                if (parsed.userId) targetUserId = parsed.userId;
                isPopup = parsed.popup;
            } catch (e) {
                // If legacy state isn't base64, try to use it directly
                if (state && state !== 'undefined' && !state.includes('{')) {
                    targetUserId = state;
                }
            }
        }

        const linkedInData = await linkedinService.exchangeLinkedInCode(code);

        if (targetUserId) {
            await authService.linkLinkedIn(
                targetUserId, 
                linkedInData.linkedInId,
                {
                    occupation: linkedInData.occupation,
                    employer: linkedInData.employer,
                    education: linkedInData.education,
                }
            );
        }
        
        if (isPopup) {
            res.send(`
                <html><body>
                <script>
                    if (window.opener) {
                        window.opener.postMessage({ 
                            type: 'LINKEDIN_SUCCESS', 
                            data: ${JSON.stringify(linkedInData)} 
                        }, '*');
                        window.close();
                    }
                </script>
                </body></html>
            `);
            return;
        }
        
        if (targetUserId) {
            res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?linkedin=success`);
        } else {
            res.json({ linkedInData });
        }
    } catch (error) {
        next(error);
    }
}

// ─── Parent–Candidate Link ─────────────────────────────────
// POST /api/auth/link-parent  { parentId, candidateId }
export async function linkParent(req: Request, res: Response, next: NextFunction) {
    try {
        const { parentId, candidateId } = req.body;
        if (!parentId || !candidateId) {
            res.status(400).json({ error: 'parentId and candidateId are required' });
            return;
        }

        // Verify both users exist
        const [parent, candidate] = await Promise.all([
            prisma.user.findUnique({ where: { id: parentId } }),
            prisma.user.findUnique({ where: { id: candidateId } }),
        ]);
        if (!parent) { res.status(404).json({ error: 'Parent user not found' }); return; }
        if (!candidate) { res.status(404).json({ error: 'Candidate user not found' }); return; }

        const link = await prisma.parentCandidateLink.upsert({
            where: { parentId_candidateId: { parentId, candidateId } },
            update: {},
            create: { parentId, candidateId },
        });

        res.status(201).json({ success: true, link });
    } catch (error) {
        next(error);
    }
}

// GET /api/auth/my-link  — returns the linked partner for the authenticated user
export async function getMyLink(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user!.userId;

        // Check if this user is a parent
        const asParent = await prisma.parentCandidateLink.findFirst({
            where: { parentId: userId },
            include: {
                candidate: {
                    select: {
                        id: true,
                        role: true,
                        email: true,
                        profile: { select: { firstName: true, lastName: true } },
                    },
                },
            },
        });
        if (asParent) {
            return res.json({
                role: 'parent',
                linkedUserId: asParent.candidateId,
                linkedUser: asParent.candidate,
            });
        }

        // Check if this user is a candidate with a parent
        const asCandidate = await prisma.parentCandidateLink.findFirst({
            where: { candidateId: userId },
            include: {
                parent: {
                    select: {
                        id: true,
                        role: true,
                        email: true,
                        profile: { select: { firstName: true, lastName: true } },
                    },
                },
            },
        });
        if (asCandidate) {
            return res.json({
                role: 'candidate',
                linkedUserId: asCandidate.parentId,
                linkedUser: asCandidate.parent,
            });
        }

        res.json({ role: null, linkedUserId: null, linkedUser: null });
    } catch (error) {
        next(error);
    }
}
