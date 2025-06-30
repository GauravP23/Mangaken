// server/src/server.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path'; // Keep if you still want explicit path, but usually not needed
import passport from './config/passport'; // Import Passport config

// Load environment variables
// Default dotenv.config() should work if .env is in the CWD (server/)
dotenv.config();
// Or, if you want to be explicit:
// const envPath = path.resolve(__dirname, '../.env');
// dotenv.config({ path: envPath });


// CRITICAL CHECK - Keep this for safety during development
if (!process.env.MANGADEX_API_BASE_URL) {
    console.error("FATAL: MANGADEX_API_BASE_URL is undefined after dotenv.config(). Check .env file and its loading. App cannot start.");
    process.exit(1);
}
if (!process.env.MONGODB_URI) {
    console.error("FATAL: MONGODB_URI is undefined after dotenv.config(). Check .env file and its loading. App cannot start.");
    process.exit(1);
}

import mangaRoutes from './routes/mangaRoutes';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import heroRoutes from './routes/heroRoutes';

const app = express();

// Initialize Passport middleware
app.use(passport.initialize());
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI; // This is now guaranteed to be loaded

app.use(cors({
    origin: [
        'http://localhost:3000', // React default
        'http://localhost:5173'  // Vite default
    ],
    credentials: true
}));
app.use(express.json());

mongoose.connect(MONGODB_URI) // MONGODB_URI is already checked
    .then(() => console.log('MongoDB connected successfully!'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'Server is healthy and running!' });
});
// Authentication routes
app.use('/api/auth', authRoutes);
// Batch hero manga endpoint
app.use('/api/hero', heroRoutes);
app.use('/api/manga', mangaRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});