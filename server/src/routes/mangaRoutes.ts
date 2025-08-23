import { Router } from 'express';
import * as mangaController from '../controllers/mangaController';

const router = Router();

// GET /api/manga?limit=10&offset=0&order[followedCount]=desc
router.get('/', mangaController.listMangaController);

// GET /api/manga/search?title=...
router.get('/search', mangaController.searchMangaController);

// GET /api/manga/statistics/batch?manga[]=id1&manga[]=id2
router.get('/statistics/batch', mangaController.getMangaStatisticsBatchController);

// GET /api/manga/statistics/:id
router.get('/statistics/:id', mangaController.getMangaStatisticsController);

// GET /api/manga/:id
router.get('/:id', mangaController.getMangaDetailsController);

// GET /api/manga/:id/feed?lang=en
router.get('/:id/feed', mangaController.getMangaFeedController);

// GET /api/manga/chapter/:chapterId/pages
router.get('/chapter/:chapterId/pages', mangaController.getChapterPagesController);

// GET /api/manga/complete/:id
router.get('/complete/:id', mangaController.getCompleteMangaInfoController);

export default router;