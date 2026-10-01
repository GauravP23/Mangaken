import React, { useEffect, useState } from 'react';
import { Sparkles, Layers, Compass, Loader2 } from 'lucide-react';
import { getRelatedManga, FormattedRelatedManga } from '../services/mangaApi';
import MangaCard from './MangaCard';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { UIManga } from '../types';

interface RelatedMangaSectionProps {
  mangaId: string;
  currentTitle?: string;
  genres?: string[];
}

export const RelatedMangaSection: React.FC<RelatedMangaSectionProps> = ({
  mangaId,
  currentTitle,
}) => {
  const [franchise, setFranchise] = useState<FormattedRelatedManga[]>([]);
  const [recommendations, setRecommendations] = useState<FormattedRelatedManga[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'franchise' | 'recommendations'>('all');

  useEffect(() => {
    if (!mangaId) return;

    let isMounted = true;
    setLoading(true);

    getRelatedManga(mangaId)
      .then((res) => {
        if (!isMounted) return;
        setFranchise(res.franchise || []);
        setRecommendations(res.recommendations || []);
        // If only franchise or only recommendations, set appropriate tab
        if ((res.franchise || []).length > 0 && (res.recommendations || []).length === 0) {
          setActiveTab('franchise');
        } else if ((res.franchise || []).length === 0 && (res.recommendations || []).length > 0) {
          setActiveTab('recommendations');
        } else {
          setActiveTab('all');
        }
      })
      .catch((err) => {
        console.error('Failed to load related manga:', err);
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
  }, [mangaId]);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-7 shadow-md mt-8 sm:mt-10">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          <h2 className="text-xl font-bold text-foreground">Related & Recommended Manga</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-3">
              <div className="aspect-[2/3] bg-muted rounded-xl" />
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totalCount = franchise.length + recommendations.length;
  if (totalCount === 0) {
    return null;
  }

  // Convert FormattedRelatedManga to UIManga for MangaCard
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
    <div className="bg-card border border-border rounded-2xl p-5 sm:p-7 shadow-md mt-8 sm:mt-10">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1 h-6 bg-primary rounded" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              Related & Recommended Manga
            </h2>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs px-2.5 py-0.5 font-bold">
              {totalCount}
            </Badge>
          </div>
          {currentTitle && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 ml-3 line-clamp-1">
              Franchise connections & similar stories for <span className="text-foreground font-semibold">"{currentTitle}"</span>
            </p>
          )}
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl self-start sm:self-auto border border-border/60">
          <Button
            size="sm"
            variant={activeTab === 'all' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('all')}
            className={`h-8 px-3 text-xs font-bold rounded-lg transition-all ${
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
              className={`h-8 px-3 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'franchise'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Franchise ({franchise.length})</span>
            </Button>
          )}

          {recommendations.length > 0 && (
            <Button
              size="sm"
              variant={activeTab === 'recommendations' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('recommendations')}
              className={`h-8 px-3 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'recommendations'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Recommended ({recommendations.length})</span>
            </Button>
          )}
        </div>
      </div>

      {/* Grid of Manga Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {displayedList.map((item) => (
          <div
            key={item.id}
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <MangaCard manga={mapToUIManga(item)} size="medium" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelatedMangaSection;
