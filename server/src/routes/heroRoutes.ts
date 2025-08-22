import express, { Request, Response, NextFunction } from 'express';
import { searchManga, getMangaFeed } from '../services/mangadexService';
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
      if (cachedHero && Date.now() - cacheTimestamp < CACHE_TTL) {
        res.json(cachedHero);
        return;
      }
      const list = await Promise.all(
        HERO_TITLES.map(async (title) => {
          try {
            const searchRes = await searchManga(title, 1, 0);
            const manga = searchRes.data[0];
            if (!manga) return null;
            const ui = mapApiMangaToUICard(manga);
            // Use a lighter approach - just get first page of chapters for count estimation
            try {
              const feedResult = await getMangaFeed(ui.id, ['en'], 100, 0);
              const estimatedCount = feedResult.total || feedResult.data?.length || 0;
              return { ...ui, chapters: estimatedCount };
            } catch {
              return { ...ui, chapters: 0 };
            }
          } catch (error) {
            console.warn(`Failed to fetch hero manga: ${title}`, error);
            return null;
          }
        })
      );
      cachedHero = list.filter(Boolean);
      cacheTimestamp = Date.now();
      res.json(cachedHero);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
