"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const passport_1 = __importDefault(require("passport"));
// Middleware to protect routes that require authentication
const requireAuth = (req, res, next) => {
    passport_1.default.authenticate('jwt', { session: false }, (err, user) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }
        // Attach user to request (cast to AuthRequest)
        req.user = user;
        return next();
    })(req, res, next);
};
exports.requireAuth = requireAuth;
