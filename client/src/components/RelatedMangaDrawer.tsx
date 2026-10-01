import React, { useEffect, useState } from 'react';
import { X, Sparkles, Layers, Compass, ExternalLink, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getRelatedManga, FormattedRelatedManga } from '../services/mangaApi';
import MangaCard from './MangaCard';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { UIManga } from '../types';

interface RelatedMangaDrawerProps {
  manga: UIManga | null;
  onClose: () => void;
}

export const RelatedMangaDrawer: React.FC<RelatedMangaDrawerProps> = ({ manga, onClose }) => {
  const [franchise, setFranchise] = useState<FormattedRelatedManga[]>([]);
  const [recommendations, setRecommendations] = useState<FormattedRelatedManga[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'franchise' | 'recommendations'>('all');
  const [currentManga, setCurrentManga] = useState<UIManga | null>(manga);

  // Sync internal manga when prop changes
  useEffect(() => {
    setCurrentManga(manga);
  }, [manga]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (currentManga) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [currentManga]);

  // Fetch related data
  useEffect(() => {
    if (!currentManga?.id) {
      setFranchise([]);
      setRecommendations([]);
      return;
    }

    let isMounted = true;
    setLoading(true);

    getRelatedManga(currentManga.id)
      .then((res) => {
        if (!isMounted) return;
        setFranchise(res.franchise || []);
        setRecommendations(res.recommendations || []);
        if ((res.franchise || []).length > 0 && (res.recommendations || []).length === 0) {
          setActiveTab('franchise');
        } else if ((res.franchise || []).length === 0 && (res.recommendations || []).length > 0) {
          setActiveTab('recommendations');
        } else {
          setActiveTab('all');
        }
      })
      .catch((err) => {
        console.error('Error in drawer getRelatedManga:', err);
        if (isMounted) {
          setFranchise([]);
          setRecommendations([]);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentManga?.id]);

  if (!currentManga) return null;

  const totalCount = franchise.length + recommendations.length;

  const mapToUIManga = (item: FormattedRelatedManga): UIManga => ({
    id: item.id,
    title: item.title,
    description: item.description,
    image: item.coverImage,
    coverImage: item.coverImage,
    rating: item.rating,
    views: item.follows,
    status: item.status,
    genres: item.genres,
    chapters: 0,
    author: '',
    year: item.year,
    relation: item.relation,
    relationType: item.relationType,
  });

  const displayedList =
    activeTab === 'franchise'
      ? franchise
      : activeTab === 'recommendations'
      ? recommendations
      : [...franchise, ...recommendations];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Sliding Drawer Container */}
      <div
        className="w-full max-w-xl sm:max-w-2xl bg-card border-l border-border h-full flex flex-col shadow-2xl transition-transform animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-border bg-card/95 backdrop-blur flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={currentManga.coverImage || currentManga.image || '/placeholder.svg'}
              alt={currentManga.title}
              className="w-12 h-16 sm:w-14 sm:h-20 object-cover rounded-lg border border-border shadow-sm shrink-0 aspect-[2/3]"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-primary font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Related Manga</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-foreground truncate" title={currentManga.title}>
                {currentManga.title}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                {currentManga.rating && currentManga.rating > 0 && (
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                    <Star className="w-3 h-3 fill-current" />
                    {Number(currentManga.rating).toFixed(1)}
                  </span>
                )}
                <Link
                  to={`/manga/${currentManga.id}`}
                  onClick={onClose}
                  className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                >
                  <span>Open Details</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="rounded-full w-8 h-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tab Filters */}
        <div className="px-4 sm:px-5 py-3 border-b border-border bg-muted/30 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border/60">
            <Button
              size="sm"
              variant={activeTab === 'all' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('all')}
              className={`h-7 px-2.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'all'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              All ({totalCount})
            </Button>

            {franchise.length > 0 && (
              <Button
                size="sm"
                variant={activeTab === 'franchise' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('franchise')}
                className={`h-7 px-2.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                  activeTab === 'franchise'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>Franchise ({franchise.length})</span>
              </Button>
            )}

            {recommendations.length > 0 && (
              <Button
                size="sm"
                variant={activeTab === 'recommendations' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('recommendations')}
                className={`h-7 px-2.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                  activeTab === 'recommendations'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Compass className="w-3 h-3" />
                <span>Recommended ({recommendations.length})</span>
              </Button>
            )}
          </div>

          <Badge variant="outline" className="text-[11px] text-muted-foreground border-border hidden sm:inline-flex">
            Click any title to explore
          </Badge>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse space-y-2">
                  <div className="aspect-[2/3] bg-muted rounded-xl" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : displayedList.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Compass className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-semibold">No related manga found</p>
              <p className="text-xs mt-1">Try exploring other titles or genres</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {displayedList.map((item) => {
                const ui = mapToUIManga(item);
                return (
                  <div key={item.id} className="relative group/drawer-item">
                    <MangaCard
                      manga={ui}
                      size="small"
                      onShowRelated={(m) => setCurrentManga(m)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-3 sm:p-4 border-t border-border bg-card/90 flex items-center justify-between text-xs text-muted-foreground">
          <span>Explore related series without leaving your browse view</span>
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
            className="text-xs h-8 px-3 rounded-lg"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RelatedMangaDrawer;
