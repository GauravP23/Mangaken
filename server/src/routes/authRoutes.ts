import express, { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import * as jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User, { IUser } from '../models/User';

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
// JWT_EXPIRATION configuration
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1d';

// Register a new user
// POST /api/auth/register
router.post('/register', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      res.status(400).json({ message: 'Username, email, and password are required.' });
      return;
    }
    const existingByEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingByEmail) {
      res.status(409).json({ message: 'Email already in use.' });
      return;
    }
    const existingByUsername = await User.findOne({ username });
    if (existingByUsername) {
      res.status(409).json({ message: 'Username already taken.' });
      return;
    }
    const newUser = new User({ username, email, password });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully. Please log in.' });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({ message: 'Email or username already exists.' });
      return;
    }
    next(error);
  }
});

// Login an existing user
// POST /api/auth/login
router.post('/login', (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate('local', { session: false }, (err: any, user: IUser | false, info: any) => {
    if (err) {
      next(err);
      return;
    }
    if (!user) {
      res.status(401).json({ message: info?.message || 'Login failed. Check credentials.' });
      return;
    }
    const payload = { sub: user._id, username: user.username };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION as any });
    res.json({ message: 'Login successful', token, user: { id: user._id, username: user.username, email: user.email } });
  })(req, res, next);
});

// Get current authenticated user's info
// GET /api/auth/me
router.get('/me', passport.authenticate('jwt', { session: false }), (req: Request, res: Response): void => {
  const user = req.user as IUser;
  if (!user) {
    res.status(401).json({ message: 'User not found or token invalid.' });
    return;
  }
  res.json({ id: user._id, username: user.username, email: user.email });
});

export default router;
