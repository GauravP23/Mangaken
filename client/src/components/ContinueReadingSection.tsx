import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMangaDetails } from '../services/mangaApi';
import { mapApiMangaToUICard } from '../utils';
import { Manga, UIManga } from '../types';
import { getReadingProgressList, ReadingProgressEntry } from '../utils/readingProgress';

interface ContinueReadingItem {
  ui: UIManga;
  progress: ReadingProgressEntry;
}

const ContinueReadingSection = () => {
  const [items, setItems] = useState<ContinueReadingItem[]>([]);

  useEffect(() => {
    const load = async () => {
      const progressList = getReadingProgressList().slice(0, 8);
      if (progressList.length === 0) return;

      try {
        const results = await Promise.all(
          progressList.map(async (entry) => {
            try {
              const manga = await getMangaDetails(entry.mangaId) as Manga;
              const ui: UIManga = mapApiMangaToUICard(manga);
              return { ui, progress: entry } as ContinueReadingItem;
            } catch {
              return null;
            }
          })
        );

        const filtered = results.filter((x): x is ContinueReadingItem => x !== null);
        setItems(filtered);
      } catch {
        // ignore errors, show nothing
      }
    };

    load();
  }, []);

  if (!items.length) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white">Continue Reading</h2>
        <span className="text-xs sm:text-sm text-blue-400 cursor-default">More </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map(({ ui, progress }) => {
          const chapterLabel = progress.chapterNumber || 'Chapter';
          const pageLabel = `Page ${progress.page}`;
          return (
            <Link
              key={`${progress.mangaId}-${progress.chapterId}`}
              to={`/manga/${progress.mangaId}/chapter/${progress.chapterId}`}
              className="block bg-gray-900/70 hover:bg-gray-800 border border-gray-800 hover:border-blue-500 rounded-xl p-4 transition-colors"
            >
              <div className="flex gap-4">
                <div className="w-16 h-24 flex-shrink-0">
                  <img
                    src={ui.image || '/placeholder.svg'}
                    alt={ui.title}
                    className="w-full h-full object-cover rounded"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-blue-300 mb-1">Manga</div>
                  <h3 className="text-sm font-semibold text-white line-clamp-2 mb-2">{ui.title}</h3>
                  <div className="text-xs text-blue-400">
                    {pageLabel} <span className="text-gray-500">/</span> {chapterLabel}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default ContinueReadingSection;
