import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import User, { IUser } from '../models/User';
import dotenv from 'dotenv';

dotenv.config(); // Ensure JWT_SECRET is loaded

// --- Local Strategy (for username/password login) ---
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email', // We'll use email for login
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
          return done(null, false, { message: 'Incorrect email or password.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          return done(null, false, { message: 'Incorrect email or password.' });
        }
        return done(null, user); // User authenticated
      } catch (error) {
        return done(error as Error);
      }
    }
  )
);

// --- JWT Strategy (for protecting routes) ---
const jwtOptions: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extracts token from "Bearer <token>" header
  secretOrKey: process.env.JWT_SECRET || 'fallback_secret_key_if_not_in_env', // Use your JWT_SECRET
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      // Payload contains the data we put in the token (e.g., user ID)
      const user = await User.findById(payload.sub as string);
      if (user) {
        return done(null, user); // User found, attach to req.user
      } else {
        return done(null, false); // User not found
      }
    } catch (error) {
      return done(error as Error, false);
    }
  })
);

export default passport;
