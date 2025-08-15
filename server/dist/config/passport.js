"use strict";
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
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = require("passport-local");
const passport_jwt_1 = require("passport-jwt");
const User_1 = __importDefault(require("../models/User"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config(); // Ensure JWT_SECRET is loaded
// --- Local Strategy (for username/password login) ---
passport_1.default.use(new passport_local_1.Strategy({
    usernameField: 'email', // We'll use email for login
    passwordField: 'password',
}, (email, password, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield User_1.default.findOne({ email: email.toLowerCase() });
        if (!user) {
            return done(null, false, { message: 'Incorrect email or password.' });
        }
        const isMatch = yield user.comparePassword(password);
        if (!isMatch) {
            return done(null, false, { message: 'Incorrect email or password.' });
        }
        return done(null, user); // User authenticated
    }
    catch (error) {
        return done(error);
    }
})));
// --- JWT Strategy (for protecting routes) ---
const jwtOptions = {
    jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(), // Extracts token from "Bearer <token>" header
    secretOrKey: process.env.JWT_SECRET || 'fallback_secret_key_if_not_in_env', // Use your JWT_SECRET
};
passport_1.default.use(new passport_jwt_1.Strategy(jwtOptions, (payload, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Payload contains the data we put in the token (e.g., user ID)
        const user = yield User_1.default.findById(payload.sub);
        if (user) {
            return done(null, user); // User found, attach to req.user
        }
        else {
            return done(null, false); // User not found
        }
    }
    catch (error) {
        return done(error, false);
    }
})));
exports.default = passport_1.default;
