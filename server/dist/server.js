"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server/src/server.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const passport_1 = __importDefault(require("./config/passport")); // Import Passport config
const mangaRoutes_1 = __importDefault(require("./routes/mangaRoutes"));
const errorHandler_1 = require("./middleware/errorHandler");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const heroRoutes_1 = __importDefault(require("./routes/heroRoutes"));

// Load environment variables
dotenv_1.default.config();

// CRITICAL CHECK - Keep this for safety during development
if (!process.env.MANGADEX_API_BASE_URL) {
    console.error("FATAL: MANGADEX_API_BASE_URL is undefined after dotenv.config(). Check .env file and its loading. App cannot start.");
    process.exit(1);
}
if (!process.env.MONGODB_URI) {
    console.error("FATAL: MONGODB_URI is undefined after dotenv.config(). Check .env file and its loading. App cannot start.");
    process.exit(1);
}

const app = (0, express_1.default)();

// Initialize Passport middleware
app.use(passport_1.default.initialize());

const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI; // This is now guaranteed to be loaded

// 👇 THIS IS THE MODIFIED SECTION
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:3000',      // React default
        'http://localhost:5173',      // Vite default
        'https://mangaken.vercel.app'  // ✅ Production URL added
    ],
    credentials: true
}));

app.use(express_1.default.json());

mongoose_1.default.connect(MONGODB_URI) // MONGODB_URI is already checked
    .then(() => console.log('MongoDB connected successfully!'))
    .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is healthy and running!' });
});

// Authentication routes
app.use('/api/auth', authRoutes_1.default);
// Batch hero manga endpoint
app.use('/api/hero', heroRoutes_1.default);
app.use('/api/manga', mangaRoutes_1.default);

app.use(errorHandler_1.errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});