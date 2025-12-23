import { Router } from 'express';
import * as hybridController from '../controllers/hybridController';

const router = Router();

/**
 * Hybrid API Routes
 * Combines MangaDex (for reading) with AniList (for metadata, recommendations, reviews)
 */

// Enhanced manga details (MangaDex + AniList)
router.get('/manga/:id', hybridController.getEnhancedMangaDetails);

// Complete enhanced manga info (with chapters and AniList data)
router.get('/manga/:id/complete', hybridController.getCompleteEnhancedMangaInfo);

// Recommendations for a manga (AniList)
router.get('/manga/:id/recommendations', hybridController.getEnhancedRecommendations);

// Reviews for a manga (AniList)
router.get('/manga/:anilistId/reviews', hybridController.getMangaReviews);

// Trending manga (AniList + MangaDex links)
router.get('/trending', hybridController.getEnhancedTrending);

// Popular manga (AniList direct)
router.get('/popular', hybridController.getAniListPopular);

// AniList trending (direct)
router.get('/anilist/trending', hybridController.getAniListTrending);

// Hybrid search (both APIs)
router.get('/search', hybridController.hybridSearch);

export default router;
