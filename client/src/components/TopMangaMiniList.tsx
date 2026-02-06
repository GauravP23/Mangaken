import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { UIManga } from '../types';

interface TopMangaMiniListProps {
  items: UIManga[];
  limit?: number;
}

const getRankStyle = (rank: number) => {
  if (rank === 1) return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black';
  if (rank === 2) return 'bg-gradient-to-br from-gray-300 to-gray-500 text-black';
  if (rank === 3) return 'bg-gradient-to-br from-amber-500 to-amber-700 text-white';
  return 'bg-gray-800 text-gray-100';
};

const TopMangaMiniList = ({ items, limit = 5 }: TopMangaMiniListProps) => {
  if (!items || items.length === 0) return null;

  const topItems = items
    .slice()
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, limit);

  return (
    <div className="bg-gradient-to-r from-slate-950/90 via-slate-900/95 to-slate-950/90 border border-slate-800 rounded-xl p-3 sm:p-4 space-y-2 shadow-[0_12px_30px_rgba(0,0,0,0.6)]">
      {topItems.map((manga, index) => (
        <Link
          key={manga.id}
          to={`/manga/${manga.id}`}
          className="flex items-center gap-3 sm:gap-4 px-2 py-2 rounded-lg hover:bg-slate-900/80 transition-colors"
        >
          <div className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-bold ${getRankStyle(index + 1)}`}>
            #{index + 1}
          </div>
          <div className="w-10 h-14 flex-shrink-0 overflow-hidden rounded-md">
            <img
              src={manga.image || '/placeholder.svg'}
              alt={manga.title}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-blue-300 mb-0.5">Manga</p>
            <p className="text-sm font-semibold text-white line-clamp-1">{manga.title}</p>
            <div className="flex items-center gap-1 text-[11px] text-gray-300 mt-0.5">
              <Eye className="w-3 h-3 text-yellow-400" />
              <span>{manga.views ?? '—'}</span>
            </div>
          </div>
        </Link>
      ))}
      <div className="pt-2 border-t border-slate-800 flex justify-end">
        <Link
          to="/top"
          className="text-xs sm:text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
        >
          View more
        </Link>
      </div>
    </div>
  );
};

export default TopMangaMiniList;
