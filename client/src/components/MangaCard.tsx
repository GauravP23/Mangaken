import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Eye, BookOpen, Info, BookOpen as ReadIcon } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Manga } from '../data/mangaData';
// Accept both API and UI Manga types
import { Manga as ApiManga, UIManga } from '../types';
import { getMangaFeed } from '../services/mangaApi';

export interface MangaCardProps {
  manga: UIManga | ApiManga;
  size?: 'small' | 'medium' | 'large';
  showLanguageBadge?: boolean;
}

// Helper to map API Manga to UI MangaCard shape
export function mapApiMangaToUICard(manga: any): UIManga {
  // If new complete info shape (from backend)
  if (manga && (manga.rating !== undefined || manga.follows !== undefined || manga.views !== undefined || manga.totalChapters !== undefined || manga.chapters !== undefined)) {
    return {
      ...manga,
      views: manga.follows ?? manga.views ?? 0,
      chapters: manga.totalChapters ?? manga.chapters ?? 0,
      rating: manga.rating ?? 0,
      status: manga.status ?? 'ongoing',
      author: manga.author ?? '',
      genres: manga.genres ?? [],
      image: manga.coverImage ?? manga.image ?? '',
      title: manga.title ?? '',
      description: manga.description ?? '',
      id: manga.id,
      lastUpdate: manga.lastUpdate ?? '',
      type: manga.type ?? 'manga',
    };
  }

  if ((manga as any).attributes) {
    const apiManga = manga as ApiManga;
    // Extract cover art filename from relationships
    let coverFileName = '';
    const coverRel = (apiManga.relationships || []).find(rel => rel.type === 'cover_art');
    if (coverRel && coverRel.attributes && coverRel.attributes.fileName) {
      coverFileName = coverRel.attributes.fileName;
    } else if (coverRel && coverRel.attributes && coverRel.attributes.filename) {
      coverFileName = coverRel.attributes.filename;
    }
    // Build MangaDex cover URL if possible
    const image = coverFileName ?
      `https://uploads.mangadex.org/covers/${apiManga.id}/${coverFileName}.256.jpg` :
      '';
    // Extract author name
    let author = '';
    const authorRel = (apiManga.relationships || []).find(rel => rel.type === 'author');
    if (authorRel && authorRel.attributes && authorRel.attributes.name) {
      author = authorRel.attributes.name;
    }
    // Extract rating (from attributes if present, fallback to 0)
    let rating = 0;
    if (apiManga.attributes && typeof (apiManga.attributes as any).bayesianRating === 'number') {
      rating = (apiManga.attributes as any).bayesianRating;
    } else if (apiManga.attributes && typeof (apiManga.attributes as any).averageRating === 'number') {
      rating = (apiManga.attributes as any).averageRating;
    }
    // Extract views (followedCount)
    let views = 0;
    if (apiManga.attributes && typeof (apiManga.attributes as any).followedCount === 'number') {
      views = (apiManga.attributes as any).followedCount;
    }
    // Extract type
    const type = (apiManga as any).type || 'manga';    return {
      id: apiManga.id,
      title: apiManga.attributes.title?.en || Object.values(apiManga.attributes.title)[0] || 'No Title',
      description: apiManga.attributes.description?.en || Object.values(apiManga.attributes.description)[0] || '',
      image,
      genres: (apiManga.attributes.tags || []).map(tag => tag.attributes.name.en || Object.values(tag.attributes.name)[0] || ''),
      rating,
      status: (apiManga.attributes.status as 'ongoing' | 'completed') || 'ongoing',
      chapters: 0, // Not available from API by default
      views,
      author,
      lastUpdate: '', // Not available from API by default
      type: type || 'manga',
      // Store original title data for alternative displays
      originalTitle: apiManga.attributes.title,
    };
  }
  // Already UI shape
  return manga as Manga;
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
    small: 'w-32 h-44',
    medium: 'w-40 h-60',
    large: 'w-48 h-68'
  };

  const textSizes = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
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

  return (    <div className="group cursor-pointer transition-transform duration-300 hover:scale-105 block">
      <Link to={`/manga/${uiManga.id}`} className="block">
        <div className="relative overflow-hidden shadow-lg rounded-md">
          <img
            src={imgSrc}
            alt={uiManga.title}
            className={`${sizeClasses[size]} object-cover transition-transform duration-300 group-hover:scale-110`}
            onError={() => setImgSrc('/placeholder.svg')}
          />
            {/* Status Badge - Updated to match reference images */}
          <Badge 
            className={`absolute top-0 right-0 rounded-bl-md rounded-tr-md px-3 py-1 ${
              uiManga.status === 'completed' ? 'bg-secondary' : 'bg-primary'
            } text-foreground text-xs font-medium`}
          >
            {uiManga.status === 'completed' ? 'Complete' : 'Ongoing'}
          </Badge>
          
          {/* Language Badge - Similar to second reference image */}
          {showLanguageBadge && (
            <Badge className="absolute top-0 left-0 bg-secondary text-secondary-foreground text-xs font-bold rounded-tr-md rounded-bl-md px-2 py-1 z-10">
              EN/JA
            </Badge>
          )}
          
          {/* Rating - Positioned to not overlap with language badge */}
          <div className={`absolute ${showLanguageBadge ? 'top-8' : 'top-2'} left-2 bg-background/70 rounded px-2 py-1 flex items-center gap-1 text-primary-white text-xs`}>
            <Star className="w-3 h-3 fill-primary text-primary" />
            <span>{uiManga.rating !== undefined ? Number(uiManga.rating).toFixed(1) : 'N/A'}</span>
          </div>
            {/* Overlay on Hover - Simplified with only buttons and minimal stats */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-3">
            {/* Action Buttons in Center - Stacked vertically */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
              <Button
                size="sm"
                className="btn-primary-cta font-semibold shadow-lg shadow-primary/50 transition-transform hover:scale-105 w-28"
                onClick={handleReadNow}
                disabled={loadingReadNow}
              >
                {loadingReadNow ? 'Loading...' : (
                  <>
                    <ReadIcon className="w-3 h-3 mr-1" />
                    Read Now
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-border text-secondary hover:bg-muted font-semibold shadow-lg shadow-secondary/20 transition-transform hover:scale-105 w-28"
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
                  <span>{formatNumber(uiManga.views)}</span>
                </div>
                
                <div className="flex items-center gap-1 justify-end">
                  <BookOpen className="w-3 h-3 accent-cyan" />
                  <span className="text-secondary font-semibold">{uiManga.chapters} ch</span>
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