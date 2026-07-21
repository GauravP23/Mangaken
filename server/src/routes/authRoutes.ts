import express from 'express';
import passport from 'passport';
import * as authController from '../controllers/authController';

const router = express.Router();

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// GET /api/auth/me — returns full user info (requires valid JWT)
router.get('/me', passport.authenticate('jwt', { session: false }), authController.getMe);

// GET /api/auth/verify — lightweight token validity check (requires valid JWT)
router.get('/verify', passport.authenticate('jwt', { session: false }), authController.verifyToken);

// POST /api/auth/logout
router.post('/logout', authController.logout);

export default router;
