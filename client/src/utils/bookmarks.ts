export interface BookmarkEntry {
  mangaId: string;
  title: string;
  coverImage?: string;
  genres?: string[];
  status?: string;
  rating?: number;
  addedAt: number;
}

const STORAGE_KEY = 'mangaken_bookmarks:v1';

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const getBookmarksList = (): BookmarkEntry[] => {
  if (!isBrowser) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BookmarkEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => b.addedAt - a.addedAt);
  } catch {
    return [];
  }
};

export const isBookmarked = (mangaId: string): boolean => {
  if (!mangaId) return false;
  const list = getBookmarksList();
  return list.some(item => item.mangaId === mangaId);
};

export const toggleBookmark = (entry: Omit<BookmarkEntry, 'addedAt'>): boolean => {
  if (!isBrowser || !entry.mangaId) return false;
  try {
    const list = getBookmarksList();
    const existingIndex = list.findIndex(item => item.mangaId === entry.mangaId);
    
    if (existingIndex >= 0) {
      // Remove bookmark
      list.splice(existingIndex, 1);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return false; // Now not bookmarked
    } else {
      // Add bookmark
      const newEntry: BookmarkEntry = {
        ...entry,
        addedAt: Date.now()
      };
      const updated = [newEntry, ...list];
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return true; // Now bookmarked
    }
  } catch {
    return false;
  }
};

export const removeBookmark = (mangaId: string) => {
  if (!isBrowser || !mangaId) return;
  try {
    const list = getBookmarksList();
    const filtered = list.filter(item => item.mangaId !== mangaId);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // ignore
  }
};
