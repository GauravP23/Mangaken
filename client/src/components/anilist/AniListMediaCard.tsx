import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Eye, Tv, Book, BookOpen, ExternalLink } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import type { AniListMedia } from '../../services/anilistService';
import { getDisplayTitle, formatCount } from '../../services/anilistService';

interface AniListMediaCardProps {
  media: AniListMedia;
  rank?: number;
  type: 'ANIME' | 'MANGA';
}

const FORMAT_COLORS: Record<string, string> = {
  TV: 'bg-blue-600/90',
  TV_SHORT: 'bg-blue-500/80',
  MOVIE: 'bg-purple-600/90',
  OVA: 'bg-indigo-500/80',
  ONA: 'bg-cyan-600/80',
  SPECIAL: 'bg-teal-500/80',
  MANGA: 'bg-rose-600/90',
  NOVEL: 'bg-amber-600/80',
  ONE_SHOT: 'bg-orange-500/80',
  MANHWA: 'bg-pink-600/80',
  MANHUA: 'bg-red-500/80',
};

const STATUS_COLORS: Record<string, string> = {
  FINISHED: 'bg-emerald-600/90 text-white',
  RELEASING: 'bg-primary/90 text-white',
  NOT_YET_RELEASED: 'bg-gray-500/80 text-white',
  CANCELLED: 'bg-red-600/80 text-white',
  HIATUS: 'bg-amber-500/90 text-white',
};

function formatStatus(status: string | null): string {
  if (!status) return '';
  switch (status) {
    case 'FINISHED': return 'Finished';
    case 'RELEASING': return 'Ongoing';
    case 'NOT_YET_RELEASED': return 'Upcoming';
    case 'CANCELLED': return 'Cancelled';
    case 'HIATUS': return 'Hiatus';
    default: return status;
  }
}

function formatFormat(format: string | null): string {
  if (!format) return '';
  return format.replace('_', ' ');
}

function getRankStyle(rank: number): string {
  if (rank === 1) return 'bg-gradient-to-r from-amber-400 to-amber-600 text-black font-black shadow-md shadow-amber-500/30';
  if (rank === 2) return 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-900 font-bold';
  if (rank === 3) return 'bg-gradient-to-r from-amber-700 to-amber-800 text-white font-bold';
  return 'bg-muted text-muted-foreground font-semibold';
}

const AniListMediaCard: React.FC<AniListMediaCardProps> = ({ media, rank, type }) => {
  const title = getDisplayTitle(media.title);
  const coverUrl = media.coverImage?.extraLarge || media.coverImage?.large || media.coverImage?.medium;
  const accentColor = media.coverImage?.color;
  const [imgError, setImgError] = useState(false);

  // Search query for linking back to MangaKen reader (manga only)
  const mangakenSearchQuery = encodeURIComponent(title);

  return (
    <div
      className="group relative bg-card border border-border rounded-xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1"
      style={
        accentColor
          ? { '--card-accent': accentColor } as React.CSSProperties
          : undefined
      }
    >
      {/* Rank Badge */}
      {rank && (
        <div className={`absolute top-2 left-2 z-20 w-8 h-8 rounded-full flex items-center justify-center text-xs ${getRankStyle(rank)}`}>
          {rank <= 3 ? (rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉') : `#${rank}`}
        </div>
      )}

      {/* Cover Image */}
      <a
        href={`https://anilist.co/${type.toLowerCase()}/${media.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative aspect-[2/3] w-full overflow-hidden bg-muted flex-shrink-0"
      >
        {!imgError && coverUrl ? (
          <img
            src={coverUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            {type === 'ANIME' ? (
              <Tv className="w-10 h-10 text-muted-foreground/30" />
            ) : (
              <Book className="w-10 h-10 text-muted-foreground/30" />
            )}
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Format Badge */}
        {media.format && (
          <span
            className={`absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded text-white ${FORMAT_COLORS[media.format] || 'bg-gray-600/80'}`}
          >
            {formatFormat(media.format)}
          </span>
        )}

        {/* Score overlay */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-full">
          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span className="text-white text-xs font-bold">
            {media.averageScore ? (media.averageScore / 10).toFixed(1) : 'N/A'}
          </span>
        </div>
      </a>

      {/* Card Info */}
      <div className="p-3 sm:p-3.5 flex flex-col flex-1 gap-1.5">
        <a
          href={`https://anilist.co/${type.toLowerCase()}/${media.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug"
          title={title}
        >
          {title}
        </a>

        {/* Meta row */}
        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
          {media.status && (
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${STATUS_COLORS[media.status] || 'bg-muted text-muted-foreground'}`}
            >
              {formatStatus(media.status)}
            </span>
          )}
          {media.startDate?.year && (
            <span className="text-xs text-muted-foreground">{media.startDate.year}</span>
          )}
          {type === 'ANIME' && media.episodes && (
            <span className="text-xs text-muted-foreground">{media.episodes} eps</span>
          )}
          {type === 'MANGA' && media.chapters && (
            <span className="text-xs text-muted-foreground">{media.chapters} chs</span>
          )}
        </div>

        {/* Popularity */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-auto pt-1">
          <Eye className="w-3.5 h-3.5 text-primary" />
          <span>{formatCount(media.popularity)} users</span>
          {media.studios?.nodes?.[0] && (
            <>
              <span className="mx-1">·</span>
              <span className="truncate">{media.studios.nodes[0].name}</span>
            </>
          )}
        </div>

        {/* Genres */}
        {media.genres?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {media.genres.slice(0, 2).map(g => (
              <span
                key={g}
                className="text-[10px] sm:text-[11px] uppercase tracking-wide px-2 py-0.5 rounded border border-border/60 text-muted-foreground bg-muted/40 font-medium"
              >
                {g}
              </span>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 mt-2 pt-2 border-t border-border/50 items-center">
          <a
            href={`https://anilist.co/${type.toLowerCase()}/${media.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors py-1"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            AniList
          </a>

          {type === 'MANGA' && (
            <Link
              to={`/search?q=${mangakenSearchQuery}`}
              className="ml-auto flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Read Here
            </Link>
          )}

          {type === 'ANIME' && media.idMal && (
            <a
              href={`https://myanimelist.net/anime/${media.idMal}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-blue-400 transition-colors py-1"
            >
              MAL
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default AniListMediaCard;
