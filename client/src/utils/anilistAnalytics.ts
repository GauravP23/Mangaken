// AniList Analytics Engine
// Computes derived statistics from raw user list data
// Mirrors core logic from ANerdStats (binge.js, taste.js, advanced.js)

import type { AniListMediaListEntry } from '../services/anilistService';

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

export interface TastePoint {
  id: number;
  title: string;
  coverImage?: string | null;
  userScore: number;       // 0-100
  globalScore: number;     // 0-100
  delta: number;           // +positive means user loved more than avg
  genre?: string;
}

export interface BingeMetrics {
  avgDaysToComplete: number;
  fastestEntry: { title: string; days: number; episodes: number | null } | null;
  slowestEntry: { title: string; days: number } | null;
  totalRewatches: number;
  completedCount: number;
  completionRate: number;  // 0-100 percent
}

export interface PopularityBias {
  avgPopularity: number;
  nicheCount: number;       // popularity < 5000
  mainstreamCount: number;  // popularity > 100000
  midtierCount: number;     // in between
  biasLabel: string;        // "Mainstream Fan" / "Niche Explorer" / "Balanced"
}

export interface GenrePreference {
  genre: string;
  count: number;
  avgUserScore: number;
  avgGlobalScore: number;
  scoreDelta: number;       // how much user likes vs community
}

export interface StudioLoyalty {
  studioName: string;
  studioId: number;
  count: number;
  avgUserScore: number;
}

export interface RatingDistribution {
  score: number;
  count: number;
}

// ─────────────────────────────────────────────────────────
// Helper utilities
// ─────────────────────────────────────────────────────────

function toDate(d: { year: number | null; month: number | null; day: number | null }): Date | null {
  if (!d.year || !d.month || !d.day) return null;
  return new Date(d.year, d.month - 1, d.day);
}

function diffDays(a: Date, b: Date): number {
  return Math.round(Math.abs(b.getTime() - a.getTime()) / (1000 * 3600 * 24));
}

// ─────────────────────────────────────────────────────────
// Flatten list collection into flat entry array
// ─────────────────────────────────────────────────────────

export function flattenEntries(
  lists: { name: string; status: string; entries: AniListMediaListEntry[] }[]
): AniListMediaListEntry[] {
  const seen = new Set<number>();
  const result: AniListMediaListEntry[] = [];
  for (const list of lists) {
    for (const entry of list.entries) {
      if (!seen.has(entry.id)) {
        seen.add(entry.id);
        result.push(entry);
      }
    }
  }
  return result;
}

// ─────────────────────────────────────────────────────────
// Taste Divergence  (User Score vs Global Score)
// ─────────────────────────────────────────────────────────

export function computeTasteDifferences(entries: AniListMediaListEntry[]): TastePoint[] {
  return entries
    .filter(e => e.score > 0 && e.media?.averageScore && e.media.averageScore > 0)
    .map(e => ({
      id: e.media.id,
      title: e.media.title.english || e.media.title.romaji || 'Unknown',
      coverImage: e.media.coverImage?.medium || e.media.coverImage?.large,
      userScore: e.score,
      globalScore: e.media.averageScore!,
      delta: Math.round(e.score - e.media.averageScore!),
      genre: e.media.genres?.[0],
    }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}

// ─────────────────────────────────────────────────────────
// Binge Velocity & Completion Habits
// ─────────────────────────────────────────────────────────

export function computeBingeMetrics(entries: AniListMediaListEntry[]): BingeMetrics {
  let totalDays = 0;
  let validCount = 0;
  let fastest: { title: string; days: number; episodes: number | null } | null = null;
  let slowest: { title: string; days: number } | null = null;
  let totalRewatches = 0;
  let completedCount = 0;
  const totalCount = entries.length;

  for (const entry of entries) {
    totalRewatches += entry.repeat || 0;
    if (entry.status === 'COMPLETED') completedCount++;

    const start = toDate(entry.startedAt);
    const end = toDate(entry.completedAt);
    if (!start || !end) continue;

    const days = Math.max(1, diffDays(start, end));
    if (days > 365 * 3) continue; // filter outliers (3+ year streaks)

    totalDays += days;
    validCount++;

    if (!fastest || days < fastest.days) {
      fastest = {
        title: entry.media.title.english || entry.media.title.romaji || 'Unknown',
        days,
        episodes: entry.media.episodes,
      };
    }
    if (!slowest || days > slowest.days) {
      slowest = {
        title: entry.media.title.english || entry.media.title.romaji || 'Unknown',
        days,
      };
    }
  }

  return {
    avgDaysToComplete: validCount > 0 ? Math.round(totalDays / validCount) : 0,
    fastestEntry: fastest,
    slowestEntry: slowest,
    totalRewatches,
    completedCount,
    completionRate: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
  };
}

// ─────────────────────────────────────────────────────────
// Popularity Bias Analysis
// ─────────────────────────────────────────────────────────

export function computePopularityBias(entries: AniListMediaListEntry[]): PopularityBias {
  let totalPop = 0;
  let nicheCount = 0;
  let mainstreamCount = 0;
  let midtierCount = 0;
  let validCount = 0;

  for (const entry of entries) {
    const pop = entry.media.popularity;
    if (!pop) continue;
    totalPop += pop;
    validCount++;
    if (pop < 5000) nicheCount++;
    else if (pop > 100000) mainstreamCount++;
    else midtierCount++;
  }

  const avgPop = validCount > 0 ? Math.round(totalPop / validCount) : 0;
  const nicheRatio = validCount > 0 ? nicheCount / validCount : 0;
  const mainstreamRatio = validCount > 0 ? mainstreamCount / validCount : 0;

  let biasLabel: string;
  if (nicheRatio > 0.45) biasLabel = 'Niche Explorer';
  else if (mainstreamRatio > 0.55) biasLabel = 'Mainstream Fan';
  else biasLabel = 'Balanced Watcher';

  return { avgPopularity: avgPop, nicheCount, mainstreamCount, midtierCount, biasLabel };
}

// ─────────────────────────────────────────────────────────
// Genre Score Preferences
// ─────────────────────────────────────────────────────────

export function computeGenrePreferences(entries: AniListMediaListEntry[]): GenrePreference[] {
  const genreMap = new Map<
    string,
    { totalUserScore: number; totalGlobalScore: number; count: number; scoredCount: number }
  >();

  for (const entry of entries) {
    for (const genre of entry.media.genres || []) {
      if (!genreMap.has(genre)) {
        genreMap.set(genre, { totalUserScore: 0, totalGlobalScore: 0, count: 0, scoredCount: 0 });
      }
      const g = genreMap.get(genre)!;
      g.count++;
      if (entry.score > 0 && entry.media.averageScore) {
        g.totalUserScore += entry.score;
        g.totalGlobalScore += entry.media.averageScore;
        g.scoredCount++;
      }
    }
  }

  return Array.from(genreMap.entries())
    .filter(([, v]) => v.count >= 2)
    .map(([genre, v]) => {
      const avgUser = v.scoredCount > 0 ? Math.round(v.totalUserScore / v.scoredCount) : 0;
      const avgGlobal = v.scoredCount > 0 ? Math.round(v.totalGlobalScore / v.scoredCount) : 0;
      return {
        genre,
        count: v.count,
        avgUserScore: avgUser,
        avgGlobalScore: avgGlobal,
        scoreDelta: avgUser - avgGlobal,
      };
    })
    .sort((a, b) => b.count - a.count);
}

// ─────────────────────────────────────────────────────────
// Studio Loyalty Score
// ─────────────────────────────────────────────────────────

export function computeStudioLoyalty(entries: AniListMediaListEntry[]): StudioLoyalty[] {
  const studioMap = new Map<
    number,
    { name: string; totalScore: number; count: number; scoredCount: number }
  >();

  for (const entry of entries) {
    const studios = entry.media.studios?.nodes || [];
    for (const studio of studios) {
      if (!studioMap.has(studio.id)) {
        studioMap.set(studio.id, { name: studio.name, totalScore: 0, count: 0, scoredCount: 0 });
      }
      const s = studioMap.get(studio.id)!;
      s.count++;
      if (entry.score > 0) {
        s.totalScore += entry.score;
        s.scoredCount++;
      }
    }
  }

  return Array.from(studioMap.entries())
    .filter(([, v]) => v.count >= 2)
    .map(([id, v]) => ({
      studioName: v.name,
      studioId: id,
      count: v.count,
      avgUserScore: v.scoredCount > 0 ? Math.round(v.totalScore / v.scoredCount) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

// ─────────────────────────────────────────────────────────
// Rating Distribution
// ─────────────────────────────────────────────────────────

export function computeRatingDistribution(entries: AniListMediaListEntry[]): RatingDistribution[] {
  const buckets: Record<number, number> = {};
  for (const entry of entries) {
    if (entry.score > 0) {
      const bucket = Math.floor(entry.score / 10) * 10; // 0, 10, 20, ... 100
      buckets[bucket] = (buckets[bucket] || 0) + 1;
    }
  }
  return Object.entries(buckets)
    .map(([score, count]) => ({ score: Number(score), count }))
    .sort((a, b) => a.score - b.score);
}

// ─────────────────────────────────────────────────────────
// Contrarian Picks (most divergent tastes in either direction)
// ─────────────────────────────────────────────────────────

export function getContrarianPicks(tastePoints: TastePoint[]): {
  lovedMore: TastePoint[];   // user loved much more than community
  lovedLess: TastePoint[];   // user liked less than community
} {
  const scored = tastePoints.filter(t => Math.abs(t.delta) >= 10);
  return {
    lovedMore: scored.filter(t => t.delta > 0).slice(0, 5),
    lovedLess: scored.filter(t => t.delta < 0).slice(0, 5),
  };
}
