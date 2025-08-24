import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Eye, BookOpen, Info, BookOpen as ReadIcon } from 'lucide-react';

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

const MangaCard = ({ manga, size = 'medium', showLanguageBadge = false }: MangaCardProps) => {
  const uiManga = mapApiMangaToUICard(manga);
  const navigate = useNavigate();
  const [loadingReadNow, setLoadingReadNow] = React.useState(false);
  const sizeClasses = {
    small: 'w-24 h-32 sm:w-28 sm:h-40 md:w-32 md:h-44',
    medium: 'w-32 h-44 sm:w-36 sm:h-52 md:w-40 md:h-60',
    large: 'w-36 h-52 sm:w-44 sm:h-60 md:w-48 md:h-68'
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

  return (
    <div className="group cursor-pointer transition-all duration-300 hover:scale-[1.02] block">
      <Link to={`/manga/${uiManga.id}`} className="block">
        <div className="relative overflow-hidden shadow-lg rounded-lg sm:rounded-xl bg-gray-900 border border-gray-800">
          <div className="relative">
            <img
              src={imgSrc}
              alt={uiManga.title}
              className={`${sizeClasses[size]} object-cover transition-transform duration-300 group-hover:scale-105`}
              onError={() => setImgSrc('/placeholder.svg')}
            />
            
            {/* Mobile overlay rating */}
            <div className="absolute top-1 right-1 sm:hidden bg-black/70 backdrop-blur-sm rounded px-1.5 py-0.5 flex items-center gap-1">
              <Star className="w-2.5 h-2.5 text-yellow-400 fill-current" />
              <span className="text-white font-medium text-xs">
                {typeof uiManga.rating === 'number' ? uiManga.rating.toFixed(1) : 'N/A'}
              </span>
            </div>

            {/* Status Badge */}
            <Badge 
              className={`absolute top-1 left-1 rounded px-2 py-0.5 text-xs font-medium ${
                uiManga.status === 'completed' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
              }`}
            >
              {uiManga.status === 'completed' ? 'Complete' : 'Ongoing'}
            </Badge>
            
            {/* Language Badge */}
            {showLanguageBadge && (
              <Badge className="absolute bottom-1 left-1 bg-purple-600 text-white text-xs font-medium rounded px-2 py-0.5">
                EN/JA
              </Badge>
            )}
          </div>
            </Badge>
          )}
          
          {/* Rating - Positioned to not overlap with language badge */}
          <div className={`absolute ${showLanguageBadge ? 'top-8' : 'top-2'} left-2 bg-background/70 rounded px-2 py-1 flex items-center gap-1 text-primary-white text-xs`}>
            <Star className="w-3 h-3 fill-primary text-primary" />
            <span>{uiManga.rating && uiManga.rating > 0 ? Number(uiManga.rating).toFixed(1) : '—'}</span>
          </div>
            {/* Overlay on Hover - Simplified with only buttons and minimal stats */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-3">
            {/* Action Buttons in Center - Stacked vertically */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 sm:gap-3 z-10">
              <Button
                size="sm"
                className="btn-primary-cta font-semibold shadow-lg shadow-primary/50 transition-transform hover:scale-105 w-20 sm:w-24 md:w-28 text-xs sm:text-sm"
                onClick={handleReadNow}
                disabled={loadingReadNow}
              >
                {loadingReadNow ? 'Loading...' : (
                  <>
                    <ReadIcon className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Read Now</span>
                    <span className="sm:hidden">Read</span>
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-border text-secondary hover:bg-muted font-semibold shadow-lg shadow-secondary/20 transition-transform hover:scale-105 w-20 sm:w-24 md:w-28 text-xs sm:text-sm"
                onClick={handleViewInfo}
              >
                <Info className="w-3 h-3 mr-1" />
                Info
              </Button>
            </div>
            
            {/* Simple Stats at bottom */}
            <div className="text-primary-white mt-auto">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3 accent-cyan" />
                  <span>{uiManga.views ? formatNumber(uiManga.views) : '—'}</span>
                </div>
                
                <div className="flex items-center gap-1 justify-end">
                  <BookOpen className="w-3 h-3 accent-cyan" />
                  <span className="text-secondary font-semibold">{uiManga.chapters ? uiManga.chapters : '—'} ch</span>
                </div>
              </div>
            </div>
          </div>
        </div>      </Link>
      {/* Title and Genres below the card - Updated layout to match reference images */}
      <div className="mt-3 space-y-1">
        <h3 className={`${textSizes[size]} font-semibold text-primary-white line-clamp-2 transition-colors`}>
          {uiManga.title}
        </h3>
        <div className="text-xs text-secondary-gray">
          {uiManga.genres.slice(0, 3).join(', ')}
        </div>
      </div>
    </div>
  );
};

export default MangaCard;