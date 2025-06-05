import { RequestHandler } from 'express'; // Import RequestHandler
import * as mangadexService from '../services/mangadexService';

// Use RequestHandler type for each controller.
// req, res, next types will be inferred.
export const searchMangaController: RequestHandler = async (req, res, next) => {
    try {
        // req.query elements are typically string | string[] | ParsedQs | ParsedQs[]
        // So, casting to string is often necessary for single query parameters.
        const title = req.query.title as string;
        const limitQuery = req.query.limit as string;
        const offsetQuery = req.query.offset as string;

        const limit = limitQuery ? parseInt(limitQuery) : 20;
        const offset = offsetQuery ? parseInt(offsetQuery) : 0;

        if (!title) {
            // Send response and return to stop further execution in this handler
            res.status(400).json({ message: 'Title query parameter is required' });
            return;
        }
        const data = await mangadexService.searchManga(title, limit, offset);
        res.json(data);
    } catch (error) {
        next(error); // Pass error to the error handling middleware
    }
};

export const getMangaDetailsController: RequestHandler = async (req, res, next) => {
    try {
        // req.params elements are strings by default if using string paths like '/:id'
        const mangaId = req.params.id;
        if (!mangaId) {
            res.status(400).json({ message: 'Manga ID parameter is required' });
            return;
        }
        const data = await mangadexService.getMangaDetails(mangaId);
        res.json(data);
    } catch (error) {
        next(error);
    }
};

export const getMangaFeedController: RequestHandler = async (req, res, next) => {
    try {
        const mangaId = req.params.id;
        const lang = (req.query.lang as string) || 'en'; // Default to English
        const limitQuery = req.query.limit as string;
        const offsetQuery = req.query.offset as string;

        const limit = limitQuery ? parseInt(limitQuery) : 100;
        const offset = offsetQuery ? parseInt(offsetQuery) : 0;

        if (!mangaId) {
            res.status(400).json({ message: 'Manga ID parameter is required' });
            return;
        }
        // Pass lang as an array as expected by mangadexService
        const data = await mangadexService.getMangaFeed(mangaId, [lang], limit, offset);
        res.json(data);
    } catch (error) {
        next(error);
    }
};

export const getChapterPagesController: RequestHandler = async (req, res, next) => {
    try {
        const chapterId = req.params.chapterId;
        if (!chapterId) {
            res.status(400).json({ message: 'Chapter ID parameter is required' });
            return;
        }
        const data = await mangadexService.getChapterPages(chapterId);
        res.json(data);
    } catch (error) {
        next(error);
    }
};

export const listMangaController: RequestHandler = async (req, res, next) => {
    try {
        // Accept limit, offset, and order params from query
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
        const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
        // Pass all query params to the service (for order, includes, etc)
        const data = await mangadexService.listManga({ ...req.query, limit, offset });
        res.json(data);
    } catch (error) {
        next(error);
    }
};