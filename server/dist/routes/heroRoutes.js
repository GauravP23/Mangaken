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
const express_1 = __importDefault(require("express"));
const mangadexService_1 = require("../services/mangadexService");
const utils_1 = require("../utils");
const router = express_1.default.Router();
// Titles to feature
const HERO_TITLES = [
    'Hunter x Hunter',
    'One-Punch Man',
    'One Piece',
    'Steel Ball Run',
    'Vagabond',
    'Tokyo Ghoul',
    'Kokou no Hito',
    'Fire Punch',
    'Billy Bat',
    'Planetes',
    'The Fragrant Flower Blooms With Dignity',
];
// In-memory cache
let cachedHero = null;
let cacheTimestamp = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
router.get('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (cachedHero && Date.now() - cacheTimestamp < CACHE_TTL) {
            res.json(cachedHero);
            return;
        }
        const list = yield Promise.all(HERO_TITLES.map((title) => __awaiter(void 0, void 0, void 0, function* () {
            const searchRes = yield (0, mangadexService_1.searchManga)(title, 1, 0);
            const manga = searchRes.data[0];
            if (!manga)
                return null;
            const ui = (0, utils_1.mapApiMangaToUICard)(manga);
            const countResult = yield (0, mangadexService_1.getMangaFeed)(ui.id).catch(() => ({ data: [] }));
            const count = Array.isArray(countResult.data) ? countResult.data.length : 0;
            return Object.assign(Object.assign({}, ui), { chapters: count });
        })));
        cachedHero = list.filter(Boolean);
        cacheTimestamp = Date.now();
        res.json(cachedHero);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = router;
