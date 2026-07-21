import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import * as jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '7d';

// ─── Helper: build consistent error response ─────────────────────────────────
function sendError(res: Response, status: number, message: string) {
    res.status(status).json({ success: false, message });
}

// ─── Register ─────────────────────────────────────────────────────────────────
// POST /api/auth/register
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { username, email, password } = req.body;

        // Input validation
        if (!username || !email || !password) {
            sendError(res, 400, 'Username, email, and password are required.');
            return;
        }
        if (username.trim().length < 3) {
            sendError(res, 400, 'Username must be at least 3 characters.');
            return;
        }
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            sendError(res, 400, 'Please provide a valid email address.');
            return;
        }
        if (password.length < 6) {
            sendError(res, 400, 'Password must be at least 6 characters.');
            return;
        }

        // Duplicate checks
        const [existingEmail, existingUsername] = await Promise.all([
            User.findOne({ email: email.toLowerCase().trim() }),
            User.findOne({ username: username.trim() }),
        ]);
        if (existingEmail) {
            sendError(res, 409, 'Email is already in use.');
            return;
        }
        if (existingUsername) {
            sendError(res, 409, 'Username is already taken.');
            return;
        }

        const newUser = new User({
            username: username.trim(),
            email: email.toLowerCase().trim(),
            password,
        });
        await newUser.save();

        res.status(201).json({ success: true, message: 'Account created successfully. Please log in.' });
    } catch (error: any) {
        if (error.code === 11000) {
            sendError(res, 409, 'Email or username already exists.');
            return;
        }
        next(error);
    }
};

// ─── Login ────────────────────────────────────────────────────────────────────
// POST /api/auth/login
export const login = (req: Request, res: Response, next: NextFunction): void => {
    passport.authenticate('local', { session: false }, (err: any, user: IUser | false, info: any) => {
        if (err) {
            next(err);
            return;
        }
        if (!user) {
            sendError(res, 401, info?.message || 'Invalid email or password.');
            return;
        }

        const payload = { sub: user._id, username: user.username };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION as any });

        res.json({
            success: true,
            message: 'Login successful.',
            token,
            user: { id: user._id, username: user.username, email: user.email },
        });
    })(req, res, next);
};

// ─── Get current user ─────────────────────────────────────────────────────────
// GET /api/auth/me
export const getMe = (req: Request, res: Response): void => {
    const user = req.user as IUser;
    if (!user) {
        sendError(res, 401, 'User not found or token invalid.');
        return;
    }
    res.json({ success: true, id: user._id, username: user.username, email: user.email });
};

// ─── Verify token ─────────────────────────────────────────────────────────────
// GET /api/auth/verify — lightweight check: returns 200 if token is valid, 401 if not
export const verifyToken = (req: Request, res: Response): void => {
    const user = req.user as IUser;
    if (!user) {
        sendError(res, 401, 'Token is invalid or expired.');
        return;
    }
    res.json({ success: true, valid: true, userId: user._id, username: user.username });
};

// ─── Logout ───────────────────────────────────────────────────────────────────
// POST /api/auth/logout — client-side token deletion is the primary mechanism;
// this endpoint exists for future server-side blacklisting and clean semantics
export const logout = (_req: Request, res: Response): void => {
    // NOTE: Token blacklisting can be added here (e.g. Redis) in the future
    res.json({ success: true, message: 'Logged out successfully.' });
};
