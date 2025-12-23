import express, { Request, Response, NextFunction } from 'express';
import { searchManga } from '../services/mangadexService';
import { mapApiMangaToUICard } from '../utils';

const router = express.Router();

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
let cachedHero: any[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes (increased from 10)

router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // If cache is valid, serve it immediately
      const now = Date.now();
      const cacheValid = cachedHero && now - cacheTimestamp < CACHE_TTL;
      if (cacheValid && cachedHero) {
        res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
        res.json(cachedHero);
        return;
      }

      // Try to rebuild cache
      try {
        const list = await Promise.all(
          HERO_TITLES.map(async (title) => {
            try {
              const searchRes = await searchManga(title, 1, 0);
              const manga = searchRes.data[0];
              if (!manga) return null;
              const ui = mapApiMangaToUICard(manga);
              // Avoid extra feed calls here to reduce upstream load; set chapters to 0 (client can fetch when needed)
              return { ...ui, chapters: 0 };
            } catch (error) {
              console.warn(`Failed to fetch hero manga: ${title}`, error);
              return null;
            }
          })
        );
        const built = list.filter(Boolean) as any[];
        if (built.length) {
          cachedHero = built;
          cacheTimestamp = now;
          res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
          res.json(cachedHero);
          return;
        }
        // If build resulted in empty, fall through to serve stale if available
      } catch (e) {
        // Rebuild failed; fall back to stale if present
      }

      if (cachedHero) {
        // Serve stale cache if we have it
        res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=600');
        res.json(cachedHero);
        return;
      }

      // No cache available and build failed
      res.status(503).json({ message: 'Hero content temporarily unavailable' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
