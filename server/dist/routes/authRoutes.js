"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
const jwt = __importStar(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = __importDefault(require("../models/User"));
dotenv_1.default.config();
const router = express_1.default.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
// JWT_EXPIRATION configuration
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1d';
// Register a new user
// POST /api/auth/register
router.post('/register', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            res.status(400).json({ message: 'Username, email, and password are required.' });
            return;
        }
        const existingByEmail = yield User_1.default.findOne({ email: email.toLowerCase() });
        if (existingByEmail) {
            res.status(409).json({ message: 'Email already in use.' });
            return;
        }
        const existingByUsername = yield User_1.default.findOne({ username });
        if (existingByUsername) {
            res.status(409).json({ message: 'Username already taken.' });
            return;
        }
        const newUser = new User_1.default({ username, email, password });
        yield newUser.save();
        res.status(201).json({ message: 'User registered successfully. Please log in.' });
    }
    catch (error) {
        if (error.code === 11000) {
            res.status(409).json({ message: 'Email or username already exists.' });
            return;
        }
        next(error);
    }
}));
// Login an existing user
// POST /api/auth/login
router.post('/login', (req, res, next) => {
    passport_1.default.authenticate('local', { session: false }, (err, user, info) => {
        if (err) {
            next(err);
            return;
        }
        if (!user) {
            res.status(401).json({ message: (info === null || info === void 0 ? void 0 : info.message) || 'Login failed. Check credentials.' });
            return;
        }
        const payload = { sub: user._id, username: user.username };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
        res.json({ message: 'Login successful', token, user: { id: user._id, username: user.username, email: user.email } });
    })(req, res, next);
});
// Get current authenticated user's info
// GET /api/auth/me
router.get('/me', passport_1.default.authenticate('jwt', { session: false }), (req, res) => {
    const user = req.user;
    if (!user) {
        res.status(401).json({ message: 'User not found or token invalid.' });
        return;
    }
    res.json({ id: user._id, username: user.username, email: user.email });
});
exports.default = router;
