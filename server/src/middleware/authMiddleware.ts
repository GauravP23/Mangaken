import passport from 'passport';
import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/User';

// Interface for request with user
export interface AuthRequest extends Request {
  user?: IUser;
}

// Middleware to protect routes that require authentication
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate('jwt', { session: false }, (err: Error, user: IUser) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }
    // Attach user to request (cast to AuthRequest)
    (req as AuthRequest).user = user;
    return next();
  })(req, res, next);
};