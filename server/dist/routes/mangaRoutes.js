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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mangaController = __importStar(require("../controllers/mangaController"));
const router = (0, express_1.Router)();
// GET /api/manga?limit=10&offset=0&order[followedCount]=desc
router.get('/', mangaController.listMangaController);
// GET /api/manga/search?title=...
router.get('/search', mangaController.searchMangaController);
// GET /api/manga/:id
router.get('/:id', mangaController.getMangaDetailsController);
// GET /api/manga/:id/feed?lang=en
router.get('/:id/feed', mangaController.getMangaFeedController);
// GET /api/manga/chapter/:chapterId/pages
router.get('/chapter/:chapterId/pages', mangaController.getChapterPagesController);
// GET /api/manga/complete/:id
router.get('/complete/:id', mangaController.getCompleteMangaInfoController);
// GET /api/manga/statistics/:id
router.get('/statistics/:id', mangaController.getMangaStatisticsController);
exports.default = router;
