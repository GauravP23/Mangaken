import { RequestHandler } from 'express';
import * as hybridService from '../services/hybridService';
import * as anilistService from '../services/anilistService';

/**
 * Get enhanced manga details combining MangaDex and AniList
 * GET /api/hybrid/manga/:id
 */
export const getEnhancedMangaDetails: RequestHandler = async (req, res, next) => {
  try {
    const mangadexId = req.params.id;
    if (!mangadexId) {
      res.status(400).json({ message: 'Manga ID is required' });
      return;
    }

    const data = await hybridService.getEnhancedMangaDetails(mangadexId);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * Get complete enhanced manga info (with chapters and AniList data)
 * GET /api/hybrid/manga/:id/complete
 */
export const getCompleteEnhancedMangaInfo: RequestHandler = async (req, res, next) => {
  try {
    const mangadexId = req.params.id;
    if (!mangadexId) {
      res.status(400).json({ message: 'Manga ID is required' });
      return;
    }

    const data = await hybridService.getCompleteEnhancedMangaInfo(mangadexId);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * Get trending manga from AniList with MangaDex reading links
 * GET /api/hybrid/trending
 */
export const getEnhancedTrending: RequestHandler = async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const data = await hybridService.getEnhancedTrendingManga(limit);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * Get recommendations for a manga (AniList recommendations + MangaDex links)
 * GET /api/hybrid/manga/:id/recommendations
 */
export const getEnhancedRecommendations: RequestHandler = async (req, res, next) => {
  try {
    const mangadexId = req.params.id;
    if (!mangadexId) {
      res.status(400).json({ message: 'Manga ID is required' });
      return;
    }

    const data = await hybridService.getEnhancedRecommendations(mangadexId);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * Search with both APIs and merge results
 * GET /api/hybrid/search
 */
export const hybridSearch: RequestHandler = async (req, res, next) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      res.status(400).json({ message: 'Search query is required' });
      return;
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const data = await hybridService.hybridSearch(query, limit);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * Get reviews for a manga from AniList
 * GET /api/hybrid/manga/:anilistId/reviews
 */
export const getMangaReviews: RequestHandler = async (req, res, next) => {
  try {
    const anilistId = parseInt(req.params.anilistId);
    if (isNaN(anilistId)) {
      res.status(400).json({ message: 'Valid AniList ID is required' });
      return;
    }

    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const perPage = req.query.perPage ? parseInt(req.query.perPage as string) : 10;

    const data = await anilistService.getMangaReviews(anilistId, page, perPage);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * Get popular manga from AniList
 * GET /api/hybrid/popular
 */
export const getAniListPopular: RequestHandler = async (req, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const perPage = req.query.perPage ? parseInt(req.query.perPage as string) : 20;

    const data = await anilistService.getPopularManga(page, perPage);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * Get trending manga from AniList (direct)
 * GET /api/hybrid/anilist/trending
 */
export const getAniListTrending: RequestHandler = async (req, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const perPage = req.query.perPage ? parseInt(req.query.perPage as string) : 20;

    const data = await anilistService.getTrendingManga(page, perPage);
    res.json(data);
  } catch (error) {
    next(error);
  }
};
