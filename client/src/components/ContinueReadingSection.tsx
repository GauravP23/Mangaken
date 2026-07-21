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
    <section className="mb-10">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <span className="w-1 h-6 rounded bg-[#FF5C00]"></span>
          Continue Reading
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map(({ ui, progress }) => {
          const chapterLabel = progress.chapterNumber || 'Chapter';
          const pageLabel = `Page ${progress.page}`;
          return (
            <Link
              key={`${progress.mangaId}-${progress.chapterId}`}
              to={`/manga/${progress.mangaId}/chapter/${progress.chapterId}`}
              className="block bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] hover:border-[#FF5C00]/30 rounded-2xl p-4 transition-all duration-300 shadow-md group"
            >
              <div className="flex gap-4">
                <div className="w-16 h-22 flex-shrink-0 overflow-hidden rounded-lg border border-white/[0.05]">
                  <img
                    src={ui.image || '/placeholder.svg'}
                    alt={ui.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-[#FF5C00] uppercase tracking-wider mb-0.5">Manga</div>
                  <h3 className="text-sm font-semibold text-gray-200 group-hover:text-[#FF5C00] transition-colors line-clamp-1 mb-2">{ui.title}</h3>
                  <div className="text-xs text-gray-400 font-medium">
                    {pageLabel} <span className="text-gray-600">•</span> <span className="text-[#FF5C00]">{chapterLabel}</span>
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
