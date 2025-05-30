import { Router } from 'express';
import * as mangaController from '../controllers/mangaController';

const router = Router();

// GET /api/manga/search?title=...
router.get('/search', mangaController.searchMangaController);

// GET /api/manga/:id
router.get('/:id', mangaController.getMangaDetailsController);

// GET /api/manga/:id/feed?lang=en
router.get('/:id/feed', mangaController.getMangaFeedController);

// GET /api/manga/chapter/:chapterId/pages
router.get('/chapter/:chapterId/pages', mangaController.getChapterPagesController);

export default router;