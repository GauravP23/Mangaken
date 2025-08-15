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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMangaStatisticsController = exports.getCompleteMangaInfoController = exports.listMangaController = exports.getChapterPagesController = exports.getMangaFeedController = exports.getMangaDetailsController = exports.searchMangaController = void 0;
const mangadexService = __importStar(require("../services/mangadexService"));
// Use RequestHandler type for each controller.
// req, res, next types will be inferred.
const searchMangaController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // req.query elements are typically string | string[] | ParsedQs | ParsedQs[]
        // So, casting to string is often necessary for single query parameters.
        const title = req.query.title;
        const limitQuery = req.query.limit;
        const offsetQuery = req.query.offset;
        const limit = limitQuery ? parseInt(limitQuery) : 20;
        const offset = offsetQuery ? parseInt(offsetQuery) : 0;
        if (!title) {
            // Send response and return to stop further execution in this handler
            res.status(400).json({ message: 'Title query parameter is required' });
            return;
        }
        const data = yield mangadexService.searchManga(title, limit, offset);
        res.json(data);
    }
    catch (error) {
        next(error); // Pass error to the error handling middleware
    }
});
exports.searchMangaController = searchMangaController;
const getMangaDetailsController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // req.params elements are strings by default if using string paths like '/:id'
        const mangaId = req.params.id;
        if (!mangaId) {
            res.status(400).json({ message: 'Manga ID parameter is required' });
            return;
        }
        const data = yield mangadexService.getMangaDetails(mangaId);
        res.json(data);
    }
    catch (error) {
        next(error);
    }
});
exports.getMangaDetailsController = getMangaDetailsController;
const getMangaFeedController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const mangaId = req.params.id;
        const lang = req.query.lang || 'en'; // Default to English
        const limitQuery = req.query.limit;
        const offsetQuery = req.query.offset;
        const limit = limitQuery ? parseInt(limitQuery) : 100;
        const offset = offsetQuery ? parseInt(offsetQuery) : 0;
        if (!mangaId) {
            res.status(400).json({ message: 'Manga ID parameter is required' });
            return;
        }
        // Pass lang as an array as expected by mangadexService
        const data = yield mangadexService.getMangaFeed(mangaId, [lang], limit, offset);
        res.json(data);
    }
    catch (error) {
        next(error);
    }
});
exports.getMangaFeedController = getMangaFeedController;
const getChapterPagesController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const chapterId = req.params.chapterId;
        if (!chapterId) {
            res.status(400).json({ message: 'Chapter ID parameter is required' });
            return;
        }
        const data = yield mangadexService.getChapterPages(chapterId);
        res.json(data);
    }
    catch (error) {
        next(error);
    }
});
exports.getChapterPagesController = getChapterPagesController;
const listMangaController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Accept limit, offset, and order params from query
        const limit = req.query.limit ? parseInt(req.query.limit) : 20;
        const offset = req.query.offset ? parseInt(req.query.offset) : 0;
        // Pass all query params to the service (for order, includes, etc)
        const data = yield mangadexService.listManga(Object.assign(Object.assign({}, req.query), { limit, offset }));
        res.json(data);
    }
    catch (error) {
        next(error);
    }
});
exports.listMangaController = listMangaController;
const getCompleteMangaInfoController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const mangaId = req.params.id;
        if (!mangaId) {
            res.status(400).json({ message: 'Manga ID parameter is required' });
            return;
        }
        const data = yield mangadexService.getCompleteMangaInfo(mangaId);
        res.json(data);
    }
    catch (error) {
        next(error);
    }
});
exports.getCompleteMangaInfoController = getCompleteMangaInfoController;
const getMangaStatisticsController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const mangaId = req.params.id;
        if (!mangaId) {
            res.status(400).json({ message: 'Manga ID parameter is required' });
            return;
        }
        const data = yield mangadexService.getMangaStatistics(mangaId);
        res.json(data);
    }
    catch (error) {
        next(error);
    }
});
exports.getMangaStatisticsController = getMangaStatisticsController;
