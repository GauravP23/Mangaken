import { Router } from 'express';
import * as mangaController from '../controllers/mangaController';

const router = Router();

// GET /api/manga?limit=10&offset=0&order[followedCount]=desc
router.get('/', mangaController.listMangaController);

// GET /api/manga/search?title=...
router.get('/search', mangaController.searchMangaController);

// GET /api/manga/browse - Advanced search with filters
router.get('/browse', mangaController.advancedSearchController);

// GET /api/manga/tags - Get available tags/genres
router.get('/tags', mangaController.getMangaTagsController);

// GET /api/manga/statistics/batch?manga[]=id1&manga[]=id2
router.get('/statistics/batch', mangaController.getMangaStatisticsBatchController);

// GET /api/manga/statistics/:id
router.get('/statistics/:id', mangaController.getMangaStatisticsController);

// New categorized endpoints - must be before '/:id' to avoid being treated as manga id
// GET /api/manga/completed?limit=20&offset=0
router.get('/completed', mangaController.getCompletedMangaController);

// GET /api/manga/trending?limit=20&offset=0
router.get('/trending', mangaController.getTrendingMangaController);

// GET /api/manga/most-viewed?limit=20&offset=0
router.get('/most-viewed', mangaController.getMostViewedMangaController);

// GET /api/manga/latest?limit=20&offset=0
router.get('/latest', mangaController.getLatestMangaController);

// New: cover proxy - must be defined before '/:id' to avoid being treated as manga id
router.get('/cover/:id/:fileName', mangaController.getCoverProxyController);

// GET /api/manga/:id
router.get('/:id', mangaController.getMangaDetailsController);

// GET /api/manga/:id/feed?lang=en
router.get('/:id/feed', mangaController.getMangaFeedController);

// GET /api/manga/chapter/:chapterId/pages
router.get('/chapter/:chapterId/pages', mangaController.getChapterPagesController);

// GET /api/manga/complete/:id
router.get('/complete/:id', mangaController.getCompleteMangaInfoController);

export default router;