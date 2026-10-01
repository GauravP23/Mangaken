import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { UIManga } from '../types';

interface TopMangaMiniListProps {
  items: UIManga[];
  limit?: number;
}

const getRankStyle = (rank: number) => {
  if (rank === 1) return 'bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg shadow-primary/25';
  if (rank === 2) return 'bg-muted text-foreground border border-border';
  if (rank === 3) return 'bg-muted/70 text-foreground border border-border';
  return 'bg-muted/30 text-muted-foreground border border-border';
};

const TopMangaMiniList = ({ items, limit = 5 }: TopMangaMiniListProps) => {
  if (!items || items.length === 0) return null;

  const topItems = items
    .slice()
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, limit);

  return (
    <div className="bg-card border border-border backdrop-blur-md rounded-2xl p-4 space-y-3 shadow-md">
      {topItems.map((manga, index) => (
        <Link
          key={manga.id}
          to={`/manga/${manga.id}`}
          className="flex items-center gap-3.5 px-2 py-2 rounded-xl hover:bg-muted border border-transparent hover:border-border transition-all duration-300 group"
        >
          <div className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-black ${getRankStyle(index + 1)}`}>
            {index + 1}
          </div>
          <div className="w-12 h-16 flex-shrink-0 overflow-hidden rounded-lg border border-border shadow-md group-hover:scale-105 transition-transform duration-300">
            <img
              src={manga.image || '/placeholder.svg'}
              alt={manga.title}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-primary uppercase tracking-wider mb-0.5">Manga</p>
            <p className="text-sm sm:text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">{manga.title}</p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
              <Eye className="w-3 h-3 text-primary" />
              <span>{manga.views ? manga.views.toLocaleString() : '—'} followers</span>
            </div>
          </div>
        </Link>
      ))}
      <div className="pt-3 border-t border-border flex justify-end">
        <Link
          to="/top"
          className="text-xs text-primary hover:text-primary/80 font-semibold flex items-center gap-1 transition-colors uppercase tracking-wider"
        >
          View all rankings →
        </Link>
      </div>
    </div>
  );
};

export default TopMangaMiniList;
