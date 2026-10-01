import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Eye, BookOpen, Info, BookOpen as ReadIcon, Sparkles } from 'lucide-react';

import { UIManga, Manga as ApiManga } from '../types';
import { mapApiMangaToUICard } from '../utils';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { getMangaFeed } from '../services/mangaApi';

// Props for MangaCard
export interface MangaCardProps {
  manga: UIManga | ApiManga;
  size?: 'small' | 'medium' | 'large';
  showLanguageBadge?: boolean;
  onShowRelated?: (manga: UIManga) => void;
}

// Helper to format large numbers with K/M suffixes
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

const MangaCard = ({ manga, size = 'medium', showLanguageBadge = false, onShowRelated }: MangaCardProps) => {
  const uiManga = mapApiMangaToUICard(manga);
  const navigate = useNavigate();
  const [loadingReadNow, setLoadingReadNow] = React.useState(false);
  const sizeClasses = {
    small: 'aspect-[2/3] min-h-[140px] sm:min-h-[160px]',
    medium: 'aspect-[2/3] min-h-[210px] sm:min-h-[240px] md:min-h-[270px]',
    large: 'aspect-[2/3] min-h-[250px] sm:min-h-[290px] md:min-h-[330px]'
  };

  const textSizes = {
    small: 'text-xs sm:text-sm',
    medium: 'text-sm sm:text-base',
    large: 'text-base sm:text-lg'
  };

  const [imgSrc, setImgSrc] = React.useState(uiManga.coverImage || uiManga.image || 'https://placehold.co/400x600?text=Manga+Cover');
  
  // Handle Read Now button click
  const handleReadNow = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent the Link wrapper from navigating
    e.stopPropagation();
    
    setLoadingReadNow(true);
    try {
      const chapters = await getMangaFeed(uiManga.id);
      const sorted = [...chapters].sort((a, b) => {
        const aNum = parseFloat(a.attributes?.chapter || '0');
        const bNum = parseFloat(b.attributes?.chapter || '0');
        return (isNaN(aNum) ? 1 : aNum) - (isNaN(bNum) ? 1 : bNum);
      });
      const firstChapter = sorted[0];
      if (firstChapter) {
        navigate(`/manga/${uiManga.id}/chapter/${firstChapter.id}`);
      } else {
        alert('No chapters found for this manga.');
      }
    } catch {
      console.error('Failed to fetch chapters');
    } finally {
      setLoadingReadNow(false);
    }
  };
  
  // Handle Info button click
  const handleViewInfo = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent the Link wrapper from navigating
    e.stopPropagation();
    navigate(`/manga/${uiManga.id}`);
  };

  // Infer Country of Origin / Format Type
  const originFormat = React.useMemo(() => {
    const genreStr = (uiManga.genres || []).join(' ').toLowerCase();
    if (genreStr.includes('manhwa') || genreStr.includes('webtoon')) return { label: 'MANHWA', flag: '🇰🇷' };
    if (genreStr.includes('manhua')) return { label: 'MANHUA', flag: '🇨🇳' };
    return { label: 'MANGA', flag: '🇯🇵' };
  }, [uiManga.genres]);

  return (
    <div className="group cursor-pointer transition-transform duration-300 hover:scale-[1.03] block w-full">
      <Link to={`/manga/${uiManga.id}`} className="block">
        <div className="relative overflow-hidden shadow-xl sm:shadow-2xl rounded-xl border border-border bg-card">
          <img
            src={imgSrc}
            alt={uiManga.title}
            className={`${sizeClasses[size]} w-full object-cover transition-transform duration-500 group-hover:scale-105`}
            onError={() => setImgSrc('/placeholder.svg')}
          />
          {/* Status Badge - Glassmorphic pills matching status */}
          <Badge 
            className={`absolute top-2 right-2 rounded-lg px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-xs font-extrabold uppercase border-none tracking-wider ${
              uiManga.status === 'completed' ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-md shadow-emerald-600/20' : 
              uiManga.status === 'hiatus' ? 'bg-amber-500 text-white' :
              uiManga.status === 'cancelled' ? 'bg-red-600 text-white' :
              'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
            }`}
          >
            {uiManga.status === 'completed' ? 'Complete' : 
             uiManga.status === 'hiatus' ? 'Hiatus' :
             uiManga.status === 'cancelled' ? 'Cancelled' :
             'Ongoing'}
          </Badge>
          
          {/* Origin Badge */}
          <Badge className="absolute top-2 left-2 bg-black/70 backdrop-blur-md text-white text-[10px] sm:text-xs font-extrabold rounded-md px-2 py-0.5 border border-white/10 z-10 flex items-center gap-1">
            <span>{originFormat.flag}</span>
            <span>{originFormat.label}</span>
          </Badge>
          
          {/* Rating */}
          <div className="absolute top-8 sm:top-9 left-2 bg-black/70 backdrop-blur-md rounded-md border border-white/10 px-2 py-0.5 flex items-center gap-1 text-white text-[11px] sm:text-xs font-bold z-10">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{uiManga.rating && uiManga.rating > 0 ? Number(uiManga.rating).toFixed(1) : '—'}</span>
          </div>

          {/* Franchise Relation Badge if available */}
          {uiManga.relation && (
            <Badge className="absolute bottom-2 left-2 bg-primary/95 text-primary-foreground text-[10px] sm:text-xs font-extrabold rounded-md px-2 py-0.5 border border-primary/30 z-10 shadow-md">
              {uiManga.relation}
            </Badge>
          )}
 
          {/* Overlay on Hover - Glass blur overlay */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[3px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-4">
            {/* Action Buttons in Center - Stacked vertically */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10 px-3">
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold shadow-lg shadow-primary/30 transition-transform hover:scale-105 w-full text-xs py-2 rounded-lg border-none"
                onClick={handleReadNow}
                disabled={loadingReadNow}
              >
                {loadingReadNow ? 'Loading...' : (
                  <>
                    <ReadIcon className="w-3.5 h-3.5 mr-1.5" />
                    <span>Read Now</span>
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white font-bold border-white/10 transition-transform hover:scale-105 w-full text-xs py-2 rounded-lg"
                onClick={handleViewInfo}
              >
                <Info className="w-3.5 h-3.5 mr-1.5" />
                <span>Info</span>
              </Button>
              {onShowRelated && (
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-primary/20 hover:bg-primary/30 text-white font-bold border-primary/40 transition-transform hover:scale-105 w-full text-xs py-1.5 rounded-lg"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onShowRelated(uiManga);
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary" />
                  <span>Related</span>
                </Button>
              )}
            </div>
            
            {/* Simple Stats at bottom */}
            <div className="text-white mt-auto z-10">
              <div className="grid grid-cols-2 gap-2 text-xs font-medium text-gray-300">
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3 text-primary" />
                  <span>{uiManga.views ? formatNumber(uiManga.views) : '—'}</span>
                </div>
                
                <div className="flex items-center gap-1 justify-end">
                  <BookOpen className="w-3 h-3 text-primary" />
                  <span>{uiManga.chapters ? `${uiManga.chapters} ch` : '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
      {/* Title and Genres below the card */}
      <div className="mt-2.5 sm:mt-3 space-y-1 px-0.5">
        <h3 className={`${textSizes[size]} font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1`}>
          {uiManga.title}
        </h3>
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          {uiManga.year && (
            <span className="text-primary font-semibold">{uiManga.year}</span>
          )}
          {uiManga.year && uiManga.genres.length > 0 && <span>•</span>}
          <span className="line-clamp-1">{uiManga.genres.slice(0, 2).join(', ')}</span>
        </div>
        {uiManga.author && (
          <div className="text-xs text-muted-foreground/80 line-clamp-1">
            {uiManga.author}
          </div>
        )}
      </div>
    </div>
  );
};

export default MangaCard;