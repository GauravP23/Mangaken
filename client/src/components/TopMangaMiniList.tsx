import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { UIManga } from '../types';

interface TopMangaMiniListProps {
  items: UIManga[];
  limit?: number;
}

const getRankStyle = (rank: number) => {
  if (rank === 1) return 'bg-gradient-to-br from-[#FF5C00] to-[#FF8C00] text-white shadow-lg shadow-[#FF5C00]/25';
  if (rank === 2) return 'bg-white/10 text-gray-200 border border-white/10';
  if (rank === 3) return 'bg-white/5 text-gray-300 border border-white/5';
  return 'bg-white/[0.02] text-gray-400 border border-white/5';
};

const TopMangaMiniList = ({ items, limit = 5 }: TopMangaMiniListProps) => {
  if (!items || items.length === 0) return null;

  const topItems = items
    .slice()
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, limit);

  return (
    <div className="bg-white/[0.02] border border-white/[0.05] backdrop-blur-md rounded-2xl p-4 space-y-3 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
      {topItems.map((manga, index) => (
        <Link
          key={manga.id}
          to={`/manga/${manga.id}`}
          className="flex items-center gap-3.5 px-2 py-2 rounded-xl hover:bg-white/[0.04] border border-transparent hover:border-white/[0.05] transition-all duration-300 group"
        >
          <div className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-black ${getRankStyle(index + 1)}`}>
            {index + 1}
          </div>
          <div className="w-11 h-15 flex-shrink-0 overflow-hidden rounded-lg border border-white/[0.08] shadow-md group-hover:scale-105 transition-transform duration-300">
            <img
              src={manga.image || '/placeholder.svg'}
              alt={manga.title}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-[#FF5C00] uppercase tracking-wider mb-0.5">Manga</p>
            <p className="text-sm font-semibold text-gray-100 group-hover:text-[#FF5C00] transition-colors line-clamp-1">{manga.title}</p>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-1">
              <Eye className="w-3 h-3 text-[#FF5C00]" />
              <span>{manga.views ? manga.views.toLocaleString() : '—'} followers</span>
            </div>
          </div>
        </Link>
      ))}
      <div className="pt-3 border-t border-white/[0.05] flex justify-end">
        <Link
          to="/top"
          className="text-xs text-[#FF5C00] hover:text-[#FF8C00] font-semibold flex items-center gap-1 transition-colors uppercase tracking-wider"
        >
          View all rankings →
        </Link>
      </div>
    </div>
  );
};

export default TopMangaMiniList;
