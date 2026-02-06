export interface ReadingProgressEntry {
  mangaId: string;
  mangaTitle: string;
  chapterId: string;
  chapterNumber?: string | null;
  page: number;
  totalPages: number;
  updatedAt: number;
}

const STORAGE_KEY = 'readingProgress:v1';

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const getReadingProgressList = (): ReadingProgressEntry[] => {
  if (!isBrowser) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ReadingProgressEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(item => item && item.mangaId && item.chapterId)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
};

export const saveReadingProgress = (entry: Omit<ReadingProgressEntry, 'updatedAt'> & { updatedAt?: number }) => {
  if (!isBrowser) return;
  try {
    const list = getReadingProgressList();
    const now = entry.updatedAt ?? Date.now();
    const existingIndex = list.findIndex(item => item.mangaId === entry.mangaId);
    const normalized: ReadingProgressEntry = {
      mangaId: entry.mangaId,
      mangaTitle: entry.mangaTitle,
      chapterId: entry.chapterId,
      chapterNumber: entry.chapterNumber ?? null,
      page: Math.max(1, Math.min(entry.page, entry.totalPages || entry.page || 1)),
      totalPages: entry.totalPages || entry.page || 1,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      list.splice(existingIndex, 1);
    }
    const updated = [normalized, ...list];
    const trimmed = updated.slice(0, 20);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // ignore
  }
};
